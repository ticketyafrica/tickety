import { createHmac, randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { enqueueEmail } from "@/lib/email/queue";
import { eventInstant } from "@/lib/email/schedule";

const accepted = () => NextResponse.json({ message: "If this address needs confirmation, an email is on its way. Check your inbox to confirm event updates." }, { status: 202 });

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  if (request.headers.get("origin") && request.headers.get("origin") !== request.nextUrl.origin) return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  let body: { email?: unknown };
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid request" }, { status: 400 }); }
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  const event = await prisma.event.findUnique({ where: { id: params.id } });
  if (!event || event.status !== "live" || eventInstant(event.endDate ?? event.date, event.endTime, event.timezone) <= new Date()) return NextResponse.json({ error: "This event is not accepting subscriptions." }, { status: 404 });
  if (await prisma.emailSuppression.findUnique({ where: { email } })) return accepted();
  try {
    const allowed = await prisma.$transaction(async (tx) => {
      const now = new Date();
      const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
      const hash = (value: string) => createHmac("sha256", process.env.CRON_SECRET || "tickety-local-development").update(value).digest("hex");
      // Bound requests by IP and by recipient across events; never store raw IPs.
      for (const bucket of [
        { key: `ip/${hash(ip)}/${Math.floor(now.getTime() / 600_000)}`, max: 20, duration: 600_000 },
        { key: `recipient/${hash(email)}/${Math.floor(now.getTime() / 3_600_000)}`, max: 5, duration: 3_600_000 },
      ]) {
        const rate = await tx.emailSubscriptionRateLimit.upsert({ where: { key: bucket.key }, update: { requests: { increment: 1 } }, create: { key: bucket.key, expiresAt: new Date(now.getTime() + bucket.duration) } });
        if (rate.requests > bucket.max) return false;
      }
      const preference = await tx.eventEmailPreference.upsert({
        where: { eventId_email: { eventId: event.id, email } }, update: {}, create: { eventId: event.id, email },
      });
      if (preference.verifiedAt && !preference.unsubscribedAt) return true;
      // One confirmation request per event/address/hour, including concurrent requests.
      const verificationToken = randomUUID();
      const expiresAt = new Date(now.getTime() + 48 * 60 * 60_000);
      const claimed = await tx.eventEmailPreference.updateMany({ where: {
        id: preference.id,
        OR: [{ confirmationRequestedAt: null }, { confirmationRequestedAt: { lt: new Date(now.getTime() - 60 * 60_000) } }],
      }, data: { verificationToken, verificationExpiresAt: expiresAt, confirmationRequestedAt: now, verifiedAt: null } });
      if (!claimed.count) return true;
      await enqueueEmail(tx, { dedupeKey: `subscription/${preference.id}/${verificationToken}`, kind: "subscription_confirmation", recipient: email, eventId: event.id, preferenceId: preference.id, context: { verificationToken }, expiresAt });
      return true;
    });
    if (!allowed) return NextResponse.json({ error: "Please wait before trying again." }, { status: 429, headers: { "Retry-After": "600" } });
    return accepted();
  } catch {
    return NextResponse.json({ error: "Could not save your subscription. Please try again." }, { status: 500 });
  }
}
