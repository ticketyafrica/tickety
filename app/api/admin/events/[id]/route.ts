import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { getAdminUser } from "@/lib/admin/access";
import { prisma } from "@/lib/db";
import { recordAudit } from "@/lib/audit";
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: "Administrator access required" }, { status: 403 });
  let body;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid request body" }, { status: 400 }); }
  const status = body?.status;
  if (!["live", "pending", "disabled", "archived"].includes(status)) return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  try {
    const found = await prisma.$transaction(async tx => {
      const event = await tx.event.findUnique({ where: { id: params.id }, select: { status: true, title: true } });
      if (!event) return false;
      if (event.status === status) return true;
      await tx.event.update({ where: { id: params.id }, data: { status } });
      await recordAudit({ action: "event.status_changed", actorId: admin.id, actorName: admin.name, entityType: "event", entityId: params.id, summary: `Changed publication status for ${event.title}`, metadata: { from: event.status, to: status } }, tx);
      return true;
    }, { isolationLevel: "Serializable", timeout: 15000 });
    return found ? NextResponse.json({ ok: true }) : NextResponse.json({ error: "Event not found" }, { status: 404 });
  } catch (error) {
    const conflict = error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2034";
    return NextResponse.json({ error: conflict ? "This event changed while saving. Refresh and try again." : "Unable to update event." }, { status: conflict ? 409 : 500 });
  }
}
