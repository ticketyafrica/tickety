import { roundMoney } from "../currency";
import { Prisma } from "@prisma/client";
import { prisma } from "../db";
import { AdminFilters } from "./filters";
import { dailyRevenue, revenueGrowth, revenueTotals, RevenueRow } from "./analytics";
export const ADMIN_PAGE_SIZE = 20;
export const createdRange = (f: AdminFilters) => ({ gte: f.start, lt: f.end });
export function eventsWhere(f: AdminFilters): Prisma.EventWhereInput {
  return { createdAt: createdRange(f), ...(f.organiser ? { organiserId: f.organiser } : {}), ...(f.status && ["live", "pending", "disabled", "archived"].includes(f.status) ? { status: f.status as Prisma.EnumEventStatusFilter["equals"] } : {}), ...(f.q ? { OR: [{ title: { contains: f.q, mode: "insensitive" } }, { organiser: { name: { contains: f.q, mode: "insensitive" } } }] } : {}) };
}
export function usersWhere(f: AdminFilters): Prisma.UserWhereInput {
  return { createdAt: createdRange(f), ...(["ADMIN", "ORGANISER", "CHECKIN_STAFF"].includes(f.role) ? { role: f.role as "ADMIN" | "ORGANISER" | "CHECKIN_STAFF" } : {}), ...(f.q ? { OR: [{ name: { contains: f.q, mode: "insensitive" } }, { email: { contains: f.q, mode: "insensitive" } }] } : {}) };
}
export function ordersWhere(f: AdminFilters): Prisma.OrderWhereInput {
  return { createdAt: createdRange(f), currency: f.currency, ...(f.eventId ? { eventId: f.eventId } : {}), ...(f.issuance === "missing" ? { attendees: { none: {} } } : {}), ...(["paid", "pending", "failed"].includes(f.status) ? { status: f.status as "paid" | "pending" | "failed" } : {}), ...(f.q ? { OR: [{ reference: { contains: f.q, mode: "insensitive" } }, { name: { contains: f.q, mode: "insensitive" } }, { email: { contains: f.q, mode: "insensitive" } }, { event: { title: { contains: f.q, mode: "insensitive" } } }] } : {}) };
}
export function contactsWhere(f: AdminFilters): Prisma.AttendeeWhereInput {
  return { purchaseDate: createdRange(f), ...(f.eventId ? { eventId: f.eventId } : {}), ...(["paid", "pending", "failed"].includes(f.status) ? { paymentStatus: f.status as "paid" | "pending" | "failed" } : {}), ...(f.q ? { OR: [{ name: { contains: f.q, mode: "insensitive" } }, { email: { contains: f.q, mode: "insensitive" } }, { ticketId: { contains: f.q, mode: "insensitive" } }, { event: { title: { contains: f.q, mode: "insensitive" } } }] } : {}) };
}
export function auditWhere(f: AdminFilters): Prisma.AuditLogWhereInput {
  return { createdAt: createdRange(f), ...(f.action ? { action: f.action } : {}), ...(f.q ? { OR: [{ summary: { contains: f.q, mode: "insensitive" } }, { actorName: { contains: f.q, mode: "insensitive" } }, { entityId: { contains: f.q, mode: "insensitive" } }] } : {}) };
}
async function revenueRows(start: Date, end: Date, currency: "NGN" | "USD"): Promise<RevenueRow[]> {
  const [orders, listings] = await Promise.all([
    prisma.order.findMany({ where: { status: "paid", paidAt: { gte: start, lt: end }, currency, OR: [{ amount: { gt: 0 } }, { attendees: { some: {} } }] }, select: { paidAt: true, amount: true, ticketAmount: true, serviceFee: true, commissionAmount: true, platformFee: true, paystackFee: true, organiserAmount: true, eventId: true, event: { select: { title: true } }, _count: { select: { attendees: true } } } }),
    currency === "NGN" ? prisma.listingFeePayment.findMany({ where: { status: "paid", paidAt: { gte: start, lt: end } }, select: { paidAt: true, amount: true, paystackFee: true } }) : Promise.resolve([]),
  ]);
  return [...orders.map(o => ({ date: o.paidAt!, gross: Number(o.amount), tickets: Number(o.ticketAmount), serviceFee: Number(o.serviceFee), commission: Number(o.commissionAmount), platform: Number(o.platformFee), paystackFee: o.paystackFee === null ? null : Number(o.paystackFee), organiser: Number(o.organiserAmount), listing: 0, ticketCount: o._count.attendees, eventId: o.eventId, eventTitle: o.event.title })), ...listings.map(l => ({ date: l.paidAt!, gross: l.amount, tickets: 0, serviceFee: 0, commission: 0, organiser: 0, listing: l.amount, paystackFee: l.paystackFee === null ? null : Number(l.paystackFee), ticketCount: 0 }))];
}
export async function overviewData(f: AdminFilters) {
  const [rows, previousRows, signups, previousSignups, activeEvents, pendingOrders, failedOrders, pendingEvents, recentUsers, recentActivity, issuancePending] = await Promise.all([
    revenueRows(f.start, f.end, f.currency), revenueRows(f.previousStart, f.previousEnd, f.currency),
    prisma.user.count({ where: { createdAt: createdRange(f) } }), prisma.user.count({ where: { createdAt: { gte: f.previousStart, lt: f.previousEnd } } }),
    prisma.event.count({ where: { status: "live" } }),
    prisma.order.count({ where: { status: "pending", createdAt: createdRange(f), currency: f.currency } }),
    prisma.order.count({ where: { status: "failed", createdAt: createdRange(f), currency: f.currency } }),
    prisma.event.count({ where: { status: "pending" } }),
    prisma.user.findMany({ where: { createdAt: createdRange(f) }, select: { id: true, name: true, email: true, role: true, createdAt: true }, orderBy: { createdAt: "desc" }, take: 5 }),
    prisma.auditLog.findMany({ where: { createdAt: createdRange(f) }, orderBy: { createdAt: "desc" }, take: 5 }),
    prisma.order.count({ where: { status: "paid", attendees: { none: {} }, currency: f.currency, createdAt: createdRange(f) } }),
  ]);
  const totals = revenueTotals(rows), previous = revenueTotals(previousRows);
  const events = new Map<string, { id: string; title: string; gross: number; tickets: number }>();
  for (const row of rows) if (row.eventId) { const item = events.get(row.eventId) ?? { id: row.eventId, title: row.eventTitle!, gross: 0, tickets: 0 }; item.gross = roundMoney(item.gross + row.gross); item.tickets += row.ticketCount; events.set(item.id, item); }
  return { totals, previous, growth: revenueGrowth(totals.gross, previous.gross), signups, signupGrowth: revenueGrowth(signups, previousSignups), activeEvents, pendingOrders, failedOrders, pendingEvents, issuancePending, recentUsers, recentActivity, series: dailyRevenue(rows, f), topEvents: [...events.values()].sort((a, b) => b.gross - a.gross).slice(0, 5) };
}
export function auditEntityLink(type: string, id: string | null) {
  if (!id) return null;
  if (type === "event") return `/admin/events/${id}`;
  if (type === "order") return `/admin/orders/${id}`;
  if (type === "user") return `/admin/users/${id}`;
  return null;
}
export function attendeeAnswers(value: Prisma.JsonValue | null, questions: { id: string; label: string }[]) {
  if (!value || typeof value !== "object") return "";
  if (Array.isArray(value)) return value.map(item => { if (!item || typeof item !== "object" || Array.isArray(item)) return ""; const q = questions.find(q => q.id === item.questionId); return `${q?.label || "Answer"}: ${String(item.answer ?? "")}`; }).filter(Boolean).join("; ");
  return questions.filter(q => value[q.id] !== undefined).map(q => `${q.label}: ${String(value[q.id])}`).join("; ");
}

