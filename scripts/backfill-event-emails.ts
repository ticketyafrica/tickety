import "dotenv/config";
import { prisma } from "../lib/db";
import { enqueueEventReminders } from "../lib/email/queue";
import { eventInstant } from "../lib/email/schedule";

// Enrol existing confirmed guests in future event updates. This never resends
// historical receipts, admin alerts, or milestones that have already passed.
async function main() {
  const apply = process.argv.includes("--apply");
  let cursor: string | undefined;
  let eligible = 0;
  const seen = new Set<string>();
  while (true) {
    const attendees = await prisma.attendee.findMany({ where: {
      paymentStatus: "paid", ticketStatus: { in: ["active", "used"] },
      event: { status: "live", OR: [{ endDate: { gte: new Date(Date.now() - 2 * 24 * 60 * 60_000) } }, { endDate: null, date: { gte: new Date(Date.now() - 2 * 24 * 60 * 60_000) } }] },
    }, include: { event: true }, take: 100, orderBy: { id: "asc" }, ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}) });
    if (!attendees.length) break;
    for (const attendee of attendees) {
      if (eventInstant(attendee.event.endDate ?? attendee.event.date, attendee.event.endTime, attendee.event.timezone) <= new Date()) continue;
      const email = attendee.email.trim().toLowerCase();
      const key = `${attendee.eventId}/${email}`;
      if (seen.has(key)) continue;
      seen.add(key); eligible++;
      if (apply) await prisma.$transaction(async (tx) => {
        const preference = await tx.eventEmailPreference.upsert({ where: { eventId_email: { eventId: attendee.eventId, email } }, update: {}, create: { eventId: attendee.eventId, email, verifiedAt: new Date() } });
        await enqueueEventReminders(tx, preference.id);
      });
    }
    cursor = attendees[attendees.length - 1].id;
  }
  console.log(`${apply ? "Enrolled" : "Would enrol"} ${eligible} event/email pairs in future updates.${apply ? " No emails were sent by this script; the worker handles queued updates." : " Dry run. Add --apply to save."}`);
}

main().catch((error) => { console.error(error); process.exitCode = 1; }).finally(() => prisma.$disconnect());
