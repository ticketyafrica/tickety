import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import OrganiserNav from "@/components/organiser/OrganiserNav";
import StatCard from "@/components/ui/StatCard";
import AttendeeTable from "@/components/organiser/AttendeeTable";
import { getEventById, getAttendeesForEventId } from "@/lib/data";
import { formatMoney } from "@/lib/currency";
import { ticketsLeft } from "@/lib/utils";
import { Ticket, Wallet, QrCode, Armchair } from "lucide-react";
import Link from "next/link";
import EventShareLink from "@/components/organiser/EventShareLink";
import EventStaffManager from "@/components/organiser/EventStaffManager";

export const dynamic = "force-dynamic";

export default async function OrganiserEventDashboardPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams?: { fee?: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const event = await getEventById(params.id);
  if (!event) notFound();

  if (session.user.role !== "ADMIN" && event.organiserId !== session.user.id) {
    redirect("/organiser/dashboard");
  }

  const attendees = await getAttendeesForEventId(params.id);

  const ticketsSold = event.ticketTypes.reduce((sum, t) => sum + t.quantitySold, 0);
  const gross = attendees.reduce((sum, a) => (a.paymentStatus === "paid" ? sum + a.amountPaid : sum), 0);
  const checkedIn = attendees.filter((a) => a.checkInStatus).length;
  const checkInRate = attendees.length > 0 ? Math.round((checkedIn / attendees.length) * 100) : 0;
  const tableType = event.ticketTypes.find((t) => t.name.toLowerCase().includes("table"));
  const tablesLeft = tableType ? ticketsLeft(tableType.quantityTotal, tableType.quantitySold) : null;

  return (
    <div>
      <OrganiserNav active="dashboard" />
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        {searchParams?.fee === "success" && (
          <div className="mb-6 rounded-xl border border-leaf-200 bg-leaf-50 px-4 py-3 text-sm text-leaf-800">
            Payment confirmed — your event is now live.
          </div>
        )}

                <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-ink-light">Dashboard</p>
            <h1 className="font-display text-2xl font-semibold text-ink sm:text-3xl">{event.title}</h1>
          </div>
          <Link
            href={`/organiser/events/${event.id}/checkin`}
            className="text-sm font-medium text-plum-700 hover:underline"
          >
            Open gate check-in
          </Link>
        </div>
        <div className="mt-6 rounded-2xl border border-zinc-200 bg-white p-5">
          <EventShareLink slug={event.slug} />

        </div>
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatCard label="Tickets sold" value={ticketsSold.toString()} icon={<Ticket size={18} />} />
          <StatCard label="Gross revenue" value={formatMoney(gross, event.currency)} icon={<Wallet size={18} />} />
          <StatCard label="Checked in" value={`${checkInRate}%`} icon={<QrCode size={18} />} />
          {tablesLeft !== null && (
            <StatCard label="Tables left" value={tablesLeft.toString()} icon={<Armchair size={18} />} />
          )}
        </div>

        <div className="mt-8">
          <p className="mb-3 text-sm font-semibold text-ink">Attendees</p>
          <AttendeeTable attendees={attendees} />
        </div>
        <EventStaffManager eventId={event.id} />
      </div>
    </div>
  );
}