import { randomUUID } from "crypto";
import { Prisma, EmailNotification } from "@prisma/client";
import { prisma } from "../db";
import { isLifecycleEmail, reminderSchedule } from "./schedule";
import { appUrl, bookingAlert, bookingEmail, lifecycleEmail, simpleEmail } from "./templates";
import { EmailMessage, EmailProviderError, sendEmail } from "./provider";

const orderInclude = {
  event: { include: { organiser: true } },
  attendees: { include: { ticketType: true } },
  items: { include: { ticketType: true } },
} satisfies Prisma.OrderInclude;

export async function enqueueEmail(tx: Prisma.TransactionClient, input: {
  dedupeKey: string; kind: string; recipient: string; eventId?: string; orderId?: string;
  userId?: string; invitationId?: string; preferenceId?: string; context?: Prisma.InputJsonValue;
  scheduledAt?: Date; expiresAt?: Date;
}) {
  const scheduledAt = input.scheduledAt || new Date();
  return tx.emailNotification.upsert({
    where: { dedupeKey: input.dedupeKey }, update: {},
    create: { ...input, recipient: input.recipient.trim().toLowerCase(), scheduledAt, availableAt: scheduledAt },
  });
}

export async function enqueueEventReminders(tx: Prisma.TransactionClient, preferenceId: string, now = new Date()) {
  const preference = await tx.eventEmailPreference.findUniqueOrThrow({ where: { id: preferenceId }, include: { event: true } });
  if (!preference.verifiedAt || preference.unsubscribedAt) return;
  for (const milestone of reminderSchedule(preference.event, now)) {
    await enqueueEmail(tx, {
      dedupeKey: `event-email/${preference.id}/${milestone.kind}`,
      recipient: preference.email, eventId: preference.eventId,
      preferenceId: preference.id, ...milestone,
    });
  }
}

// Called inside the ticket-issuance transaction. No network calls here.
export async function enqueueBookingEmails(tx: Prisma.TransactionClient, orderId: string) {
  const order = await tx.order.findUniqueOrThrow({ where: { id: orderId }, include: orderInclude });
  if (order.status !== "paid" || !order.attendees.length) return;
  const email = order.email.trim().toLowerCase();
  const preference = await tx.eventEmailPreference.upsert({
    where: { eventId_email: { eventId: order.eventId, email } },
    update: { verifiedAt: new Date() },
    create: { eventId: order.eventId, email, verifiedAt: new Date() },
  });
  const now = new Date();
  const jobs: Prisma.EmailNotificationCreateManyInput[] = [
    { dedupeKey: `booking/${order.id}/customer`, kind: "booking_customer", recipient: email, orderId, eventId: order.eventId, scheduledAt: now, availableAt: now },
    { dedupeKey: `booking/${order.id}/organiser`, kind: "booking_organiser", recipient: order.event.organiser.email.trim().toLowerCase(), orderId, eventId: order.eventId, scheduledAt: now, availableAt: now },
  ];
  for (const recipient of new Set((process.env.ADMIN_NOTIFICATION_EMAILS || "hello@tickety.africa").split(",").map((value) => value.trim().toLowerCase()).filter(Boolean))) {
    jobs.push({ dedupeKey: `booking/${order.id}/admin/${recipient}`, kind: "booking_admin", recipient, orderId, eventId: order.eventId, scheduledAt: now, availableAt: now });
  }
  // Reuse the preference and event already loaded. One insert avoids a
  // database round trip for every reminder while ticket inventory is locked.
  if (preference.verifiedAt && !preference.unsubscribedAt) {
    for (const milestone of reminderSchedule(order.event, now)) {
      jobs.push({
        dedupeKey: `event-email/${preference.id}/${milestone.kind}`,
        recipient: email, eventId: order.eventId, preferenceId: preference.id,
        ...milestone, availableAt: milestone.scheduledAt,
      });
    }
  }
  await tx.emailNotification.createMany({ data: jobs, skipDuplicates: true });
}

