import EventExpiryRefresh from "./EventExpiryRefresh";
import { getEventEnd } from "@/lib/event-time";
import Link from "next/link";
import EventCard from "@/components/events/EventCard";
import { getMostBookedEvents } from "@/lib/data";
import { ArrowRight, ArrowUpRight } from "lucide-react";

export default async function FeaturedEvents() {
  const topEvents = await getMostBookedEvents(3);

  if (topEvents.length === 0) return null;

  return (
    <section
      id="featured-events"
      className="relative overflow-hidden bg-[#FAF9F6] text-[#17131D]"
    >
      <EventExpiryRefresh expiresAt={Math.min(...topEvents.map(event => getEventEnd(event).getTime()))} />
      <div className="mx-auto max-w-[1440px] px-5 py-20 sm:px-8 sm:py-24 lg:px-12 lg:py-28">
        {/* SECTION HEADER */}
        <header className="mb-11 sm:mb-14 lg:mb-16">
          <div className="mb-7 flex items-center gap-3">
            <span className="h-px w-9 bg-[#6D28D9]" />

            <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6D28D9]">
              Most booked on Tickety
            </span>
          </div>

          <div className="flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-[850px]">
              <h2 className="text-[clamp(2.8rem,5.5vw,5.5rem)] font-semibold leading-[1.02] tracking-[-0.065em]">
                Worth making
                <br />
                <span className="text-[#6D28D9]">plans for.</span>
              </h2>

              <p className="mt-6 max-w-[470px] text-[14px] leading-7 text-[#77717E] sm:text-[16px]">
                Discover the events people are booking and
                find your next experience.
              </p>
            </div>

            <Link
              href="/explore"
              className="group inline-flex w-fit items-center gap-3 border-b border-[#17131D] pb-2 text-[13px] font-semibold transition-colors hover:border-[#6D28D9] hover:text-[#6D28D9]"
            >
              Explore all events

              <ArrowUpRight
                size={17}
                strokeWidth={1.8}
                className="transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
              />
            </Link>
          </div>
        </header>

        {/* EDITORIAL DIVIDER */}
        <div className="mb-7 flex items-center justify-between border-t border-[#DDD9E0] pt-5">
          <span className="text-[10px] font-semibold uppercase tracking-[0.17em] text-[#8C8492]">
            Popular experiences
          </span>

          <span className="text-[10px] font-medium tracking-[0.08em] text-[#8C8492]">
            {String(topEvents.length).padStart(2, "0")} EVENTS
          </span>
        </div>

        {/* EVENT GRID */}
        <div className="grid items-stretch gap-x-6 gap-y-12 md:grid-cols-2 lg:grid-cols-3 lg:gap-x-7">
          {topEvents.map((event, index) => (
            <FeaturedEventCard
              key={event.id}
              event={event}
              index={index}
            />
          ))}
        </div>

        {/* BOTTOM CTA */}
        <div className="mt-14 flex flex-col gap-5 border-t border-[#DDD9E0] pt-7 sm:flex-row sm:items-center sm:justify-between lg:mt-20">
          <p className="text-[13px] text-[#77717E]">
            There's always something worth showing up for.
          </p>

          <Link
            href="/explore"
            className="group inline-flex w-fit items-center gap-2.5 text-[13px] font-semibold text-[#6D28D9]"
          >
            See all events

            <ArrowRight
              size={16}
              className="transition-transform duration-300 group-hover:translate-x-1"
            />
          </Link>
        </div>
      </div>
    </section>
  );
}

function FeaturedEventCard({
  event,
  index,
}: {
  event: Parameters<typeof EventCard>[0]["event"];
  index: number;
}) {
  return (
    <article className="group flex min-w-0 flex-col">
      {/* SMALL EDITORIAL INDEX */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-[12px] font-semibold tabular-nums text-[#6D28D9]">
            {String(index + 1).padStart(2, "0")}
          </span>

          <span className="h-px w-7 bg-[#CFC6D9]" />

          <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#8C8492]">
            {index === 0 ? "Most booked" : "Popular event"}
          </span>
        </div>

        <ArrowUpRight
          size={18}
          strokeWidth={1.6}
          className="text-[#A19AA7] transition-all duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-[#6D28D9]"
        />
      </div>

      {/* EVENT CARD — RETAINS EXISTING EVENT FUNCTIONALITY */}
      <div className="min-w-0 flex-1 transition-transform duration-300 ease-out group-hover:-translate-y-1">
        <EventCard event={event} />
      </div>
    </article>
  );
}