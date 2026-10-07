"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronRight,
  Compass,
  CreditCard,
  LockKeyhole,
  MapPin,
  MousePointer2,
  Pause,
  Play,
  ScanLine,
  ShieldCheck,
  Ticket,
} from "lucide-react";

type StepIndex = 0 | 1 | 2;

const STEP_DURATION = 4200;

const steps = [
  {
    number: "01",
    label: "DISCOVER",
    title: "Find your next experience.",
    description:
      "Explore events, discover what is happening around you, and find something worth showing up for.",
    icon: Compass,
    detail: "Explore events",
  },
  {
    number: "02",
    label: "BOOK",
    title: "Choose your ticket. Book online.",
    description:
      "Select your ticket, review your order, and complete your payment securely on Tickety.",
    icon: CreditCard,
    detail: "Secure checkout",
  },
  {
    number: "03",
    label: "EXPERIENCE",
    title: "Your ticket. Ready when you are.",
    description:
      "Access your ticket directly on Tickety. When entry opens, present your QR code at the gate.",
    icon: ScanLine,
    detail: "Digital ticket",
  },
] as const;

function EventPreview() {
  return (
    <div className="w-full max-w-[365px] overflow-hidden rounded-2xl border border-white/15 bg-[#171326] shadow-[0_25px_70px_rgba(0,0,0,0.25)]">
      <div className="relative flex h-[116px] items-end overflow-hidden bg-[linear-gradient(125deg,#5B21B6_0%,#7C3AED_45%,#C084FC_100%)] p-4">
        <div
          aria-hidden="true"
          className="absolute -right-8 -top-16 h-52 w-52 rounded-full border-[35px] border-white/10"
        />

        <div
          aria-hidden="true"
          className="absolute right-12 top-[-45px] h-44 w-44 rounded-full border border-white/20"
        />

        <span className="relative rounded-md border border-white/20 bg-black/20 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.12em] text-white">
          Music & nightlife
        </span>
      </div>

      <div className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[16px] font-semibold tracking-[-0.04em] text-white">
              Lagos After Dark
            </p>

            <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1.5 text-[10px] text-white/50">
              <span className="flex items-center gap-1.5">
                <CalendarDays size={11} />
                Saturday
              </span>

              <span className="flex items-center gap-1.5">
                <MapPin size={11} />
                Victoria Island
              </span>
            </div>
          </div>

          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-500/15 text-violet-300">
            <ArrowRight size={15} />
          </div>
        </div>

        <div className="mt-5 flex items-center justify-between border-t border-white/10 pt-4">
          <div>
            <p className="text-[9px] text-white/40">
              Tickets from
            </p>

            <p className="mt-0.5 text-[15px] font-semibold tracking-[-0.04em] text-white">
              ₦12,500
            </p>
          </div>

          <span className="rounded-lg bg-white px-3 py-2 text-[10px] font-semibold text-[#24133F]">
            View event
          </span>
        </div>
      </div>
    </div>
  );
}

function CheckoutPreview() {
  return (
    <div className="w-full max-w-[365px] overflow-hidden rounded-2xl border border-white/15 bg-[#171326] shadow-[0_25px_70px_rgba(0,0,0,0.25)]">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3.5 sm:px-5">
        <div className="flex items-center gap-2">
          <LockKeyhole
            size={13}
            className="text-violet-300"
          />

          <span className="text-[11px] font-semibold text-white">
            Secure checkout
          </span>
        </div>

        <span className="text-[9px] text-white/40">
          tickety.africa
        </span>
      </div>

      <div className="p-4 sm:p-5">
        <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-violet-300">
          Order summary
        </p>

        <h4 className="mt-2 text-[16px] font-semibold tracking-[-0.035em] text-white">
          Lagos After Dark
        </h4>

        <div className="mt-5 flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.04] p-3.5">
          <div>
            <p className="text-[11px] font-semibold text-white">
              General Admission
            </p>

            <p className="mt-1 text-[9px] text-white/40">
              2 tickets
            </p>
          </div>

          <p className="text-[13px] font-semibold text-white">
            ₦25,000
          </p>
        </div>

        <div className="mt-4 space-y-2.5">
          <div className="flex items-center justify-between text-[10px] text-white/50">
            <span>Tickets</span>
            <span>₦25,000</span>
          </div>

          <div className="flex items-center justify-between text-[10px] text-white/50">
            <span>Service fee</span>
            <span>₦1,250</span>
          </div>

          <div className="flex items-center justify-between border-t border-white/10 pt-3 text-[12px] font-semibold text-white">
            <span>Total</span>
            <span>₦26,250</span>
          </div>
        </div>

        <div className="mt-5 flex h-10 items-center justify-center gap-2 rounded-lg bg-violet-600 text-[11px] font-semibold text-white">
          <CreditCard size={13} />
          Pay securely
          <ArrowRight size={13} />
        </div>

        <div className="mt-3 flex items-center justify-center gap-1.5 text-[9px] text-white/35">
          <ShieldCheck size={11} />
          Secure online payment
        </div>
      </div>
    </div>
  );
}

