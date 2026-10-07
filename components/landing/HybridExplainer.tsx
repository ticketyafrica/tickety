"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  Check,
  CheckCircle2,
  Compass,
  CreditCard,
  LockKeyhole,
  MapPin,
  ShieldCheck,
  Ticket,
  Wallet,
} from "lucide-react";

const benefits = [
  {
    number: "01",
    icon: Compass,
    title: "Find what moves you.",
    description:
      "Discover events across different categories and find experiences worth making plans for.",
  },
  {
    number: "02",
    icon: CreditCard,
    title: "Book without the back-and-forth.",
    description:
      "Choose your tickets, see your total, and complete checkout directly on the website.",
  },
  {
    number: "03",
    icon: Ticket,
    title: "Your tickets stay within reach.",
    description:
      "Access your confirmed bookings on Tickety whenever you need them.",
  },
  {
    number: "04",
    icon: ShieldCheck,
    title: "Know what you're paying for.",
    description:
      "Review ticket prices and applicable fees before completing your payment.",
  },
] as const;

function formatNaira(value: number) {
  return `₦${value.toLocaleString("en-NG")}`;
}

function BenefitItem({
  benefit,
  index,
  visible,
}: {
  benefit: (typeof benefits)[number];
  index: number;
  visible: boolean;
}) {
  const Icon = benefit.icon;

  return (
    <div
      className={[
        "group grid grid-cols-[38px_minmax(0,1fr)] gap-4 border-t border-zinc-200/80 py-5 transition-all duration-700 sm:grid-cols-[44px_minmax(0,1fr)] sm:gap-5 sm:py-6",
        visible
          ? "translate-y-0 opacity-100"
          : "translate-y-4 opacity-0",
      ].join(" ")}
      style={{
        transitionDelay: visible
          ? `${index * 110}ms`
          : "0ms",
      }}
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-violet-100 bg-violet-50 text-violet-700 sm:h-11 sm:w-11">
        <Icon size={19} strokeWidth={1.7} />
      </div>

      <div className="min-w-0">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-[17px] font-semibold leading-snug tracking-[-0.035em] text-zinc-900 sm:text-[19px]">
            {benefit.title}
          </h3>

          <span className="pt-1 text-[10px] font-semibold tracking-[0.1em] text-zinc-300">
            {benefit.number}
          </span>
        </div>

        <p className="mt-1.5 max-w-[440px] text-[12px] leading-[1.8] text-zinc-500 sm:text-[13px]">
          {benefit.description}
        </p>
      </div>
    </div>
  );
}

function TicketPreview() {
  return (
    <div className="relative mx-auto w-full max-w-[465px]">
      {/* Main product window */}
      <div className="overflow-hidden rounded-[24px] border border-zinc-200 bg-white shadow-[0_30px_85px_-35px_rgba(39,20,80,0.23)]">
        {/* Window header */}
        <div className="flex h-[56px] items-center justify-between border-b border-zinc-100 px-5 sm:px-6">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-violet-600 text-white">
              <Ticket size={16} strokeWidth={1.8} />
            </div>

            <span className="text-[13px] font-bold tracking-[-0.045em] text-zinc-950">
              tickety
              <span className="text-violet-600">.</span>
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-zinc-400">
            <LockKeyhole size={12} />

            <span className="text-[10px] font-medium">
              My tickets
            </span>
          </div>
        </div>

        <div className="p-4 sm:p-6">
          {/* Section heading */}
          <div className="mb-5 flex items-end justify-between gap-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-violet-600">
                Your next experience
              </p>

              <h4 className="mt-1.5 text-[22px] font-semibold tracking-[-0.055em] text-zinc-950 sm:text-[25px]">
                You're going.
              </h4>
            </div>

            <div className="flex items-center gap-1.5 rounded-lg bg-emerald-50 px-2.5 py-1.5 text-[10px] font-semibold text-emerald-700">
              <CheckCircle2 size={13} />
              Confirmed
            </div>
          </div>

          {/* Digital ticket */}
          <div className="overflow-hidden rounded-[18px] border border-zinc-200">
            {/* Event artwork */}
            <div className="relative h-[145px] overflow-hidden bg-[linear-gradient(125deg,#241047_0%,#6D28D9_55%,#A78BFA_100%)] p-5 text-white sm:h-[170px]">
              <div
                aria-hidden="true"
                className="absolute -right-12 -top-24 h-[260px] w-[260px] rounded-full border-[48px] border-white/10"
              />

              <div
                aria-hidden="true"
                className="absolute right-16 top-[-65px] h-[230px] w-[230px] rounded-full border border-white/25"
              />

              <div className="relative flex h-full flex-col justify-between">
                <span className="w-fit rounded-md border border-white/20 bg-white/10 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.12em]">
                  Live experience
                </span>

                <div>
                  <p className="text-[10px] font-medium text-white/65">
                    Lagos, Nigeria
                  </p>

                  <h5 className="mt-1 text-[26px] font-bold leading-none tracking-[-0.06em] sm:text-[31px]">
                    The Lagos
                    <br />
                    Experience
                  </h5>
                </div>
              </div>
            </div>

            {/* Ticket details */}
            <div className="bg-white px-4 py-4 sm:px-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[9px] font-medium uppercase tracking-[0.12em] text-zinc-400">
                    Ticket type
                  </p>

                  <p className="mt-1 text-[13px] font-semibold text-zinc-900">
                    General Admission
                  </p>
                </div>

                <div className="flex items-center gap-1.5 rounded-md bg-violet-50 px-2.5 py-1.5 text-[10px] font-semibold text-violet-700">
                  <Check size={12} />
                  Booked
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-4 border-t border-dashed border-zinc-200 pt-4">
                <div>
                  <p className="text-[9px] text-zinc-400">
                    Date
                  </p>

                  <p className="mt-1 flex items-center gap-1.5 text-[11px] font-medium text-zinc-800">
                    <CalendarDays
                      size={12}
                      className="text-violet-600"
                    />
                    24 October
                  </p>
                </div>

                <div>
                  <p className="text-[9px] text-zinc-400">
                    Location
                  </p>

                  <p className="mt-1 flex items-center gap-1.5 text-[11px] font-medium text-zinc-800">
                    <MapPin
                      size={12}
                      className="text-violet-600"
                    />
                    Victoria Island
                  </p>
                </div>
              </div>
            </div>

            {/* QR activation note */}
            <div className="flex items-start gap-2.5 border-t border-zinc-100 bg-zinc-50 px-4 py-3.5 sm:px-5">
              <ShieldCheck
                size={15}
                className="mt-0.5 shrink-0 text-violet-600"
              />

              <p className="text-[10px] leading-5 text-zinc-500">
                Your booking is confirmed. Your entry QR
                code will become available closer to the
                event.
              </p>
            </div>
          </div>

          {/* Order footer */}
          <div className="mt-5 flex items-center justify-between gap-4">
            <div>
              <p className="text-[10px] text-zinc-400">
                Booking total
              </p>

              <p className="mt-1 text-[19px] font-bold tracking-[-0.045em] text-zinc-950">
                {formatNaira(26250)}
              </p>
            </div>

            <span className="inline-flex h-10 items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 px-4 text-[11px] font-semibold text-zinc-700">
              View ticket
              <ArrowUpRight size={13} />
            </span>
          </div>
        </div>
      </div>

      {/* Small supporting note */}
      <div className="mt-4 flex items-center justify-center gap-2 text-zinc-500">
        <ShieldCheck
          size={14}
          className="text-violet-600"
        />

        <span className="text-[11px] font-medium">
          Your booking, all in one place.
        </span>
      </div>
    </div>
  );
}

