"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  ChevronDown,
  Loader2,
  Minus,
  Plus,
  ShieldCheck,
  Ticket,
} from "lucide-react";
import { EventItem } from "@/lib/types";
import { formatEventDate, ticketsLeft } from "@/lib/utils";

import { formatMoney, roundMoney } from "@/lib/currency";
import { calculateTicketServiceFee, TICKET_SERVICE_FEE_CAP_NAIRA, TICKET_SERVICE_FEE_CAP_USD } from "@/lib/constants";

type CheckoutFormProps = {
  event: EventItem;
};

type SelectedTickets = Record<string, number>;

type AnswerMap = Record<string, string>;

export default function CheckoutForm({
  event,
}: CheckoutFormProps) {
  const currency = event.currency ?? "NGN";
  const formatPrice = (amount: number) => formatMoney(amount, currency);
  const [selectedTickets, setSelectedTickets] =
    useState<SelectedTickets>({});

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  const [answers, setAnswers] = useState<AnswerMap>({});

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const selectedItems = useMemo(() => {
    return event.ticketTypes
      .filter((ticket) => (selectedTickets[ticket.id] ?? 0) > 0)
      .map((ticket) => ({
        ...ticket,
        quantity: selectedTickets[ticket.id],
      }));
  }, [event.ticketTypes, selectedTickets]);

  const ticketCount = useMemo(
    () =>
      selectedItems.reduce(
        (sum, ticket) => sum + ticket.quantity,
        0
      ),
    [selectedItems]
  );

  const total = useMemo(
    () =>
      selectedItems.reduce(
        (sum, ticket) =>
          sum + ticket.price * ticket.quantity,
        0
      ),
    [selectedItems]
  );

  const serviceFee = calculateTicketServiceFee(total, currency);
  const totalToPay = roundMoney(total + serviceFee);
  const isFree = total === 0;
  const belowUsdMinimum = currency === "USD" && !isFree && totalToPay < 2;

  function changeQuantity(
    ticketId: string,
    quantity: number
  ) {
    const ticket = event.ticketTypes.find(
      (item) => item.id === ticketId
    );

    if (!ticket) return;

    const available = ticketsLeft(
      ticket.quantityTotal,
      ticket.quantitySold + ticket.quantityReserved
    );

    const nextQuantity = Math.max(
      0,
      Math.min(quantity, available, 20)
    );

    setSelectedTickets((current) => {
      const next = { ...current };

      if (nextQuantity === 0) {
        delete next[ticketId];
      } else {
        next[ticketId] = nextQuantity;
      }

      return next;
    });

    setError("");
  }

  function setAnswer(questionId: string, value: string) {
    setAnswers((current) => ({
      ...current,
      [questionId]: value,
    }));

    setError("");
  }

  function validate(): boolean {
    if (selectedItems.length === 0) {
      setError("Please select at least one ticket.");
      return false;
    }

    if (!name.trim()) {
      setError("Please enter your full name.");
      return false;
    }

    if (!email.trim()) {
      setError("Please enter your email address.");
      return false;
    }

    if (!phone.trim()) {
      setError("Please enter your phone number.");
      return false;
    }

    for (const question of event.customQuestions) {
      if (
        question.required &&
        !answers[question.id]?.trim()
      ) {
        setError(
          `Please answer: ${question.label}`
        );
        return false;
      }

      if (
        question.type === "select" &&
        question.options?.length &&
        answers[question.id] &&
        !question.options.includes(
          answers[question.id]
        )
      ) {
        setError(
          `Please select a valid answer for: ${question.label}`
        );
        return false;
      }
    }

    return true;
  }

  async function handleCheckout() {
    setError("");

    if (!validate()) {
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          eventId: event.id,
          tickets: selectedItems.map((ticket) => ({
            ticketTypeId: ticket.id,
            quantity: ticket.quantity,
          })),
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
          customAnswers: event.customQuestions
            .filter((question) =>
              Object.prototype.hasOwnProperty.call(
                answers,
                question.id
              )
            )
            .map((question) => ({
              questionId: question.id,
              answer: answers[question.id]?.trim() ?? "",
            })),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(
          data?.error ??
            "We couldn't start your checkout. Please try again."
        );
        return;
      }

      /*
       * FREE TICKETS
       *
       * The order has already been completed by the server.
       * There is no payment step, so take the attendee directly
       * to their ticket confirmation page.
       */
      if (data.free && data.reference) {
        window.location.href = `/tickets/${encodeURIComponent(
          data.reference
        )}`;

        return;
      }

      /*
       * PAID TICKETS
       *
       * Send the customer directly to Paystack.
       */
      if (!data.authorizationUrl) {
        setError(
          "Payment could not be started. Please try again."
        );
        return;
      }

      window.location.href = data.authorizationUrl;
    } catch (err) {
      console.error("Checkout request failed:", err);

      setError(
        "Something went wrong. Please check your connection and try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-[1080px]">
      {/* Back */}
      <Link
        href={`/events/${event.slug}`}
        className="group inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-400 transition-colors hover:text-violet-600"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-full border border-zinc-200 bg-white transition-colors group-hover:border-violet-200 group-hover:bg-violet-50">
          <ArrowLeft
            className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5"
            strokeWidth={1.8}
          />
        </span>

        Back to event
      </Link>

      {/* Header */}
      <div className="mt-8 max-w-[700px]">
        <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-violet-600">
          Checkout
        </p>

        <h1 className="mt-2 text-[2.2rem] font-semibold leading-[0.98] tracking-[-0.055em] text-zinc-950 sm:text-[3.2rem]">
          Get your ticket
        </h1>

        <p className="mt-3 text-sm leading-6 text-zinc-500">
          {event.title}
        </p>

        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] font-medium text-zinc-400">
          <span>
            {formatEventDate(
              event.date,
              event.startTime
            )}
          </span>

          <span className="h-1 w-1 rounded-full bg-zinc-300" />

          <span>
            {event.venue}, {event.state}
          </span>
        </div>
      </div>

      {/* Main */}
      <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
        {/* Left */}
        <div className="space-y-6">
          {/* Tickets */}
          <section className="rounded-[24px] border border-zinc-200 bg-white">
            <div className="border-b border-zinc-100 px-5 py-5 sm:px-6">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                  <Ticket
                    className="h-4 w-4"
                    strokeWidth={1.8}
                  />
                </div>

                <div>
                  <h2 className="text-sm font-semibold tracking-[-0.02em] text-zinc-900">
                    Select tickets
                  </h2>

                  <p className="mt-0.5 text-[10px] text-zinc-400">
                    Choose the tickets you want.
                  </p>
                </div>
              </div>
            </div>

            <div className="divide-y divide-zinc-100">
              {event.ticketTypes.map((ticket) => {
                const quantity =
                  selectedTickets[ticket.id] ?? 0;

                const available = ticketsLeft(
                  ticket.quantityTotal,
                  ticket.quantitySold +
                    ticket.quantityReserved
                );

                const soldOut = available <= 0;

                return (
                  <div
                    key={ticket.id}
                    className={[
                      "flex items-center justify-between gap-4 px-5 py-5 sm:px-6",
                      soldOut ? "opacity-45" : "",
                    ].join(" ")}
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-zinc-900">
                        {ticket.name}
                      </p>

                      <p className="mt-1 text-[11px] text-zinc-400">
                        {soldOut
                          ? "Sold out"
                          : `${available} available`}
                      </p>

                      <p className="mt-2 text-sm font-semibold text-zinc-900">
                        {formatPrice(ticket.price)}
                      </p>
                    </div>

                    {!soldOut && (
                      <div className="flex shrink-0 items-center rounded-xl border border-zinc-200">
                        <button
                          type="button"
                          onClick={() =>
                            changeQuantity(
                              ticket.id,
                              quantity - 1
                            )
                          }
                          disabled={quantity === 0}
                          aria-label={`Remove ${ticket.name}`}
                          className="flex h-10 w-10 items-center justify-center text-zinc-400 transition-colors hover:text-zinc-900 disabled:cursor-not-allowed disabled:opacity-30"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>

                        <span className="flex h-10 min-w-8 items-center justify-center border-x border-zinc-200 text-xs font-semibold text-zinc-900">
                          {quantity}
                        </span>

                        <button
                          type="button"
                          onClick={() =>
                            changeQuantity(
                              ticket.id,
                              quantity + 1
                            )
                          }
                          disabled={
                            quantity >= available ||
                            quantity >= 20
                          }
                          aria-label={`Add ${ticket.name}`}
                          className="flex h-10 w-10 items-center justify-center text-zinc-400 transition-colors hover:text-violet-600 disabled:cursor-not-allowed disabled:opacity-30"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          {/* Details */}
          <section className="rounded-[24px] border border-zinc-200 bg-white">
            <div className="border-b border-zinc-100 px-5 py-5 sm:px-6">
              <h2 className="text-sm font-semibold tracking-[-0.02em] text-zinc-900">
                Your details
              </h2>

              <p className="mt-1 text-[10px] leading-5 text-zinc-400">
                We'll use these details for your ticket.
              </p>
            </div>

            <div className="space-y-5 p-5 sm:p-6">
              <Field
                label="Full name"
                value={name}
                onChange={setName}
                placeholder="Your full name"
                autoComplete="name"
              />

              <Field
                label="Email address"
                type="email"
                value={email}
                onChange={setEmail}
                placeholder="you@example.com"
                autoComplete="email"
              />

              <Field
                label="Phone number"
                type="tel"
                value={phone}
                onChange={setPhone}
                placeholder="08012345678"
                autoComplete="tel"
              />
            </div>
          </section>

          {/* Custom questions */}
          {event.customQuestions.length > 0 && (
            <section className="rounded-[24px] border border-zinc-200 bg-white">
              <div className="border-b border-zinc-100 px-5 py-5 sm:px-6">
                <h2 className="text-sm font-semibold tracking-[-0.02em] text-zinc-900">
                  A little more about you
                </h2>

                <p className="mt-1 text-[10px] leading-5 text-zinc-400">
                  The organiser has a few questions for
                  attendees.
                </p>
              </div>

              <div className="space-y-5 p-5 sm:p-6">
                {event.customQuestions.map(
                  (question) => (
                    <div key={question.id}>
                      <label
                        htmlFor={`question-${question.id}`}
                        className="mb-2 block text-[11px] font-semibold text-zinc-700"
                      >
                        {question.label}

                        {question.required && (
                          <span className="ml-1 text-violet-600">
                            *
                          </span>
                        )}
                      </label>

                      {question.type === "select" &&
                      question.options?.length ? (
                        <div className="relative">
                          <select
                            id={`question-${question.id}`}
                            value={
                              answers[question.id] ?? ""
                            }
                            onChange={(event) =>
                              setAnswer(
                                question.id,
                                event.target.value
                              )
                            }
                            className="h-12 w-full appearance-none rounded-xl border border-zinc-200 bg-white px-3.5 pr-10 text-sm text-zinc-800 outline-none transition-colors focus:border-violet-400 focus:ring-4 focus:ring-violet-500/10"
                          >
                            <option value="">
                              Select an option
                            </option>

                            {question.options.map(
                              (option) => (
                                <option
                                  key={option}
                                  value={option}
                                >
                                  {option}
                                </option>
                              )
                            )}
                          </select>

                          <ChevronDown
                            aria-hidden="true"
                            className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400"
                          />
                        </div>
                      ) : (
                        <input
                          id={`question-${question.id}`}
                          value={
                            answers[question.id] ?? ""
                          }
                          onChange={(event) =>
                            setAnswer(
                              question.id,
                              event.target.value
                            )
                          }
                          className="h-12 w-full rounded-xl border border-zinc-200 bg-white px-3.5 text-sm text-zinc-800 outline-none transition-colors placeholder:text-zinc-300 focus:border-violet-400 focus:ring-4 focus:ring-violet-500/10"
                          placeholder="Your answer"
                        />
                      )}
                    </div>
                  )
                )}
              </div>
            </section>
          )}

          {/* Error */}
          {error && (
            <div
              role="alert"
              className="rounded-xl border border-red-200 bg-red-50 px-4 py-3"
            >
              <p className="text-xs font-medium leading-5 text-red-600">
                {error}
              </p>
            </div>
          )}
        </div>

        {/* Right */}
        <aside className="lg:sticky lg:top-28">
          <div className="rounded-[24px] border border-zinc-200 bg-white">
            <div className="border-b border-zinc-100 px-5 py-5">
              <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-violet-600">
                Order summary
              </p>

              <h2 className="mt-1.5 text-xl font-semibold tracking-[-0.04em] text-zinc-900">
                Your tickets
              </h2>
            </div>

            <div className="p-5">
              {selectedItems.length === 0 ? (
                <div className="rounded-xl border border-dashed border-zinc-200 px-4 py-6 text-center">
                  <Ticket className="mx-auto h-5 w-5 text-zinc-300" />

                  <p className="mt-2 text-xs font-medium text-zinc-400">
                    No tickets selected yet.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {selectedItems.map((ticket) => (
                    <div
                      key={ticket.id}
                      className="flex items-start justify-between gap-4"
                    >
                      <div>
                        <p className="text-xs font-semibold text-zinc-800">
                          {ticket.name}
                        </p>

                        <p className="mt-1 text-[10px] text-zinc-400">
                          {ticket.quantity} ×{" "}
                          {formatPrice(ticket.price)}
                        </p>
                      </div>

                      <p className="text-xs font-semibold text-zinc-900">
                        {formatPrice(
                          ticket.price *
                            ticket.quantity
                        )}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              <div className="my-5 h-px bg-zinc-100" />

              <div className="mb-3 flex items-center justify-between text-xs text-zinc-500">
                <span>Ticket subtotal</span>
                <span>{formatPrice(total)}</span>
              </div>
              {!isFree && (
                <div className="mb-4 flex items-center justify-between gap-4 text-xs text-zinc-500">
                  <span>Service fee (5%, capped at {formatPrice(currency === "USD" ? TICKET_SERVICE_FEE_CAP_USD : TICKET_SERVICE_FEE_CAP_NAIRA)})</span>
                  <span className="shrink-0">{formatPrice(serviceFee)}</span>
                </div>
              )}

              <div className="flex items-center justify-between" aria-live="polite">
                <span className="text-xs text-zinc-500">
                  Total for{" "}
                  {ticketCount}{" "}
                  {ticketCount === 1
                    ? "ticket"
                    : "tickets"}
                </span>

                <span className="text-lg font-semibold tracking-[-0.03em] text-zinc-950">
                  {formatPrice(totalToPay)}
                </span>
              </div>

              {!isFree && (
                <p className="mt-4 rounded-lg bg-violet-50 px-3 py-2 text-xs leading-5 text-violet-900">
                  You will pay <strong>{formatPrice(totalToPay)}</strong> on Paystack,
                  including the service fee.
                </p>
              )}

              {belowUsdMinimum && (
                <p className="mt-3 text-xs leading-5 text-amber-700">
                  USD payments require a total of at least {formatPrice(2)}.
                  Select more tickets to continue.
                </p>
              )}

              <button
                type="button"
                onClick={handleCheckout}
                disabled={
                  loading || selectedItems.length === 0 || belowUsdMinimum
                }
                className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 text-sm font-semibold text-white transition-colors hover:bg-violet-700 disabled:cursor-not-allowed disabled:bg-zinc-200 disabled:text-zinc-400"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />

                    {isFree
                      ? "Getting your ticket..."
                      : "Preparing payment..."}
                  </>
                ) : (
                  <>
                    {isFree
                      ? "Get Free Ticket"
                      : "Continue to Payment"}

                    <ArrowRight
                      className="h-4 w-4"
                      strokeWidth={2}
                    />
                  </>
                )}
              </button>

              {isFree ? (
                <div className="mt-4 flex items-start gap-2">
                  <Ticket className="mt-0.5 h-3.5 w-3.5 shrink-0 text-zinc-400" />

                  <p className="text-[9px] leading-4 text-zinc-400">
                    Your ticket will be issued instantly after
                    you complete this form.
                  </p>
                </div>
              ) : (
                <div className="mt-4 flex items-start gap-2">
                  <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-zinc-400" />

                  <p className="text-[9px] leading-4 text-zinc-400">
                    You'll be securely redirected to Paystack
                    to complete your payment.
                  </p>
                </div>
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  autoComplete,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  type?: string;
  autoComplete?: string;
}) {
  return (
    <div>
      <label className="mb-2 block text-[11px] font-semibold text-zinc-700">
        {label}
      </label>

      <input
        type={type}
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        placeholder={placeholder}
        autoComplete={autoComplete}
        className="h-12 w-full rounded-xl border border-zinc-200 bg-white px-3.5 text-sm text-zinc-800 outline-none transition-colors placeholder:text-zinc-300 focus:border-violet-400 focus:ring-4 focus:ring-violet-500/10"
      />
    </div>
  );
}