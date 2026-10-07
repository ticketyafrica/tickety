import { paystackFeeAmount } from "@/lib/payment-fees";
import { LISTING_FEE_KOBO } from "@/lib/constants";
import { prisma } from "@/lib/db";
import { matchesTicketPayment } from "@/lib/payment-validation";
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { markListingFeePaid } from "@/lib/data";
import { completeTicketOrder } from "@/lib/ticket-orders";

export async function POST(request: NextRequest) {
  const secret = process.env.PAYSTACK_SECRET_KEY;

  if (!secret) {
    console.error(
      "PAYSTACK_SECRET_KEY not set — rejecting webhook"
    );

    return NextResponse.json(
      { error: "Not configured" },
      { status: 500 }
    );
  }

  /*
   * ---------------------------------------------------------------
   * READ RAW BODY
   *
   * Paystack's signature must be calculated from the exact raw
   * request body.
   * ---------------------------------------------------------------
   */

  const rawBody = await request.text();

  const signature =
    request.headers.get("x-paystack-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "Missing signature" },
      { status: 401 }
    );
  }

  /*
   * ---------------------------------------------------------------
   * VERIFY PAYSTACK SIGNATURE
   * ---------------------------------------------------------------
   */

  const expectedHash = crypto
    .createHmac("sha512", secret)
    .update(rawBody)
    .digest("hex");

  const receivedBuffer = Buffer.from(signature, "utf8");
  const expectedBuffer = Buffer.from(
    expectedHash,
    "utf8"
  );

  if (
    receivedBuffer.length !== expectedBuffer.length ||
    !crypto.timingSafeEqual(
      receivedBuffer,
      expectedBuffer
    )
  ) {
    return NextResponse.json(
      { error: "Invalid signature" },
      { status: 401 }
    );
  }

  /*
   * ---------------------------------------------------------------
   * PARSE PAYLOAD
   * ---------------------------------------------------------------
   */

  let payload: {
    event?: string;
    data?: {
      fees?: number | null;
      amount?: number;
      currency?: string;
      reference?: string;
      status?: string;
      metadata?: {
        paymentType?: string;
        eventId?: string;
        orderId?: string;
        orderReference?: string;
      };
    };
  };

  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON payload" },
      { status: 400 }
    );
  }

  /*
   * ---------------------------------------------------------------
   * WE ONLY PROCESS SUCCESSFUL CHARGES
   * ---------------------------------------------------------------
   */

  if (
    payload.event !== "charge.success" ||
    payload.data?.status !== "success"
  ) {
    return NextResponse.json({
      received: true,
    });
  }

  const reference = payload.data?.reference;
  const metadata = payload.data?.metadata;

  if (!reference || !metadata) {
    return NextResponse.json({
      received: true,
    });
  }

  /*
   * ---------------------------------------------------------------
   * LISTING FEE
   * ---------------------------------------------------------------
   */

  if (metadata.paymentType === "EVENT_LISTING_FEE") {
    const eventId = metadata.eventId;

    if (!eventId) {
      console.error(
        "Listing fee webhook missing eventId",
        reference
      );

      return NextResponse.json({
        received: true,
      });
    }

    if (payload.data?.amount !== LISTING_FEE_KOBO || payload.data?.currency !== "NGN") {
      return NextResponse.json({ error: "Listing payment amount or currency does not match" }, { status: 400 });
    }
    try {
      await markListingFeePaid(
        eventId,
        reference,
        paystackFeeAmount(payload.data?.fees, payload.data!.amount!)
      );
    } catch (error) {
      console.error(
        "Failed to mark listing fee paid from webhook:",
        error
      );

      /*
       * Return 500 so Paystack can retry the webhook.
       */
      return NextResponse.json(
        { error: "Failed to process listing fee" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      received: true,
    });
  }

  /*
   * ---------------------------------------------------------------
   * TICKET PURCHASE
   * ---------------------------------------------------------------
   */

  if (metadata.paymentType === "TICKET_PURCHASE") {
    const orderId = metadata.orderId;

    if (!orderId) {
      console.error(
        "Ticket purchase webhook missing orderId",
        reference
      );

      return NextResponse.json(
        { error: "Missing order ID" },
        { status: 400 }
      );
    }

    try {
      const order = await prisma.order.findUnique({ where: { id: orderId } });
      if (!order || !matchesTicketPayment(order, payload.data ?? {})) {
        return NextResponse.json({ error: "Payment does not match the order" }, { status: 400 });
      }
      await completeTicketOrder(
        orderId,
        reference,
        paystackFeeAmount(payload.data?.fees, payload.data!.amount!)
      );
    } catch (error) {
      /*
       * If the order has already been completed, the completion
       * service handles it idempotently.
       *
       * For genuine processing failures, return 500 so Paystack
       * can retry the webhook.
       */
      console.error(
        "Failed to complete ticket order:",
        {
          orderId,
          reference,
          error,
        }
      );

      return NextResponse.json(
        { error: "Failed to process ticket purchase" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      received: true,
    });
  }

  /*
   * ---------------------------------------------------------------
   * UNKNOWN PAYMENT TYPE
   *
   * Don't accidentally process an unknown payment as a listing
   * fee or ticket purchase.
   * ---------------------------------------------------------------
   */

  console.warn(
    "Received Paystack payment with unknown paymentType:",
    {
      reference,
      paymentType: metadata.paymentType,
    }
  );

  return NextResponse.json({
    received: true,
  });
}