export default function HybridExplainer() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const element = sectionRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      {
        threshold: 0.12,
      }
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="why-tickety"
      className="relative isolate overflow-hidden bg-[#FAF9FD]"
    >
      {/* Restrained background accents */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10"
      >
        <div className="absolute inset-0 bg-[linear-gradient(180deg,#FFFFFF_0%,#FAF9FD_100%)]" />

        <div className="absolute -right-40 top-16 h-[500px] w-[500px] rounded-full bg-violet-100/45 blur-[110px]" />

        <div className="absolute -left-48 bottom-0 h-[420px] w-[420px] rounded-full bg-purple-100/30 blur-[110px]" />
      </div>

      <div className="mx-auto max-w-[1360px] px-5 py-20 sm:px-8 sm:py-24 lg:px-12 lg:py-28">
        {/* Section introduction */}
        <div className="mb-12 flex flex-col gap-6 lg:mb-16 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <span className="h-px w-8 bg-violet-600" />

              <span className="text-[10px] font-semibold uppercase tracking-[0.19em] text-violet-700">
                Why Tickety
              </span>
            </div>

            <h2 className="mt-5 max-w-[800px] text-[clamp(2.7rem,5.3vw,5.2rem)] font-semibold leading-[1.02] tracking-[-0.065em] text-zinc-950">
              Less figuring out.
              <br />
              <span className="text-violet-600">
                More showing up.
              </span>
            </h2>
          </div>

          <p className="max-w-[335px] text-[13px] leading-7 text-zinc-500 sm:text-[14px]">
            Great experiences deserve a simpler way in.
            Tickety brings event discovery, booking, and
            ticket access together on one website.
          </p>
        </div>

        {/* Main content */}
        <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:gap-16 xl:gap-24">
          {/* Benefits */}
          <div className="min-w-0">
            <div>
              {benefits.map((benefit, index) => (
                <BenefitItem
                  key={benefit.number}
                  benefit={benefit}
                  index={index}
                  visible={visible}
                />
              ))}
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-5">
              <Link
                href="/explore"
                className="group inline-flex h-[48px] items-center justify-center gap-2.5 rounded-xl bg-violet-600 px-6 text-[12px] font-semibold text-white transition-colors hover:bg-violet-700"
              >
                Explore events

                <ArrowRight
                  size={15}
                  className="transition-transform group-hover:translate-x-0.5"
                />
              </Link>

              <span className="flex items-center gap-2 text-[11px] font-medium text-zinc-500">
                <CheckCircle2
                  size={14}
                  className="text-violet-600"
                />
                All on Tickety
              </span>
            </div>
          </div>

          {/* Product visual */}
          <div
            className={[
              "min-w-0 transition-all duration-1000 ease-out",
              visible
                ? "translate-y-0 opacity-100"
                : "translate-y-6 opacity-0",
            ].join(" ")}
          >
            <TicketPreview />
          </div>
        </div>

        {/* Closing statement */}
        <div className="mt-16 flex flex-col gap-4 border-t border-zinc-200 pt-6 sm:flex-row sm:items-center sm:justify-between lg:mt-20">
          <p className="text-[11px] font-medium text-zinc-500">
            From finding an event to getting through the
            door.
          </p>

          <div className="flex items-center gap-2 text-[11px] font-semibold text-violet-700">
            <span>Discover</span>
            <ArrowRight size={12} />
            <span>Book</span>
            <ArrowRight size={12} />
            <span>Experience</span>
          </div>
        </div>
      </div>
    </section>
  );
}