import assert from "node:assert/strict";
import { test } from "node:test";
import { eventDuration } from "../lib/event-duration";
import { getEventEnd, canPurchaseTickets } from "../lib/event-time";
import { reminderSchedule } from "../lib/email/schedule";
import { lifecycleEmail } from "../lib/email/templates";

const event = { id: "multi-day", slug: "festival", title: "Festival", venue: "The Hall", state: "Lagos", date: "2099-11-14", endDate: "2099-11-16", startTime: "18:00", endTime: "10:00", timezone: "Africa/Lagos" };

test("multi-day events count calendar days and elapsed duration separately", () => {
  assert.deepEqual(eventDuration(event), { calendarDays: 3, elapsed: "1 day, 16 hours" });
  assert.deepEqual(eventDuration({ ...event, endDate: event.date, endTime: "20:30" }), { calendarDays: 1, elapsed: "2 hours, 30 minutes" });
});

test("overnight and month/year boundaries allow earlier end clock times", () => {
  assert.deepEqual(eventDuration({ ...event, date: "2099-12-31", endDate: "2100-01-01", startTime: "23:00", endTime: "01:00" }), { calendarDays: 2, elapsed: "2 hours" });
});

test("invalid date ranges and zero-length events are rejected", () => {
  assert.throws(() => eventDuration({ ...event, endDate: "2099-11-13" }), /Check your end date\./);
  assert.throws(() => eventDuration({ ...event, endDate: event.date, endTime: event.startTime }), /Check your end date or end time/);
  assert.throws(() => eventDuration({ ...event, endDate: event.date, endTime: "10:00" }), /Check your end date or end time/);
  assert.throws(() => eventDuration({ ...event, endDate: "2099-02-30" }));
});

test("duration accounts for timezone daylight-saving changes", () => {
  assert.deepEqual(eventDuration({ ...event, date: "2026-03-07", endDate: "2026-03-08", startTime: "12:00", endTime: "12:00", timezone: "America/New_York" }), { calendarDays: 2, elapsed: "23 hours" });
});

test("event availability uses the end date and legacy events fall back to their start date", () => {
  assert.equal(getEventEnd(event).toISOString(), "2099-11-16T09:00:00.000Z");
  assert.equal(getEventEnd({ ...event, endDate: undefined }).toISOString(), "2099-11-14T09:00:00.000Z");
  // This event began in the past and is still running across multiple days.
  assert.equal(canPurchaseTickets({ ...event, date: "2020-01-01" }), true);
  assert.equal(canPurchaseTickets({ ...event, endDate: "2020-01-02" }), false);
});

test("follow-up emails wait until the final day and show the correct end date", () => {
  const followUp = reminderSchedule(event, new Date("2099-11-01T00:00:00Z")).find((job) => job.kind === "event_follow_up");
  assert.equal(followUp?.scheduledAt.toISOString(), "2099-11-16T10:00:00.000Z");
  const email = lifecycleEmail(event, "guest@example.com", "reminder_day", "token", []);
  assert.ok(email.text.includes("16 November 2099"));
});
