import { prisma } from "@/lib/db";
import { requireAdminPage } from "@/lib/admin/access";
import { adminFilters, AdminParams } from "@/lib/admin/filters";
import { usersWhere, ADMIN_PAGE_SIZE } from "@/lib/admin/data";
import { AdminTitle, AdminFiltersBar, AdminTable, AdminPagination, DetailLink, StatusBadge, adminTime } from "@/components/admin/AdminUI";
export default async function AdminUsers({ searchParams = {} }: { searchParams?: AdminParams }) {
  await requireAdminPage(); const f = adminFilters(searchParams), where = usersWhere(f);
  const [users, total] = await Promise.all([prisma.user.findMany({ where, select: { id: true, name: true, email: true, role: true, createdAt: true, paystackSubaccountCode: true, paystackUsdSubaccountCode: true, _count: { select: { events: true } } }, orderBy: { createdAt: "desc" }, skip: (f.page - 1) * ADMIN_PAGE_SIZE, take: ADMIN_PAGE_SIZE }), prisma.user.count({ where })]);
  return <><AdminTitle title="People behind the moments." description="Track new signups, account roles, event activity and payout readiness. Date filters follow signup dates." section="users" params={searchParams} /><AdminFiltersBar params={searchParams} search roles /><AdminTable headers={["Person", "Email", "Role", "Events", "Payouts", "Joined"]} empty={!users.length}>{users.map(u => <tr key={u.id} className="hover:bg-[#FCFAFF]"><td><DetailLink href={`/admin/users/${u.id}`}>{u.name}</DetailLink></td><td>{u.email}</td><td><StatusBadge status={u.role} /></td><td>{u._count.events}</td><td className="text-[#8A769C]">{u.role === "ORGANISER" ? `${u.paystackSubaccountCode ? "NGN connected" : "NGN not connected"}${u.paystackUsdSubaccountCode ? " · USD connected" : ""}` : "—"}</td><td className="whitespace-nowrap text-[#A090AE]">{adminTime(u.createdAt)}</td></tr>)}</AdminTable><AdminPagination total={total} page={f.page} path="/admin/users" params={searchParams} /></>;
}
