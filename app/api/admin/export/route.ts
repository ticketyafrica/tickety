import { revenueTotals } from "@/lib/admin/analytics";
import { netAfterFees } from "@/lib/payment-fees";
import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin/access";
import { adminFilters } from "@/lib/admin/filters";
import { auditWhere, contactsWhere, eventsWhere, ordersWhere, usersWhere, overviewData, attendeeAnswers, createdRange, eventFinances } from "@/lib/admin/data";
import { prisma } from "@/lib/db";
import { recordAudit } from "@/lib/audit";
import { toCsv } from "@/lib/csv";
const sections = ["overview", "events", "users", "orders", "contacts", "audit", "listings"];
export async function GET(request: NextRequest) {
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: "Administrator access required" }, { status: 403 });
  const params = Object.fromEntries(request.nextUrl.searchParams);
  const section = params.section;
  if (!sections.includes(section)) return NextResponse.json({ error: "Invalid export section" }, { status: 400 });
  const f = adminFilters(params);
  if (f.error) return NextResponse.json({ error: f.error }, { status: 400 });
  await recordAudit({ action: "export.requested", actorId: admin.id, actorName: admin.name, entityType: "export", summary: `Requested ${section} CSV export`, metadata: { section, format: "csv", start: f.startDay, end: f.endDay, ...(["overview", "orders"].includes(section) ? { currency: f.currency } : {}) } });
  const headers = { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="tickety-${section}-${f.startDay}-${f.endDay}.csv"`, "Cache-Control": "no-store" };
  if (section === "overview") {
    const data = await overviewData(f);
    const rows = data.series.map(d => ({ date: d.date, currency: f.currency, revenueProcessed: d.gross, ticketyBeforePaystack: d.platform, organiserShare: d.organiser, paystackFees: d.paystack, feesConfirmedSoFar: d.knownPaystackFees, missingFeePayments: d.missingFees, ticketyAfterPaystack: d.net, recordedTicketyAfterPaystack: d.recordedNet, tickets: d.tickets }));
    await recordAudit({ action: "export.completed", actorId: admin.id, actorName: admin.name, entityType: "export", summary: "Exported overview analytics", metadata: { section, format: "csv" } });
    return new NextResponse("\ufeff" + toCsv(rows, [{ key: "date", header: "Date (Africa/Lagos)" }, { key: "currency", header: "Currency" }, { key: "revenueProcessed", header: "Revenue processed" }, { key: "ticketyBeforePaystack", header: "Tickety before Paystack" }, { key: "organiserShare", header: "Organisers share" }, { key: "paystackFees", header: "Paystack fees (blank if incomplete)" }, { key: "feesConfirmedSoFar", header: "Confirmed Paystack fees so far" }, { key: "missingFeePayments", header: "Payments missing fees" }, { key: "ticketyAfterPaystack", header: "Tickety after Paystack (blank if incomplete)" }, { key: "recordedTicketyAfterPaystack", header: "Recorded Tickety share after confirmed Paystack fees" }, { key: "tickets", header: "Tickets issued" }]), { headers });
  }
  // Stable ID pagination keeps exports complete without loading all rows into memory.
  // Bound creation dates to the export start time so new inserts cannot prolong it.
  const snapshot = new Date(); if (f.end > snapshot) f.end = snapshot;
  let lastId = "", wroteHeader = false;
  const encoder = new TextEncoder();
  async function loadBatch(): Promise<Record<string, unknown>[]> {
    const id = lastId ? { gt: lastId } : undefined; const common = { take: 500, orderBy: { id: "asc" as const } };
    if (section === "events") {
      const events = await prisma.event.findMany({ ...common, where: { AND: [eventsWhere(f), { id }] }, include: { organiser: { select: { name: true, email: true } }, ticketTypes: true } });
      const finances = await eventFinances(events.map(e => e.id));
      return events.flatMap(e => (finances.get(e.id) || [{ currency: e.currency, totals: revenueTotals([]) }]).map(g => ({ id: e.id, event: e.title, organiser: e.organiser.name, organiserEmail: e.organiser.email, status: e.status, ticketCurrency: e.currency, currency: g.currency, moneyCollected: g.totals.gross, organiserShare: g.totals.organiser, commission: g.totals.commission, serviceFees: g.totals.serviceFee, listingIncome: g.totals.listing, ticketyBeforePaystack: g.totals.platform, paystackFees: g.totals.missingFees ? null : g.totals.paystack, paystackFeesConfirmed: g.totals.paystack, missingFeePayments: g.totals.missingFees, ticketyAfterPaystack: g.totals.net, recordedTicketyAfterPaystack: g.totals.recordedNet, eventDate: e.date.toISOString(), created: e.createdAt.toISOString(), venue: e.venue, capacity: e.ticketTypes.reduce((s, t) => s + t.quantityTotal, 0), sold: e.ticketTypes.reduce((s, t) => s + t.quantitySold, 0) })));
    }
    if (section === "users") return (await prisma.user.findMany({ ...common, where: { AND: [usersWhere(f), { id }] }, select: { id: true, name: true, email: true, role: true, createdAt: true, paystackSubaccountCode: true, paystackUsdSubaccountCode: true, _count: { select: { events: true } } } })).map(u => ({ id: u.id, name: u.name, email: u.email, role: u.role, joined: u.createdAt.toISOString(), eventCount: u._count.events, ngnPayoutsConnected: Boolean(u.paystackSubaccountCode), usdPayoutsConnected: Boolean(u.paystackUsdSubaccountCode) }));
    if (section === "orders") return (await prisma.order.findMany({ ...common, where: { AND: [ordersWhere(f), { id }] }, include: { event: { include: { organiser: { select: { name: true } } } }, _count: { select: { attendees: true } } } })).map(o => ({ id: o.id, reference: o.reference, customer: o.name, email: o.email, phone: o.phone, event: o.event.title, organiser: o.event.organiser.name, status: o.status, currency: o.currency, total: Number(o.amount), ticketSubtotal: Number(o.ticketAmount), serviceFee: Number(o.serviceFee), commission: Number(o.commissionAmount), platformShare: Number(o.platformFee), paystackFees: Number(o.amount) === 0 ? 0 : o.paystackFee === null ? null : Number(o.paystackFee), ticketyAfterPaystack: ((Number(o.amount) === 0 || o.paystackFee !== null) && Math.abs(Number(o.amount) - Number(o.platformFee) - Number(o.organiserAmount)) < 0.005) ? netAfterFees(Number(o.platformFee), Number(o.paystackFee || 0)) : null, organiserShare: Number(o.organiserAmount), ticketsIssued: o._count.attendees, paystackReference: o.paystackRef, created: o.createdAt.toISOString(), paid: o.paidAt?.toISOString() || "" }));
    if (section === "contacts") return (await prisma.attendee.findMany({ ...common, where: { AND: [contactsWhere(f), { id }] }, include: { event: { include: { organiser: { select: { name: true } }, customQuestions: true } }, ticketType: { select: { name: true } } } })).map(a => ({ id: a.id, name: a.name, email: a.email, phone: a.phone, organiser: a.event.organiser.name, event: a.event.title, ticketType: a.ticketType.name, ticketId: a.ticketId, currency: a.event.currency, amount: Number(a.amountPaid), paymentStatus: a.paymentStatus, ticketStatus: a.ticketStatus, checkedIn: a.checkInStatus, checkInTime: a.checkInTime?.toISOString() || "", purchased: a.purchaseDate.toISOString(), answers: attendeeAnswers(a.customAnswers, a.event.customQuestions) }));
    if (section === "audit") return (await prisma.auditLog.findMany({ ...common, where: { AND: [auditWhere(f), { id }] } })).map(a => ({ id: a.id, timestamp: a.createdAt.toISOString(), actor: a.actorName || "System", actorId: a.actorId || "", action: a.action, entityType: a.entityType, entityId: a.entityId || "", summary: a.summary, context: JSON.stringify(a.metadata || {}) }));
    return (await prisma.listingFeePayment.findMany({ ...common, where: { id, createdAt: createdRange(f), ...(["paid", "pending", "failed"].includes(f.status) ? { status: f.status as "paid" | "pending" | "failed" } : {}), ...(f.q ? { event: { title: { contains: f.q, mode: "insensitive" as const } } } : {}) }, include: { event: { include: { organiser: { select: { name: true } } } } } })).map(l => ({ id: l.id, event: l.event.title, organiser: l.event.organiser.name, currency: "NGN", amount: l.amount, paystackFees: l.status === "paid" && l.paystackFee !== null ? Number(l.paystackFee) : null, ticketyAfterPaystack: l.status === "paid" && l.paystackFee !== null ? netAfterFees(l.amount, Number(l.paystackFee)) : null, status: l.status, paystackReference: l.paystackRef, created: l.createdAt.toISOString(), paid: l.paidAt?.toISOString() || "" }));
  }
  const emptyKeys: Record<string, string[]> = {
    events: ["id", "event", "organiser", "organiserEmail", "status", "ticketCurrency", "currency", "moneyCollected", "organiserShare", "commission", "serviceFees", "listingIncome", "ticketyBeforePaystack", "paystackFees", "paystackFeesConfirmed", "missingFeePayments", "ticketyAfterPaystack", "recordedTicketyAfterPaystack", "eventDate", "created", "venue", "capacity", "sold"], users: ["id", "name", "email", "role", "joined", "eventCount", "ngnPayoutsConnected", "usdPayoutsConnected"], orders: ["id", "reference", "customer", "email", "phone", "event", "organiser", "status", "currency", "total", "ticketSubtotal", "serviceFee", "commission", "platformShare", "paystackFees", "ticketyAfterPaystack", "organiserShare", "ticketsIssued", "paystackReference", "created", "paid"], contacts: ["id", "name", "email", "phone", "organiser", "event", "ticketType", "ticketId", "currency", "amount", "paymentStatus", "ticketStatus", "checkedIn", "checkInTime", "purchased", "answers"], audit: ["id", "timestamp", "actor", "actorId", "action", "entityType", "entityId", "summary", "context"], listings: ["id", "event", "organiser", "currency", "amount", "paystackFees", "ticketyAfterPaystack", "status", "paystackReference", "created", "paid"],
  };
  const stream = new ReadableStream<Uint8Array>({
    async pull(controller) {
      try {
        const rows = await loadBatch();
        const keys = emptyKeys[section]; const csv = toCsv(rows, keys.map(key => ({ key, header: key.replace(/([A-Z])/g, " $1").replace(/^./, c => c.toUpperCase()) })));
        const lines = csv.split("\n"); // Strip only the generated header; quoted multiline fields remain intact after join.
        const chunk = wroteHeader ? lines.slice(1).join("\n") : "\ufeff" + csv;
        if (chunk) controller.enqueue(encoder.encode(chunk + "\n")); wroteHeader = true;
        if (rows.length < 500) {
          await recordAudit({ action: "export.completed", actorId: admin.id, actorName: admin.name, entityType: "export", summary: `Exported ${section} records`, metadata: { section, format: "csv" } });
          controller.close();
        } else lastId = String(rows[rows.length - 1].id);
      } catch (error) { controller.error(error); }
    },
  });
  return new NextResponse(stream, { headers });
}
