import { paystackFeeAmount } from "@/lib/payment-fees";
import { LISTING_FEE_KOBO } from "@/lib/constants";
import { NextRequest, NextResponse } from "next/server";
import { verifyTransaction } from "@/lib/paystack";
import { markListingFeePaid } from "@/lib/data";

export async function GET(request: NextRequest) {
  const reference = request.nextUrl.searchParams.get("reference");

  if (!reference) {
    return NextResponse.redirect(new URL("/organiser/dashboard?fee=missing_reference", request.url));
  }

  try {
    const verification = await verifyTransaction(reference);

    if (verification.status !== "success" || verification.amount !== LISTING_FEE_KOBO || verification.currency !== "NGN" || verification.metadata?.paymentType !== "EVENT_LISTING_FEE") {
      return NextResponse.redirect(new URL("/organiser/dashboard?fee=failed", request.url));
    }

    const eventId = (verification.metadata as { eventId?: string } | undefined)?.eventId;
    if (!eventId) {
      return NextResponse.redirect(new URL("/organiser/dashboard?fee=missing_event", request.url));
    }

    await markListingFeePaid(eventId, reference, paystackFeeAmount(verification.fees, verification.amount));

    return NextResponse.redirect(new URL(`/organiser/events/${eventId}?fee=success`, request.url));
  } catch (err) {
    console.error("Listing fee verification failed:", err);
    return NextResponse.redirect(new URL("/organiser/dashboard?fee=error", request.url));
  }
}