// Existing sent messages keep their history. Pending milestones move with the event.
export async function rescheduleEventEmails(tx: Prisma.TransactionClient, eventId: string) {
  const event = await tx.event.findUniqueOrThrow({ where: { id: eventId } });
  const preferences = await tx.eventEmailPreference.findMany({
    where: { eventId, verifiedAt: { not: null }, unsubscribedAt: null },
    select: { id: true, email: true },
  });
  const schedule = reminderSchedule(event, new Date());
  const lifecycleKinds = ["reminder_week", "reminder_three_days", "reminder_day", "reminder_three_hours", "reminder_thirty_minutes", "event_started", "event_follow_up"];
  await tx.emailNotification.updateMany({
    where: { eventId, kind: { in: lifecycleKinds }, status: "queued", attempts: 0 },
    data: { status: "skipped", lastError: "Event schedule changed" },
  });
  for (const milestone of schedule) {
    await tx.emailNotification.updateMany({
      where: { eventId, kind: milestone.kind, status: { in: ["queued", "skipped"] }, attempts: 0 },
      data: { status: "queued", lastError: null, scheduledAt: milestone.scheduledAt, availableAt: milestone.scheduledAt, expiresAt: milestone.expiresAt },
    });
    // Batch inserts keep edits from running seven queries for every subscriber.
    for (let index = 0; index < preferences.length; index += 500) {
      await tx.emailNotification.createMany({ skipDuplicates: true, data: preferences.slice(index, index + 500).map((preference) => ({
        dedupeKey: `event-email/${preference.id}/${milestone.kind}`,
        recipient: preference.email, eventId, preferenceId: preference.id,
        kind: milestone.kind, scheduledAt: milestone.scheduledAt,
        availableAt: milestone.scheduledAt, expiresAt: milestone.expiresAt,
      })) });
    }
  }
}

async function renderNotification(job: EmailNotification): Promise<EmailMessage | null> {
  if (job.kind.startsWith("booking_")) {
    const order = await prisma.order.findUnique({ where: { id: job.orderId! }, include: orderInclude });
    if (!order || order.status !== "paid" || !order.attendees.length) return null;
    return job.kind === "booking_customer" ? bookingEmail(order) : bookingAlert(order, job.recipient, job.kind === "booking_admin");
  }
  if (isLifecycleEmail(job.kind)) {
    const preference = await prisma.eventEmailPreference.findUnique({ where: { id: job.preferenceId! }, include: { event: { include: { organiser: true } } } });
    if (!preference?.verifiedAt || preference.unsubscribedAt || preference.event.status !== "live") return null;
    const orders = await prisma.order.findMany({ where: { eventId: preference.eventId, email: { equals: preference.email, mode: "insensitive" }, status: "paid" }, include: orderInclude, orderBy: { createdAt: "asc" } });
    const legacyTickets = await prisma.attendee.findMany({ where: { eventId: preference.eventId, email: { equals: preference.email, mode: "insensitive" }, orderId: null, paymentStatus: "paid", ticketStatus: { in: ["active", "used"] } }, include: { ticketType: true } });
    // Subscribers can get updates without an order; cancelled-only orders cannot.
    if (orders.length && !legacyTickets.length && !orders.some((order) => order.attendees.some((ticket) => ["active", "used"].includes(ticket.ticketStatus)))) return null;
    return lifecycleEmail(preference.event, job.recipient, job.kind, preference.token, orders, legacyTickets);
  }
  if (job.kind === "subscription_confirmation") {
    const preference = await prisma.eventEmailPreference.findUnique({ where: { id: job.preferenceId! }, include: { event: true } });
    const context = job.context as { verificationToken?: string } | null;
    if (!preference || preference.verifiedAt || preference.verificationToken !== context?.verificationToken || !preference.verificationExpiresAt || preference.verificationExpiresAt < new Date()) return null;
    const url = appUrl(`/email/confirm/${preference.verificationToken}`);
    return simpleEmail(job.recipient, `Confirm event updates: ${preference.event.title}`, "Stay close to the moments you love.", `Confirm that you’d like email updates for ${preference.event.title}. We’ll send the countdown, an event-start update, and a follow-up. This confirmation expires in 48 hours.`, "Confirm event updates", url);
  }
  if (job.kind === "welcome") {
    const user = await prisma.user.findUnique({ where: { id: job.userId! } });
    if (!user) return null;
    return simpleEmail(job.recipient, "Welcome to Tickety", "Your next great event starts here.", `Hi ${user.name}, welcome to Tickety. Create your event, share it with your audience, and manage every booking and check-in from your organiser dashboard.`, "Open your workspace", appUrl('/organiser/dashboard'));
  }
  if (job.kind === "staff_invitation") {
    const invitation = await prisma.staffInvitation.findUnique({ where: { id: job.invitationId! }, include: { event: true } });
    if (!invitation || invitation.revokedAt || invitation.acceptedAt || invitation.expiresAt < new Date()) return null;
    const context = job.context as { inviteUrl?: string } | null;
    if (!context?.inviteUrl) return null;
    return simpleEmail(job.recipient, `You're invited to check in guests: ${invitation.event.title}`, "You’re on the guest welcome team.", `You’ve been invited to help check in guests at ${invitation.event.title}. Use the secure link below to accept before ${invitation.expiresAt.toISOString()}.`, "Accept invitation", context.inviteUrl);
  }
  if (job.kind === "event_created" || job.kind === "listing_fee_paid") {
    const event = await prisma.event.findUnique({ where: { id: job.eventId! } });
    if (!event) return null;
    const paid = job.kind === "listing_fee_paid";
    return simpleEmail(job.recipient, paid ? `Listing payment confirmed: ${event.title}` : `Event created: ${event.title}`, paid ? "Your event is ready for its audience." : "Your event’s next chapter starts now.", paid ? `We’ve received your listing-fee payment. ${event.title} is now live. Open your dashboard to share the event link and manage bookings.` : `${event.title} has been created. ${event.status === 'live' ? 'Your event is live and ready for bookings.' : 'Complete your listing-fee payment to make the event live.'} Your dashboard has your shareable event link.`, "Open event dashboard", appUrl(`/organiser/events/${event.id}`));
  }
  throw new Error(`Unsupported email kind: ${job.kind}`);
}

