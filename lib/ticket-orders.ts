import { recordAudit } from "./audit";
import crypto from "crypto";
import { prisma } from "@/lib/db";
import { calculateTicketCommission } from "@/lib/constants";
import { enqueueBookingEmails, dispatchBookingEmails } from "@/lib/email/queue";

type StoredCustomAnswer = {
  questionId: string;
  answer: string;
};

function generateTicketId(): string {
  return `TCK-${crypto
    .randomBytes(4)
    .toString("hex")
    .toUpperCase()}`;
}

async function createUniqueTicketId(
  tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0]
): Promise<string> {
  for (let attempt = 0; attempt < 10; attempt++) {
    const ticketId = generateTicketId();

    const existing = await tx.attendee.findUnique({
      where: {
        ticketId,
      },
      select: {
        id: true,
      },
    });

    if (!existing) {
      return ticketId;
    }
  }

  throw new Error("TICKET_ID_GENERATION_FAILED");
}

/* ===============================================================
   PAID TICKET ORDERS
=============================================================== */

export async function completeTicketOrder(
  orderId: string,
  paystackReference: string,
  paystackFee: number | null = null
) {
  /*
   * Everything inside this transaction is atomic.
   *
   * If anything fails:
   *
   * - the order isn't partially completed
   * - inventory isn't partially updated
   * - attendees aren't partially created
   */
  const result = await prisma.$transaction(
    async (tx) => {
      const order = await tx.order.findUnique({
        where: {
          id: orderId,
        },
        include: {
          event: true,
          items: {
            include: {
              ticketType: true,
            },
          },
          attendees: true,
        },
      });

      if (!order) {
        throw new Error("ORDER_NOT_FOUND");
      }

      /*
       * -----------------------------------------------------------
       * IDEMPOTENCY
       * -----------------------------------------------------------
       *
       * Paystack can retry callbacks and customers can revisit
       * callback URLs.
       *
       * If this order has already been completed, simply return it.
       */
      if (order.status === "paid") {
        if (order.paystackFee === null && paystackFee !== null) {
          await tx.order.update({ where: { id: order.id }, data: { paystackFee } });
        }
        await enqueueBookingEmails(tx, order.id);
        return order;
      }

      /*
       * We only complete pending orders.
       */
      if (order.status !== "pending") {
        throw new Error("ORDER_NOT_PENDING");
      }

      /*
       * Make sure this payment reference belongs to this order.
       *
       * A temporary PENDING reference is allowed because the real
       * Paystack reference is written immediately after successful
       * Paystack initialization.
       */
      if (
        order.paystackRef !== paystackReference &&
        !order.paystackRef.startsWith("PENDING-")
      ) {
        throw new Error("PAYMENT_REFERENCE_MISMATCH");
      }

      /*
       * -----------------------------------------------------------
       * CHECK ORDER EXPIRY
       * -----------------------------------------------------------
       */

      if (
        order.expiresAt &&
        order.expiresAt.getTime() < Date.now()
      ) {
        /*
         * Release any reservation still held by this order.
         */
        for (const item of order.items) {
          await tx.ticketType.updateMany({
            where: {
              id: item.ticketTypeId,
              quantityReserved: {
                gte: item.quantity,
              },
            },
            data: {
              quantityReserved: {
                decrement: item.quantity,
              },
            },
          });
        }

        await tx.order.update({
          where: {
            id: order.id,
          },
          data: {
            status: "failed",
          },
        });

        throw new Error("ORDER_EXPIRED");
      }

      /*
       * -----------------------------------------------------------
       * VERIFY INVENTORY RESERVATION
       * -----------------------------------------------------------
       */

      for (const item of order.items) {
        const ticketType = await tx.ticketType.findUnique({
          where: {
            id: item.ticketTypeId,
          },
        });

        if (!ticketType) {
          throw new Error("TICKET_TYPE_NOT_FOUND");
        }

        if (ticketType.quantityReserved < item.quantity) {
          throw new Error("RESERVATION_NOT_FOUND");
        }
      }

      /*
       * -----------------------------------------------------------
       * MARK ORDER AS PAID
       * -----------------------------------------------------------
       */

      await tx.order.update({
        where: {
          id: order.id,
        },
        data: {
          status: "paid",
          paystackFee: paystackFee ?? undefined,
          paystackRef: paystackReference,
          paidAt: new Date(),
        },
      });

      /*
       * -----------------------------------------------------------
       * MOVE RESERVED INVENTORY TO SOLD
       * -----------------------------------------------------------
       */

      for (const item of order.items) {
        const updated = await tx.ticketType.updateMany({
          where: {
            id: item.ticketTypeId,
            quantityReserved: {
              gte: item.quantity,
            },
          },
          data: {
            quantityReserved: {
              decrement: item.quantity,
            },
            quantitySold: {
              increment: item.quantity,
            },
          },
        });

        if (updated.count !== 1) {
          throw new Error("INVENTORY_FINALIZATION_FAILED");
        }
      }

      /*
       * -----------------------------------------------------------
       * CREATE INDIVIDUAL ATTENDEES / TICKETS
       * -----------------------------------------------------------
       */

      const customAnswers =
        (order.customAnswers as StoredCustomAnswer[] | null) ?? [];

      for (const item of order.items) {
        /*
         * Calculate the commission for this individual ticket.
         *
         * The service fee is an ORDER-level fee and is
         * intentionally NOT added to each transaction.
         */
        const ticketCommission = calculateTicketCommission(Number(item.unitPrice), order.currency);

        for (
          let index = 0;
          index < item.quantity;
          index++
        ) {
          const ticketId = await createUniqueTicketId(tx);

          const attendee = await tx.attendee.create({
            data: {
              name: order.name,
              email: order.email,
              phone: order.phone,

              ticketId,

              /*
               * Amount paid attributable to this ticket.
               *
               * Service fee is stored at Order level rather than
               * being duplicated across individual attendees.
               */
              amountPaid: item.unitPrice,

              purchaseDate: new Date(),

              paymentStatus: "paid",

              checkInStatus: false,

              ticketStatus: "active",

              customAnswers:
                customAnswers.length > 0
                  ? customAnswers
                  : undefined,

              eventId: order.eventId,

              ticketTypeId: item.ticketTypeId,

              orderId: order.id,
            },
          });

          /*
           * One transaction record represents one issued ticket.
           *
           * platformFee represents Tickety's 10% commission on
           * this ticket.
           *
           * The service fee remains recorded on the Order
           * because it is charged once per order.
           */
          await tx.transaction.create({
            data: {
              amount: item.unitPrice,

              platformFee: ticketCommission,

              status: "paid",

              attendeeId: attendee.id,
            },
          });
        }
      }

      /*
       * -----------------------------------------------------------
       * RETURN COMPLETED ORDER
       * -----------------------------------------------------------
       */

      await recordAudit({ action: "booking.confirmed", actorName: Number(order.amount) > 0 ? "Paystack" : "Guest checkout", entityType: "order", entityId: order.id, summary: `Confirmed booking ${order.reference}`, metadata: { amount: Number(order.amount), currency: order.currency, ticketCount: order.items.reduce((sum, item) => sum + item.quantity, 0) }, dedupeKey: `booking-confirmed/${order.id}` }, tx);
      await enqueueBookingEmails(tx, order.id);
      return tx.order.findUniqueOrThrow({
        where: {
          id: order.id,
        },
        include: {
          event: true,
          attendees: {
            include: {
              ticketType: true,
            },
          },
          items: {
            include: {
              ticketType: true,
            },
          },
        },
      });
    },
    {
      isolationLevel: "Serializable",
      // Allow remote database latency during atomic ticket and outbox writes.
      timeout: 30000,
    }
  );

  if (result) await dispatchBookingEmails(result.id);
  return result;
}

