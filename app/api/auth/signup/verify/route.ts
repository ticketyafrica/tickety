import { NextRequest, NextResponse } from "next/server";
import { verifySignupCode, SignupError } from "@/lib/signup-verification";

export async function POST(request: NextRequest) {
  if (request.headers.get("origin") && request.headers.get("origin") !== request.nextUrl.origin) return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid request" }, { status: 400 }); }
  try {
    return NextResponse.json(await verifySignupCode(body), { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof SignupError) return NextResponse.json({ error: error.message }, { status: error.status });
    console.error("Signup verification failed", {
      name: error instanceof Error ? error.name : "UnknownError",
      code: typeof error === "object" && error !== null && "code" in error ? String(error.code) : undefined,
    });
    return NextResponse.json({ error: "Could not verify your email. Please try again." }, { status: 500 });
  }
}
