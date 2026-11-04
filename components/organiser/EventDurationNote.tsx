"use client";

import { eventDuration } from "@/lib/event-duration";

export default function EventDurationNote(props: Parameters<typeof eventDuration>[0]) {
  if (!props.date || !props.endDate) return null;
  if (props.endDate < props.date) {
    return <p role="alert" className="text-xs text-red-700 sm:col-span-2">Check your end date. It cannot be before the start date.</p>;
  }
  if (!props.startTime || !props.endTime) {
    const days = Math.round((Date.parse(props.endDate) - Date.parse(props.date)) / 86_400_000) + 1;
    return <p role="status" className="rounded-xl bg-violet-50 p-4 text-xs leading-6 text-violet-800 sm:col-span-2">{days === 1 ? "Single-day event (1 calendar day)" : `This event spans ${days} calendar days`}. Add the start and end times to see the exact duration.</p>;
  }
  try {
    const { calendarDays, elapsed } = eventDuration(props);
    return <p role="status" className="rounded-xl bg-violet-50 p-4 text-xs leading-6 text-violet-800 sm:col-span-2">{calendarDays === 1 ? "Single-day event (1 calendar day)" : `This event spans ${calendarDays} calendar days`}. Duration: {elapsed}. Tickets remain available until the event ends.</p>;
  } catch (error) {
    return <p role="alert" className="text-xs text-red-700 sm:col-span-2">{error instanceof Error ? error.message : "Choose valid event dates and times."}</p>;
  }
}
