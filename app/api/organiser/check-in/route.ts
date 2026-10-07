import { recordAudit } from "@/lib/audit";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { Prisma } from "@prisma/client";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

type CheckInBody = {
  eventId?: string;
  method?: "qr" | "ticket";
  value?: string;
};

type SessionRole =
  | "ORGANISER"
  | "CHECKIN_STAFF"
  | "ADMIN";

/* ============================================================
   TICKET ID EXTRACTION
============================================================ */

function extractTicketId(value: string): string {
  const raw = value.trim();

  if (!raw) {
    return "";
  }

  /*
   * Support QR values containing JSON:
   *
   * {
   *   "ticketId": "TCK-12345"
   * }
   *
   * Also support:
   * { "ticket": "TCK-12345" }
   * { "id": "TCK-12345" }
   */
  try {
    const parsed = JSON.parse(raw) as {
      ticketId?: unknown;
      ticket?: unknown;
      id?: unknown;
    };

    if (typeof parsed.ticketId === "string") {
      return parsed.ticketId.trim();
    }

    if (typeof parsed.ticket === "string") {
      return parsed.ticket.trim();
    }

    if (typeof parsed.id === "string") {
      return parsed.id.trim();
    }
  } catch {
    /*
     * Not JSON.
     * Continue checking other formats.
     */
  }

  /*
   * Support QR values containing a URL.
   *
   * Examples:
   * https://tickety.africa/tickets/TCK-12345
   * https://tickety.africa/ticket/TCK-12345
   * https://tickety.africa/tickets/TCK-12345?foo=bar
   */
  try {
    const url = new URL(raw);

    const queryTicket =
      url.searchParams.get("ticketId") ??
      url.searchParams.get("ticket") ??
      url.searchParams.get("ticketNumber");

    if (queryTicket) {
      return queryTicket.trim();
    }

    const segments = url.pathname
      .split("/")
      .map((segment) => {
        try {
          return decodeURIComponent(segment).trim();
        } catch {
          return segment.trim();
        }
      })
      .filter(Boolean);

    const ticketIndex = segments.findIndex(
      (segment) => {
        const normalized = segment.toLowerCase();

        return (
          normalized === "tickets" ||
          normalized === "ticket"
        );
      }
    );

    if (
      ticketIndex >= 0 &&
      segments[ticketIndex + 1]
    ) {
      return segments[ticketIndex + 1];
    }

    /*
     * If the URL does not contain /tickets/,
     * use the final path segment.
     */
    if (segments.length > 0) {
      return segments[segments.length - 1];
    }
  } catch {
    /*
     * Not a URL.
     * Treat the raw value as the ticket number.
     */
  }

  /*
   * Manual ticket number:
   *
   * TCK-12345
   */
  return raw;
}

/* ============================================================
   POST
============================================================ */

