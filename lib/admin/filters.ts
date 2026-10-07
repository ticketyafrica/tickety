import { Currency } from "../currency";
export type AdminParams = Record<string, string | string[] | undefined>;
export function param(params: AdminParams, key: string): string { const value = params[key]; return typeof value === "string" ? value : ""; }
const DAY = 86400000;
export const lagosDay = (date: Date) => new Date(date.getTime() + 3600000).toISOString().slice(0, 10);
const validDay = (day: string) => /^\d{4}-\d{2}-\d{2}$/.test(day) && !Number.isNaN(Date.parse(day)) && new Date(day).toISOString().slice(0, 10) === day;
export function adminFilters(params: AdminParams = {}, now = new Date()) {
  const today = lagosDay(now);
  const range = ["today", "7d", "30d", "90d", "year", "custom"].includes(param(params, "range")) ? param(params, "range") : "30d";
  let startDay = range === "year" ? `${today.slice(0, 4)}-01-01` : lagosDay(new Date(now.getTime() - ((range === "today" ? 1 : range === "7d" ? 7 : range === "90d" ? 90 : 30) - 1) * DAY));
  let endDay = today;
  let error = "";
  if (range === "custom") {
    const start = param(params, "start"), end = param(params, "end");
    if (!validDay(start) || !validDay(end) || start > end || (Date.parse(end) - Date.parse(start)) / DAY > 366) error = "Choose valid dates in order, up to 367 days apart. Showing the last 30 days.";
    else { startDay = start; endDay = end; }
  }
  const start = new Date(`${startDay}T00:00:00+01:00`);
  const end = new Date(new Date(`${endDay}T00:00:00+01:00`).getTime() + DAY);
  const duration = end.getTime() - start.getTime();
  const currency: Currency = param(params, "currency") === "USD" ? "USD" : "NGN";
  const page = Math.min(100000, Math.max(1, Math.floor(Number(param(params, "page")) || 1)));
  return { range, startDay, endDay, start, end, previousStart: new Date(start.getTime() - duration), previousEnd: start, currency, page, eventId: param(params, "eventId"), organiser: param(params, "organiser"), issuance: param(params, "issuance"), q: param(params, "q").trim().slice(0, 200), status: param(params, "status"), role: param(params, "role"), action: param(params, "action"), error };
}
export type AdminFilters = ReturnType<typeof adminFilters>;
export function filterQuery(params: AdminParams, overrides: Record<string, string> = {}) {
  const query = new URLSearchParams();
  for (const key of ["range", "start", "end", "currency", "q", "status", "role", "action", "page", "eventId", "organiser", "issuance"]) { const value = param(params, key); if (value) query.set(key, value); }
  for (const [key, value] of Object.entries(overrides)) { if (value) query.set(key, value); else query.delete(key); }
  return query.toString();
}
