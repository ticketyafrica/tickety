import { cache } from "react";
import { eventMetadata, eventStructuredData, serializeJsonLd } from "@/lib/seo";
import { formatMoney } from "@/lib/currency";
import { notFound } from "next/navigation";
import { getEventBySlug } from "@/lib/data";
import { formatEventDate } from "@/lib/utils";

import Badge from "@/components/ui/Badge";
import TicketTypeCard from "@/components/events/TicketTypeCard";
import GetTicketButton from "@/components/events/GetTicketButton";
import EventCountdown from "@/components/events/EventCountdown";
import EventSubscriptionForm from "@/components/events/EventSubscriptionForm";

import {
  ArrowLeft,
  ArrowUpRight,
  CalendarDays,
  Check,
  Ticket,
  Clock3,
  MapPin,
  Share2,
  UserRound,
} from "lucide-react";

import Link from "next/link";

export const dynamic = "force-dynamic";

const loadEvent = cache(getEventBySlug);

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const event = await loadEvent(params.slug);
  if (!event) notFound();
  return eventMetadata(event);
}

export default async function EventPage({
  params,
}: {
  params: { slug: string };
}) {
  const event = await loadEvent(params.slug);

  if (!event) {
    notFound();
  }

  return (
    <main className="min-h-screen overflow-x-clip bg-[#FBFAFC] text-zinc-950">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(eventStructuredData(event)) }} />
      <div className="mx-auto w-full max-w-[1440px] min-w-0 px-4 pb-20 pt-28 sm:px-6 sm:pt-32 lg:px-10 lg:pt-36">
        {/* =========================================================
            EVENT COUNTDOWN
        ========================================================= */}
        <div className="mb-6">
          <EventCountdown
            date={event.date}
            startTime={event.startTime}
            timezone={event.timezone}
          />
        </div>

        {/* =========================================================
            TOP NAV
        ========================================================= */}
        <div className="mb-6 flex min-w-0 items-center justify-between sm:mb-8">
          <Link
            href="/explore"
            className="group inline-flex shrink-0 items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-400 transition-colors hover:text-violet-600"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full border border-zinc-200 bg-white transition-colors group-hover:border-violet-200 group-hover:bg-violet-50">
              <ArrowLeft
                aria-hidden="true"
                className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5"
                strokeWidth={1.8}
              />
            </span>

            Back to events
          </Link>

          <button
            type="button"
            aria-label="Share event"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-500 transition-colors hover:border-violet-200 hover:bg-violet-50 hover:text-violet-600"
          >
            <Share2
              aria-hidden="true"
              className="h-4 w-4"
              strokeWidth={1.8}
            />
          </button>
        </div>

        {/* =========================================================
            EVENT HEADER
        ========================================================= */}
        <section className="grid min-w-0 items-center gap-10 lg:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.65fr)] lg:gap-14 xl:gap-20">
  {/* Event artwork */}
  <div className="min-w-0">
    <div
      className={`group relative w-full overflow-hidden rounded-[28px] bg-gradient-to-br ${event.coverGradient} shadow-[0_28px_80px_rgba(24,24,27,0.10)] sm:rounded-[34px]`}
    >
      {event.coverImageUrl ? (
        <>
          {/* 
            The image controls the height of the container.
            This means:
            - no cropping
            - no distortion
            - no letterboxing
            - no awkward white space
            - portrait and landscape flyers both work naturally
          */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={event.coverImageUrl}
            alt={event.title}
            className="relative z-[1] block h-auto w-full object-contain object-center transition-transform duration-700 ease-out group-hover:scale-[1.008]"
          />

          {/* Very subtle readability layer */}
          <div className="pointer-events-none absolute inset-0 z-[2] bg-gradient-to-t from-black/[0.18] via-transparent to-black/[0.025]" />

          {/* Category */}
          <div className="absolute left-5 top-5 z-[3] sm:left-7 sm:top-7">
            <div className="flex items-center gap-2 rounded-full border border-white/25 bg-black/20 px-3.5 py-2 text-[9px] font-semibold uppercase tracking-[0.16em] text-white shadow-sm backdrop-blur-md">
              <span className="h-1.5 w-1.5 rounded-full bg-white" />
              {event.category}
            </div>
          </div>

          {/* Subtle bottom fade */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[2] h-24 bg-gradient-to-t from-black/10 to-transparent" />
        </>
      ) : (
        /* Fallback when there is no artwork */
        <div className="flex aspect-[16/9] w-full items-center justify-center">
          <div className="text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-white/20 bg-white/10">
              <Ticket
                aria-hidden="true"
                className="h-6 w-6 text-white/70"
                strokeWidth={1.5}
              />
            </div>

            <p className="mt-4 text-sm font-medium text-white/60">
              {event.title}
            </p>
          </div>
        </div>
      )}
    </div>

    {/* Artwork metadata */}
    <div className="mt-3 flex min-w-0 items-center justify-between gap-4 px-1">
      <span className="truncate text-[9px] font-semibold uppercase tracking-[0.16em] text-zinc-300">
        Event / {event.category}
      </span>

      <span className="shrink-0 text-[9px] font-medium text-zinc-400">
        {event.trending ? "Trending now" : "Open for tickets"}
      </span>
    </div>
  </div>

  {/* Event identity */}
  <div className="flex min-w-0 flex-col justify-center lg:pb-5">
    <div className="flex flex-wrap items-center gap-2">
      <Badge tone="plum">{event.category}</Badge>

      {event.trending && (
        <Badge tone="amber">Trending</Badge>
      )}
    </div>

    <h1 className="mt-5 max-w-[700px] break-words text-[2.8rem] font-semibold leading-[0.94] tracking-[-0.065em] text-zinc-950 sm:text-[3.8rem] lg:text-[4.5rem] xl:text-[5.1rem]">
      {event.title}
    </h1>

    <div className="mt-7 space-y-3.5">
      <EventMeta
        icon={CalendarDays}
        label={formatEventDate(
          event.date,
          event.startTime
        )}
      />

      <EventMeta
        icon={MapPin}
        label={`${event.venue}, ${event.state}`}
      />

      <EventMeta
        icon={UserRound}
        label={`Organised by ${event.organiserName}`}
      />
    </div>

    <div className="mt-8 h-px w-full bg-zinc-200" />

    <div className="mt-6 flex items-center gap-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
        <Clock3
          aria-hidden="true"
          className="h-4 w-4"
          strokeWidth={1.7}
        />
      </div>

      <div className="min-w-0">
        <p className="text-[9px] font-semibold uppercase tracking-[0.15em] text-zinc-400">
          Ticketing
        </p>

        <p className="mt-0.5 text-[11px] font-medium text-zinc-600">
          Simple checkout. Instant ticket delivery.
        </p>
      </div>
    </div>
  </div>
</section>
        {/* =========================================================
            CONTENT + TICKETS
        ========================================================= */}
        <section className="mt-14 grid min-w-0 items-start gap-10 lg:mt-20 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-14 xl:grid-cols-[minmax(0,1fr)_400px] xl:gap-16">
          {/* Description */}
          <div className="min-w-0 max-w-[760px]">
            <div className="flex items-center gap-3">
              <span className="h-px w-8 bg-violet-600" />

              <span className="text-[9px] font-semibold uppercase tracking-[0.2em] text-violet-700">
                About the event
              </span>
            </div>

            <p className="mt-6 whitespace-pre-line text-[15px] font-medium leading-8 tracking-[-0.015em] text-zinc-600 sm:text-[17px] sm:leading-9">
              {event.description}
            </p>

            {/* Event details */}
            <div className="mt-12 border-t border-zinc-200 pt-7">
              <div className="flex items-center justify-between">
                <h2 className="text-[12px] font-semibold uppercase tracking-[0.16em] text-zinc-900">
                  Event details
                </h2>

                <span className="text-[9px] font-medium uppercase tracking-[0.14em] text-zinc-300">
                  01
                </span>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <DetailRow
                  icon={CalendarDays}
                  label="Date & time"
                  value={formatEventDate(
                    event.date,
                    event.startTime
                  )}
                />

                <DetailRow
                  icon={MapPin}
                  label="Location"
                  value={`${event.venue}, ${event.state}`}
                />

                <DetailRow
                  icon={UserRound}
                  label="Organiser"
                  value={event.organiserName}
                />

                <DetailRow
                  icon={Check}
                  label="Ticket delivery"
                  value="Instant after purchase"
                />
              </div>
            </div>

            {/* Reassurance */}
            <div className="mt-10 rounded-[22px] border border-zinc-200 bg-white p-5 sm:p-6">
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                  <Check
                    aria-hidden="true"
                    className="h-4 w-4"
                    strokeWidth={2.2}
                  />
                </div>

                <div className="min-w-0">
                  <p className="text-[12px] font-semibold tracking-[-0.02em] text-zinc-900">
                    Ready to go?
                  </p>

                  <p className="mt-1 text-[11px] font-medium leading-5 text-zinc-500">
                    Review the available tickets and select Get
                    Ticket when you're ready to continue.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* =========================================================
              TICKET PANEL
          ========================================================= */}
          <aside className="min-w-0 lg:sticky lg:top-28">
  <div className="overflow-hidden rounded-[28px] border border-zinc-200 bg-white">
    {/* Header */}
    <div className="border-b border-zinc-100 px-5 py-5 sm:px-6">
      <div className="min-w-0">
        <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-violet-600">
          Tickets
        </p>

        <h2 className="mt-1.5 text-[21px] font-semibold tracking-[-0.04em] text-zinc-900">
          Ticket options
        </h2>

        <p className="mt-1 text-[10px] leading-5 text-zinc-400">
          View available ticket types and prices.
        </p>
      </div>
    </div>

    {/* Ticket information */}
    <div className="px-5 sm:px-6">
      {event.ticketTypes.map((ticket, index) => {
        const remaining = Math.max(
          0,
          ticket.quantityTotal -
            ticket.quantitySold -
            ticket.quantityReserved
        );

        const soldOut = remaining === 0;

        return (
          <div
            key={ticket.id}
            className={[
              "flex min-w-0 items-center justify-between gap-5 py-5",
              index !== event.ticketTypes.length - 1
                ? "border-b border-zinc-100"
                : "",
            ].join(" ")}
          >
            {/* Ticket information */}
            <div className="min-w-0">
              <p className="truncate text-[14px] font-semibold tracking-[-0.02em] text-zinc-900">
                {ticket.name}
              </p>

              <p
                className={[
                  "mt-1 text-[10px] font-medium",
                  soldOut
                    ? "text-red-500"
                    : "text-zinc-400",
                ].join(" ")}
              >
                {soldOut
                  ? "Sold out"
                  : `${remaining.toLocaleString("en-NG")} ${
                      remaining === 1
                        ? "ticket"
                        : "tickets"
                    } available`}
              </p>
            </div>

            {/* Price */}
            <div className="shrink-0 text-right">
              <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-zinc-300">
                Price
              </p>

              <p className="mt-0.5 text-[17px] font-semibold tracking-[-0.04em] text-zinc-950">
                {ticket.price === 0
                  ? "Free"
                  : formatMoney(ticket.price, event.currency)}
              </p>
            </div>
          </div>
        );
      })}
    </div>

    {/* CTA */}
    <div className="border-t border-zinc-100 px-5 py-5 sm:px-6">
      <GetTicketButton
        eventSlug={event.slug}
        eventTitle={event.title}
      />

      <div className="mt-3 flex items-start gap-2 px-1">
        <Check
          aria-hidden="true"
          className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600"
          strokeWidth={2.3}
        />

        <p className="text-[10px] font-medium leading-5 text-zinc-400">
          You'll choose your ticket type and quantity on the
          next step.
        </p>
      </div>
    </div>
  </div>

  {event.status === "live" && <EventSubscriptionForm eventId={event.id} />}

  {/* Help */}
  <div className="mt-4 flex items-center justify-between px-1">
    <span className="text-[9px] font-semibold uppercase tracking-[0.14em] text-zinc-300">
      Need help?
    </span>

    <button
      type="button"
      className="group inline-flex items-center gap-1.5 text-[10px] font-semibold text-zinc-500 transition-colors hover:text-violet-600"
    >
      Contact organiser

      <ArrowUpRight
        aria-hidden="true"
        className="h-3 w-3 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
        strokeWidth={1.8}
      />
    </button>
  </div>
</aside>
        </section>
      </div>
    </main>
  );
}

