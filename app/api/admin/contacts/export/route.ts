import { NextRequest, NextResponse } from "next/server";
export async function GET(request: NextRequest) {
  const url = new URL("/api/admin/export", request.url);
  url.search = request.nextUrl.search;
  url.searchParams.set("section", "contacts");
  if (!url.searchParams.has("range")) url.searchParams.set("range", "year");
  return NextResponse.redirect(url);
}
