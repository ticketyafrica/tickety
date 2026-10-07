import { paystackFeeAmount } from "@/lib/payment-fees";
import { matchesTicketPayment } from "@/lib/payment-validation";
import { toMinorUnits } from "@/lib/currency";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyTransaction } from "@/lib/paystack";
import { completeTicketOrder } from "@/lib/ticket-orders";

export async function GET(request: NextRequest) {
  const reference =
    request.nextUrl.searchParams.get("reference");

  if (!reference) {
    return NextResponse.redirect(
      new URL(
        "/checkout/error?reason=missing_reference",
        request.url
      )
    );
  }

  try {
    /*
     * -------------------------------------------------------------
     * VERIFY PAYMENT WITH PAYSTACK
     * -------------------------------------------------------------
     */

    const verification =
      await verifyTransaction(reference);

    /*
     * Paystack must report a successful transaction.
     */

    if (verification.status !== "success") {
      return NextResponse.redirect(
        new URL(
          `/checkout/error?reason=payment_failed&reference=${encodeURIComponent(
            reference
          )}`,
          request.url
        )
      );
    }

    /*
     * -------------------------------------------------------------
     * VALIDATE PAYMENT METADATA
     * -------------------------------------------------------------
     */

    const metadata =
      verification.metadata as
        | {
            paymentType?: string;
            orderId?: string;
          }
        | undefined;

    if (
      metadata?.paymentType !==
      "TICKET_PURCHASE"
    ) {
      return NextResponse.redirect(
        new URL(
          "/checkout/error?reason=invalid_payment",
          request.url
        )
      );
    }

    if (!metadata.orderId) {
      return NextResponse.redirect(
        new URL(
          "/checkout/error?reason=missing_order",
          request.url
        )
      );
    }

    /*
     * -------------------------------------------------------------
     * LOAD ORDER
     * -------------------------------------------------------------
     *
     * We load the order from our database rather than trusting
     * the amount supplied by the browser or Paystack metadata.
     */

    const order = await prisma.order.findUnique({
      where: {
        id: metadata.orderId,
      },
    });

    if (!order) {
      return NextResponse.redirect(
        new URL(
          "/checkout/error?reason=order_not_found",
          request.url
        )
      );
    }

    /*
     * -------------------------------------------------------------
     * VERIFY PAYSTACK REFERENCE
     * -------------------------------------------------------------
     *
     * The payment reference returned by Paystack must belong
     * to this order.
     *
     * During checkout the real Paystack reference is saved after
     * initialization.
     */

    if (
      order.paystackRef !== reference &&
      !order.paystackRef.startsWith("PENDING-")
    ) {
      console.error(
        "Paystack reference mismatch:",
        {
          orderId: order.id,
          expected: order.paystackRef,
          received: reference,
        }
      );

      return NextResponse.redirect(
        new URL(
          "/checkout/error?reason=reference_mismatch",
          request.url
        )
      );
    }

    /*
     * -------------------------------------------------------------
     * VERIFY PAYMENT AMOUNT
     * -------------------------------------------------------------
     *
     * Order.amount is the complete amount the customer was
     * supposed to pay:
     *
     * ticket amount + the stored service fee
     *
     * Paystack returns the successful transaction amount in kobo.
     */

    const expectedAmountKobo =
      toMinorUnits(Number(order.amount));

    if (
      !matchesTicketPayment(order, { ...verification, reference })
    ) {
      console.error(
        "Paystack amount mismatch:",
        {
          orderId: order.id,
          reference,
          expectedAmountKobo,
          receivedAmountKobo:
            verification.amount,
        }
      );

      return NextResponse.redirect(
        new URL(
          "/checkout/error?reason=amount_mismatch",
          request.url
        )
      );
    }

    /*
     * -------------------------------------------------------------
     * ALREADY COMPLETED ORDER
     * -------------------------------------------------------------
     *
     * This protects against the callback being opened more than
     * once after a successful payment.
     */

    if (order.status === "paid") {
      const fee = paystackFeeAmount(verification.fees, verification.amount);
      if (order.paystackFee === null && fee !== null) {
        await prisma.order.updateMany({ where: { id: order.id, paystackFee: null }, data: { paystackFee: fee } });
      }
      return NextResponse.redirect(
        new URL(
          `/tickets/${order.reference}`,
          request.url
        )
      );
    }

    /*
     * -------------------------------------------------------------
     * COMPLETE ORDER
     * -------------------------------------------------------------
     *
     * completeTicketOrder() is responsible for:
     *
     * - marking the order as paid
     * - creating attendee records
     * - creating ticket IDs
     * - creating transaction records
     * - increasing quantitySold
     * - releasing quantityReserved
     */

    const completedOrder =
      await completeTicketOrder(
        metadata.orderId,
        reference,
        paystackFeeAmount(verification.fees, verification.amount)
      );

    /*
     * -------------------------------------------------------------
     * SEND CUSTOMER TO THEIR TICKET
     * -------------------------------------------------------------
     */

    return NextResponse.redirect(
      new URL(
        `/tickets/${completedOrder.reference}`,
        request.url
      )
    );
  } catch (error) {
    console.error(
      "Ticket payment verification failed:",
      error
    );

    return NextResponse.redirect(
      new URL(
        "/checkout/error?reason=verification_error",
        request.url
      )
    );
  }
}