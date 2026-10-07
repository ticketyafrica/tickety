import { netAfterFees } from "@/lib/payment-fees";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireAdminPage } from "@/lib/admin/access";
import { adminFilters, AdminParams } from "@/lib/admin/filters";
import { createdRange, ADMIN_PAGE_SIZE } from "@/lib/admin/data";
import { Prisma } from "@prisma/client";
import { formatMoney } from "@/lib/currency";
import { AdminTitle, AdminFiltersBar, AdminTable, AdminPagination, DetailLink, StatusBadge, adminTime } from "@/components/admin/AdminUI";
export default async function ListingFees({ searchParams = {} }: { searchParams?: AdminParams }) {
  await requireAdminPage(); const f = adminFilters(searchParams);
  const where: Prisma.ListingFeePaymentWhereInput = { createdAt: createdRange(f), ...(["paid", "pending", "failed"].includes(f.status) ? { status: f.status as "paid" | "pending" | "failed" } : {}), ...(f.q ? { event: { title: { contains: f.q, mode: "insensitive" } } } : {}) };
  const [rows, total] = await Promise.all([prisma.listingFeePayment.findMany({ where, include: { event: { include: { organiser: { select: { name: true, id: true } } } } }, orderBy: { createdAt: "desc" }, skip: (f.page - 1) * ADMIN_PAGE_SIZE, take: ADMIN_PAGE_SIZE }), prisma.listingFeePayment.count({ where })]);
  return <><AdminTitle title="Listing fee payments." description="Free-event listing fees are charged in NGN. Date filters follow payment creation." section="listings" params={searchParams} /><div className="mb-5 flex gap-4 text-xs"><Link href="/admin/orders" className="text-[#A18CAD] hover:text-violet-700">Ticket orders</Link><span className="font-semibold text-violet-700">Listing fees</span></div><AdminFiltersBar params={searchParams} search statuses={["paid", "pending", "failed"]} /><AdminTable headers={["Event", "Organiser", "Amount", "Paystack fees", "Tickety keeps", "Status", "Paystack reference", "Created", "Paid"]} empty={!rows.length}>{rows.map(r => <tr key={r.id}><td><DetailLink href={`/admin/events/${r.eventId}`}>{r.event.title}</DetailLink></td><td><DetailLink href={`/admin/users/${r.event.organiser.id}`}>{r.event.organiser.name}</DetailLink></td><td>{formatMoney(r.amount)}</td><td>{r.status !== "paid" ? "—" : r.paystackFee === null ? "Awaiting confirmation" : formatMoney(Number(r.paystackFee))}</td><td>{r.status !== "paid" ? "—" : r.paystackFee === null ? "Awaiting confirmation" : formatMoney(netAfterFees(r.amount, Number(r.paystackFee)))}</td><td><StatusBadge status={r.status} /></td><td className="font-mono text-[10px]">{r.paystackRef}</td><td>{adminTime(r.createdAt)}</td><td>{r.paidAt ? adminTime(r.paidAt) : "—"}</td></tr>)}</AdminTable><AdminPagination total={total} page={f.page} path="/admin/orders/listing-fees" params={searchParams} /></>;
}