function TicketPreview() {
  return (
    <div className="w-full max-w-[365px]">
      <div className="overflow-hidden rounded-2xl border border-white/15 bg-[#171326] shadow-[0_25px_70px_rgba(0,0,0,0.25)]">
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-3.5 sm:px-5">
          <div className="flex items-center gap-2">
            <Ticket
              size={14}
              className="text-violet-300"
            />

            <span className="text-[11px] font-semibold text-white">
              My tickets
            </span>
          </div>

          <span className="flex items-center gap-1.5 text-[9px] text-emerald-300">
            <CheckCircle2 size={12} />
            Confirmed
          </span>
        </div>

        <div className="p-4 sm:p-5">
          <div className="rounded-xl bg-white p-4 text-zinc-900">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-violet-600">
                  Admission ticket
                </p>

                <h4 className="mt-2 text-[17px] font-bold tracking-[-0.045em]">
                  Lagos After Dark
                </h4>

                <p className="mt-2 text-[10px] text-zinc-500">
                  Saturday · Victoria Island
                </p>
              </div>

              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-violet-100 text-violet-600">
                <Ticket size={18} />
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between border-t border-dashed border-zinc-200 pt-4">
              <div>
                <p className="text-[9px] text-zinc-400">
                  Ticket type
                </p>

                <p className="mt-1 text-[12px] font-semibold">
                  General Admission
                </p>
              </div>

              <div className="flex items-center gap-1.5 rounded-md bg-emerald-50 px-2 py-1.5 text-[9px] font-semibold text-emerald-700">
                <Check size={11} />
                Booked
              </div>
            </div>
          </div>

          <div className="mt-3 flex items-center gap-2 rounded-lg border border-violet-400/15 bg-violet-400/[0.07] px-3 py-2.5">
            <ScanLine
              size={15}
              className="shrink-0 text-violet-300"
            />

            <p className="text-[10px] leading-4 text-white/65">
              Your entry QR code becomes available
              closer to the event.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function StepVisual({
  activeStep,
}: {
  activeStep: StepIndex;
}) {
  return (
    <div className="relative mx-auto w-full max-w-[410px]">
      <div className="mb-4 flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-violet-400" />

          <span className="text-[9px] font-semibold uppercase tracking-[0.15em] text-white/45">
            On Tickety
          </span>
        </div>

        <span className="text-[9px] font-medium text-white/30">
          0{activeStep + 1} / 03
        </span>
      </div>

      {/* Constant height prevents shifting between previews */}
      <div className="relative h-[365px] overflow-hidden sm:h-[385px]">
        {[
          <EventPreview key="event" />,
          <CheckoutPreview key="checkout" />,
          <TicketPreview key="ticket" />,
        ].map((visual, index) => (
          <div
            key={index}
            aria-hidden={activeStep !== index}
            className={[
              "absolute inset-x-0 top-0 flex justify-center transition-all duration-700 ease-out",
              activeStep === index
                ? "translate-y-0 scale-100 opacity-100"
                : index < activeStep
                  ? "-translate-y-5 scale-[0.98] opacity-0"
                  : "translate-y-5 scale-[0.98] opacity-0",
            ].join(" ")}
          >
            {visual}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function HowItWorks() {
  const [activeStep, setActiveStep] =
    useState<StepIndex>(0);

  const [playing, setPlaying] = useState(true);
  const [progress, setProgress] = useState(0);
  const [inView, setInView] = useState(false);

  const sectionRef = useRef<HTMLElement | null>(null);
  const progressRef = useRef(0);

  useEffect(() => {
    const node = sectionRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setInView(entry.isIntersecting);
      },
      {
        threshold: 0.2,
      }
    );

    observer.observe(node);

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!playing || !inView) return;

    let frame = 0;
    let lastTime = 0;

    const animate = (timestamp: number) => {
      if (!lastTime) {
        lastTime = timestamp;
      }

      const delta = Math.min(
        timestamp - lastTime,
        100
      );

      lastTime = timestamp;

      progressRef.current +=
        (delta / STEP_DURATION) * 100;

      if (progressRef.current >= 100) {
        progressRef.current = 0;

        setActiveStep((current) =>
          ((current + 1) % 3) as StepIndex
        );
      }

      setProgress(progressRef.current);

      frame = requestAnimationFrame(animate);
    };

    frame = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(frame);
  }, [playing, inView]);

  function selectStep(index: StepIndex) {
    setActiveStep(index);
    progressRef.current = 0;
    setProgress(0);
  }

  return (
    <section
      ref={sectionRef}
      id="how-it-works"
      className="relative isolate overflow-hidden bg-[#10091F] text-white"
    >
      {/* Brand dark gradient background */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
      >
        <div className="absolute inset-0 bg-[linear-gradient(135deg,#10091F_0%,#1B1034_48%,#10091F_100%)]" />

        <div className="absolute right-[-260px] top-[-280px] h-[680px] w-[680px] rounded-full bg-violet-700/15 blur-[130px]" />

        <div className="absolute bottom-[-360px] left-[-250px] h-[700px] w-[700px] rounded-full bg-purple-800/20 blur-[140px]" />

        <div className="absolute inset-0 opacity-[0.035] [background-image:linear-gradient(to_right,white_1px,transparent_1px),linear-gradient(to_bottom,white_1px,transparent_1px)] [background-size:80px_80px]" />
      </div>

      <div className="relative mx-auto max-w-[1360px] px-5 py-20 sm:px-8 sm:py-24 lg:px-12 lg:py-28">
        {/* Section header */}
        <div className="grid gap-5 lg:grid-cols-[0.65fr_1.35fr] lg:items-end lg:gap-16">
          <div>
            <div className="flex items-center gap-3">
              <span className="h-px w-8 bg-violet-400" />

              <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-violet-300">
                How Tickety works
              </span>
            </div>

            <p className="mt-5 max-w-[250px] text-[12px] leading-6 text-white/45">
              One platform. Three simple steps.
              From discovery to the door.
            </p>
          </div>

          <h2 className="max-w-[800px] text-[clamp(2.6rem,5.5vw,5.4rem)] font-semibold leading-[1.02] tracking-[-0.065em]">
            Going out should
            <br />
            <span className="text-violet-400">
              feel this easy.
            </span>
          </h2>
        </div>

        {/* Main timeline and preview */}
        <div className="mt-14 grid gap-12 border-t border-white/10 pt-12 lg:mt-20 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)] lg:items-center lg:gap-20 lg:pt-16">
          {/* Vertical timeline */}
          <div className="relative">
            {/* Timeline track */}
            <div
              aria-hidden="true"
              className="absolute bottom-[55px] left-[19px] top-[20px] w-px bg-white/10 sm:left-[23px]"
            />

            {/* Animated progress track */}
            <div
              aria-hidden="true"
              className="absolute left-[19px] top-[20px] w-px bg-violet-400 transition-[height] duration-300 sm:left-[23px]"
              style={{
                height: `calc((100% - 75px) * ${
                  (activeStep + progress / 100) / 3
                })`,
              }}
            />

            <div className="space-y-10 sm:space-y-12">
              {steps.map((step, index) => {
                const Icon = step.icon;
                const active = activeStep === index;
                const completed = activeStep > index;

                return (
                  <button
                    key={step.number}
                    type="button"
                    onClick={() =>
                      selectStep(index as StepIndex)
                    }
                    className="group relative flex w-full items-start gap-5 text-left sm:gap-7"
                    aria-current={
                      active ? "step" : undefined
                    }
                  >
                    {/* Timeline node */}
                    <span
                      className={[
                        "relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border transition-all duration-500 sm:h-12 sm:w-12",
                        active
                          ? "border-violet-400 bg-violet-600 text-white shadow-[0_0_0_6px_rgba(139,92,246,0.1)]"
                          : completed
                            ? "border-violet-500 bg-violet-600 text-white"
                            : "border-white/15 bg-[#1B1330] text-white/35 group-hover:border-violet-400/50",
                      ].join(" ")}
                    >
                      {completed ? (
                        <Check size={18} />
                      ) : (
                        <Icon
                          size={18}
                          strokeWidth={1.7}
                        />
                      )}
                    </span>

                    {/* Copy */}
                    <div className="min-w-0 flex-1 pb-1">
                      <div className="flex items-center justify-between gap-3">
                        <span
                          className={[
                            "text-[10px] font-semibold uppercase tracking-[0.18em] transition-colors",
                            active
                              ? "text-violet-300"
                              : "text-white/30",
                          ].join(" ")}
                        >
                          {step.number} / {step.label}
                        </span>

                        <ChevronRight
                          size={15}
                          className={[
                            "transition-all duration-300",
                            active
                              ? "translate-x-0 text-violet-300"
                              : "-translate-x-1 text-white/20 group-hover:translate-x-0",
                          ].join(" ")}
                        />
                      </div>

                      <h3
                        className={[
                          "mt-2 text-[22px] font-semibold leading-[1.15] tracking-[-0.045em] transition-colors sm:text-[27px]",
                          active
                            ? "text-white"
                            : "text-white/55 group-hover:text-white/80",
                        ].join(" ")}
                      >
                        {step.title}
                      </h3>

                      <p
                        className={[
                          "mt-3 max-w-[440px] text-[12px] leading-6 transition-colors sm:text-[13px]",
                          active
                            ? "text-white/60"
                            : "text-white/35",
                        ].join(" ")}
                      >
                        {step.description}
                      </p>

                      {/* Active step progress */}
                      <div className="mt-4 h-[2px] max-w-[260px] overflow-hidden rounded-full bg-white/10">
                        <div
                          className="h-full rounded-full bg-violet-400"
                          style={{
                            width: active
                              ? `${progress}%`
                              : completed
                                ? "100%"
                                : "0%",
                          }}
                        />
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Product preview */}
          <div className="relative min-w-0">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute left-1/2 top-1/2 h-[330px] w-[330px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-violet-600/10 blur-[90px]"
            />

            <div className="relative mx-auto max-w-[430px] rounded-[25px] border border-white/10 bg-white/[0.035] p-4 sm:p-6">
              <div className="mb-5 flex items-center justify-between border-b border-white/10 pb-4">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-600">
                    <Ticket size={14} />
                  </div>

                  <span className="text-[12px] font-bold tracking-[-0.04em]">
                    tickety
                    <span className="text-violet-400">
                      .
                    </span>
                  </span>
                </div>

                <div className="flex items-center gap-1.5 text-white/40">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />

                  <span className="text-[9px] font-medium">
                    Website experience
                  </span>
                </div>
              </div>

              <StepVisual activeStep={activeStep} />

              {/* Playback controls */}
              <div className="mt-2 flex items-center justify-between border-t border-white/10 pt-4">
                <div className="flex items-center gap-2">
                  {steps.map((step, index) => (
                    <button
                      key={step.number}
                      type="button"
                      onClick={() =>
                        selectStep(index as StepIndex)
                      }
                      aria-label={`Preview ${step.label.toLowerCase()}`}
                      className={[
                        "h-1 rounded-full transition-all duration-300",
                        activeStep === index
                          ? "w-7 bg-violet-400"
                          : "w-2 bg-white/20 hover:bg-white/40",
                      ].join(" ")}
                    />
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setPlaying((current) => !current)
                  }
                  className="flex items-center gap-2 text-[10px] font-medium text-white/45 transition-colors hover:text-white"
                  aria-label={
                    playing
                      ? "Pause timeline animation"
                      : "Play timeline animation"
                  }
                >
                  {playing ? (
                    <Pause size={13} />
                  ) : (
                    <Play size={13} />
                  )}

                  {playing ? "Pause" : "Play"}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-16 flex flex-col gap-5 border-t border-white/10 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2.5">
            <CheckCircle2
              size={16}
              className="text-violet-400"
            />

            <p className="text-[11px] font-medium text-white/50">
              Discover on Tickety. Book on Tickety.
              Experience it in person.
            </p>
          </div>

          <Link
            href="/explore"
            className="group inline-flex items-center gap-2 text-[12px] font-semibold text-white transition-colors hover:text-violet-300"
          >
            Explore events

            <ArrowRight
              size={15}
              className="transition-transform group-hover:translate-x-1"
            />
          </Link>
        </div>
      </div>
    </section>
  );
}