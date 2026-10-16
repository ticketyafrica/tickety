import { pageMetadata } from "@/lib/seo";
import { redirect } from "next/navigation";
import { getAdminUser } from "@/lib/admin/access";
import AdminShell from "@/components/admin/AdminShell";
export const metadata = pageMetadata({ title: 'Admin', noIndex: true });
export const dynamic = "force-dynamic";
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getAdminUser();
  if (!user) redirect("/login?callbackUrl=%2Fadmin");
  return <AdminShell name={user.name}>{children}</AdminShell>;
}
