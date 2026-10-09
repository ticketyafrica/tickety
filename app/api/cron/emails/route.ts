import { timingSafeEqual } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { processEmailQueue } from "@/lib/email/queue";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return NextResponse.json({ error: "Email worker is not configured" }, { status: 503 });
  const actual = Buffer.from(request.headers.get("authorization") || "");
  const expected = Buffer.from(`Bearer ${secret}`);
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    await prisma.emailSubscriptionRateLimit.deleteMany({ where: { expiresAt: { lt: new Date() } } });
    await prisma.signupVerification.deleteMany({ where: { expiresAt: { lt: new Date(Date.now() - 24 * 60 * 60_000) } } });
    const result = await processEmailQueue();
    return NextResponse.json(result, { status: result.configured ? 200 : 503 });
  } catch {
    console.error("Email worker failed; pending jobs will be retried");
    return NextResponse.json({ error: "Email worker failed" }, { status: 500 });
  }
}
