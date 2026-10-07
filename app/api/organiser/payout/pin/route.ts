import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { PayoutPinError, setInitialPayoutPin } from "@/lib/payout-pin";
import { payoutPinStore } from "@/lib/payout-pin-store";

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "ORGANISER") return NextResponse.json({ error: "Only organisers can set payout PINs" }, { status: 403 });
  let body;
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: "Invalid request body" }, { status: 400 }); }
  if (!body || typeof body !== "object" || Array.isArray(body)) return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  try {
    await setInitialPayoutPin(session.user.id, body, payoutPinStore);
    return NextResponse.json({ success: true, pinConfigured: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof PayoutPinError ? error.message : "Unable to set payout PIN. Please try again." }, { status: error instanceof PayoutPinError ? error.status : 500 });
  }
}
