"use client";

import {
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Check,
  CheckCircle2,
  CreditCard,
  LockKeyhole,
  MapPin,
  Minus,
  Plus,
  ShieldCheck,
  Ticket,
} from "lucide-react";

import { calculateTicketServiceFee } from "@/lib/constants";

type BookingStep = "tickets" | "checkout" | "confirmed";

const EVENT = {
  title: "The Lagos Experience",
  date: "Saturday, 24 October",
  time: "7:00 PM",
  venue: "Victoria Island, Lagos",
  ticketName: "General Admission",
  price: 12500,
};

function formatNaira(amount: number) {
  return `₦${amount.toLocaleString("en-NG")}`;
}

function StepIndicator({
  step,
}: {
  step: BookingStep;
}) {
  const steps = [
    { id: "tickets", label: "Tickets" },
    { id: "checkout", label: "Checkout" },
    { id: "confirmed", label: "Confirmed" },
  ] as const;

  const activeIndex = steps.findIndex(
    (item) => item.id === step
  );

  return (
    <div className="flex items-center gap-2">
      {steps.map((item, index) => {
        const completed = index < activeIndex;
        const active = index === activeIndex;

        return (
          <div
            key={item.id}
            className="flex min-w-0 flex-1 items-center gap-2"
          >
            <div
              className={[
                "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold transition-colors duration-300",
                completed
                  ? "bg-violet-600 text-white"
                  : active
                    ? "bg-violet-600 text-white"
                    : "bg-zinc-100 text-zinc-400",
              ].join(" ")}
            >
              {completed ? (
                <Check size={12} strokeWidth={2.5} />
              ) : (
                index + 1
              )}
            </div>

            <span
              className={[
                "truncate text-[10px] font-medium transition-colors duration-300 sm:text-[11px]",
                active
                  ? "text-zinc-900"
                  : completed
                    ? "text-zinc-600"
                    : "text-zinc-400",
              ].join(" ")}
            >
              {item.label}
            </span>

            {index < steps.length - 1 && (
              <div
                className={[
                  "ml-auto hidden h-px min-w-2 flex-1 sm:block",
                  completed
                    ? "bg-violet-400"
                    : "bg-zinc-200",
                ].join(" ")}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

function Detail({
  icon,
  children,
}: {
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="flex min-w-0 items-center gap-2 text-[11px] text-zinc-500">
      <span className="shrink-0 text-zinc-400">
        {icon}
      </span>
      <span className="truncate">{children}</span>
    </div>
  );
}

function PriceRow({
  label,
  value,
  strong = false,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span
        className={
          strong
            ? "text-[12px] font-semibold text-zinc-900"
            : "text-[11px] text-zinc-500"
        }
      >
        {label}
      </span>

      <span
        className={
          strong
            ? "text-[15px] font-bold tracking-[-0.04em] text-zinc-950"
            : "text-[11px] font-medium text-zinc-700"
        }
      >
        {value}
      </span>
    </div>
  );
}

export default function HeroConversation() {
  const [step, setStep] =
    useState<BookingStep>("tickets");

  const [quantity, setQuantity] = useState(2);

  const [autoPlay, setAutoPlay] = useState(true);

  const ticketTotal = EVENT.price * quantity;
  const serviceFee = calculateTicketServiceFee(ticketTotal);
  const grandTotal = ticketTotal + serviceFee;

  useEffect(() => {
    if (!autoPlay) return;

    const delay =
      step === "tickets"
        ? 3600
        : step === "checkout"
          ? 3500
          : 4200;

    const timeout = window.setTimeout(() => {
      setStep((current) => {
        if (current === "tickets") {
          return "checkout";
        }

        if (current === "checkout") {
          return "confirmed";
        }

        return "tickets";
      });
    }, delay);

    return () => window.clearTimeout(timeout);
  }, [step, autoPlay]);

  function changeStep(next: BookingStep) {
    setAutoPlay(false);
    setStep(next);
  }

  return (
    <div className="relative mx-auto w-full max-w-[490px] px-3 sm:px-4">
      {/* Small section label */}
      <div className="mb-4 flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-violet-600" />

          <span className="text-[10px] font-semibold uppercase tracking-[0.17em] text-zinc-500">
            The Tickety experience
          </span>
        </div>

        <span className="text-[10px] font-medium text-zinc-400">
          A simpler way to book
        </span>
      </div>

      {/* Main booking interface — height stays constant */}
      <div className="overflow-hidden rounded-[22px] border border-zinc-200 bg-white shadow-[0_18px_65px_-35px_rgba(24,24,27,0.24)]">
        {/* Browser header */}
        <div className="flex h-[45px] items-center justify-between border-b border-zinc-100 px-4">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-[7px] bg-violet-600 text-white">
              <Ticket size={13} strokeWidth={2} />
            </div>

            <span className="text-[12px] font-bold tracking-[-0.035em] text-zinc-900">
              tickety
              <span className="text-violet-600">.</span>
            </span>
          </div>

          <div className="flex items-center gap-1.5 rounded-md bg-zinc-50 px-2.5 py-1.5">
            <LockKeyhole
              size={10}
              className="text-zinc-400"
            />

            <span className="text-[9px] font-medium text-zinc-500">
              Secure booking
            </span>
          </div>
        </div>

        {/* Progress */}
        <div className="border-b border-zinc-100 px-5 py-4 sm:px-6">
          <StepIndicator step={step} />
        </div>

        {/*
          CRITICAL:
          This fixed-height viewport prevents layout shifts.
          All three screens occupy the same space.
        */}
        <div className="relative h-[400px] overflow-hidden sm:h-[405px]">
          {/* STEP 1 — SELECT TICKETS */}
          <div
            aria-hidden={step !== "tickets"}
            className={[
              "absolute inset-0 flex flex-col px-5 py-5 transition-all duration-500 ease-out sm:px-6",
              step === "tickets"
                ? "pointer-events-auto translate-x-0 opacity-100"
                : "pointer-events-none -translate-x-5 opacity-0",
            ].join(" ")}
          >
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-violet-600">
                Select your tickets
              </p>

              <h3 className="mt-2 text-[21px] font-semibold leading-tight tracking-[-0.055em] text-zinc-950 sm:text-[23px]">
                {EVENT.title}
              </h3>

              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2">
                <Detail
                  icon={<CalendarDays size={13} />}
                >
                  {EVENT.date}
                </Detail>

                <Detail
                  icon={<MapPin size={13} />}
                >
                  {EVENT.venue}
                </Detail>
              </div>
            </div>

            <div className="mt-6 border-y border-zinc-100 py-5">
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-violet-600" />

                    <p className="text-[13px] font-semibold tracking-[-0.02em] text-zinc-900">
                      {EVENT.ticketName}
                    </p>
                  </div>

                  <p className="mt-1.5 pl-3.5 text-[11px] text-zinc-500">
                    {formatNaira(EVENT.price)} per ticket
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-3">
                  <button
                    type="button"
                    aria-label="Remove one ticket"
                    disabled={quantity <= 1}
                    onClick={() => {
                      setAutoPlay(false);
                      setQuantity((current) =>
                        Math.max(1, current - 1)
                      );
                    }}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-200 text-zinc-600 transition-colors hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    <Minus size={13} />
                  </button>

                  <span className="w-3 text-center text-[13px] font-semibold text-zinc-900">
                    {quantity}
                  </span>

                  <button
                    type="button"
                    aria-label="Add one ticket"
                    disabled={quantity >= 10}
                    onClick={() => {
                      setAutoPlay(false);
                      setQuantity((current) =>
                        Math.min(10, current + 1)
                      );
                    }}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-200 text-zinc-600 transition-colors hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    <Plus size={13} />
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              <PriceRow
                label={`${quantity} × ${EVENT.ticketName}`}
                value={formatNaira(ticketTotal)}
              />

              <PriceRow
                label="Service fee"
                value={formatNaira(serviceFee)}
              />

              <div className="border-t border-zinc-100 pt-3">
                <PriceRow
                  label="Total"
                  value={formatNaira(grandTotal)}
                  strong
                />
              </div>
            </div>

            <div className="mt-auto">
              <button
                type="button"
                onClick={() => changeStep("checkout")}
                className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-violet-600 text-[12px] font-semibold text-white transition-colors hover:bg-violet-700"
              >
                Continue to checkout
                <ArrowRight size={14} />
              </button>

              <p className="mt-3 text-center text-[10px] text-zinc-400">
                Choose your tickets. Checkout in minutes.
              </p>
            </div>
          </div>

          {/* STEP 2 — CHECKOUT */}
          <div
            aria-hidden={step !== "checkout"}
            className={[
              "absolute inset-0 flex flex-col px-5 py-5 transition-all duration-500 ease-out sm:px-6",
              step === "checkout"
                ? "pointer-events-auto translate-x-0 opacity-100"
                : "pointer-events-none translate-x-5 opacity-0",
            ].join(" ")}
          >
            <div>
              <button
                type="button"
                onClick={() => changeStep("tickets")}
                className="mb-4 flex items-center gap-1.5 text-[11px] font-medium text-zinc-500 transition-colors hover:text-zinc-900"
              >
                <ArrowLeft size={12} />
                Back to tickets
              </button>

              <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-violet-600">
                Almost there
              </p>

              <h3 className="mt-2 text-[22px] font-semibold tracking-[-0.055em] text-zinc-950">
                Review your booking.
              </h3>

              <p className="mt-1.5 text-[11px] leading-5 text-zinc-500">
                Everything in one place, before you pay.
              </p>
            </div>

            <div className="mt-5 rounded-xl border border-zinc-200 p-4">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-violet-50 text-violet-600">
                  <Ticket size={19} />
                </div>

                <div className="min-w-0">
                  <p className="text-[12px] font-semibold tracking-[-0.025em] text-zinc-900">
                    {EVENT.title}
                  </p>

                  <p className="mt-1 text-[10px] text-zinc-500">
                    {EVENT.date} · {EVENT.time}
                  </p>

                  <p className="mt-1 text-[10px] text-zinc-500">
                    {quantity} × {EVENT.ticketName}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              <PriceRow
                label="Tickets"
                value={formatNaira(ticketTotal)}
              />

              <PriceRow
                label="Service fee"
                value={formatNaira(serviceFee)}
              />

              <div className="border-t border-zinc-100 pt-3">
                <PriceRow
                  label="Amount to pay"
                  value={formatNaira(grandTotal)}
                  strong
                />
              </div>
            </div>

            <div className="mt-auto">
              <button
                type="button"
                onClick={() => changeStep("confirmed")}
                className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-violet-600 text-[12px] font-semibold text-white transition-colors hover:bg-violet-700"
              >
                <CreditCard size={15} />
                Preview confirmation
                <ArrowRight size={13} />
              </button>

              <div className="mt-3 flex items-center justify-center gap-1.5 text-zinc-400">
                <ShieldCheck size={12} />

                <span className="text-[10px]">
                  Payments are processed securely
                </span>
              </div>
            </div>
          </div>

          {/* STEP 3 — CONFIRMATION */}
          <div
            aria-hidden={step !== "confirmed"}
            className={[
              "absolute inset-0 flex flex-col px-5 py-5 transition-all duration-500 ease-out sm:px-6",
              step === "confirmed"
                ? "pointer-events-auto translate-x-0 opacity-100"
                : "pointer-events-none translate-x-5 opacity-0",
            ].join(" ")}
          >
            <div className="flex flex-col items-center pt-3 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                <CheckCircle2
                  size={29}
                  strokeWidth={1.7}
                />
              </div>

              <p className="mt-4 text-[10px] font-semibold uppercase tracking-[0.15em] text-emerald-600">
                Booking preview
              </p>

              <h3 className="mt-2 text-[23px] font-semibold tracking-[-0.055em] text-zinc-950">
                You&apos;re all set.
              </h3>

              <p className="mt-1.5 max-w-[260px] text-[11px] leading-5 text-zinc-500">
                After a successful payment, your tickets
                are available directly on Tickety.
              </p>
            </div>

            <div className="mt-5 overflow-hidden rounded-xl border border-zinc-200">
              <div className="flex items-center gap-3 p-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-violet-50 text-violet-600">
                  <Ticket size={21} strokeWidth={1.7} />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-[12px] font-semibold text-zinc-900">
                    {EVENT.title}
                  </p>

                  <p className="mt-1 text-[10px] text-zinc-500">
                    {quantity} × {EVENT.ticketName}
                  </p>
                </div>

                <CheckCircle2
                  size={17}
                  className="shrink-0 text-emerald-600"
                />
              </div>

              <div className="flex items-center justify-between border-t border-dashed border-zinc-200 bg-zinc-50/70 px-4 py-3">
                <span className="text-[10px] text-zinc-500">
                  Booking total
                </span>

                <span className="text-[12px] font-bold text-zinc-900">
                  {formatNaira(grandTotal)}
                </span>
              </div>
            </div>

            <div className="mt-auto">
              <button
                type="button"
                onClick={() => changeStep("tickets")}
                className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-violet-600 text-[12px] font-semibold text-white transition-colors hover:bg-violet-700"
              >
                Explore booking again
                <ArrowRight size={14} />
              </button>

              <p className="mt-3 text-center text-[10px] text-zinc-400">
                Your event. Your tickets. One website.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer — outside fixed-height card */}
      <div className="mt-4 flex items-center justify-between px-1">
        <div className="flex items-center gap-1.5">
          {(
            [
              "tickets",
              "checkout",
              "confirmed",
            ] as BookingStep[]
          ).map((item) => (
            <button
              key={item}
              type="button"
              aria-label={`Show ${item} preview`}
              aria-current={
                step === item ? "step" : undefined
              }
              onClick={() => changeStep(item)}
              className={[
                "h-1 rounded-full transition-all duration-300",
                step === item
                  ? "w-6 bg-violet-600"
                  : "w-2 bg-zinc-200 hover:bg-zinc-300",
              ].join(" ")}
            />
          ))}
        </div>

        <div className="flex items-center gap-1.5 text-zinc-400">
          <ShieldCheck size={12} />

          <span className="text-[10px] font-medium">
            Built for seamless booking
          </span>
        </div>
      </div>
    </div>
  );
}