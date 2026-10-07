import { formatMoney } from "@/lib/currency";
import Link from "next/link";
import { EventItem } from "@/lib/types";
import {
  formatEventDate,
  priceFrom,
} from "@/lib/utils";
import Badge from "@/components/ui/Badge";
import {
  ArrowUpRight,
  CalendarDays,
  MapPin,
  Ticket,
} from "lucide-react";

export default function EventCard({
  event,
}: {
  event: EventItem;
}) {
  const formatPrice = (amount: number) => formatMoney(amount, event.currency);
  const from = priceFrom(event.ticketTypes);

  const isFree =
    event.ticketTypes.length > 0 &&
    event.ticketTypes.every((ticket) => ticket.price === 0);

  return (
    <Link
      href={`/events/${event.slug}`}
      className="group block h-full w-full min-w-0"
    >
      <article className="relative flex h-full w-full min-w-0 flex-col overflow-hidden rounded-[24px] border border-black/[0.07] bg-white shadow-[0_18px_55px_rgba(0,0,0,0.07)] transition-all duration-500 ease-out group-hover:-translate-y-1 group-hover:shadow-[0_28px_75px_rgba(0,0,0,0.12)]">
        {/* =====================================================
            FIXED IMAGE FRAME

            Every event gets the exact same media dimensions.

            object-cover means:
            - portrait flyers are cropped
            - landscape flyers are cropped
            - square flyers are cropped
            - nothing stretches
            - nothing changes the card height
        ===================================================== */}
        <div
          className={`relative h-[260px] w-full shrink-0 overflow-hidden bg-gradient-to-br ${event.coverGradient}`}
        >
          {event.coverImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={event.coverImageUrl}
              alt={event.title}
              className="absolute inset-0 h-full w-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-[1.025]"
            />
          ) : (
            /* Fallback uses the exact same frame */
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-[15px] border border-white/20 bg-black/10 text-white/60">
                  <Ticket size={20} />
                </div>

                <p className="mt-3 max-w-[190px] truncate px-4 font-display text-sm font-semibold text-white/50">
                  {event.title}
                </p>
              </div>
            </div>
          )}

          {/* Image treatment */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/[0.03] via-transparent to-black/[0.18]" />

          {/* =================================================
              TOP BADGES
          ================================================= */}
          <div className="absolute left-4 top-4 z-10 flex flex-wrap gap-2">
            {event.trending && (
              <Badge tone="amber">
                Trending
              </Badge>
            )}

            {isFree && (
              <Badge tone="leaf">
                Free
              </Badge>
            )}
          </div>

          {/* =================================================
              CATEGORY
          ================================================= */}
          <div className="absolute bottom-4 left-4 z-10">
            <div className="max-w-[calc(100vw-80px)] truncate rounded-full border border-white/15 bg-black/35 px-3 py-1.5 text-[9px] font-semibold uppercase tracking-[0.13em] text-white backdrop-blur-xl sm:max-w-[220px]">
              {event.category}
            </div>
          </div>

          {/* =================================================
              HOVER ARROW
          ================================================= */}
          <div className="absolute bottom-4 right-4 z-10 flex h-9 w-9 translate-y-2 items-center justify-center rounded-full border border-white/20 bg-black/35 text-white opacity-0 backdrop-blur-xl transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
            <ArrowUpRight size={15} />
          </div>
        </div>

        {/* =====================================================
            TICKET SEPARATOR
        ===================================================== */}
        <div className="relative h-px shrink-0">
          {/* Left notch */}
          <span className="absolute -left-[11px] -top-[10px] h-5 w-5 rounded-full border-r border-black/[0.07] bg-[#F5F1EB]" />

          {/* Right notch */}
          <span className="absolute -right-[11px] -top-[10px] h-5 w-5 rounded-full border-l border-black/[0.07] bg-[#F5F1EB]" />

          {/* Dashed ticket line */}
          <div className="mx-5 border-t border-dashed border-black/[0.09]" />
        </div>

        {/* =====================================================
            EVENT DETAILS

            flex-1 makes this section fill the remaining card
            height rather than allowing content to determine
            the card height.
        ===================================================== */}
        <div className="flex min-h-0 flex-1 flex-col px-5 pb-5 pt-4">
          {/* Title */}
          <h3 className="line-clamp-2 min-h-[42px] font-display text-xl font-semibold leading-[1.05] tracking-[-0.035em] text-[#111014] transition-colors duration-300 group-hover:text-[#6D28D9]">
            {event.title}
          </h3>

          {/* Date */}
          <div className="mt-3 flex shrink-0 items-center gap-2 text-black/45">
            <CalendarDays
              size={13}
              strokeWidth={1.8}
              className="shrink-0 text-[#7C3AED]"
            />

            <span className="truncate text-[11px] font-medium">
              {formatEventDate(
                event.date,
                event.startTime
              )}
            </span>
          </div>

          {/* Location */}
          <div className="mt-2 flex min-h-0 items-start gap-2 text-black/40">
            <MapPin
              size={13}
              strokeWidth={1.8}
              className="mt-0.5 shrink-0 text-[#7C3AED]"
            />

            <span className="line-clamp-2 text-[11px] leading-5">
              {event.venue}, {event.state}
            </span>
          </div>

          {/* =================================================
              BOTTOM META

              mt-auto locks this section to the bottom of
              every card.
          ================================================= */}
          <div className="mt-auto flex shrink-0 items-end justify-between border-t border-black/[0.06] pt-4">
            <div>
              <p className="text-[8px] font-semibold uppercase tracking-[0.16em] text-black/25">
                Tickets
              </p>

              <p className="mt-1 font-display text-sm font-semibold tracking-[-0.02em] text-[#111014]">
                {from === 0
                  ? "Free"
                  : `From ${formatPrice(from)}`}
              </p>
            </div>

            {/* Small CTA */}
            <span className="flex items-center gap-1.5 text-[9px] font-semibold uppercase tracking-[0.12em] text-black/30 transition-colors group-hover:text-[#6D28D9]">
              View event

              <ArrowUpRight
                size={11}
                className="transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
              />
            </span>
          </div>
        </div>

        {/* =====================================================
            BOTTOM ACCENT
        ===================================================== */}
        <div className="absolute bottom-0 left-0 right-0 h-[2px] origin-left scale-x-0 bg-gradient-to-r from-[#7C3AED] via-[#A855F7] to-transparent transition-transform duration-500 group-hover:scale-x-100" />
      </article>
    </Link>
  );
}