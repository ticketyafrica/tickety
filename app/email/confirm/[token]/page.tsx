import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { enqueueEventReminders } from "@/lib/email/queue";
import { eventInstant } from "@/lib/email/schedule";

export const dynamic = "force-dynamic";

export default async function ConfirmEventEmails({ params, searchParams }: { params: { token: string }; searchParams?: { done?: string } }) {
  const preference = await prisma.eventEmailPreference.findUnique({ where: { verificationToken: params.token }, include: { event: true } });
  if (!preference) notFound();
  const expired = !preference.verificationExpiresAt || preference.verificationExpiresAt <= new Date();
  const confirmed = !!preference.verifiedAt && !preference.unsubscribedAt;

  async function confirm() {
    "use server";
    await prisma.$transaction(async (tx) => {
      const current = await tx.eventEmailPreference.findUnique({ where: { verificationToken: params.token }, include: { event: true } });
      if (!current || !current.verificationExpiresAt || current.verificationExpiresAt <= new Date() || current.event.status !== 'live' || eventInstant(current.event.endDate ?? current.event.date, current.event.endTime, current.event.timezone) <= new Date()) return;
      await tx.eventEmailPreference.update({ where: { id: current.id }, data: { verifiedAt: new Date(), unsubscribedAt: null } });
      await enqueueEventReminders(tx, current.id);
    });
    redirect(`/email/confirm/${params.token}?done=1`);
  }

  return <main className="mx-auto min-h-[70vh] max-w-lg px-5 py-32"><div className="rounded-3xl border border-violet-100 bg-white p-8"><p className="text-xs font-semibold uppercase tracking-widest text-violet-700">Tickety event updates</p><h1 className="mt-4 text-3xl font-semibold text-zinc-900">{confirmed ? "You’re on the list." : expired ? "This link has expired." : "Keep the countdown going."}</h1><p className="mt-4 text-sm leading-6 text-zinc-500">{confirmed ? `You’ll receive event updates for ${preference.event.title}. You can unsubscribe from any update email.` : expired ? 'Visit the event page and subscribe again for a fresh confirmation link.' : `Confirm that you’d like countdown reminders and updates for ${preference.event.title}.`}</p>{!confirmed && !expired && !searchParams?.done && <form action={confirm}><button className="mt-6 rounded-full bg-violet-700 px-6 py-3 text-sm font-semibold text-white">Confirm event updates</button></form>}<Link href={`/events/${preference.event.slug}`} className="mt-6 block text-sm font-semibold text-violet-700">View event →</Link></div></main>;
}