export function retryDelay(attempts: number, retryAfterSeconds = 0) {
  return Math.max(Math.min(60_000 * 2 ** Math.max(0, attempts - 1), 60 * 60_000), (Number.isFinite(retryAfterSeconds) ? retryAfterSeconds : 0) * 1000);
}

async function processNotification(job: EmailNotification, token: string) {
  let attemptRecorded = false;
  const ownsJob = { id: job.id, status: "processing", lockToken: token };
  const skip = async (reason: string) => {
    await prisma.emailNotification.updateMany({ where: ownsJob, data: { status: "skipped", lastError: reason, lockedUntil: null, lockToken: null } });
  };
  try {
    if (job.expiresAt && job.expiresAt <= new Date()) return skip("Email milestone expired");
    if (await prisma.emailSuppression.findUnique({ where: { email: job.recipient } })) return skip("Recipient suppressed");
    if (job.kind === "staff_invitation") {
      const invitation = await prisma.staffInvitation.findUnique({ where: { id: job.invitationId! } });
      if (!invitation || invitation.revokedAt || invitation.acceptedAt || invitation.expiresAt <= new Date()) return skip("Invitation is no longer active");
    }
    if (job.kind === "subscription_confirmation") {
      const preference = await prisma.eventEmailPreference.findUnique({ where: { id: job.preferenceId! } });
      const context = job.context as { verificationToken?: string } | null;
      if (!preference || preference.verifiedAt || preference.verificationToken !== context?.verificationToken) return skip("Subscription confirmation is no longer current");
    }
    if (isLifecycleEmail(job.kind)) {
      const preference = await prisma.eventEmailPreference.findUnique({ where: { id: job.preferenceId! }, include: { event: true } });
      if (!preference?.verifiedAt || preference.unsubscribedAt || preference.event.status !== "live") return skip("Event updates unavailable or unsubscribed");
      const milestone = reminderSchedule(preference.event, new Date(0)).find((item) => item.kind === job.kind);
      if (!milestone || milestone.expiresAt <= new Date()) return skip("Event milestone is no longer current");
      if (job.attempts > 0 && milestone.scheduledAt.getTime() !== job.scheduledAt.getTime()) return skip("Event schedule changed after delivery was attempted");
      if (milestone.scheduledAt > new Date()) {
        await prisma.emailNotification.updateMany({ where: ownsJob, data: { status: "queued", scheduledAt: milestone.scheduledAt, availableAt: milestone.scheduledAt, expiresAt: milestone.expiresAt, lockToken: null, lockedUntil: null } });
        return;
      }
    }
    // Resend remembers idempotency keys for 24h. Stop before that boundary
    // rather than risk delivering twice after an ambiguous/crashed attempt.
    if (job.firstAttemptAt && Date.now() - job.firstAttemptAt.getTime() >= 23 * 60 * 60_000) {
      await prisma.emailNotification.updateMany({ where: ownsJob, data: { status: "failed", lastError: "Idempotency window elapsed; review provider delivery before retrying", lockToken: null, lockedUntil: null } });
      return;
    }
    const message = job.payload ? job.payload as unknown as EmailMessage : await renderNotification(job);
    if (!message) return skip("No eligible recipient or booking");
    // Freeze the exact request before contacting Resend; retries use the same bytes.
    const saved = await prisma.emailNotification.updateMany({ where: ownsJob, data: {
      payload: message as unknown as Prisma.InputJsonValue,
      firstAttemptAt: job.firstAttemptAt || new Date(), attempts: { increment: 1 },
    } });
    if (!saved.count) return;
    attemptRecorded = true;
    const providerId = await sendEmail(message, `tickety/${job.id}`);
    await prisma.emailNotification.updateMany({ where: ownsJob, data: {
      status: "sent", sentAt: new Date(), providerId, deliveryStatus: "accepted",
      lastError: null, lockToken: null, lockedUntil: null,
      // Ticket attachments / invitation links need not remain in the outbox after success.
      payload: Prisma.DbNull, context: Prisma.DbNull,
    } });
    // Read after saving providerId so a fast webhook cannot fall into the gap
    // between the lookup and linking the job to its provider delivery record.
    const delivery = await prisma.emailDeliveryEvent.findFirst({ where: { providerId }, orderBy: { occurredAt: "desc" } });
    if (delivery) await prisma.emailNotification.updateMany({
      where: { id: job.id, providerId, OR: [{ deliveryUpdatedAt: null }, { deliveryUpdatedAt: { lte: delivery.occurredAt } }] },
      data: { deliveryStatus: delivery.status, deliveryUpdatedAt: delivery.occurredAt },
    });
  } catch (error) {
    const attempts = job.attempts + 1;
    const permanent = error instanceof EmailProviderError && [400, 422].includes(error.status);
    const exhausted = permanent || attempts >= 10;
    await prisma.emailNotification.updateMany({ where: ownsJob, data: {
      status: exhausted ? "failed" : "queued", availableAt: new Date(Date.now() + retryDelay(attempts, error instanceof EmailProviderError ? error.retryAfterSeconds : undefined)),
      ...(!attemptRecorded ? { attempts } : {}),
      lastError: error instanceof EmailProviderError ? error.message : "Email preparation or delivery failed; inspect worker logs",
      lockToken: null, lockedUntil: null,
    } });
    console.error("Email job failed", { id: job.id, kind: job.kind, attempts, error: error instanceof EmailProviderError ? error.message : error instanceof Error ? error.name : "UnknownError" });
  }
}

