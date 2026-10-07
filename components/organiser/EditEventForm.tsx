"use client";

import { useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  MapPin,
  Plus,
  Save,
  Sparkles,
  Ticket,
  Trash2,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import EventTimezoneSelect from "@/components/organiser/EventTimezoneSelect";
import CoverImageUpload from "@/components/organiser/CoverImageUpload";
import { NIGERIAN_STATES, EVENT_CATEGORIES } from "@/lib/utils";

type TicketDraft = {
  id?: string;
  name: string;
  price: string;
  quantity: string;
  quantitySold: number;
};

type QuestionDraft = {
  id?: string;
  label: string;
  required: boolean;
};

type EventData = {
  currency?: "NGN" | "USD";
  id: string;
  title: string;
  venue: string;
  state: string;
  date: string;
  startTime: string;
  endTime: string;
  timezone: string;
  category: string;
  description: string;
  coverImageUrl: string;
  tags: string;
  refundPolicy: string;
  minAge: string;
  ticketTypes: TicketDraft[];
  customQuestions: QuestionDraft[];
};

export default function EditEventForm({
  event,
}: {
  event: EventData;
}) {
  const router = useRouter();

  const [title, setTitle] = useState(event.title);
  const [venue, setVenue] = useState(event.venue);
  const [state, setState] = useState(event.state);
  const [date, setDate] = useState(event.date);
  const [startTime, setStartTime] = useState(event.startTime);
  const [endTime, setEndTime] = useState(event.endTime);
  const [timezone, setTimezone] = useState(event.timezone);
  const [category, setCategory] = useState(event.category);
  const [description, setDescription] = useState(event.description);
  const [coverImageUrl, setCoverImageUrl] = useState(
    event.coverImageUrl
  );
  const [tags, setTags] = useState(event.tags);
  const [refundPolicy, setRefundPolicy] = useState(
    event.refundPolicy
  );
  const [minAge, setMinAge] = useState(event.minAge);

  const [ticketTypes, setTicketTypes] = useState<TicketDraft[]>(
    event.ticketTypes
  );

  const [questions, setQuestions] = useState<QuestionDraft[]>(
    event.customQuestions
  );

  const [status, setStatus] = useState<
    "idle" | "saving" | "success" | "error"
  >("idle");

  const [errorMessage, setErrorMessage] = useState("");

  function updateTicket(
    index: number,
    field: keyof TicketDraft,
    value: string
  ) {
    setTicketTypes((current) =>
      current.map((ticket, i) =>
        i === index
          ? {
              ...ticket,
              [field]: value,
            }
          : ticket
      )
    );
  }

  function addTicket() {
    setTicketTypes((current) => [
      ...current,
      {
        name: "",
        price: "",
        quantity: "",
        quantitySold: 0,
      },
    ]);
  }

  function removeTicket(index: number) {
    const ticket = ticketTypes[index];

    if (ticket.quantitySold > 0) {
      setErrorMessage(
        `${ticket.name} has already sold ${ticket.quantitySold} ticket${
          ticket.quantitySold === 1 ? "" : "s"
        } and cannot be removed.`
      );
      setStatus("error");
      return;
    }

    setTicketTypes((current) =>
      current.filter((_, i) => i !== index)
    );
  }

  function updateQuestion(index: number, value: string) {
    setQuestions((current) =>
      current.map((question, i) =>
        i === index
          ? {
              ...question,
              label: value,
            }
          : question
      )
    );
  }

  function addQuestion() {
    setQuestions((current) => [
      ...current,
      {
        label: "",
        required: false,
      },
    ]);
  }

  function removeQuestion(index: number) {
    setQuestions((current) =>
      current.filter((_, i) => i !== index)
    );
  }

  async function handleSubmit(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    setStatus("saving");
    setErrorMessage("");

    try {
      const response = await fetch(`/api/events/${event.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          venue,
          state,
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
          ticketTypes,
          customQuestions: questions.filter(
            (question) => question.label.trim()
          ),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error || "Unable to save your changes."
        );
      }

      setStatus("success");

      setTimeout(() => {
        router.push("/organiser/dashboard");
        router.refresh();
      }, 900);
    } catch (error) {
      setStatus("error");
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to save your changes."
      );
    }
  }

  return (
    <form onSubmit={handleSubmit} className="w-full">
      {status === "error" && (
        <div className="mb-7 flex items-start gap-3 rounded-[18px] border border-red-200 bg-red-50 px-5 py-4">
          <AlertCircle
            size={18}
            className="mt-0.5 shrink-0 text-red-600"
          />

          <div>
            <p className="text-sm font-semibold text-red-800">
              We couldn't save your changes
            </p>

            <p className="mt-1 text-xs leading-5 text-red-600/80">
              {errorMessage}
            </p>
          </div>
        </div>
      )}

      {status === "success" && (
        <div className="mb-7 flex items-center gap-3 rounded-[18px] border border-emerald-200 bg-emerald-50 px-5 py-4">
          <CheckCircle2
            size={18}
            className="text-emerald-600"
          />

          <div>
            <p className="text-sm font-semibold text-emerald-800">
              Changes saved
            </p>

            <p className="mt-0.5 text-xs text-emerald-700/70">
              Taking you back to your organiser dashboard...
            </p>
          </div>
        </div>
      )}

      <section className="border-b border-black/[0.07] pb-14">
        <SectionHeader
          number="01"
          title="Event details"
          description="Keep the information attendees need clear and current."
        />

        <div className="mt-9 space-y-7">
          <Field label="Event title" required>
            <input
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={inputClass}
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
                onChange={(e) => setVenue(e.target.value)}
                className={inputClass}
              />
            </Field>

            <Field label="State" required>
              <select
                required
                value={state}
                onChange={(e) => setState(e.target.value)}
                className={`${inputClass} appearance-none`}
              >
                <option value="" disabled>
                  Select a state
                </option>

                {NIGERIAN_STATES.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </Field>

            <Field
              label="Date"
              required
              icon={<CalendarDays size={13} />}
            >
              <input
                required
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
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
                onChange={(e) => setStartTime(e.target.value)}
                className={inputClass}
              />
            </Field>

            <Field label="End time" required icon={<Clock3 size={13} />}>
              <input required type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className={inputClass} />
            </Field>
            <EventTimezoneSelect value={timezone} onChange={setTimezone} />

            <Field label="Category" required>
              <select
                required
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className={`${inputClass} appearance-none`}
              >
                <option value="" disabled>
                  Select a category
                </option>

                {EVENT_CATEGORIES.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <Field label="Description" required>
            <textarea
              required
              rows={6}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={textareaClass}
            />

            <div className="mt-2 text-right text-[10px] text-black/25">
              {description.length}
            </div>
          </Field>
        </div>
      </section>

      <section className="border-b border-black/[0.07] py-14">
        <SectionHeader
          number="02"
          title="Presentation"
          description="Keep your event's public appearance polished."
        />

        <div className="mt-9 space-y-8">
          <Field label="Cover image">
            <CoverImageUpload
              value={coverImageUrl}
              onChange={setCoverImageUrl}
            />
          </Field>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <Field label="Tags">
              <input
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="afrobeats, outdoor, nightlife"
                className={inputClass}
              />
            </Field>

            <Field label="Minimum age">
              <input
                type="number"
                min={0}
                value={minAge}
                onChange={(e) => setMinAge(e.target.value)}
                placeholder="18"
                className={inputClass}
              />
            </Field>
          </div>

          <Field label="Refund policy">
            <textarea
              rows={4}
              value={refundPolicy}
              onChange={(e) => setRefundPolicy(e.target.value)}
              className={textareaClass}
            />
          </Field>
        </div>
      </section>

      <section className="border-b border-black/[0.07] py-14">
        <SectionHeader
          number="03"
          title="Tickets"
          description="Update prices and capacity while protecting existing sales."
        />

        <div className="mt-9 space-y-3">
          {ticketTypes.map((ticket, index) => (
            <div
              key={ticket.id ?? `new-${index}`}
              className="rounded-[20px] border border-black/[0.08] bg-white p-4"
            >
              {ticket.quantitySold > 0 && (
                <div className="mb-4 flex items-center gap-2 rounded-[12px] bg-[#F5F0FF] px-3 py-2 text-[10px] font-semibold text-[#7C3AED]">
                  <Ticket size={12} />
                  {ticket.quantitySold} sold — this ticket type
                  cannot be removed
                </div>
              )}

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_190px_190px_44px]">
                <Field label="Ticket type">
                  <input
                    required
                    value={ticket.name}
                    onChange={(e) =>
                      updateTicket(index, "name", e.target.value)
                    }
                    className={ticketInput}
                  />
                </Field>

                <Field label={`Price · ${event.currency ?? "NGN"}`}>
                  <input
                    required
                    type="number"
                    min={0}
                    step="0.01"
                    value={ticket.price}
                    onChange={(e) =>
                      updateTicket(index, "price", e.target.value)
                    }
                    className={ticketInput}
                  />
                </Field>

                <Field label="Quantity">
                  <input
                    required
                    type="number"
                    min={ticket.quantitySold}
                    value={ticket.quantity}
                    onChange={(e) =>
                      updateTicket(index, "quantity", e.target.value)
                    }
                    className={ticketInput}
                  />
                </Field>

                <div className="flex items-end justify-end sm:items-center">
                  <button
                    type="button"
                    onClick={() => removeTicket(index)}
                    disabled={ticket.quantitySold > 0}
                    className="flex h-11 w-11 items-center justify-center rounded-[12px] text-black/20 hover:bg-red-50 hover:text-red-500 disabled:pointer-events-none disabled:opacity-20"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            </div>
          ))}

          <button
            type="button"
            onClick={addTicket}
            className="flex h-14 w-full items-center justify-center gap-2 rounded-[17px] border border-dashed border-black/10 bg-[#FCFCFB] text-xs font-semibold text-black/40 hover:border-[#7C3AED]/30 hover:text-[#7C3AED]"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-black/[0.035]">
              <Plus size={14} />
            </span>

            Add another ticket type
          </button>
        </div>
      </section>

      <section className="py-14">
        <SectionHeader
          number="04"
          title="Attendee questions"
          description="Collect the information your event team needs."
        />

        <div className="mt-9 space-y-3">
          {questions.map((question, index) => (
            <div
              key={question.id ?? `question-${index}`}
              className="flex gap-3 rounded-[18px] border border-black/[0.08] bg-white p-3"
            >
              <input
                value={question.label}
                onChange={(e) =>
                  updateQuestion(index, e.target.value)
                }
                placeholder="e.g. What is your Instagram handle?"
                className={`${inputClass} flex-1`}
              />

              <button
                type="button"
                onClick={() => removeQuestion(index)}
                className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-[14px] text-black/20 hover:bg-red-50 hover:text-red-500"
              >
                <Trash2 size={15} />
              </button>
            </div>
          ))}

          <button
            type="button"
            onClick={addQuestion}
            className="flex h-14 w-full items-center justify-center gap-2 rounded-[17px] border border-dashed border-black/10 bg-[#FCFCFB] text-xs font-semibold text-black/40 hover:border-[#7C3AED]/30 hover:text-[#7C3AED]"
          >
            <Plus size={14} />
            Add attendee question
          </button>
        </div>
      </section>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-black/[0.08] bg-white/90 px-4 py-3 shadow-[0_-15px_50px_rgba(0,0,0,0.08)] backdrop-blur-2xl sm:px-6">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4">
          <Link
            href="/organiser/dashboard"
            className="inline-flex h-12 items-center gap-2 rounded-full border border-black/[0.08] bg-white px-5 text-sm font-semibold text-black/55 hover:text-black"
          >
            <ArrowLeft size={15} />
            <span className="hidden sm:inline">
              Cancel
            </span>
          </Link>

          <button
            type="submit"
            disabled={status === "saving" || status === "success"}
            className="inline-flex h-12 items-center gap-2 rounded-full bg-[#111014] px-6 text-sm font-semibold text-white shadow-[0_8px_25px_rgba(17,16,20,0.18)] transition hover:bg-[#7C3AED] disabled:opacity-60"
          >
            {status === "saving" ? (
              <>
                <Clock3 size={15} className="animate-spin" />
                Saving...
              </>
            ) : status === "success" ? (
              <>
                <CheckCircle2 size={15} />
                Saved
              </>
            ) : (
              <>
                <Save size={15} />
                Save changes
                <ArrowRight size={15} />
              </>
            )}
          </button>
        </div>
      </div>
    </form>
  );
}

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
        <h2 className="font-display text-2xl font-semibold tracking-[-0.035em]">
          {title}
        </h2>

        <p className="mt-1.5 max-w-xl text-sm leading-6 text-black/40">
          {description}
        </p>
      </div>
    </div>
  );
}

function Field({
  label,
  required,
  icon,
  children,
}: {
  label: string;
  required?: boolean;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2.5 flex items-center gap-1.5 text-[11px] font-bold text-[#111014]">
        {icon && <span className="text-black/30">{icon}</span>}
        {label}
        {required && (
          <span className="text-[#7C3AED]">*</span>
        )}
      </span>

      {children}
    </label>
  );
}

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

const textareaClass = `
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
