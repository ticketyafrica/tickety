import { eventInstant } from "./email/schedule";

export function eventDuration(input: { date: string; endDate: string; startTime: string; endTime: string; timezone: string }) {
  if (input.endDate < input.date) throw new Error("Check your end date. It cannot be before the start date.");
  const start = eventInstant(input.date, input.startTime, input.timezone);
  const end = eventInstant(input.endDate, input.endTime, input.timezone);
  if (end <= start) throw new Error("Check your end date or end time. The event must end after it starts.");
  const calendarDays = Math.round((Date.parse(input.endDate) - Date.parse(input.date)) / 86_400_000) + 1;
  if (calendarDays < 1) throw new Error("Check your end date. It cannot be before the start date.");
  const minutes = Math.round((end.getTime() - start.getTime()) / 60_000);
  const parts = [
    [Math.floor(minutes / 1440), "day"],
    [Math.floor(minutes % 1440 / 60), "hour"],
    [minutes % 60, "minute"],
  ] as const;
  const elapsed = parts.filter(([value]) => value > 0).map(([value, unit]) => `${value} ${unit}${value === 1 ? "" : "s"}`).join(", ");
  return { calendarDays, elapsed };
}
