import assert from "node:assert/strict";
import { test, mock } from "node:test";
import { Prisma, EmailNotification } from "@prisma/client";
import { prisma } from "../lib/db";
import { dispatchBookingEmails, enqueueBookingEmails, enqueueEventReminders, processEmailQueue, rescheduleEventEmails, retryDelay } from "../lib/email/queue";
import { simpleEmail } from "../lib/email/templates";

const event = { id: "event-1", date: new Date("2099-11-14"), startTime: "18:00", endTime: "23:00", timezone: "Africa/Lagos", organiser: { email: "organiser@example.com" } };
const preference = { id: "preference-1", email: "guest@example.com", eventId: event.id, verifiedAt: new Date(), unsubscribedAt: null, event };
const originalDelegates = {
  emailWorkerLease: prisma.emailWorkerLease,
  emailNotification: prisma.emailNotification,
  emailSuppression: prisma.emailSuppression,
  emailDeliveryEvent: prisma.emailDeliveryEvent,
  eventEmailPreference: prisma.eventEmailPreference,
};

function restoreWorker() {
  mock.restoreAll();
  Object.assign(prisma, originalDelegates);
}

test("paid and free confirmed bookings queue customer, organiser, configured admin, and seven milestones idempotently", async () => {
  const previous = process.env.ADMIN_NOTIFICATION_EMAILS;
  process.env.ADMIN_NOTIFICATION_EMAILS = "hello@tickety.africa";
  try {
    const records = new Map<string, any>();
    const tx = {
      order: { findUniqueOrThrow: async () => ({ id: "order-1", status: "paid", email: "Guest@Example.com", eventId: event.id, event, attendees: [{ id: "ticket-1" }] }) },
      eventEmailPreference: { upsert: async () => preference, findUniqueOrThrow: async () => preference },
      emailNotification: { createMany: async (args: any) => {
        assert.equal(args.skipDuplicates, true);
        for (const job of args.data) if (!records.has(job.dedupeKey)) records.set(job.dedupeKey, job);
        return { count: args.data.length };
      } },
    } as unknown as Prisma.TransactionClient;
    await enqueueBookingEmails(tx, "order-1");
    await enqueueBookingEmails(tx, "order-1");
    assert.equal(records.size, 10);
    const bookingJobs = [...records.values()].filter((job) => job.kind.startsWith("booking_"));
    assert.deepEqual(bookingJobs.map((job) => job.recipient), ["guest@example.com", "organiser@example.com", "hello@tickety.africa"]);
    assert.equal([...records.values()].filter((job) => job.preferenceId).length, 7);
  } finally { if (previous === undefined) delete process.env.ADMIN_NOTIFICATION_EMAILS; else process.env.ADMIN_NOTIFICATION_EMAILS = previous; }
});

test("booking emails use one batch and preserve an existing reminder unsubscribe", async () => {
  const batches: Prisma.EmailNotificationCreateManyInput[][] = [];
  const tx = {
    order: { findUniqueOrThrow: async () => ({ id: "order-1", status: "paid", email: "Guest@Example.com", eventId: event.id, event, attendees: [{ id: "ticket-1" }] }) },
    eventEmailPreference: { upsert: async () => ({ ...preference, unsubscribedAt: new Date() }) },
    emailNotification: { createMany: async (args: any) => { batches.push(args.data); return { count: args.data.length }; } },
  } as unknown as Prisma.TransactionClient;
  await enqueueBookingEmails(tx, "order-1");
  assert.equal(batches.length, 1);
  assert.ok(batches[0].some((job) => job.kind === "booking_customer"));
  assert.ok(batches[0].every((job) => job.kind.startsWith("booking_")));
});

test("unconfirmed or unsubscribed recipients cannot be scheduled", async () => {
  for (const overrides of [{ verifiedAt: null }, { unsubscribedAt: new Date() }]) {
    let queued = 0;
    const tx = {
      eventEmailPreference: { findUniqueOrThrow: async () => ({ ...preference, ...overrides }) },
      emailNotification: { upsert: async () => { queued++; } },
    } as unknown as Prisma.TransactionClient;
    await enqueueEventReminders(tx, preference.id);
    assert.equal(queued, 0);
  }
});

test("retry backoff respects provider Retry-After and is bounded", () => {
  assert.equal(retryDelay(1), 60_000);
  assert.equal(retryDelay(3), 240_000);
  assert.equal(retryDelay(10), 3_600_000);
  assert.equal(retryDelay(1, 120), 120_000);
});

