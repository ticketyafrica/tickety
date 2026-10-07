import { getServerSession } from "next-auth";
import { authOptions } from "../auth";
import { prisma } from "../db";
export async function getAdminUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;
  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { id: true, name: true, email: true, role: true } });
  return user?.role === "ADMIN" ? user : null;
}

export async function requireAdminPage() {
  const user = await getAdminUser();
  if (!user) {
    const { redirect } = await import("next/navigation");
    redirect("/login?callbackUrl=%2Fadmin");
  }
  return user;
}
