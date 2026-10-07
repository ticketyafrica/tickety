import { paystackFeeAmount } from "@/lib/payment-fees";
import { LISTING_FEE_KOBO } from "@/lib/constants";
import { NextRequest, NextResponse } from "next/server";

import { verifyTransaction } from "@/lib/paystack";
import { markListingFeePaid } from "@/lib/data";

export async function GET(request: NextRequest) {
  try {
    // --------------------------------------------------
    // Get Paystack reference
    // --------------------------------------------------

    const reference =
      request.nextUrl.searchParams.get("reference");

    if (!reference) {
      return NextResponse.redirect(
        new URL(
          "/organiser/dashboard?payment=failed",
          request.url
        )
      );
    }

    // --------------------------------------------------
    // Verify payment with Paystack
    // --------------------------------------------------

    const payment = await verifyTransaction(reference);

    if (!payment || payment.status !== "success" || payment.amount !== LISTING_FEE_KOBO || payment.currency !== "NGN" || payment.metadata?.paymentType !== "EVENT_LISTING_FEE") {
      return NextResponse.redirect(
        new URL(
          `/organiser/dashboard?payment=failed&reference=${encodeURIComponent(
            reference
          )}`,
          request.url
        )
      );
    }

    // --------------------------------------------------
    // Get event ID from Paystack metadata
    // --------------------------------------------------

    const rawEventId = payment.metadata?.eventId;

    if (typeof rawEventId !== "string" || !rawEventId) {
      console.error(
        "Listing fee payment has invalid eventId metadata:",
        {
          reference,
          metadata: payment.metadata,
        }
      );

      return NextResponse.redirect(
        new URL(
          "/organiser/dashboard?payment=failed",
          request.url
        )
      );
    }

    const eventId = rawEventId;

    // --------------------------------------------------
    // Mark listing fee as paid
    // This also changes the event status to live.
    // --------------------------------------------------

    await markListingFeePaid(
      eventId,
      reference,
      paystackFeeAmount(payment.fees, payment.amount)
    );

    // --------------------------------------------------
    // Return organiser to dashboard
    // --------------------------------------------------

    return NextResponse.redirect(
      new URL(
        "/organiser/dashboard?payment=success",
        request.url
      )
    );
  } catch (error) {
    console.error(
      "LISTING FEE CALLBACK ERROR:",
      error
    );

    return NextResponse.redirect(
      new URL(
        "/organiser/dashboard?payment=failed",
        request.url
      )
    );
  }
}