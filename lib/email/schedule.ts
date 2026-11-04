export const DEFAULT_EVENT_TIMEZONE = "Africa/Lagos";
const MINUTE = 60_000;

export const REMINDERS = [
  { kind: "reminder_week", offset: 7 * 24 * 60 * MINUTE, label: "One week to go" },
  { kind: "reminder_three_days", offset: 3 * 24 * 60 * MINUTE, label: "Three days to go" },
  { kind: "reminder_day", offset: 24 * 60 * MINUTE, label: "Tomorrow is the day" },
  { kind: "reminder_three_hours", offset: 3 * 60 * MINUTE, label: "Just three hours to go" },
  { kind: "reminder_thirty_minutes", offset: 30 * MINUTE, label: "We start in 30 minutes" },
  { kind: "event_started", offset: 0, label: "Your event has started" },
] as const;

export function isValidTimezone(timezone: string): boolean {
  try {
    new Intl.DateTimeFormat("en", { timeZone: timezone }).format();
    return true;
  } catch { return false; }
}

function partsAt(timestamp: number, timezone: string) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23",
  }).formatToParts(new Date(timestamp));
  const value = (type: string) => Number(parts.find((part) => part.type === type)?.value);
  return Date.UTC(value("year"), value("month") - 1, value("day"), value("hour"), value("minute"), value("second"));
}

// Resolve the organiser's wall-clock time, independent of the server timezone.
export function eventInstant(date: Date | string, time: string, timezone = DEFAULT_EVENT_TIMEZONE): Date {
  let normalized = time.trim();
  const twelveHour = normalized.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (twelveHour) {
    if (Number(twelveHour[1]) < 1 || Number(twelveHour[1]) > 12) throw new Error("Invalid event time");
    const hour = Number(twelveHour[1]) % 12 + (twelveHour[3].toUpperCase() === "PM" ? 12 : 0);
    normalized = `${String(hour).padStart(2, "0")}:${twelveHour[2]}`;
  }
  if (!/^([01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/.test(normalized) || !isValidTimezone(timezone)) {
    throw new Error("Invalid event time or timezone");
  }
  const day = (date instanceof Date ? date.toISOString() : date).slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) throw new Error("Invalid event date");
  const wallClock = Date.parse(`${day}T${normalized.length === 5 ? `${normalized}:00` : normalized}Z`);
  if (!Number.isFinite(wallClock) || new Date(wallClock).toISOString().slice(0, 10) !== day) throw new Error("Invalid event date");
  let instant = wallClock;
  for (let attempt = 0; attempt < 4; attempt++) {
    const correction = wallClock - partsAt(instant, timezone);
    if (!correction) return new Date(instant);
    instant += correction;
  }
  throw new Error("This event time does not exist in its timezone");
}

export type SchedulableEvent = { date: Date | string; endDate?: Date | string | null; startTime: string; endTime: string; timezone: string };

export function reminderSchedule(event: SchedulableEvent, bookedAt: Date) {
  const start = eventInstant(event.date, event.startTime, event.timezone).getTime();
  const end = eventInstant(event.endDate ?? event.date, event.endTime, event.timezone).getTime();
  return [
    ...REMINDERS.map((reminder, index) => ({
      kind: reminder.kind,
      scheduledAt: new Date(start - reminder.offset),
      // Never send an obsolete milestone after the next milestone is due.
      expiresAt: new Date(Math.min(index < REMINDERS.length - 1 ? start - REMINDERS[index + 1].offset : end, start - reminder.offset + 15 * MINUTE)),
    })),
    { kind: "event_follow_up", scheduledAt: new Date(end + 60 * MINUTE), expiresAt: new Date(end + 48 * 60 * MINUTE) },
  ].filter((job) => job.scheduledAt >= bookedAt);
}

export function isLifecycleEmail(kind: string) {
  return kind.startsWith("reminder_") || kind === "event_started" || kind === "event_follow_up";
}