function EventMeta({
  icon: Icon,
  label,
}: {
  icon: typeof CalendarDays;
  label: string;
}) {
  return (
    <div className="flex min-w-0 items-start gap-3 text-zinc-500">
      <Icon
        aria-hidden="true"
        className="mt-0.5 h-4 w-4 shrink-0 text-zinc-400"
        strokeWidth={1.7}
      />

      <span className="min-w-0 break-words text-[12px] font-medium leading-5 tracking-[-0.01em]">
        {label}
      </span>
    </div>
  );
}

function DetailRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof CalendarDays;
  label: string;
  value: string;
}) {
  return (
    <div className="min-w-0 rounded-[18px] border border-zinc-200/80 bg-white p-4">
      <div className="flex items-center gap-2">
        <Icon
          aria-hidden="true"
          className="h-3.5 w-3.5 shrink-0 text-violet-600"
          strokeWidth={1.8}
        />

        <span className="text-[9px] font-semibold uppercase tracking-[0.14em] text-zinc-400">
          {label}
        </span>
      </div>

      <p className="mt-2 break-words text-[11px] font-semibold leading-5 tracking-[-0.01em] text-zinc-700">
        {value}
      </p>
    </div>
  );
}

function TicketIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
    >
      <path
        d="M4 7.5A2.5 2.5 0 0 0 6.5 5h11A2.5 2.5 0 0 0 20 7.5v1a2.5 2.5 0 0 0 0 5v1A2.5 2.5 0 0 0 17.5 17h-11A2.5 2.5 0 0 0 4 14.5v-1a2.5 2.5 0 0 0 0-5v-1Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />

      <path
        d="M13 7v10"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeDasharray="2 2"
      />
    </svg>
  );
}