test("event edits move pending milestones in bulk and preserve sent-job deduplication", async () => {
  const updates: any[] = [];
  const inserts: any[] = [];
  const tx = {
    event: { findUniqueOrThrow: async () => event },
    eventEmailPreference: { findMany: async () => [preference, { ...preference, id: "preference-2", email: "second@example.com" }] },
    emailNotification: {
      updateMany: async (args: any) => { updates.push(args); return { count: 1 }; },
      createMany: async (args: any) => { inserts.push(args); return { count: args.data.length }; },
    },
  } as unknown as Prisma.TransactionClient;
  await rescheduleEventEmails(tx, event.id);
  assert.equal(inserts.length, 7);
  assert.equal(inserts.flatMap((args) => args.data).length, 14);
  assert.ok(inserts.every((args) => args.skipDuplicates));
  assert.ok(updates.every((args) => args.where.attempts === 0));
  assert.equal(updates[0].data.status, "skipped");
  assert.equal(updates[1].data.status, "queued");
});

function setupWorker(overrides: Partial<EmailNotification> = {}) {
  // Prisma delegates are proxies with virtual method descriptors. Replace the
  // delegates with plain test doubles so Node's mock tracker can intercept them.
  Object.assign(prisma, {
    emailWorkerLease: { upsert: async () => ({}), updateMany: async () => ({ count: 1 }) },
    emailNotification: { findMany: async () => [], updateMany: async () => ({ count: 1 }) },
    emailSuppression: { findUnique: async () => null },
    emailDeliveryEvent: { findFirst: async () => null },
  });
  const message = simpleEmail("guest@example.com", "Booking confirmed", "You're booked", "Your booking is confirmed.", "Open tickets", "https://tickety.africa/tickets/example");
  const job = {
    id: "job-1", kind: "booking_customer", recipient: "guest@example.com", orderId: "order-1", eventId: event.id,
    status: "queued", attempts: 0, expiresAt: null, payload: message, context: null,
    availableAt: new Date(0), scheduledAt: new Date(0), firstAttemptAt: null, ...overrides,
  } as unknown as EmailNotification;
  const updates: any[] = [];
  mock.method(prisma.emailWorkerLease, "upsert", async () => ({}));
  mock.method(prisma.emailWorkerLease, "updateMany", async () => ({ count: 1 }));
  mock.method(prisma.emailNotification, "findMany", async () => [{ ...job }]);
  mock.method(prisma.emailSuppression, "findUnique", async () => null);
  mock.method(prisma.emailDeliveryEvent, "findFirst", async () => null);
  mock.method(prisma.emailNotification, "updateMany", async (args: any) => {
    updates.push(args.data);
    for (const [key, value] of Object.entries(args.data)) {
      (job as any)[key] = key === "attempts" && typeof value === "object" ? job.attempts + (value as any).increment : value;
    }
    return { count: 1 };
  });
  return { job, updates, message };
}

test("successful send stores provider acceptance and clears sensitive request payload", async () => {
  const previous = process.env.RESEND_API_KEY;
  process.env.RESEND_API_KEY = "test-key";
  try {
    const { updates } = setupWorker();
    mock.method(globalThis, "fetch", async () => new Response(JSON.stringify({ id: "provider-1" })));
    assert.equal((await processEmailQueue({ limit: 1 })).processed, 1);
    assert.ok(updates.some((update) => update.status === "sent" && update.providerId === "provider-1" && update.deliveryStatus === "accepted"));
    assert.ok(updates.some((update) => update.payload === Prisma.DbNull));
  } finally { restoreWorker(); if (previous === undefined) delete process.env.RESEND_API_KEY; else process.env.RESEND_API_KEY = previous; }
});

test("transient failures retain an identical payload and retry with the same provider key", async () => {
  const previous = process.env.RESEND_API_KEY;
  process.env.RESEND_API_KEY = "test-key";
  try {
    const { job, updates } = setupWorker();
    const requests: { body: string; key: string }[] = [];
    mock.method(globalThis, "fetch", async (_url: unknown, args?: RequestInit) => {
      requests.push({ body: args!.body as string, key: (args!.headers as Record<string, string>)["Idempotency-Key"] });
      return requests.length === 1 ? new Response('{}', { status: 503 }) : new Response(JSON.stringify({ id: "provider-1" }));
    });
    await processEmailQueue({ limit: 1 });
    assert.equal(job.status, "queued");
    assert.equal(job.attempts, 1);
    assert.ok(job.firstAttemptAt);
    await processEmailQueue({ limit: 1 });
    assert.equal(requests.length, 2);
    assert.deepEqual(requests[0], requests[1]);
    assert.ok(updates.some((update) => update.status === "sent"));
  } finally { restoreWorker(); if (previous === undefined) delete process.env.RESEND_API_KEY; else process.env.RESEND_API_KEY = previous; }
});

