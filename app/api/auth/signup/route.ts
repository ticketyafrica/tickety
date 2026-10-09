import { NextRequest, NextResponse } from "next/server";
import { requestSignupCode, SignupError } from "@/lib/signup-verification";

export async function POST(request: NextRequest) {
  if (request.headers.get("origin") && request.headers.get("origin") !== request.nextUrl.origin) return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid request" }, { status: 400 }); }
  try {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
    return NextResponse.json(await requestSignupCode(body, ip), { status: 202, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof SignupError) return NextResponse.json({ error: error.message }, { status: error.status, headers: error.retryAfter ? { "Retry-After": String(error.retryAfter) } : {} });
    // Never log the request, Prisma query arguments, passwords, or OTPs.
    console.error("Signup request failed", {
      name: error instanceof Error ? error.name : "UnknownError",
      code: typeof error === "object" && error !== null && "code" in error ? String(error.code) : undefined,
    });
    return NextResponse.json({ error: "Could not start signup. Please try again." }, { status: 500 });
  }
}