export async function eventFinances(eventIds: string[]) {
  const [orders, listings] = await Promise.all([
    prisma.order.findMany({ where: { eventId: { in: eventIds }, status: "paid", OR: [{ amount: { gt: 0 } }, { attendees: { some: {} } }] }, select: { eventId: true, currency: true, paidAt: true, createdAt: true, amount: true, ticketAmount: true, serviceFee: true, commissionAmount: true, organiserAmount: true, platformFee: true, paystackFee: true, _count: { select: { attendees: true } } } }),
    prisma.listingFeePayment.findMany({ where: { eventId: { in: eventIds }, status: "paid" }, select: { eventId: true, paidAt: true, createdAt: true, amount: true, paystackFee: true } }),
  ]);
  const grouped = new Map<string, Map<"NGN" | "USD", RevenueRow[]>>();
  function add(eventId: string, currency: "NGN" | "USD", row: RevenueRow) { const currencies = grouped.get(eventId) ?? new Map(); const rows = currencies.get(currency) ?? []; rows.push(row); currencies.set(currency, rows); grouped.set(eventId, currencies); }
  for (const o of orders) add(o.eventId, o.currency, { date: o.paidAt || o.createdAt, gross: Number(o.amount), tickets: Number(o.ticketAmount), serviceFee: Number(o.serviceFee), commission: Number(o.commissionAmount), organiser: Number(o.organiserAmount), platform: Number(o.platformFee), paystackFee: o.paystackFee === null ? null : Number(o.paystackFee), listing: 0, ticketCount: o._count.attendees });
  for (const l of listings) add(l.eventId, "NGN", { date: l.paidAt || l.createdAt, gross: l.amount, tickets: 0, serviceFee: 0, commission: 0, organiser: 0, listing: l.amount, paystackFee: l.paystackFee === null ? null : Number(l.paystackFee), ticketCount: 0 });
  return new Map([...grouped].map(([id, currencies]) => [id, [...currencies].map(([currency, rows]) => ({ currency, totals: revenueTotals(rows) }))]));
}
