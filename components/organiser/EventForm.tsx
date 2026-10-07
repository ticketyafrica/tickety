"use client";

import type { Currency } from "@/lib/currency";
import { useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  CalendarDays,
  Check,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  MapPin,
  Plus,
  Sparkles,
  Ticket,
  Trash2,
  Users,
  WalletCards,
  X,
} from "lucide-react";

import Button from "@/components/ui/Button";
import { EVENT_CATEGORIES } from "@/lib/utils";
import CoverImageUpload from "@/components/organiser/CoverImageUpload";
import EventTimezoneSelect from "@/components/organiser/EventTimezoneSelect";
import EventCreatedDialog from "@/components/organiser/EventCreatedDialog";

interface DraftTicketType {
  name: string;
  price: string;
  quantity: string;
}

interface DraftQuestion {
  label: string;
}

export default function EventForm() {
  const [createdEvent, setCreatedEvent] = useState<{ id: string; slug: string; title: string; status: string } | null>(null);
  const [paymentUrl, setPaymentUrl] = useState<string>();
  const [title, setTitle] = useState("");
  const [venue, setVenue] = useState("");
  const [country, setCountry] = useState("Nigeria");
  const [state, setState] = useState("");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [timezone, setTimezone] = useState("Africa/Lagos");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [coverImageUrl, setCoverImageUrl] = useState("");
  const [tags, setTags] = useState("");
  const [refundPolicy, setRefundPolicy] = useState("");
  const [minAge, setMinAge] = useState("");
  const [currency, setCurrency] = useState<Currency>("NGN");
  const [isFree, setIsFree] = useState(false);
  const [freeCapacity, setFreeCapacity] = useState("100");

  const [ticketTypes, setTicketTypes] = useState<
    DraftTicketType[]
  >([
    {
      name: "Regular",
      price: "",
      quantity: "",
    },
  ]);

  const [questions, setQuestions] = useState<
    DraftQuestion[]
  >([]);

  const [status, setStatus] = useState<
    "idle" | "submitting" | "published" | "error"
  >("idle");

  const [errorMessage, setErrorMessage] =
    useState("");

  const [payoutCheck, setPayoutCheck] = useState<
    "idle" | "checking" | "connected" | "missing" | "error"
  >("idle");

  const [showPayoutNotice, setShowPayoutNotice] =
    useState(false);

  function updateTicketType(
    index: number,
    field: keyof DraftTicketType,
    value: string
  ) {
    setTicketTypes((prev) =>
      prev.map((ticket, i) =>
        i === index
          ? {
              ...ticket,
              [field]: value,
            }
          : ticket
      )
    );
  }

  function addTicketType() {
    setTicketTypes((prev) => [
      ...prev,
      {
        name: "",
        price: "",
        quantity: "",
      },
    ]);
  }

  function removeTicketType(index: number) {
    setTicketTypes((prev) =>
      prev.filter((_, i) => i !== index)
    );
  }

  function addQuestion() {
    setQuestions((prev) => [
      ...prev,
      {
        label: "",
      },
    ]);
  }

  function updateQuestion(
    index: number,
    value: string
  ) {
    setQuestions((prev) =>
      prev.map((question, i) =>
        i === index
          ? {
              ...question,
              label: value,
            }
          : question
      )
    );
  }

  function removeQuestion(index: number) {
    setQuestions((prev) =>
      prev.filter((_, i) => i !== index)
    );
  }

  async function checkPayoutSetup(): Promise<boolean> {
  setPayoutCheck("checking");

  try {
    const res = await fetch(
      `/api/organiser/payout?currency=${currency}`,
      {
        method: "GET",
        cache: "no-store",
      }
    );

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      console.error(
        "Payout status request failed:",
        data
      );

      setPayoutCheck("error");
      return false;
    }

    const connected =
      data?.connected === true ||
      data?.payoutConfigured === true ||
      Boolean(data?.paystackSubaccountCode) ||
      Boolean(data?.subaccountCode);

    console.log(
      "Tickety payout status:",
      {
        connected,
        apiConnected: data?.connected,
        payoutConfigured:
          data?.payoutConfigured,
        hasSubaccountCode:
          Boolean(data?.subaccountCode),
        hasPaystackSubaccountCode:
          Boolean(
            data?.paystackSubaccountCode
          ),
      }
    );

    setPayoutCheck(
      connected
        ? "connected"
        : "missing"
    );

    return connected;
  } catch (error) {
    console.error(
      "Payout setup check failed:",
      error
    );

    setPayoutCheck("error");

    return false;
  }
}

  async function handleSubmit(
    e: React.FormEvent
  ) {
    e.preventDefault();

    setErrorMessage("");
    setShowPayoutNotice(false);

    /*
     * Paid events need an organiser Paystack subaccount because
     * ticket revenue is split between the organiser and Tickety.
     *
     * Free events do NOT need payout details. The organiser can
     * publish the event and simply pay Tickety's ₦50,000 listing fee.
     */
    if (!isFree) {
      const payoutReady = await checkPayoutSetup();

      if (!payoutReady) {
        setStatus("idle");
        setShowPayoutNotice(true);
        setErrorMessage(
          "Please connect a payout account in the selected ticket currency before publishing a paid event."
        );
        return;
      }
    }

    setStatus("submitting");

    try {
      const res = await fetch("/api/events", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          venue,
          state: state ? `${state}, ${country}` : country,
          date,
          startTime,
          endTime,
          timezone,
          category,
          description,
          coverImageUrl,
          tags,
          refundPolicy,
          minAge,
          isFree,
          freeCapacity,
          currency,
          ticketTypes,
          customQuestions: questions.filter(
            (q) => q.label.trim() !== ""
          ),
        }),
      });

      const data = await res
        .json()
        .catch(() => ({}));

      if (!res.ok) {
        throw new Error(
          data?.error ??
            "Something went wrong publishing this event."
        );
      }

      setCreatedEvent(data.event);
      setPaymentUrl(data.redirectUrl);

      setStatus("published");
    } catch (err) {
      setErrorMessage(
        err instanceof Error
          ? err.message
          : "Something went wrong."
      );

      setStatus("error");
    }
  }

  /* ============================================================
     SUCCESS
  ============================================================ */

  if (status === "published" && createdEvent) {
    return <EventCreatedDialog event={createdEvent} redirectUrl={paymentUrl} />;
  }

  /* ============================================================
     FORM
  ============================================================ */

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto w-full max-w-5xl pb-36"
    >
      {/* ========================================================
          PAGE HEADER
      ======================================================== */}

      <header className="mb-10">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-[9px] bg-[#7C3AED]/10">
            <Sparkles
              size={13}
              className="text-[#7C3AED]"
            />
          </span>

          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#7C3AED]">
            Event builder
          </span>
        </div>

        <div className="mt-4 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <h1 className="font-display text-3xl font-semibold tracking-[-0.045em] text-[#111014] sm:text-5xl">
              Create your event
            </h1>

            <p className="mt-3 max-w-xl text-sm leading-6 text-black/45">
              Everything attendees need to know,
              presented beautifully and connected to
              your Tickety ticket flow.
            </p>
          </div>

          <div className="flex items-center gap-2 text-[10px] font-semibold text-black/30">
            <span className="h-1.5 w-1.5 rounded-full bg-[#7C3AED]" />
            Draft
          </div>
        </div>
      </header>

      {/* ========================================================
          ERROR
      ======================================================== */}

      {status === "error" && (
        <div className="mb-8 flex items-start gap-3 rounded-[18px] border border-red-200 bg-red-50 px-5 py-4">
          <AlertCircle
            size={18}
            className="mt-0.5 shrink-0 text-red-600"
          />

          <div>
            <p className="text-sm font-semibold text-red-800">
              We couldn&apos;t publish your event
            </p>

            <p className="mt-1 text-xs leading-5 text-red-600/80">
              {errorMessage}
            </p>
          </div>
        </div>
      )}


      {/* ========================================================
          01 — EVENT DETAILS
      ======================================================== */}

      <section className="border-b border-black/[0.07] pb-14">
        <SectionHeader
          number="01"
          title="Event details"
          description="Start with the information attendees need to decide if they want to be there."
        />

        <div className="mt-9 space-y-7">
          <Field
            label="Event title"
            required
            hint="A clear, memorable name works best."
          >
            <input
              required
              value={title}
              onChange={(e) =>
                setTitle(e.target.value)
              }
              placeholder="Afrobeats Picnic — Lagos"
              className="
                h-[58px]
                w-full
                rounded-[16px]
                border
                border-black/[0.10]
                bg-white
                px-4
                text-[16px]
                font-medium
                tracking-[-0.015em]
                text-[#111014]
                outline-none
                transition-all
                placeholder:text-black/25
                hover:border-black/[0.16]
                focus:border-[#7C3AED]/50
                focus:ring-4
                focus:ring-[#7C3AED]/[0.07]
              "
            />
          </Field>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <Field
              label="Venue"
              required
              icon={<MapPin size={13} />}
            >
              <input
                required
                value={venue}
                onChange={(e) =>
                  setVenue(e.target.value)
                }
                placeholder="Muri Okunola Park"
                className={inputClass}
              />
            </Field>

            <Field
              label="Country"
              required
              icon={<MapPin size={13} />}
              hint="Events can be created anywhere."
            >
              <div className="relative">
                <select
                  required
                  value={country}
                  onChange={(e) => {
                    setCountry(e.target.value);
                    setState("");
                  }}
                  className={`${inputClass} appearance-none pr-10`}
                >
                  <option value="" disabled>
                    Select a country
                  </option>

                  {COUNTRIES.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>

                <Chevron />
              </div>
            </Field>

            <Field
              label={getRegionLabel(country)}
              required
              hint="Select a region, state or province."
            >
              {getRegions(country).length > 0 ? (
                <div className="relative">
                  <select
                    required
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className={`${inputClass} appearance-none pr-10`}
                  >
                    <option value="" disabled>
                      Select {getRegionLabel(country).toLowerCase()}
                    </option>

                    {getRegions(country).map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>

                  <Chevron />
                </div>
              ) : (
                <input
                  required
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  placeholder={`Enter ${getRegionLabel(country).toLowerCase()}`}
                  className={inputClass}
                />
              )}
            </Field>

            <Field
              label="Date"
              required
              icon={
                <CalendarDays size={13} />
              }
            >
              <input
                required
                type="date"
                value={date}
                onChange={(e) =>
                  setDate(e.target.value)
                }
                className={inputClass}
              />
            </Field>

            <Field
              label="Start time"
              required
              icon={<Clock3 size={13} />}
            >
              <input
                required
                type="time"
                value={startTime}
                onChange={(e) =>
                  setStartTime(
                    e.target.value
                  )
                }
                className={inputClass}
              />
            </Field>

            <Field
  label="End time"
  required
  icon={<Clock3 size={13} />}
  hint="Tickets remain available while the event is ongoing."
>
  <input
    required
    type="time"
    value={endTime}
    onChange={(e) => setEndTime(e.target.value)}
    className={inputClass}
  />
</Field>

            <EventTimezoneSelect value={timezone} onChange={setTimezone} />

            <Field
              label="Category"
              required
            >
              <div className="relative">
                <select
                  required
                  value={category}
                  onChange={(e) =>
                    setCategory(
                      e.target.value
                    )
                  }
                  className={`${inputClass} appearance-none pr-10`}
                >
                  <option
                    value=""
                    disabled
                  >
                    Select a category
                  </option>

                  {EVENT_CATEGORIES.map(
                    (item) => (
                      <option
                        key={item}
                        value={item}
                      >
                        {item}
                      </option>
                    )
                  )}
                </select>

                <Chevron />
              </div>
            </Field>
          </div>

          <Field
            label="Description"
            required
            hint="Give people enough context to understand the experience."
          >
            <textarea
              required
              rows={6}
              value={description}
              onChange={(e) =>
                setDescription(
                  e.target.value
                )
              }
              placeholder="Tell attendees what makes this event worth attending..."
              className="
                min-h-[155px]
                w-full
                resize-y
                rounded-[16px]
                border
                border-black/[0.10]
                bg-white
                px-4
                py-3.5
                text-[14px]
                leading-6
                text-[#111014]
                outline-none
                transition-all
                placeholder:text-black/25
                hover:border-black/[0.16]
                focus:border-[#7C3AED]/50
                focus:ring-4
                focus:ring-[#7C3AED]/[0.07]
              "
            />

            <div className="mt-2 flex justify-between px-1 text-[10px] text-black/25">
              <span>
                Keep it useful and easy to scan.
              </span>

              <span>
                {description.length}
              </span>
            </div>
          </Field>
        </div>
      </section>

      {/* ========================================================
          02 — PRESENTATION
      ======================================================== */}

      <section className="border-b border-black/[0.07] py-14">
        <SectionHeader
          number="02"
          title="Event presentation"
          description="Make the event look as good as the experience you're creating."
        />

        <div className="mt-9 space-y-8">
          <Field
            label="Event flyer"
            hint="Square format recommended · 1:1 · 500 × 500 px recommended"
          >
            <div className="space-y-4">
              <div className="rounded-[18px] border border-[#7C3AED]/15 bg-[#F8F5FF] px-4 py-4 sm:px-5">
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] bg-[#7C3AED]/10">
                    <CheckCircle2 size={15} className="text-[#7C3AED]" />
                  </div>

                  <div className="min-w-0">
                    <p className="text-xs font-bold text-[#111014]">
                      Square flyer recommended
                    </p>

                    <p className="mt-1.5 text-[11px] leading-5 text-black/50">
                      A square <strong className="font-semibold text-black/65">1:1 format</strong> works best on Tickety. We recommend <strong className="font-semibold text-black/65">500 × 500 px</strong>.
                    </p>

                    <p className="mt-2 text-[11px] leading-5 text-black/45">
                      You can still upload a non-square flyer. It will not prevent you from publishing, but the image may be cropped when displayed on the event page.
                    </p>
                  </div>
                </div>
              </div>

              <CoverImageUpload
                value={coverImageUrl}
                onChange={setCoverImageUrl}
              />

              <div className="flex items-center justify-between px-1">
                <p className="text-[10px] font-medium text-black/30">
                  Recommended format
                </p>

                <p className="text-[10px] font-bold tracking-[0.02em] text-[#7C3AED]">
                  500 × 500 px · 1:1
                </p>
              </div>
            </div>
          </Field>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <Field
              label="Tags"
              hint="Separate multiple tags with commas."
            >
              <input
                value={tags}
                onChange={(e) =>
                  setTags(e.target.value)
                }
                placeholder="afrobeats, outdoor, nightlife"
                className={inputClass}
              />
            </Field>

            <Field
              label="Minimum age"
              hint="Leave blank if there is no restriction."
            >
              <input
                type="number"
                min={0}
                value={minAge}
                onChange={(e) =>
                  setMinAge(e.target.value)
                }
                placeholder="18"
                className={inputClass}
              />
            </Field>
          </div>

          <Field
            label="Refund policy"
            hint="Optional, but recommended."
          >
            <textarea
              rows={4}
              value={refundPolicy}
              onChange={(e) =>
                setRefundPolicy(
                  e.target.value
                )
              }
              placeholder="e.g. Full refunds up to 48 hours before the event."
              className="
                min-h-[115px]
                w-full
                resize-y
                rounded-[16px]
                border
                border-black/[0.10]
                bg-white
                px-4
                py-3.5
                text-[14px]
                leading-6
                text-[#111014]
                outline-none
                transition-all
                placeholder:text-black/25
                hover:border-black/[0.16]
                focus:border-[#7C3AED]/50
                focus:ring-4
                focus:ring-[#7C3AED]/[0.07]
              "
            />
          </Field>
        </div>
      </section>

      {/* ========================================================
          03 — TICKETS
      ======================================================== */}

      <section className="border-b border-black/[0.07] py-14">
        <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-start">
          <SectionHeader
            number="03"
            title="Tickets"
            description="Set your ticket types, pricing and available capacity."
          />

          {/* FREE EVENT TOGGLE */}

          <button
            type="button"
            onClick={() =>
              setIsFree(!isFree)
            }
            className={[
              "flex h-12 shrink-0 items-center gap-3 rounded-full border px-4 transition-all",
              isFree
                ? "border-[#25D366]/30 bg-[#25D366]/10"
                : "border-black/[0.10] bg-white hover:border-black/20",
            ].join(" ")}
          >
            <span
              className={[
                "flex h-5 w-5 items-center justify-center rounded-full border transition-all",
                isFree
                  ? "border-[#25D366] bg-[#25D366]"
                  : "border-black/20 bg-white",
              ].join(" ")}
            >
              {isFree && (
                <Check
                  size={11}
                  strokeWidth={3}
                  className="text-white"
                />
              )}
            </span>

            <span
              className={[
                "text-xs font-semibold",
                isFree
                  ? "text-[#168A43]"
                  : "text-black/55",
              ].join(" ")}
            >
              This is a free event
            </span>
          </button>
        </div>

        {isFree ? (
          <div className="mt-9 overflow-hidden rounded-[22px] border border-[#25D366]/15 bg-[#F6FBF7]">
            <div className="flex flex-col gap-7 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-7">
              <div className="flex gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-[#25D366]/10">
                  <Users
                    size={17}
                    className="text-[#168A43]"
                  />
                </div>

                <div>
                  <p className="text-sm font-semibold text-[#111014]">
                    Free admission
                  </p>

                  <p className="mt-1 max-w-md text-xs leading-5 text-black/40">
                    Attendees won&apos;t be charged. Set the maximum number of
                    people your venue can accommodate.
                  </p>

                  <div className="mt-4 flex items-start gap-2.5 rounded-[12px] border border-black/[0.07] bg-white/80 px-3.5 py-3">
                    <CircleDollarSign
                      size={14}
                      className="mt-0.5 shrink-0 text-black/35"
                    />
                    <p className="text-[11px] leading-5 text-black/45">
                      <strong className="font-semibold text-black/65">
                        Event listing fee:
                      </strong>{" "}
                      Creating and publishing an event on Tickety costs{" "}
                      <strong className="font-semibold text-black/70">
                        ₦50,000
                      </strong>
                      . This fee applies whether your event is free or paid.
                    </p>
                  </div>
                </div>
              </div>

              <div className="w-full sm:w-[180px]">
                <label className="mb-2 block text-[10px] font-bold uppercase tracking-[0.12em] text-black/35">
                  Capacity
                </label>

                <input
                  type="number"
                  min={1}
                  value={freeCapacity}
                  onChange={(e) =>
                    setFreeCapacity(
                      e.target.value
                    )
                  }
                  className={inputClass}
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-9">
            <div className="mb-6 flex items-start gap-3 rounded-[18px] border border-[#7C3AED]/15 bg-[#F8F5FF] px-4 py-4 sm:px-5">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] bg-[#7C3AED]/10">
                <CircleDollarSign
                  size={15}
                  className="text-[#7C3AED]"
                />
              </div>

              <div>
                <p className="text-xs font-bold text-[#111014]">
                  Tickety platform fee
                </p>

                <p className="mt-1 text-[11px] leading-5 text-black/50">
                  Tickety retains a{" "}
                  <strong className="font-semibold text-black/70">
                    10% commission on ticket sales
                  </strong>
                  . This is deducted from the ticket revenue paid to the
                  organiser. Attendees also pay the applicable service fee
                  during checkout.
                </p>

                <p className="mt-2 text-[10px] font-medium text-black/35">
                  Creating and publishing your event costs{" "}
                  <strong className="font-semibold text-black/55">
                    ₦50,000
                  </strong>
                  , payable when your listing is submitted.
                </p>
              </div>
            </div>

            {/* Desktop headings */}

            <div className="mb-3 hidden grid-cols-[1fr_190px_190px_44px] gap-3 px-4 sm:grid">
              <span className={tableLabel}>
                Ticket type
              </span>

              <span className={tableLabel}>
                Price · {currency}
              </span>

              <span className={tableLabel}>
                Quantity
              </span>

              <span />
            </div>

            <div className="space-y-3">
              <div className="mb-5">
                <label htmlFor="event-currency" className="mb-2 block text-sm font-medium">Ticket currency</label>
                <select id="event-currency" value={currency} onChange={(e) => setCurrency(e.target.value as Currency)} className={ticketInput}>
                  <option value="NGN">Nigerian naira (NGN)</option>
                  <option value="USD">US dollars (USD)</option>
                </select>
                <p className="mt-2 text-xs leading-5 text-black/50">
                  Ticket prices and payouts use this currency. It cannot be changed after publishing.
                  {currency === "USD" && " USD sales require a connected USD payout account. Service fee: 5%, capped at $5 per order."}
                </p>
              </div>
              {ticketTypes.map(
                (ticket, index) => (
                  <div
                    key={index}
                    className="
                      group
                      rounded-[20px]
                      border
                      border-black/[0.08]
                      bg-white
                      p-3
                      shadow-[0_5px_20px_rgba(0,0,0,0.025)]
                      transition-all
                      hover:border-black/[0.13]
                      hover:shadow-[0_10px_30px_rgba(0,0,0,0.045)]
                    "
                  >
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_190px_190px_44px]">
                      {/* NAME */}

                      <div>
                        <label
                          className={
                            mobileLabel
                          }
                        >
                          Ticket type
                        </label>

                        <input
                          value={
                            ticket.name
                          }
                          onChange={(e) =>
                            updateTicketType(
                              index,
                              "name",
                              e.target.value
                            )
                          }
                          placeholder="e.g. Regular, VIP, VVIP"
                          className={
                            ticketInput
                          }
                        />
                      </div>

                      {/* PRICE */}

                      <div>
                        <label
                          className={
                            mobileLabel
                          }
                        >
                          Price · {currency}
                        </label>

                        <div className="relative">
                          <span
                            className="
                              pointer-events-none
                              absolute
                              left-3.5
                              top-1/2
                              -translate-y-1/2
                              text-[14px]
                              font-semibold
                              text-black/30
                            "
                          >
                            {currency === "USD" ? "$" : "₦"}
                          </span>

                          <input
                            type="number"
                            min={0}
                            step="0.01"
                            value={
                              ticket.price
                            }
                            onChange={(e) =>
                              updateTicketType(
                                index,
                                "price",
                                e.target.value
                              )
                            }
                            placeholder={currency === "USD" ? "20.00" : "5,000"}
                            className={`${ticketInput} pl-9`}
                          />
                        </div>
                      </div>

                      {/* QUANTITY */}

                      <div>
                        <label
                          className={
                            mobileLabel
                          }
                        >
                          Quantity
                        </label>

                        <div className="relative">
                          <Users
                            size={15}
                            className="
                              pointer-events-none
                              absolute
                              left-3.5
                              top-1/2
                              -translate-y-1/2
                              text-black/25
                            "
                          />

                          <input
                            type="number"
                            min={0}
                            value={
                              ticket.quantity
                            }
                            onChange={(e) =>
                              updateTicketType(
                                index,
                                "quantity",
                                e.target.value
                              )
                            }
                            placeholder="e.g. 500"
                            className={`${ticketInput} pl-10`}
                          />
                        </div>
                      </div>

                      {/* DELETE */}

                      <div className="flex items-end justify-end sm:items-center sm:justify-center">
                        <button
                          type="button"
                          onClick={() =>
                            removeTicketType(
                              index
                            )
                          }
                          disabled={
                            ticketTypes.length ===
                            1
                          }
                          className="
                            flex
                            h-11
                            w-11
                            items-center
                            justify-center
                            rounded-[12px]
                            text-black/20
                            transition-all
                            hover:bg-red-50
                            hover:text-red-500
                            disabled:pointer-events-none
                            disabled:opacity-20
                          "
                          aria-label="Remove ticket type"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  </div>
                )
              )}
            </div>

            {/* ADD TICKET */}

            <button
              type="button"
              onClick={addTicketType}
              className="
                mt-3
                flex
                h-14
                w-full
                items-center
                justify-center
                gap-2
                rounded-[17px]
                border
                border-dashed
                border-black/10
                bg-[#FCFCFB]
                text-xs
                font-semibold
                text-black/40
                transition-all
                hover:border-[#7C3AED]/30
                hover:bg-[#7C3AED]/[0.025]
                hover:text-[#7C3AED]
              "
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-black/[0.035]">
                <Plus size={14} />
              </span>

              Add another ticket type
            </button>
          </div>
        )}
      </section>

      
      {showPayoutNotice && !isFree && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-[#111014]/55 px-4 py-6 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="payout-modal-title"
        >
          <div className="relative w-full max-w-md overflow-hidden rounded-[24px] bg-white shadow-[0_30px_80px_rgba(0,0,0,0.20)]">
            <button
              type="button"
              onClick={() => setShowPayoutNotice(false)}
              className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full text-black/35 transition-colors hover:bg-black/[0.05] hover:text-black/70"
              aria-label="Close payout setup notice"
            >
              <X size={17} />
            </button>

            <div className="p-6 sm:p-7">
              <div className="flex h-12 w-12 items-center justify-center rounded-[14px] bg-[#7C3AED]/10">
                <WalletCards size={21} className="text-[#7C3AED]" />
              </div>

              <p className="mt-5 text-[10px] font-bold uppercase tracking-[0.18em] text-[#7C3AED]">
                Payout setup required
              </p>

              <h2 id="payout-modal-title" className="mt-2 text-2xl font-semibold tracking-[-0.035em] text-[#111014]">
                Add your bank account first
              </h2>

              <p className="mt-3 text-sm leading-6 text-black/50">
                Paid events need a verified payout account so Tickety can send your ticket-sale proceeds to you. You only need to do this once.
              </p>

              <div className="mt-5 rounded-[16px] border border-black/[0.07] bg-[#FAFAF9] px-4 py-3.5">
                <p className="text-xs font-semibold text-[#111014]">
                  What to do
                </p>
                <p className="mt-1.5 text-[11px] leading-5 text-black/45">
                  Go to Payouts, enter your bank details and complete the verification. Then come back here and publish your paid event.
                </p>
              </div>

              <div className="mt-6 flex flex-col-reverse gap-2.5 sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setShowPayoutNotice(false)}
                  className="h-11 rounded-full px-5 text-xs font-semibold"
                >
                  Not now
                </Button>

                <Button
                  type="button"
                  variant="primary"
                  onClick={() => {
                    window.location.href = "/organiser/payouts";
                  }}
                  className="h-11 rounded-full bg-[#7C3AED] px-5 text-xs font-semibold text-white hover:bg-[#6D28D9]"
                >
                  <span className="flex items-center justify-center gap-2">
                    Set up payouts
                    <ArrowRight size={15} />
                  </span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          FIXED PUBLISH BAR
      ======================================================== */}

      <div
        className="
          fixed
          inset-x-0
          bottom-0
          z-40
          border-t
          border-black/[0.08]
          bg-white/90
          px-4
          py-3
          shadow-[0_-15px_50px_rgba(0,0,0,0.08)]
          backdrop-blur-2xl
          sm:px-6
        "
      >
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-5">
          {/* LEFT */}

          <div className="flex min-w-0 items-center gap-3">
            <div className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-[#7C3AED]/10 sm:flex">
              <Ticket
                size={15}
                className="text-[#7C3AED]"
              />
            </div>

            <div className="min-w-0">
              <p className="truncate text-sm font-semibold tracking-[-0.01em] text-[#111014]">
                Ready to publish?
              </p>

              <p className="hidden text-xs text-black/35 sm:block">
                Your event page and ticket flow will
                be created automatically.
              </p>
            </div>
          </div>

          {/* RIGHT */}

          <Button
            type="submit"
            variant="primary"
            size="lg"
            disabled={
              status === "submitting"
            }
            className="
              h-12
              shrink-0
              rounded-full
              bg-[#111014]
              px-5
              text-sm
              font-semibold
              text-white
              shadow-[0_8px_25px_rgba(17,16,20,0.18)]
              transition-all
              hover:-translate-y-0.5
              hover:bg-[#241044]
              hover:shadow-[0_12px_30px_rgba(17,16,20,0.22)]
              sm:min-w-[190px]
              sm:px-6
            "
          >
            <span className="flex items-center justify-center gap-2">
              {status === "submitting" ? (
                <>
                  <Clock3
                    size={16}
                    className="animate-spin"
                  />
                  <span>
                    Publishing...
                  </span>
                </>
              ) : (
                <>
                  <span>
                    Publish event
                  </span>

                  {/* Arrow is intentionally
                      on the SAME LINE */}
                  <ArrowRight
                    size={17}
                    strokeWidth={2}
                  />
                </>
              )}
            </span>
          </Button>
        </div>
      </div>
    </form>
  );
}

/* ===============================================================
   INTERNATIONAL LOCATION DATA
=============================================================== */

const COUNTRIES = [
  "Nigeria",
  "Ghana",
  "Kenya",
  "South Africa",
  "Egypt",
  "Rwanda",
  "Tanzania",
  "Uganda",
  "Morocco",
  "Ethiopia",
  "Senegal",
  "Côte d'Ivoire",
  "United Kingdom",
  "United States",
  "Canada",
  "Mexico",
  "Brazil",
  "Argentina",
  "France",
  "Germany",
  "Italy",
  "Spain",
  "Netherlands",
  "Belgium",
  "Switzerland",
  "Portugal",
  "Ireland",
  "Australia",
  "New Zealand",
  "United Arab Emirates",
  "Saudi Arabia",
  "Qatar",
  "Kuwait",
  "India",
  "Pakistan",
  "Bangladesh",
  "Singapore",
  "Malaysia",
  "Indonesia",
  "Japan",
  "South Korea",
  "China",
  "Thailand",
  "Philippines",
  "Turkey",
  "Israel",
  "Greece",
  "Austria",
  "Sweden",
  "Norway",
  "Denmark",
  "Finland",
  "Poland",
  "Czech Republic",
  "Romania",
  "Hungary",
  "Ukraine",
  "Russia",
  "Other",
] as const;

const REGIONS: Record<string, string[]> = {
  Nigeria: [
    "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa",
    "Benue", "Borno", "Cross River", "Delta", "Ebonyi", "Edo",
    "Ekiti", "Enugu", "Gombe", "Imo", "Jigawa", "Kaduna", "Kano",
    "Katsina", "Kebbi", "Kogi", "Kwara", "Lagos", "Nasarawa",
    "Niger", "Ogun", "Ondo", "Osun", "Oyo", "Plateau", "Rivers",
    "Sokoto", "Taraba", "Yobe", "Zamfara", "Federal Capital Territory",
  ],
  Ghana: [
    "Ahafo", "Ashanti", "Bono", "Bono East", "Central", "Eastern",
    "Greater Accra", "North East", "Northern", "Oti", "Savannah",
    "Upper East", "Upper West", "Volta", "Western", "Western North",
  ],
  Kenya: [
    "Baringo", "Bomet", "Bungoma", "Busia", "Elgeyo-Marakwet",
    "Embu", "Garissa", "Homa Bay", "Isiolo", "Kajiado", "Kakamega",
    "Kericho", "Kiambu", "Kilifi", "Kirinyaga", "Kisii", "Kisumu",
    "Kitui", "Kwale", "Laikipia", "Lamu", "Machakos", "Makueni",
    "Mandera", "Marsabit", "Meru", "Migori", "Mombasa", "Murang'a",
    "Nairobi", "Nakuru", "Nandi", "Narok", "Nyamira", "Nyandarua",
    "Nyeri", "Samburu", "Siaya", "Taita-Taveta", "Tana River",
    "Tharaka-Nithi", "Trans Nzoia", "Turkana", "Uasin Gishu", "Vihiga",
    "Wajir", "West Pokot",
  ],
  "South Africa": [
    "Eastern Cape", "Free State", "Gauteng", "KwaZulu-Natal",
    "Limpopo", "Mpumalanga", "Northern Cape", "North West", "Western Cape",
  ],
  Egypt: [
    "Cairo", "Alexandria", "Giza", "Qalyubia", "Port Said", "Suez",
    "Luxor", "Aswan", "Red Sea", "Dakahlia", "Gharbia", "Sharqia",
    "Faiyum", "Minya", "Assiut", "Sohag", "Qena", "Beheira",
  ],
  Rwanda: ["Kigali", "Eastern Province", "Northern Province", "Southern Province", "Western Province"],
  Tanzania: ["Arusha", "Dar es Salaam", "Dodoma", "Mwanza", "Zanzibar", "Mbeya", "Morogoro", "Tanga"],
  Uganda: ["Central Region", "Eastern Region", "Northern Region", "Western Region", "Kampala"],
  Morocco: ["Casablanca-Settat", "Rabat-Salé-Kénitra", "Marrakesh-Safi", "Fès-Meknès", "Tangier-Tetouan-Al Hoceima", "Souss-Massa", "Oriental", "Béni Mellal-Khénifra", "Drâa-Tafilalet", "Guelmim-Oued Noun", "Laâyoune-Sakia El Hamra", "Dakhla-Oued Ed-Dahab"],
  Ethiopia: ["Addis Ababa", "Afar", "Amhara", "Benishangul-Gumuz", "Dire Dawa", "Gambela", "Harari", "Oromia", "Sidama", "Somali", "SNNPR", "Tigray"],
  Senegal: ["Dakar", "Diourbel", "Fatick", "Kaffrine", "Kaolack", "Kédougou", "Kolda", "Louga", "Matam", "Saint-Louis", "Sédhiou", "Tambacounda", "Thiès", "Ziguinchor"],
  "Côte d'Ivoire": ["Abidjan", "Yamoussoukro", "Bas-Sassandra", "Comoé", "Denguélé", "Gôh-Djiboua", "Lacs", "Lagunes", "Montagnes", "Sassandra-Marahoué", "Savanes", "Vallée du Bandama", "Woroba", "Zanzan"],
  "United Kingdom": ["England", "Scotland", "Wales", "Northern Ireland"],
  "United States": [
    "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado",
    "Connecticut", "Delaware", "Florida", "Georgia", "Hawaii", "Idaho",
    "Illinois", "Indiana", "Iowa", "Kansas", "Kentucky", "Louisiana",
    "Maine", "Maryland", "Massachusetts", "Michigan", "Minnesota",
    "Mississippi", "Missouri", "Montana", "Nebraska", "Nevada", "New Hampshire",
    "New Jersey", "New Mexico", "New York", "North Carolina", "North Dakota",
    "Ohio", "Oklahoma", "Oregon", "Pennsylvania", "Rhode Island",
    "South Carolina", "South Dakota", "Tennessee", "Texas", "Utah",
    "Vermont", "Virginia", "Washington", "West Virginia", "Wisconsin",
    "Wyoming", "District of Columbia",
  ],
  Canada: ["Alberta", "British Columbia", "Manitoba", "New Brunswick", "Newfoundland and Labrador", "Nova Scotia", "Ontario", "Prince Edward Island", "Quebec", "Saskatchewan", "Northwest Territories", "Nunavut", "Yukon"],
  Australia: ["New South Wales", "Queensland", "South Australia", "Tasmania", "Victoria", "Western Australia", "Australian Capital Territory", "Northern Territory"],
  "New Zealand": ["Auckland", "Bay of Plenty", "Canterbury", "Gisborne", "Hawke's Bay", "Manawatū-Whanganui", "Marlborough", "Nelson", "Northland", "Otago", "Southland", "Taranaki", "Tasman", "Waikato", "Wellington", "West Coast"],
  "United Arab Emirates": ["Abu Dhabi", "Ajman", "Dubai", "Fujairah", "Ras Al Khaimah", "Sharjah", "Umm Al Quwain"],
  "Saudi Arabia": ["Riyadh", "Makkah", "Madinah", "Eastern Province", "Asir", "Tabuk", "Hail", "Northern Borders", "Jazan", "Najran", "Al Bahah", "Al Jawf", "Qassim"],
  Qatar: ["Doha", "Al Rayyan", "Al Wakrah", "Al Khor", "Umm Salal", "Al Daayen", "Al Shamal", "Al Shahaniya"],
  India: ["Andhra Pradesh", "Delhi", "Goa", "Gujarat", "Haryana", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Punjab", "Rajasthan", "Tamil Nadu", "Telangana", "Uttar Pradesh", "West Bengal"],
  Pakistan: ["Balochistan", "Khyber Pakhtunkhwa", "Punjab", "Sindh", "Islamabad Capital Territory"],
  
};

function getRegions(country: string): string[] {
  return REGIONS[country] ?? [];
}

function getRegionLabel(country: string): string {
  if (["United Kingdom", "Australia", "New Zealand"].includes(country)) return "Region";
  if (["United States", "Canada", "Nigeria", "Ghana", "Kenya", "South Africa"].includes(country)) return country === "Canada" ? "Province / Territory" : "State / Province";
  return "State / Province / Region";
}

/* ===============================================================
   SECTION HEADER
=============================================================== */

function SectionHeader({
  number,
  title,
  description,
}: {
  number: string;
  title: string;
  description: string;
}) {
  return (
    <div className="flex gap-4">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[11px] bg-[#111014] font-mono text-[9px] font-bold text-white/55">
        {number}
      </div>

      <div>
        <h2 className="font-display text-2xl font-semibold tracking-[-0.035em] text-[#111014]">
          {title}
        </h2>

        <p className="mt-1.5 max-w-xl text-sm leading-6 text-black/40">
          {description}
        </p>
      </div>
    </div>
  );
}

/* ===============================================================
   FIELD
=============================================================== */

function Field({
  label,
  hint,
  required,
  icon,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <div className="mb-2.5 flex items-center justify-between gap-3">
        <span className="flex items-center gap-1.5 text-[11px] font-bold text-[#111014]">
          {icon && (
            <span className="text-black/30">
              {icon}
            </span>
          )}

          {label}

          {required && (
            <span className="text-[#7C3AED]">
              *
            </span>
          )}
        </span>

        {hint && (
          <span className="hidden text-[10px] text-black/25 sm:block">
            {hint}
          </span>
        )}
      </div>

      {hint && (
        <p className="mb-2 text-[10px] leading-4 text-black/30 sm:hidden">
          {hint}
        </p>
      )}

      {children}
    </label>
  );
}

/* ===============================================================
   INPUTS
=============================================================== */

const inputClass = `
  h-[52px]
  w-full
  rounded-[14px]
  border
  border-black/[0.10]
  bg-white
  px-4
  text-[13px]
  text-[#111014]
  outline-none
  transition-all
  placeholder:text-black/25
  hover:border-black/[0.16]
  focus:border-[#7C3AED]/50
  focus:ring-4
  focus:ring-[#7C3AED]/[0.07]
`;

const ticketInput = `
  h-[50px]
  w-full
  rounded-[13px]
  border
  border-black/[0.08]
  bg-[#FAFAFA]
  px-3.5
  text-[13px]
  text-[#111014]
  outline-none
  transition-all
  placeholder:text-black/25
  hover:border-black/[0.15]
  hover:bg-white
  focus:border-[#7C3AED]/45
  focus:bg-white
  focus:ring-4
  focus:ring-[#7C3AED]/[0.06]
`;

const mobileLabel =
  "mb-1.5 block text-[9px] font-bold uppercase tracking-[0.12em] text-black/30";

const tableLabel =
  "text-[9px] font-bold uppercase tracking-[0.14em] text-black/30";

/* ===============================================================
   CHEVRON
=============================================================== */

function Chevron() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-black/30"
      aria-hidden="true"
    >
      <path
        d="M4 6L8 10L12 6"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}