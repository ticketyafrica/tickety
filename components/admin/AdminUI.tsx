import DateRangeFields from "./DateRangeFields";
import Link from "next/link";
import { ArrowUpRight, ChevronLeft, ChevronRight, Download, Search } from "lucide-react";
import { AdminParams, adminFilters, filterQuery } from "@/lib/admin/filters";
export const cardClass = "rounded-[20px] border border-[#E5E2EC] bg-white shadow-[0_3px_14px_#251B3003]";
export const adminDate = (date: Date) => new Intl.DateTimeFormat("en-GB", { timeZone: "Africa/Lagos", day: "numeric", month: "short", year: "numeric" }).format(date);
export const adminTime = (date: Date) => new Intl.DateTimeFormat("en-GB", { timeZone: "Africa/Lagos", day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(date);
export function AdminTitle({ title, description, section, params, back }: { title: string; description: string; section?: string; params?: AdminParams; back?: string }) {
  return <div className="mb-7 flex flex-wrap items-end justify-between gap-4"><div>{back && <Link href={back} className="mb-4 inline-flex min-h-9 items-center gap-1 text-xs text-violet-700"><ChevronLeft size={14} /> Back to list</Link>}<p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-[#94849F]">Tickety / Administration</p><h1 className="mt-2 font-display text-3xl font-semibold tracking-[-0.05em] sm:text-4xl">{title}</h1><p className="mt-2 max-w-2xl text-xs leading-6 text-[#867B92]">{description}</p></div>{section && <a href={`/api/admin/export?section=${section}&${filterQuery(params ?? {})}`} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[#DED8E9] bg-white px-4 text-xs font-semibold hover:bg-violet-50"><Download size={14} /> Export CSV</a>}</div>;
}
export function AdminFiltersBar({ params, search = false, statuses, roles = false, currency = false, actions }: { params: AdminParams; search?: boolean; statuses?: string[]; roles?: boolean; currency?: boolean; actions?: string[] }) {
  const f = adminFilters(params); const field = "h-10 rounded-lg border border-[#E4DEEB] bg-white px-3 text-xs outline-none focus:border-violet-500";
  return <><form className={`${cardClass} mb-6 flex flex-wrap items-end gap-3 p-4`}>
    {f.organiser && <input type="hidden" name="organiser" value={f.organiser} />}
    {f.eventId && <input type="hidden" name="eventId" value={f.eventId} />}
    {f.issuance && <input type="hidden" name="issuance" value={f.issuance} />}
    {search && <label className="min-w-[180px] flex-1 text-[10px] font-medium text-[#8B7C98]">Search<div className="relative mt-1"><Search size={13} className="absolute left-3 top-3.5" /><input name="q" defaultValue={f.q} placeholder="Search records..." className={`${field} w-full pl-9`} /></div></label>}
    <DateRangeFields key={`${f.range}-${f.startDay}-${f.endDay}`} range={f.range} start={f.startDay} end={f.endDay} />
    {currency && <label className="text-[10px] font-medium text-[#8B7C98]">Currency<select name="currency" defaultValue={f.currency} className={`${field} mt-1 block`}><option value="NGN">NGN · Naira</option><option value="USD">USD · Dollars</option></select></label>}
    {statuses && <label className="text-[10px] font-medium text-[#8B7C98]">Status<select name="status" defaultValue={f.status} className={`${field} mt-1 block`}><option value="">All statuses</option>{statuses.map(s => <option key={s} value={s}>{s}</option>)}</select></label>}
    {roles && <label className="text-[10px] font-medium text-[#8B7C98]">Role<select name="role" defaultValue={f.role} className={`${field} mt-1 block`}><option value="">All roles</option>{["ORGANISER", "ADMIN", "CHECKIN_STAFF"].map(r => <option key={r}>{r}</option>)}</select></label>}
    {actions && <label className="text-[10px] font-medium text-[#8B7C98]">Activity<select name="action" defaultValue={f.action} className={`${field} mt-1 block max-w-44`}><option value="">All activity</option>{actions.map(a => <option key={a}>{a}</option>)}</select></label>}
    <button className="h-10 rounded-lg bg-[#6D28D9] px-4 text-xs font-semibold text-white hover:bg-violet-800">Apply filters</button>
    <p className="w-full text-[10px] leading-5 text-[#9D8FA8]">Dates use Africa/Lagos. Editing From / To selects a custom period.</p>
  </form>{f.error && <p role="alert" className="mb-5 rounded-xl bg-amber-50 p-3 text-xs text-amber-800">{f.error}</p>}</>;
}
export function AdminTable({ headers, children, empty }: { headers: string[]; children: React.ReactNode; empty?: boolean }) {
  return <div className={`${cardClass} overflow-hidden`}><div className="overflow-x-auto"><table className="w-full text-left text-xs"><thead className="border-b border-[#ECE7F1] bg-[#FCFBFD] text-[9px] uppercase tracking-[0.08em] text-[#9B8FA6]"><tr>{headers.map(h => <th key={h} className="whitespace-nowrap px-5 py-4 font-semibold">{h}</th>)}</tr></thead><tbody className="divide-y divide-[#F0ECF5] [&_td]:px-5 [&_td]:py-4">{empty ? <tr><td colSpan={headers.length} className="h-36 text-center text-[#9A8BA6]">No records match these filters.</td></tr> : children}</tbody></table></div></div>;
}
export function AdminPagination({ total, page, path, params }: { total: number; page: number; path: string; params: AdminParams }) {
  const pages = Math.max(1, Math.ceil(total / 20));
  return <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-[11px] text-[#92839F]"><span>{total.toLocaleString()} records · Page {page} of {pages}</span><div className="flex gap-2">{page > 1 && <Link href={`${path}?${filterQuery(params, { page: String(page - 1) })}`} className="inline-flex min-h-10 items-center gap-1 rounded-lg border bg-white px-3"><ChevronLeft size={13} /> Previous</Link>}{page < pages && <Link href={`${path}?${filterQuery(params, { page: String(page + 1) })}`} className="inline-flex min-h-10 items-center gap-1 rounded-lg border bg-white px-3">Next <ChevronRight size={13} /></Link>}</div></div>;
}
export function StatusBadge({ status }: { status: string }) { return <span className={`inline-block whitespace-nowrap rounded-full px-2.5 py-1 text-[10px] font-medium ${["paid", "live", "active"].includes(status) ? "bg-green-50 text-green-700" : ["failed", "disabled", "cancelled"].includes(status) ? "bg-red-50 text-red-700" : "bg-violet-50 text-violet-700"}`}>{status.replace(/_/g, " ")}</span>; }
export function DetailLink({ href, children }: { href: string; children: React.ReactNode }) { return <Link href={href} className="inline-flex items-center gap-1.5 font-semibold text-[#67418B] hover:underline">{children}<ArrowUpRight size={12} /></Link>; }
