import { eventInstant } from "@/lib/email/schedule";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import type { ReactNode } from "react";

import { authOptions } from "@/lib/auth";
import OrganiserNav from "@/components/organiser/OrganiserNav";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import DeleteEventButton from "@/components/organiser/DeleteEventButton";
import PayListingFeeButton from "@/components/organiser/PayListingFeeButton";
import { getEventsByOrganiserId } from "@/lib/data";
import { Currency, formatMoney, formatCurrencyTotals } from "@/lib/currency";

import {
  ArrowRight,
  CalendarDays,
  Clock3,
  Eye,
  MoreHorizontal,
  Pencil,
  Plus,
  Ticket,
  TrendingUp,
  Users,
} from "lucide-react";

export const dynamic = "force-dynamic";

type DashboardEvent = {
  currency?: Currency;
  id: string;
  title: string;
  status: string;
  date: string;
  startTime: string;
  endTime: string;
  timezone?: string;
  ticketsSold: number;
  gross: number;
};

export default async function OrganiserDashboardPage({
  searchParams,
}: {
  searchParams?: {
    fee?: string;
  };
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  const events = await getEventsByOrganiserId(
    session.user.id
  );

  const feeMessage =
    searchParams?.fee === "success"
      ? "Payment successful — your event is now live."
      : searchParams?.fee === "failed"
        ? "Payment didn't go through — you can retry from the event below."
        : searchParams?.fee === "error"
          ? "Something went wrong confirming your payment. Try again below."
          : null;

  const feeMessageIsSuccess =
    searchParams?.fee === "success";

  const totalSold = events.reduce(
    (sum, event) => sum + (event.ticketsSold || 0),
    0
  );


 const now = new Date();

const liveEvents = events.filter((event) => {
  if (event.status !== "live") return false;

  const eventEnd = eventInstant(event.date, event.endTime, event.timezone);

  return eventEnd > now;
}).length;

  const pendingEvents = events.filter(
    (event) => event.status === "pending"
  ).length;

  const firstName =
    session.user.name?.split(" ")[0] || "there";

  return (
    <div className="min-h-screen bg-[#F7F5F2] text-[#111014]">
      <OrganiserNav active="dashboard" />

      <main>
        {/* =========================================================
            HEADER
        ========================================================= */}

        <section className="border-b border-black/[0.06] bg-white">
          <div className="mx-auto max-w-7xl px-5 pb-10 pt-10 sm:px-8 lg:px-10 lg:pb-12">
            <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <div className="mb-4 flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#7C3AED]" />

                  <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-black/35">
                    Organiser workspace
                  </span>
                </div>

                <h1 className="font-display text-4xl font-semibold tracking-[-0.055em] text-[#111014] sm:text-5xl">
                  Good to see you,
                  <br className="sm:hidden" /> {firstName}.
                </h1>

                <p className="mt-3 max-w-xl text-sm leading-6 text-black/45">
                  Manage your events, monitor sales and
                  keep everything ready for your audience.
                </p>
              </div>

              <Button
                href="/organiser/events/new"
                variant="primary"
                icon={<Plus size={16} />}
                className="h-12 rounded-full px-5"
              >
                Create event
              </Button>
            </div>

            {/* =====================================================
                QUICK STATS
            ===================================================== */}

            <div className="mt-10 grid grid-cols-2 gap-px overflow-hidden rounded-[20px] border border-black/[0.06] bg-black/[0.06] sm:grid-cols-4">
              <Stat
                icon={<CalendarDays size={15} />}
                label="Total events"
                value={events.length}
              />

              <Stat
                icon={<TrendingUp size={15} />}
                label="Live now"
                value={liveEvents}
                accent
              />

              <Stat
                icon={<Ticket size={15} />}
                label="Tickets sold"
                value={totalSold}
              />

              <Stat
                icon={<Users size={15} />}
                label="Gross sales"
                value={formatCurrencyTotals(events.map((event) => ({ amount: event.gross, currency: event.currency })))}
              />
            </div>
          </div>
        </section>

        {/* =========================================================
            CONTENT
        ========================================================= */}

        <section className="mx-auto max-w-7xl px-5 py-8 sm:px-8 sm:py-10 lg:px-10 lg:py-12">
          {/* Payment message */}

          {feeMessage && (
            <div
              className={[
                "mb-6 flex items-start gap-3 rounded-[18px] border px-4 py-3.5 text-sm",
                feeMessageIsSuccess
                  ? "border-green-200/80 bg-green-50 text-green-900"
                  : "border-amber-200/80 bg-amber-50 text-amber-900",
              ].join(" ")}
            >
              <div
                className={[
                  "mt-0.5 h-2 w-2 shrink-0 rounded-full",
                  feeMessageIsSuccess
                    ? "bg-green-500"
                    : "bg-amber-500",
                ].join(" ")}
              />

              <span>{feeMessage}</span>
            </div>
          )}

          {events.length === 0 ? (
            <EmptyState />
          ) : (
            <>
              {/* ===================================================
                  SECTION HEADER
              =================================================== */}

              <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="font-display text-2xl font-semibold tracking-[-0.04em]">
                      Your events
                    </h2>

                    <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-[#111014] px-2 text-[9px] font-bold text-white">
                      {events.length}
                    </span>
                  </div>

                  <p className="mt-1.5 text-xs text-black/40">
                    Everything you&apos;re currently managing.
                  </p>
                </div>

                <Link
                  href="/explore"
                  className="group inline-flex items-center gap-2 text-xs font-semibold text-black/45 transition-colors hover:text-[#7C3AED]"
                >
                  View public events

                  <ArrowRight
                    size={13}
                    className="transition-transform duration-200 group-hover:translate-x-1"
                  />
                </Link>
              </div>

              {/* ===================================================
                  EVENT LIST
              =================================================== */}

              <div className="overflow-hidden rounded-[24px] border border-black/[0.07] bg-white shadow-[0_12px_40px_rgba(17,16,20,0.035)]">
                {/* Desktop header */}

                <div className="hidden border-b border-black/[0.06] bg-[#FAFAF9] px-6 py-3.5 lg:grid lg:grid-cols-[minmax(0,1.8fr)_130px_100px_140px_220px] lg:items-center lg:gap-4">
                  <HeaderCell>Event</HeaderCell>

                  <HeaderCell>Status</HeaderCell>

                  <HeaderCell>Sold</HeaderCell>

                  <HeaderCell>Gross</HeaderCell>

                  <HeaderCell align="right">
                    Actions
                  </HeaderCell>
                </div>

                <div>
                  {events.map((event, index) => (
                    <EventRow
                      key={event.id}
                      event={event}
                      index={index}
                    />
                  ))}
                </div>
              </div>

              {/* ===================================================
                  PENDING EVENTS NOTE
              =================================================== */}

              {pendingEvents > 0 && (
                <div className="mt-4 flex items-center gap-2 px-1 text-[10px] text-black/35">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />

                  <span>
                    {pendingEvents === 1
                      ? "1 event is waiting for its listing fee."
                      : `${pendingEvents} events are waiting for their listing fees.`}
                  </span>
                </div>
              )}
            </>
          )}
        </section>
      </main>
    </div>
  );
}

/* ===============================================================
   STAT
=============================================================== */

function Stat({
  icon,
  label,
  value,
  accent = false,
}: {
  icon: ReactNode;
  label: string;
  value: string | number;
  accent?: boolean;
}) {
  return (
    <div className="bg-white px-4 py-5 sm:px-5">
      <div className="flex items-center gap-2">
        <span
          className={[
            "flex h-7 w-7 items-center justify-center rounded-[9px]",
            accent
              ? "bg-[#F3E8FF] text-[#7C3AED]"
              : "bg-[#F5F5F4] text-black/45",
          ].join(" ")}
        >
          {icon}
        </span>

        <span className="text-[9px] font-semibold uppercase tracking-[0.13em] text-black/30">
          {label}
        </span>
      </div>

      <p className="mt-3 font-display text-xl font-semibold tracking-[-0.04em] text-[#111014] sm:text-2xl">
        {value}
      </p>
    </div>
  );
}

/* ===============================================================
   TABLE HEADER
=============================================================== */

function HeaderCell({
  children,
  align = "left",
}: {
  children: ReactNode;
  align?: "left" | "right";
}) {
  return (
    <div
      className={[
        "text-[9px] font-bold uppercase tracking-[0.14em] text-black/30",
        align === "right" ? "text-right" : "",
      ].join(" ")}
    >
      {children}
    </div>
  );
}

/* ===============================================================
   EVENT ROW
=============================================================== */

function EventRow({
  event,
  index,
}: {
  event: DashboardEvent;
  index: number;
}) {
  const isPending = event.status === "pending";

const eventEnd = eventInstant(event.date, event.endTime, event.timezone);

const hasEnded =
  event.status === "live" &&
  eventEnd <= new Date();

const isLive =
  event.status === "live" && !hasEnded;

const displayStatus = hasEnded
  ? "ended"
  : event.status;

  return (
    <div className="group relative border-b border-black/[0.055] transition-colors duration-200 last:border-0 hover:bg-[#FCFBFA]">
      {/* =========================================================
          DESKTOP
      ========================================================= */}

      <div className="hidden min-h-[92px] grid-cols-[minmax(0,1.8fr)_130px_100px_140px_220px] items-center gap-4 px-6 lg:grid">
        {/* Event */}

        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <span className="w-5 shrink-0 text-[9px] font-semibold text-black/20">
              {String(index + 1).padStart(2, "0")}
            </span>

            <div className="min-w-0">
              <Link
                href={`/organiser/events/${event.id}`}
                className="block truncate text-sm font-semibold tracking-[-0.015em] text-[#111014] transition-colors hover:text-[#7C3AED]"
              >
                {event.title}
              </Link>

              <div className="mt-1 flex items-center gap-2 text-[10px] text-black/30">
                <Clock3 size={11} />

                <span>
                  {isPending
  ? "Awaiting listing payment"
  : hasEnded
    ? "Event has ended"
    : isLive
      ? "Published event"
      : "Event"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Status */}

        <div>
         <StatusBadge status={displayStatus} />
        </div>

        {/* Sold */}

        <div>
          <p className="text-sm font-semibold text-[#111014]">
            {event.ticketsSold}
          </p>

          <p className="mt-0.5 text-[9px] text-black/30">
            tickets
          </p>
        </div>

        {/* Gross */}

        <div>
          <p className="text-sm font-semibold text-[#111014]">
            {formatMoney(event.gross, event.currency)}
          </p>

          <p className="mt-0.5 text-[9px] text-black/30">
            gross
          </p>
        </div>

        {/* Actions */}

        <EventActions
          eventId={event.id}
          pending={isPending}
        />
      </div>

      {/* =========================================================
          MOBILE / TABLET
      ========================================================= */}

      <div className="p-5 lg:hidden">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="mb-3 flex items-center gap-2">
              <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-black/25">
                {String(index + 1).padStart(2, "0")}
              </span>

              <span className="h-px w-5 bg-black/10" />

              <StatusBadge status={displayStatus} />
            </div>

            <Link
              href={`/organiser/events/${event.id}`}
              className="block text-base font-semibold tracking-[-0.025em] text-[#111014] hover:text-[#7C3AED]"
            >
              {event.title}
            </Link>
          </div>

          <MobileEventMenu
            eventId={event.id}
            pending={isPending}
          />
        </div>

        <div className="mt-5 grid grid-cols-2 gap-px overflow-hidden rounded-[14px] border border-black/[0.06] bg-black/[0.06]">
          <div className="bg-[#FAFAF9] px-4 py-3">
            <p className="text-[9px] font-semibold uppercase tracking-[0.13em] text-black/30">
              Tickets sold
            </p>

            <p className="mt-1 text-sm font-semibold text-[#111014]">
              {event.ticketsSold}
            </p>
          </div>

          <div className="bg-[#FAFAF9] px-4 py-3">
            <p className="text-[9px] font-semibold uppercase tracking-[0.13em] text-black/30">
              Gross
            </p>

            <p className="mt-1 text-sm font-semibold text-[#111014]">
              {formatMoney(event.gross, event.currency)}
            </p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          {isPending ? (
            <PendingPaymentAction eventId={event.id} />
          ) : (
            <>
              <Link
                href={`/organiser/events/${event.id}`}
                className="inline-flex h-10 items-center gap-2 rounded-full bg-[#111014] px-4 text-[11px] font-semibold text-white transition-all hover:bg-[#7C3AED]"
              >
                <Eye size={13} />
                View dashboard
              </Link>

              <Link
                href={`/organiser/events/${event.id}/edit`}
                className="inline-flex h-10 items-center gap-2 rounded-full border border-black/[0.08] bg-white px-4 text-[11px] font-semibold text-black/60 transition-all hover:border-black/15 hover:text-black"
              >
                <Pencil size={13} />
                Edit
              </Link>

              <DeleteEventButton eventId={event.id} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ===============================================================
   STATUS
=============================================================== */

function StatusBadge({
  status,
}: {
  status: string;
}) {
  return (
    <Badge
    tone={
  status === "live"
    ? "leaf"
    : status === "pending"
      ? "amber"
      : status === "ended" || status === "archived"
        ? "red"
        : "red"
}
    >
      {status === "pending"
  ? "awaiting payment"
  : status === "ended"
    ? "ended"
    : status}
    </Badge>
  );
}

/* ===============================================================
   DESKTOP ACTIONS
=============================================================== */

function EventActions({
  eventId,
  pending,
}: {
  eventId: string;
  pending: boolean;
}) {
  if (pending) {
    return (
      <div className="flex items-center justify-end gap-2">
        <PendingPaymentAction eventId={eventId} />
      </div>
    );
  }

  return (
    <div className="flex items-center justify-end gap-2">
      <Link
        href={`/organiser/events/${eventId}`}
        className="inline-flex h-9 items-center gap-1.5 rounded-full border border-black/[0.07] bg-white px-3.5 text-[10px] font-semibold text-black/55 transition-all hover:border-black/15 hover:bg-[#FAFAF9] hover:text-black"
      >
        <Eye size={13} />
        View
      </Link>

      <Link
        href={`/organiser/events/${eventId}/edit`}
        className="inline-flex h-9 items-center gap-1.5 rounded-full border border-black/[0.07] bg-white px-3.5 text-[10px] font-semibold text-black/55 transition-all hover:border-[#7C3AED]/20 hover:bg-[#F5F0FF] hover:text-[#7C3AED]"
      >
        <Pencil size={13} />
        Edit
      </Link>

      <DeleteEventButton eventId={eventId} />
    </div>
  );
}

/* ===============================================================
   PENDING PAYMENT ACTION
=============================================================== */

function PendingPaymentAction({
  eventId,
}: {
  eventId: string;
}) {
  return (
    <PayListingFeeButton
      eventId={eventId}
      compact
    />
  );
}

/* ===============================================================
   MOBILE MENU
=============================================================== */

function MobileEventMenu({
  eventId,
  pending,
}: {
  eventId: string;
  pending: boolean;
}) {
  return (
    <div className="relative">
      <details className="group">
        <summary className="flex h-9 w-9 cursor-pointer list-none items-center justify-center rounded-full border border-black/[0.07] text-black/40 transition-colors hover:bg-[#FAFAF9] hover:text-black [&::-webkit-details-marker]:hidden">
          <MoreHorizontal size={16} />
        </summary>

        <div className="absolute right-0 top-11 z-30 w-48 overflow-hidden rounded-[16px] border border-black/[0.08] bg-white p-1.5 shadow-[0_18px_45px_rgba(0,0,0,0.12)]">
          {pending ? (
            <div className="p-1">
              <PayListingFeeButton
                eventId={eventId}
                compact
              />
            </div>
          ) : (
            <>
              <Link
                href={`/organiser/events/${eventId}`}
                className="flex h-10 items-center gap-2 rounded-[11px] px-3 text-xs font-medium text-black/60 hover:bg-[#F7F5F2] hover:text-black"
              >
                <Eye size={14} />
                View dashboard
              </Link>

              <Link
                href={`/organiser/events/${eventId}/edit`}
                className="flex h-10 items-center gap-2 rounded-[11px] px-3 text-xs font-medium text-black/60 hover:bg-[#F7F5F2] hover:text-[#7C3AED]"
              >
                <Pencil size={14} />
                Edit event
              </Link>

              <DeleteEventButton eventId={eventId} />
            </>
          )}
        </div>
      </details>
    </div>
  );
}

/* ===============================================================
   EMPTY STATE
=============================================================== */

function EmptyState() {
  return (
    <div className="relative overflow-hidden rounded-[28px] border border-black/[0.07] bg-white px-6 py-20 text-center shadow-[0_12px_40px_rgba(17,16,20,0.035)] sm:px-10">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-0 h-44 w-72 -translate-x-1/2 rounded-full bg-[#7C3AED]/[0.06] blur-[80px]"
      />

      <div className="relative mx-auto flex h-16 w-16 items-center justify-center rounded-[20px] bg-[#111014] text-white shadow-[0_12px_30px_rgba(17,16,20,0.14)]">
        <CalendarDays
          size={21}
          strokeWidth={1.7}
        />
      </div>

      <p className="relative mt-7 text-[9px] font-bold uppercase tracking-[0.18em] text-black/30">
        Your workspace is ready
      </p>

      <h2 className="relative mt-2 font-display text-2xl font-semibold tracking-[-0.04em] text-[#111014]">
        Your first event starts here.
      </h2>

      <p className="relative mx-auto mt-2 max-w-md text-sm leading-6 text-black/40">
        Create an event, add your tickets and share it
        with your audience. Everything you need to manage
        the event will live here.
      </p>

      <Button
        href="/organiser/events/new"
        variant="primary"
        icon={<Plus size={15} />}
        className="relative mt-7 h-11 rounded-full px-5"
      >
        Create your first event
      </Button>
    </div>
  );
}