import assert from "node:assert/strict";
import { test } from "node:test";
import { adminFilters, filterQuery, lagosDay } from "../lib/admin/filters";
import { dailyRevenue, revenueGrowth, revenueTotals, RevenueRow } from "../lib/admin/analytics";
import { safeAuditMetadata } from "../lib/audit";
import { toCsv } from "../lib/csv";
const now = new Date("2026-10-07T12:00:00Z");

test("date filters use Lagos midnight and an equal previous period", () => {
  const f = adminFilters({ range: "7d" }, now);
  assert.equal(f.start.toISOString(), "2026-09-30T23:00:00.000Z");
  assert.equal(f.end.toISOString(), "2026-10-07T23:00:00.000Z");
  assert.equal(f.start.getTime() - f.previousStart.getTime(), f.end.getTime() - f.start.getTime());
  assert.equal(f.previousEnd.getTime(), f.start.getTime());
  assert.equal(lagosDay(new Date("2026-10-07T23:30:00Z")), "2026-10-08");
});
test("custom ranges include the last day and reject invalid or excessive intervals", () => {
  const f = adminFilters({ range: "custom", start: "2026-10-01", end: "2026-10-07", currency: "USD" }, now);
  assert.equal(f.currency, "USD"); assert.equal(f.end.toISOString(), "2026-10-07T23:00:00.000Z");
  for (const [start, end] of [["2026-02-30", "2026-03-01"], ["2026-10-08", "2026-10-07"], ["2020-01-01", "2026-01-01"]]) assert.ok(adminFilters({ range: "custom", start, end }, now).error);
});
test("revenue includes fees once, organiser proceeds separately, and listing receipts", () => {
  const rows: RevenueRow[] = [
    { date: now, gross: 105, tickets: 100, serviceFee: 5, commission: 10, organiser: 90, listing: 0, ticketCount: 2 },
    { date: now, gross: 50, tickets: 0, serviceFee: 0, commission: 0, organiser: 0, listing: 50, ticketCount: 0 },
  ];
  const total = revenueTotals(rows);
  assert.equal(total.gross, 155); assert.equal(total.platform, 65); assert.equal(total.organiser, 90); assert.equal(total.ticketCount, 2);
  assert.equal(total.gross, total.platform + total.organiser);
  assert.equal(revenueGrowth(150, 100), 50); assert.equal(revenueGrowth(50, 100), -50); assert.equal(revenueGrowth(10, 0), null);
});
test("charts include zero days and use local dates around midnight", () => {
  const f = adminFilters({ range: "custom", start: "2026-10-07", end: "2026-10-08" }, now);
  const rows: RevenueRow[] = [{ date: new Date("2026-10-07T23:30:00Z"), gross: 21, tickets: 20, serviceFee: 1, commission: 2, organiser: 18, listing: 0, ticketCount: 1 }];
  const series = dailyRevenue(rows, f); assert.equal(series.length, 2); assert.equal(series[0].gross, 0); assert.equal(series[1].gross, 21); assert.equal(series[1].platform, 3);
});
test("pagination and drill-down query strings preserve filters safely", () => {
  assert.equal(adminFilters({ page: "-3" }, now).page, 1);
  const query = new URLSearchParams(filterQuery({ q: "Music & Arts", currency: "USD", range: "7d" }, { page: "2" }));
  assert.equal(query.get("q"), "Music & Arts"); assert.equal(query.get("currency"), "USD"); assert.equal(query.get("page"), "2");
});
test("audit context excludes security credentials and banking details", () => {
  assert.deepEqual(safeAuditMetadata({ from: "live", to: "disabled", pin: "123456", password: "secret", payoutPinHash: "hash", accountNumber: "0123456789", verificationToken: "token", secretKey: "key", amount: 525, currency: "NGN" }), { from: "live", to: "disabled", amount: 525, currency: "NGN" });
});
test("CSV preserves commas, quotes and multiline answers and neutralises formulas", () => {
  const csv = toCsv([{ name: '=HYPERLINK("bad")', answer: 'Line 1\nLine 2, "yes"', amount: 12 }], [{ key: "name", header: "Name" }, { key: "answer", header: "Answer" }, { key: "amount", header: "Amount" }]);
  assert.ok(csv.includes("'=HYPERLINK")); assert.ok(csv.includes('Line 1\nLine 2, ""yes""')); assert.ok(csv.endsWith(",12"));
});

test("recorded platform share is authoritative for historical fee breakdowns", () => {
  const row: RevenueRow = { date: now, gross: 100, tickets: 90, serviceFee: 5, commission: 10, platform: 20, organiser: 80, listing: 0, ticketCount: 1 };
  assert.equal(revenueTotals([row]).platform, 20);
  const f = adminFilters({ range: "today" }, now);
  assert.equal(dailyRevenue([row], f)[0].platform, 20);
});

test("Tickety net deducts confirmed fees and the money reconciles across all parties", () => {
  const row: RevenueRow = { date: now, gross: 525, tickets: 500, serviceFee: 25, commission: 50, organiser: 450, platform: 75, paystackFee: 7.88, listing: 0, ticketCount: 1 };
  const t = revenueTotals([row]);
  assert.equal(t.paystack, 7.88); assert.equal(t.net, 67.12); assert.equal(t.confirmedNet, 67.12);
  assert.equal(Math.round((t.organiser + t.paystack + t.net!) * 100), Math.round(t.gross * 100));
});
test("unknown fees and incomplete shares do not produce a fabricated net amount", () => {
  const base: RevenueRow = { date: now, gross: 21, tickets: 20, serviceFee: 1, commission: 2, organiser: 18, platform: 3, paystackFee: null, listing: 0, ticketCount: 1 };
  const unknown = revenueTotals([base]); assert.equal(unknown.net, null); assert.equal(unknown.missingFees, 1); assert.equal(unknown.paystack, 0); assert.equal(unknown.recordedNet, null);
  const incomplete = revenueTotals([{ ...base, paystackFee: 0.82, organiser: 0, platform: 0 }]); assert.equal(incomplete.net, null); assert.equal(incomplete.missingSplits, 1); assert.equal(incomplete.recordedNet, -0.82);
  const mixed = revenueTotals([base, { ...base, paystackFee: 0.82 }]); assert.equal(mixed.net, null); assert.equal(mixed.confirmedNet, 2.18);
});
test("free bookings require no Paystack fee and listing income counts toward Tickety net", () => {
  const free: RevenueRow = { date: now, gross: 0, tickets: 0, serviceFee: 0, commission: 0, organiser: 0, platform: 0, listing: 0, ticketCount: 1 };
  assert.equal(revenueTotals([free]).net, 0); assert.equal(revenueTotals([free]).missingFees, 0);
  const listing: RevenueRow = { ...free, gross: 50000, listing: 50000, platform: 50000, ticketCount: 0, paystackFee: 850 };
  assert.equal(revenueTotals([listing]).net, 49150);
});