export async function POST(
  request: NextRequest
) {
  const session = await getServerSession(
    authOptions
  );

  /*
   * ----------------------------------------------------------
   * AUTHENTICATION
   * ----------------------------------------------------------
   */

  if (!session?.user?.id) {
    return NextResponse.json(
      {
        success: false,
        status: "unauthorized",
        message: "Please sign in.",
      },
      { status: 401 }
    );
  }

  try {
    /*
     * --------------------------------------------------------
     * REQUEST VALIDATION
     * --------------------------------------------------------
     */

    const body =
      (await request.json()) as CheckInBody;

    const eventId = body.eventId?.trim();

    const method = body.method;

    const value = body.value?.trim();

    if (
      !eventId ||
      !value ||
      (method !== "qr" &&
        method !== "ticket")
    ) {
      return NextResponse.json(
        {
          success: false,
          status: "invalid_request",
          message:
            "Event, check-in method and ticket value are required.",
        },
        { status: 400 }
      );
    }

    /*
     * --------------------------------------------------------
     * ROLE
     * --------------------------------------------------------
     */

    const role =
      session.user.role as SessionRole;

    const isAdmin = role === "ADMIN";

    const isOrganiser =
      role === "ORGANISER";

    const isCheckInStaff =
      role === "CHECKIN_STAFF";

    /*
     * --------------------------------------------------------
     * BASIC ROLE GATE
     * --------------------------------------------------------
     *
     * Nobody outside these roles can use the check-in API.
     */

    if (
      !isAdmin &&
      !isOrganiser &&
      !isCheckInStaff
    ) {
      return NextResponse.json(
        {
          success: false,
          status: "forbidden",
          message:
            "You don't have permission to check in tickets.",
        },
        { status: 403 }
      );
    }

    /*
     * --------------------------------------------------------
     * EVENT ACCESS
     * --------------------------------------------------------
     *
     * ADMIN:
     *   Can check in any event.
     *
     * ORGANISER:
     *   Can only check in events they own.
     *
     * CHECKIN_STAFF:
     *   Can only check in events assigned through EventStaff.
     *
     * This check is server-side and therefore cannot be
     * bypassed by manually calling the API.
     * --------------------------------------------------------
     */

    let event: {
      id: string;
      title: string;
    } | null = null;

    if (isAdmin) {
      event = await prisma.event.findUnique({
        where: {
          id: eventId,
        },
        select: {
          id: true,
          title: true,
        },
      });
    } else if (isOrganiser) {
      event = await prisma.event.findFirst({
        where: {
          id: eventId,
          organiserId: session.user.id,
        },
        select: {
          id: true,
          title: true,
        },
      });
    } else if (isCheckInStaff) {
      /*
       * Staff access is explicitly tied to the event.
       */
      const assignment =
        await prisma.eventStaff.findUnique({
          where: {
            eventId_userId: {
              eventId,
              userId: session.user.id,
            },
          },
          select: {
            event: {
              select: {
                id: true,
                title: true,
              },
            },
          },
        });

      event = assignment?.event ?? null;
    }

    if (!event) {
      return NextResponse.json(
        {
          success: false,
          status: "event_not_found",
          message:
            "This event is not available to your check-in account.",
        },
        { status: 404 }
      );
    }

    /*
     * --------------------------------------------------------
     * EXTRACT TICKET ID
     * --------------------------------------------------------
     */

    const ticketId = extractTicketId(value);

    if (!ticketId) {
      return NextResponse.json(
        {
          success: false,
          status: "ticket_not_found",
          message:
            "Enter a valid ticket number.",
        },
        { status: 404 }
      );
    }

    /*
     * --------------------------------------------------------
     * ATOMIC CHECK-IN
     * --------------------------------------------------------
     *
     * The entire operation happens inside a serializable
     * transaction.
     *
     * We first locate the ticket.
     *
     * Then we check:
     *
     * 1. Ticket exists
     * 2. Payment is confirmed
     * 3. Ticket is not cancelled
     * 4. Ticket has not already been used
     *
     * Finally, we atomically change:
     *
     * checkInStatus: false -> true
     * ticketStatus: active -> used
     *
     * If two staff members scan the same ticket at the same
     * time, only one can successfully change the ticket.
     * --------------------------------------------------------
     */

    const updated = await prisma.$transaction(
      async (tx) => {
        const attendee =
          await tx.attendee.findFirst({
            where: {
              ticketId,
              eventId: event.id,
            },
            include: {
              ticketType: true,
            },
          });

        /*
         * ------------------------------------------------------
         * TICKET DOES NOT EXIST
         * ------------------------------------------------------
         */

        if (!attendee) {
          return {
            kind: "not_found" as const,
          };
        }

        /*
         * ------------------------------------------------------
         * PAYMENT NOT CONFIRMED
         * ------------------------------------------------------
         */

        if (
          attendee.paymentStatus !== "paid"
        ) {
          return {
            kind: "unpaid" as const,
            attendee,
          };
        }

        /*
         * ------------------------------------------------------
         * CANCELLED
         * ------------------------------------------------------
         */

        if (
          attendee.ticketStatus ===
          "cancelled"
        ) {
          return {
            kind: "cancelled" as const,
            attendee,
          };
        }

        /*
         * ------------------------------------------------------
         * ALREADY USED
         * ------------------------------------------------------
         */

        if (
          attendee.checkInStatus ||
          attendee.ticketStatus === "used"
        ) {
          return {
            kind: "already_checked_in" as const,
            attendee,
          };
        }

        /*
         * ------------------------------------------------------
         * ATOMIC UPDATE
         * ------------------------------------------------------
         *
         * The WHERE clause ensures that this ticket is still
         * active and unchecked-in at the exact moment we try
         * to consume it.
         */

        const result =
          await tx.attendee.updateMany({
            where: {
              id: attendee.id,
              eventId: event.id,
              checkInStatus: false,
              ticketStatus: "active",
              paymentStatus: "paid",
            },

            data: {
              checkInStatus: true,
              checkInTime: new Date(),
              ticketStatus: "used",
            },
          });

        /*
         * Exactly one row must have been updated.
         */

        if (result.count !== 1) {
          /*
           * Another scanner may have processed this ticket
           * between our first read and the update.
           *
           * Read the current state so we can return the
           * correct "already checked in" response.
           */

          const current =
            await tx.attendee.findUnique({
              where: {
                id: attendee.id,
              },
              include: {
                ticketType: true,
              },
            });

          if (
            current?.checkInStatus ||
            current?.ticketStatus === "used"
          ) {
            return {
              kind:
                "already_checked_in" as const,
              attendee: current,
            };
          }

          return {
            kind: "conflict" as const,
          };
        }

        /*
         * ------------------------------------------------------
         * FETCH THE FINAL CHECK-IN STATE
         * ------------------------------------------------------
         */

        const checkedIn =
          await tx.attendee.findUnique({
            where: {
              id: attendee.id,
            },
            include: {
              ticketType: true,
            },
          });

        await recordAudit({ action: "ticket.checked_in", actorId: session.user.id, actorName: session.user.name || "Event staff", entityType: attendee.orderId ? "order" : "event", entityId: attendee.orderId || event.id, summary: `Checked in ticket ${attendee.ticketId}`, dedupeKey: `check-in/${attendee.id}` }, tx);

        return {
          kind: "checked_in" as const,
          attendee: checkedIn,
        };
      },
      {
        isolationLevel:
          Prisma.TransactionIsolationLevel.Serializable,

        timeout: 10000,
      }
    );

    /*
     * ----------------------------------------------------------
     * RESPONSE: TICKET NOT FOUND
     * ----------------------------------------------------------
     */

    if (updated.kind === "not_found") {
      return NextResponse.json(
        {
          success: false,
          status: "ticket_not_found",
          message:
            "Ticket not found for this event.",
        },
        { status: 404 }
      );
    }

    /*
     * ----------------------------------------------------------
     * RESPONSE: PAYMENT NOT CONFIRMED
     * ----------------------------------------------------------
     */

    if (updated.kind === "unpaid") {
      return NextResponse.json(
        {
          success: false,
          status: "payment_not_confirmed",
          message:
            "Payment for this ticket has not been confirmed.",

          attendee: updated.attendee
            ? {
                name:
                  updated.attendee.name,

                email:
                  updated.attendee.email,

                ticketType:
                  updated.attendee.ticketType.name,

                ticketId:
                  updated.attendee.ticketId,
              }
            : undefined,
        },
        { status: 409 }
      );
    }

    /*
     * ----------------------------------------------------------
     * RESPONSE: CANCELLED
     * ----------------------------------------------------------
     */

    if (
      updated.kind === "cancelled"
    ) {
      return NextResponse.json(
        {
          success: false,
          status: "ticket_cancelled",

          message:
            "This ticket has been cancelled and cannot be used for entry.",

          attendee: updated.attendee
            ? {
                name:
                  updated.attendee.name,

                email:
                  updated.attendee.email,

                ticketType:
                  updated.attendee.ticketType.name,

                ticketId:
                  updated.attendee.ticketId,
              }
            : undefined,
        },
        { status: 409 }
      );
    }

    /*
     * ----------------------------------------------------------
     * RESPONSE: ALREADY CHECKED IN
     * ----------------------------------------------------------
     */

    if (
      updated.kind ===
      "already_checked_in"
    ) {
      return NextResponse.json(
        {
          success: false,
          status: "already_checked_in",

          message:
            "This ticket has already been checked in.",

          attendee: updated.attendee
            ? {
                name:
                  updated.attendee.name,

                email:
                  updated.attendee.email,

                ticketType:
                  updated.attendee.ticketType.name,

                ticketId:
                  updated.attendee.ticketId,

                checkInTime:
                  updated.attendee.checkInTime?.toISOString() ??
                  null,
              }
            : undefined,
        },
        { status: 409 }
      );
    }

    /*
     * ----------------------------------------------------------
     * RESPONSE: CONFLICT
     * ----------------------------------------------------------
     */

    if (
      updated.kind === "conflict"
    ) {
      return NextResponse.json(
        {
          success: false,
          status: "check_in_conflict",

          message:
            "This ticket was just processed. Please scan it again if needed.",
        },
        { status: 409 }
      );
    }

    /*
     * ----------------------------------------------------------
     * RESPONSE: SUCCESS
     * ----------------------------------------------------------
     */

    return NextResponse.json({
      success: true,
      status: "checked_in",

      message:
        "Check-in successful.",

      event: {
        id: event.id,
        title: event.title,
      },

      attendee: updated.attendee
        ? {
            name:
              updated.attendee.name,

            email:
              updated.attendee.email,

            phone:
              updated.attendee.phone,

            ticketType:
              updated.attendee.ticketType.name,

            ticketId:
              updated.attendee.ticketId,

            checkInTime:
              updated.attendee.checkInTime?.toISOString() ??
              null,
          }
        : undefined,
    });
  } catch (error) {
    console.error(
      "Organiser check-in failed:",
      error
    );

    /*
     * Serializable transactions can occasionally fail because
     * another transaction changed the same record concurrently.
     *
     * We return a clean response instead of exposing Prisma
     * internals to the scanner.
     */

    if (
      error instanceof Prisma.PrismaClientKnownRequestError
    ) {
      return NextResponse.json(
        {
          success: false,
          status: "check_in_conflict",
          message:
            "This ticket was just processed. Please scan it again if needed.",
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        status: "server_error",
        message:
          "Something went wrong while checking in this ticket.",
      },
      { status: 500 }
    );
  }
}