test("a delivery webhook arriving before the send acknowledgement is reconciled after provider linking", async () => {
  const previous = process.env.RESEND_API_KEY;
  process.env.RESEND_API_KEY = "test-key";
  try {
    const { updates } = setupWorker();
    mock.method(globalThis, "fetch", async () => new Response(JSON.stringify({ id: "provider-1" })));
    mock.method(prisma.emailDeliveryEvent, "findFirst", async () => ({ status: "delivered", occurredAt: new Date() }));
    await processEmailQueue({ limit: 1 });
    const accepted = updates.findIndex((update) => update.status === "sent" && update.providerId === "provider-1");
    const delivered = updates.findIndex((update) => update.deliveryStatus === "delivered");
    assert.ok(accepted >= 0 && delivered > accepted);
  } finally { restoreWorker(); if (previous === undefined) delete process.env.RESEND_API_KEY; else process.env.RESEND_API_KEY = previous; }
});

test("expired, suppressed, and ambiguous attempts beyond the idempotency window never send", async () => {
  const previous = process.env.RESEND_API_KEY;
  process.env.RESEND_API_KEY = "test-key";
  try {
    for (const scenario of ["expired", "suppressed", "old_attempt"]) {
      const { job } = setupWorker(scenario === "expired" ? { expiresAt: new Date(0) } : scenario === "old_attempt" ? { firstAttemptAt: new Date(Date.now() - 24 * 60 * 60_000) } : {});
      if (scenario === "suppressed") mock.method(prisma.emailSuppression, "findUnique", async () => ({ email: job.recipient }));
      const request = mock.method(globalThis, "fetch", async () => { throw new Error("Should not send"); });
      await processEmailQueue({ limit: 1 });
      assert.equal(request.mock.callCount(), 0);
      assert.equal(job.status, scenario === "old_attempt" ? "failed" : "skipped");
      restoreWorker();
    }
  } finally { restoreWorker(); if (previous === undefined) delete process.env.RESEND_API_KEY; else process.env.RESEND_API_KEY = previous; }
});

test("worker lease prevents concurrent senders and dispatch failure cannot undo a booking", async () => {
  const previous = process.env.RESEND_API_KEY;
  process.env.RESEND_API_KEY = "test-key";
  try {
    setupWorker();
    mock.method(prisma.emailWorkerLease, "updateMany", async () => ({ count: 0 }));
    const result = await processEmailQueue();
    assert.equal(result.processed, 0);
    assert.ok('busy' in result && result.busy);
    mock.method(prisma.emailWorkerLease, "upsert", async () => { throw new Error("Database temporarily unavailable"); });
    await assert.doesNotReject(dispatchBookingEmails("order-1"));
  } finally { restoreWorker(); if (previous === undefined) delete process.env.RESEND_API_KEY; else process.env.RESEND_API_KEY = previous; }
});

test("queued reminder payloads are not sent after unsubscribe or event disabling", async () => {
  const previous = process.env.RESEND_API_KEY;
  process.env.RESEND_API_KEY = "test-key";
  try {
    for (const current of [
      { ...preference, unsubscribedAt: new Date(), event: { ...event, status: "live" } },
      { ...preference, event: { ...event, status: "disabled" } },
    ]) {
      const { job } = setupWorker({ kind: "reminder_week", preferenceId: preference.id });
      Object.assign(prisma, { eventEmailPreference: { findUnique: async () => current } });
      const request = mock.method(globalThis, "fetch", async () => { throw new Error("Should not send"); });
      await processEmailQueue({ limit: 1 });
      assert.equal(request.mock.callCount(), 0);
      assert.equal(job.status, "skipped");
      restoreWorker();
    }
  } finally { restoreWorker(); if (previous === undefined) delete process.env.RESEND_API_KEY; else process.env.RESEND_API_KEY = previous; }
});