/* ===============================================================
   FREE TICKET ORDERS
=============================================================== */

export async function completeFreeTicketOrder(
  orderId: string
) {
  const result = await prisma.$transaction(
    async (tx) => {
      const order = await tx.order.findUnique({
        where: {
          id: orderId,
        },
        include: {
          event: true,
          items: {
            include: {
              ticketType: true,
            },
          },
          attendees: true,
        },
      });

      if (!order) {
        throw new Error("ORDER_NOT_FOUND");
      }

      /*
       * Idempotency:
       * if tickets have already been issued, return them.
       */
      if (
        order.status === "paid" &&
        order.attendees.length > 0
      ) {
        await enqueueBookingEmails(tx, order.id);
        return order;
      }

      if (order.status !== "paid") {
        throw new Error("FREE_ORDER_NOT_PAID");
      }

      const customAnswers =
        (order.customAnswers as StoredCustomAnswer[] | null) ?? [];

      /*
       * Check and finalize each ticket type inside the same
       * serializable transaction.
       */

      for (const item of order.items) {
        const ticketType = await tx.ticketType.findUnique({
          where: {
            id: item.ticketTypeId,
          },
        });

        if (!ticketType) {
          throw new Error("TICKET_TYPE_NOT_FOUND");
        }

        const available =
          ticketType.quantityTotal -
          ticketType.quantitySold -
          ticketType.quantityReserved;

        if (available < item.quantity) {
          throw new Error("TICKETS_SOLD_OUT");
        }

        /*
         * Re-check the inventory while updating it.
         *
         * This prevents the ticket count from exceeding the
         * available quantity.
         */
        const updated = await tx.ticketType.updateMany({
          where: {
            id: item.ticketTypeId,
            quantitySold: ticketType.quantitySold,
            quantityReserved: ticketType.quantityReserved,
          },
          data: {
            quantitySold: {
              increment: item.quantity,
            },
          },
        });

        if (updated.count !== 1) {
          throw new Error("INVENTORY_FINALIZATION_FAILED");
        }
      }

      /*
       * Create one attendee/ticket for every quantity purchased.
       */

      for (const item of order.items) {
        for (
          let index = 0;
          index < item.quantity;
          index++
        ) {
          const ticketId = await createUniqueTicketId(tx);

          const attendee = await tx.attendee.create({
            data: {
              name: order.name,
              email: order.email,
              phone: order.phone,

              ticketId,

              amountPaid: 0,

              purchaseDate: new Date(),

              paymentStatus: "paid",

              checkInStatus: false,

              ticketStatus: "active",

              customAnswers:
                customAnswers.length > 0
                  ? customAnswers
                  : undefined,

              eventId: order.eventId,

              ticketTypeId: item.ticketTypeId,

              orderId: order.id,
            },
          });

          await tx.transaction.create({
            data: {
              amount: 0,
              platformFee: 0,
              status: "paid",
              attendeeId: attendee.id,
            },
          });
        }
      }

      await recordAudit({ action: "booking.confirmed", actorName: Number(order.amount) > 0 ? "Paystack" : "Guest checkout", entityType: "order", entityId: order.id, summary: `Confirmed booking ${order.reference}`, metadata: { amount: Number(order.amount), currency: order.currency, ticketCount: order.items.reduce((sum, item) => sum + item.quantity, 0) }, dedupeKey: `booking-confirmed/${order.id}` }, tx);
      await enqueueBookingEmails(tx, order.id);
      return tx.order.findUniqueOrThrow({
        where: {
          id: order.id,
        },
        include: {
          event: true,
          attendees: {
            include: {
              ticketType: true,
            },
          },
          items: {
            include: {
              ticketType: true,
            },
          },
        },
      });
    },
    {
      isolationLevel: "Serializable",
      // Allow remote database latency during atomic ticket and outbox writes.
      timeout: 30000,
    }
  );

  if (result) await dispatchBookingEmails(result.id);
  return result;
}
