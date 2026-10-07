import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "./access";
import { syncPaystackFees } from "./sync-fees";
import { recordAudit } from "../audit";
import { prisma } from "../db";
export async function handleFeeSync(request: NextRequest, eventId?: string) {
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: "Administrator access required" }, { status: 403 });
  if (eventId && !await prisma.event.findUnique({ where: { id: eventId }, select: { id: true } })) return NextResponse.json({ error: "Event not found" }, { status: 404 });
  let body: { orderCursor?: string; listingCursor?: string } = {};
  try { body = await request.json(); } catch { /* An empty body starts the first batch. */ }
  if (!body || typeof body !== "object" || Array.isArray(body)) return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  for (const value of [body.orderCursor, body.listingCursor]) if (value !== undefined && (typeof value !== "string" || value.length > 200)) return NextResponse.json({ error: "Invalid cursor" }, { status: 400 });
  await recordAudit({ action: "payment.fee_sync_requested", actorId: admin.id, actorName: admin.name, entityType: eventId ? "event" : "payment", entityId: eventId, summary: "Requested confirmed Paystack processing fees" });
  try {
    const result = await syncPaystackFees({ eventId, orderCursor: body.orderCursor, listingCursor: body.listingCursor });
    await recordAudit({ action: "payment.fees_synced", actorId: admin.id, actorName: admin.name, entityType: eventId ? "event" : "payment", entityId: eventId, summary: `Confirmed processing fees for ${result.synced} payments`, metadata: { reason: `${result.remaining} payments still need fee confirmation` } });
    return NextResponse.json(result);
  } catch { return NextResponse.json({ error: "Unable to fetch Paystack fees. Please try again." }, { status: 502 }); }
}