export async function processEmailQueue(options: { limit?: number; orderId?: string; budgetMs?: number } = {}) {
  if (!process.env.RESEND_API_KEY) return { processed: 0, configured: false };
  const token = randomUUID();
  const now = new Date();
  await prisma.emailWorkerLease.upsert({ where: { id: "resend" }, update: {}, create: { id: "resend", lockedUntil: new Date(0) } });
  const acquired = await prisma.emailWorkerLease.updateMany({ where: { id: "resend", lockedUntil: { lt: now } }, data: { token, lockedUntil: new Date(Date.now() + 90_000) } });
  if (!acquired.count) return { processed: 0, busy: true, configured: true };
  let processed = 0;
  const deadline = Date.now() + (options.budgetMs ?? 45_000);
  try {
    const jobs = await prisma.emailNotification.findMany({ where: {
      ...(options.orderId ? { orderId: options.orderId } : {}),
      availableAt: { lte: now },
      OR: [{ status: "queued" }, { status: "processing", lockedUntil: { lt: now } }],
    }, orderBy: [{ availableAt: "asc" }, { id: "asc" }], take: Math.min(options.limit ?? 40, 100) });
    for (const job of jobs) {
      if (Date.now() + 12_000 > deadline) break;
      const claimed = await prisma.emailNotification.updateMany({ where: {
        id: job.id, OR: [{ status: "queued" }, { status: "processing", lockedUntil: { lt: new Date() } }],
      }, data: { status: "processing", lockToken: token, lockedUntil: new Date(Date.now() + 90_000) } });
      if (!claimed.count) continue;
      await processNotification(job, token);
      processed++;
      // Stay below Resend's default request rate; the DB lease covers concurrent workers.
      await new Promise((resolve) => setTimeout(resolve, 600));
    }
  } finally {
    await prisma.emailWorkerLease.updateMany({ where: { id: "resend", token }, data: { token: null, lockedUntil: new Date(0) } });
  }
  return { processed, configured: true };
}

export async function dispatchBookingEmails(orderId: string) {
  try { await processEmailQueue({ orderId, limit: 8, budgetMs: 35_000 }); }
  catch { console.error("Booking emails remain queued for the next worker run", { orderId }); }
}
