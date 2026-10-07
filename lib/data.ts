import { recordAudit } from "./audit";
import type { Currency } from "./currency";
import { eventInstant } from "@/lib/email/schedule";
import { prisma } from "@/lib/db";
import { enqueueEmail, rescheduleEventEmails } from "@/lib/email/queue";
import {
  EventItem,
  EventCategory,
  Attendee,
  Transaction,
  AdminEventSummary,
  CustomQuestion,
} from "@/lib/types";
import { Prisma } from "@prisma/client";
import { LISTING_FEE_NAIRA } from "@/lib/constants";

const eventInclude = {
  organiser: true,
  ticketTypes: true,
  customQuestions: true,
} satisfies Prisma.EventInclude;

type EventWithRelations = Prisma.EventGetPayload<{
  include: typeof eventInclude;
}>;

const COVER_GRADIENTS = [
  "from-plum-700 via-plum-600 to-leaf-600",
  "from-plum-800 via-plum-700 to-plum-500",
  "from-leaf-700 via-leaf-600 to-plum-600",
  "from-plum-600 via-leaf-600 to-leaf-500",
  "from-plum-500 via-plum-700 to-plum-900",
  "from-leaf-600 via-plum-600 to-plum-800",
];

function getEventEndDate(event: { date: Date; endTime: string; timezone?: string }): Date {
  return eventInstant(event.date, event.endTime, event.timezone);
}

function isEventCurrentlyPublic(event: {
  status: string;
  date: Date;
  endTime: string;
  timezone?: string;
}): boolean {
  if (event.status !== "live") {
    return false;
  }

  return getEventEndDate(event) > new Date();
}

function randomCoverGradient(): string {
  return COVER_GRADIENTS[
    Math.floor(Math.random() * COVER_GRADIENTS.length)
  ];
}

function formatCustomAnswers(
  customAnswers: Prisma.JsonValue | null,
  questions: { id: string; label: string }[]
): string {
  if (!customAnswers || typeof customAnswers !== "object") {
    return "";
  }

  const answers = customAnswers as Record<string, string>;

  return questions
    .map((q) =>
      answers[q.id] ? `${q.label}: ${answers[q.id]}` : null
    )
    .filter(Boolean)
    .join("; ");
}

function mapEvent(event: EventWithRelations): EventItem {
  return {
    id: event.id,
    slug: event.slug,
    title: event.title,
    currency: event.currency,
    description: event.description,
    state: event.state,
    venue: event.venue,
    date: event.date.toISOString().slice(0, 10),
    startTime: event.startTime,
    endTime: event.endTime,
    timezone: event.timezone,
    status: event.status,
    category: event.category as EventCategory,
    organiserName: event.organiser.name,
    organiserId: event.organiserId,
    featured: event.featured,
    trending: event.trending,
    coverGradient: event.coverGradient,
    coverImageUrl: event.coverImageUrl ?? undefined,
    tags: event.tags,
    refundPolicy: event.refundPolicy ?? undefined,
    minAge: event.minAge ?? undefined,

    ticketTypes: event.ticketTypes.map((t) => ({
      id: t.id,
      name: t.name,
      price: Number(t.price),
      quantityTotal: t.quantityTotal,
      quantitySold: t.quantitySold,
      quantityReserved: t.quantityReserved,
    })),

    customQuestions: event.customQuestions.map(
      (q): CustomQuestion => ({
        id: q.id,
        label: q.label,
        type: q.type === "select" ? "select" : "text",
        options: q.options,
        required: q.required,
      })
    ),
  };
}

function mapAttendee(
  a: Prisma.AttendeeGetPayload<{
    include: { ticketType: true };
  }>,
  customQuestions: { id: string; label: string }[] = [],
  currency: Currency = "NGN"
): Attendee {
  return {
    id: a.id,
    currency,
    name: a.name,
    email: a.email,
    phone: a.phone,
    ticketType: a.ticketType.name,
    ticketId: a.ticketId,
    amountPaid: Number(a.amountPaid),
    purchaseDate: a.purchaseDate.toISOString().slice(0, 10),
    paymentStatus: a.paymentStatus,
    checkInStatus: a.checkInStatus,
    checkInTime: a.checkInTime?.toISOString(),
    ticketStatus: a.ticketStatus,
    answers: formatCustomAnswers(
      a.customAnswers,
      customQuestions
    ),
  };
}

/* ===============================================================
   PUBLIC EVENTS
=============================================================== */

export async function getEvents(): Promise<EventItem[]> {
  const events = await prisma.event.findMany({
    where: {
      status: "live",
    },
    include: eventInclude,
    orderBy: {
      date: "asc",
    },
  });

  return events
    .filter(isEventCurrentlyPublic)
    .map(mapEvent);
}
export async function getMostBookedEvents(
  limit = 3
): Promise<EventItem[]> {
  const events = await prisma.event.findMany({
    where: {
      status: "live",
    },
    include: eventInclude,
  });

  const ranked = events
    .map((event) => ({
      event,
      sold: event.ticketTypes.reduce(
        (sum, ticket) => sum + ticket.quantitySold,
        0
      ),
    }))
    .sort((a, b) => b.sold - a.sold);

  return ranked
  .filter((item) => isEventCurrentlyPublic(item.event))
  .slice(0, limit)
  .map((item) => mapEvent(item.event));
}

export async function getEventBySlug(
  slug: string
): Promise<EventItem | null> {
  const event = await prisma.event.findUnique({
    where: {
      slug,
    },
    include: eventInclude,
  });

  if (!event || !isEventCurrentlyPublic(event)) {
    return null;
  }

  return mapEvent(event);
}
export async function getEventById(
  id: string
): Promise<EventItem | null> {
  const event = await prisma.event.findUnique({
    where: {
      id,
    },
    include: eventInclude,
  });

  return event ? mapEvent(event) : null;
}

export async function getAllEventSlugs(): Promise<string[]> {
  const events = await prisma.event.findMany({
    where: {
      status: "live",
    },
    include: {
      ticketTypes: false,
    },
  });

  return events
    .filter(isEventCurrentlyPublic)
    .map((event) => event.slug);
}

/* ===============================================================
   ATTENDEES
=============================================================== */

export async function getAttendeesForEventSlug(
  slug: string
): Promise<Attendee[]> {
  const event = await prisma.event.findUnique({
    where: {
      slug,
    },
    include: {
      customQuestions: true,
    },
  });

  if (!event) {
    return [];
  }

  const attendees = await prisma.attendee.findMany({
    where: {
      eventId: event.id,
    },
    include: {
      ticketType: true,
    },
    orderBy: {
      purchaseDate: "desc",
    },
  });

  return attendees.map((attendee) =>
    mapAttendee(attendee, event.customQuestions, event.currency)
  );
}

export async function getAttendeesForEventId(
  eventId: string
): Promise<Attendee[]> {
  const event = await prisma.event.findUnique({
    where: {
      id: eventId,
    },
    include: {
      customQuestions: true,
    },
  });

  if (!event) {
    return [];
  }

  const attendees = await prisma.attendee.findMany({
    where: {
      eventId,
    },
    include: {
      ticketType: true,
    },
    orderBy: {
      purchaseDate: "desc",
    },
  });

  return attendees.map((attendee) =>
    mapAttendee(attendee, event.customQuestions, event.currency)
  );
}

/* ===============================================================
   TRANSACTIONS
=============================================================== */

export async function getTransactions(): Promise<Transaction[]> {
  const transactions = await prisma.transaction.findMany({
    include: {
      attendee: {
        include: {
          event: {
            include: {
              organiser: true,
            },
          },
        },
      },
    },
    orderBy: {
      date: "desc",
    },
  });

  return transactions.map((transaction) => ({
    id: transaction.id,
    eventTitle: transaction.attendee.event.title,
    currency: transaction.attendee.event.currency,
    organiserName: transaction.attendee.event.organiser.name,
    amount: Number(transaction.amount),
    platformFee: Number(transaction.platformFee),
    date: transaction.date.toISOString().slice(0, 10),
    status: transaction.status,
  }));
}

/* ===============================================================
   ADMIN EVENTS
=============================================================== */

export async function getAdminEvents(): Promise<
  AdminEventSummary[]
> {
  const events = await prisma.event.findMany({
    include: {
      organiser: true,
      attendees: true,
    },
  });

  return events.map((event) => {
    const paidAttendees = event.attendees.filter(
      (attendee) => attendee.paymentStatus === "paid"
      
    );

    return {
  id: event.id,
  title: event.title,
    currency: event.currency,
  organiserName: event.organiser.name,
  status: event.status,
  date: event.date.toISOString().slice(0, 10),
  startTime: event.startTime,
  endTime: event.endTime,
  ticketsSold: event.attendees.length,
  gross: paidAttendees.reduce(
    (sum, attendee) => sum + Number(attendee.amountPaid),
    0
  ),
};
  });
}

/* ===============================================================
   ORGANISER EVENTS
=============================================================== */

export async function getEventsByOrganiserId(
  organiserId: string
): Promise<AdminEventSummary[]> {
  const events = await prisma.event.findMany({
    where: {
      organiserId,
    },
    include: {
      organiser: true,
      attendees: true,
    },
    orderBy: {
      date: "asc",
    },
  });

  return events.map((event) => {
  const paidAttendees = event.attendees.filter(
    (attendee) => attendee.paymentStatus === "paid"
  );

  return {
    id: event.id,
    title: event.title,
    currency: event.currency,
    organiserName: event.organiser.name,
    status: event.status,

    // Needed by the organizer dashboard to calculate ENDED
    date: event.date.toISOString().slice(0, 10),
    startTime: event.startTime,
    endTime: event.endTime,
    timezone: event.timezone,

    ticketsSold: event.attendees.length,
    gross: paidAttendees.reduce(
      (sum, attendee) => sum + Number(attendee.amountPaid),
      0
    ),
  };
});
}

/* ===============================================================
   ORGANISER SUMMARY
=============================================================== */

export interface OrganiserSummary {
  id: string;
  name: string;
  email: string;
  eventCount: number;
}

export async function getOrganisersSummary(): Promise<
  OrganiserSummary[]
> {
  const organisers = await prisma.user.findMany({
    where: {
      role: "ORGANISER",
    },
    include: {
      _count: {
        select: {
          events: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return organisers.map((organiser) => ({
    id: organiser.id,
    name: organiser.name,
    email: organiser.email,
    eventCount: organiser._count.events,
  }));
}

/* ===============================================================
   EVENT STATUS
=============================================================== */

export async function setEventStatus(
  eventId: string,
  status: "live" | "pending" | "disabled" | "archived"
): Promise<void> {
  await prisma.event.update({
    where: { id: eventId },
    data: { status },
  });
}

/* ===============================================================
   CREATE EVENT
=============================================================== */

interface CreateEventInput {
  currency?: Currency;
  title: string;
  slug: string;
  description: string;
  state: string;
  venue: string;
  date: string;
  startTime: string;
  endTime: string;
  timezone?: string;
  category: string;
  organiserId: string;
  status?: "live" | "pending" | "disabled";
  coverGradient?: string;
  coverImageUrl?: string;
  tags?: string[];
  refundPolicy?: string;
  minAge?: number;
  ticketTypes: {
    name: string;
    price: number;
    quantityTotal: number;
  }[];
  customQuestions: {
    label: string;
    required?: boolean;
  }[];
}

export async function createEvent(
  input: CreateEventInput
): Promise<EventItem> {
  const event = await prisma.$transaction(async (tx) => {
    const created = await tx.event.create({
      data: {
        currency: input.currency ?? "NGN",
        title: input.title,
        slug: input.slug,
        description: input.description,
        state: input.state,
        venue: input.venue,
        date: new Date(input.date),
        startTime: input.startTime,
        endTime: input.endTime,
        timezone: input.timezone ?? "Africa/Lagos",
        category: input.category,
        organiserId: input.organiserId,
        status: input.status ?? "live",
        coverGradient:
          input.coverGradient ?? randomCoverGradient(),
        coverImageUrl: input.coverImageUrl,
        tags: input.tags ?? [],
        refundPolicy: input.refundPolicy,
        minAge: input.minAge,

        ticketTypes: {
          create: input.ticketTypes.map((ticket) => ({
            name: ticket.name,
            price: ticket.price,
            quantityTotal: ticket.quantityTotal,
          })),
        },

        customQuestions: {
          create: input.customQuestions.map((question) => ({
            label: question.label,
            required: question.required ?? false,
          })),
        },
      },

      include: eventInclude,
    });
    await enqueueEmail(tx, { dedupeKey: `event-created/${created.id}`, kind: "event_created", recipient: created.organiser.email, eventId: created.id });
    await recordAudit({ action: "event.created", actorId: created.organiserId, actorName: created.organiser.name, entityType: "event", entityId: created.id, summary: `Created event: ${created.title}`, metadata: { status: created.status, currency: created.currency } }, tx);
    return created;
  });

  return mapEvent(event);
}

/* ===============================================================
   LISTING FEE
=============================================================== */

/**
 * Called once Paystack confirms a free event's listing fee
 * was actually paid.
 *
 * This can safely be called more than once for the same event.
 */
export async function markListingFeePaid(
  eventId: string,
  paystackRef: string,
  paystackFee: number | null = null
): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const previous = await tx.listingFeePayment.findUnique({ where: { eventId } });
    if (previous?.status === "paid") {
      if (previous.paystackRef === paystackRef && previous.paystackFee === null && paystackFee !== null) {
        await tx.listingFeePayment.update({ where: { eventId }, data: { paystackFee } });
      }
      return;
    }
    await tx.listingFeePayment.upsert({
      where: {
        eventId,
      },

      update: {
        status: "paid",
        paystackFee: paystackFee ?? undefined,
        paidAt: new Date(),
        paystackRef,
      },

      create: {
        eventId,
        amount: LISTING_FEE_NAIRA,
        paystackRef,
        status: "paid",
        paystackFee: paystackFee ?? undefined,
        paidAt: new Date(),
      },
    });

    const event = await tx.event.update({
      where: {
        id: eventId,
      },
      data: {
        status: "live",
      },
      include: { organiser: true },
    });
    await recordAudit({ action: "payment.listing_confirmed", actorName: "Paystack", entityType: "event", entityId: eventId, summary: `Listing payment confirmed for ${event.title}`, metadata: { amount: LISTING_FEE_NAIRA, currency: "NGN" }, dedupeKey: `listing-paid/${eventId}` }, tx);
    await enqueueEmail(tx, { dedupeKey: `listing-fee/${eventId}`, kind: "listing_fee_paid", recipient: event.organiser.email, eventId });
  });
}

/* ===============================================================
   ORGANISER CONTACTS
=============================================================== */

export interface ContactRow {
  currency?: Currency;
  id: string;
  eventTitle: string;
  name: string;
  email: string;
  phone: string;
  ticketType: string;
  amountPaid: number;
  purchaseDate: string;
  paymentStatus: string;
  answers: string;
}

export async function getContactsForOrganiser(
  organiserId: string
): Promise<ContactRow[]> {
  const attendees = await prisma.attendee.findMany({
    where: {
      event: {
        organiserId,
      },
    },

    include: {
      ticketType: true,
      event: {
        include: {
          customQuestions: true,
        },
      },
    },

    orderBy: {
      purchaseDate: "desc",
    },
  });

  return attendees.map((attendee) => ({
    id: attendee.id,
    eventTitle: attendee.event.title,
    currency: attendee.event.currency,
    name: attendee.name,
    email: attendee.email,
    phone: attendee.phone,
    ticketType: attendee.ticketType.name,
    amountPaid: Number(attendee.amountPaid),
    purchaseDate: attendee.purchaseDate
      .toISOString()
      .slice(0, 10),
    paymentStatus: attendee.paymentStatus,
    answers: formatCustomAnswers(
      attendee.customAnswers,
      attendee.event.customQuestions
    ),
  }));
}

export interface AdminContactRow extends ContactRow {
  organiserName: string;
}

export async function getAllContactsAdmin(): Promise<
  AdminContactRow[]
> {
  const attendees = await prisma.attendee.findMany({
    include: {
      ticketType: true,
      event: {
        include: {
          customQuestions: true,
          organiser: true,
        },
      },
    },

    orderBy: {
      purchaseDate: "desc",
    },
  });

  return attendees.map((attendee) => ({
    id: attendee.id,
    eventTitle: attendee.event.title,
    currency: attendee.event.currency,
    organiserName: attendee.event.organiser.name,
    name: attendee.name,
    email: attendee.email,
    phone: attendee.phone,
    ticketType: attendee.ticketType.name,
    amountPaid: Number(attendee.amountPaid),
    purchaseDate: attendee.purchaseDate
      .toISOString()
      .slice(0, 10),
    paymentStatus: attendee.paymentStatus,
    answers: formatCustomAnswers(
      attendee.customAnswers,
      attendee.event.customQuestions
    ),
  }));
}

/* ===============================================================
   UPDATE EVENT
=============================================================== */

export interface UpdateEventInput {
  title: string;
  description: string;
  state: string;
  venue: string;
  date: string;
  startTime: string;
  endTime?: string;
  timezone?: string;
  category: string;
  coverImageUrl?: string;
  tags?: string[];
  refundPolicy?: string;
  minAge?: number;

  ticketTypes: {
    id?: string;
    name: string;
    price: number;
    quantityTotal: number;
  }[];

  customQuestions: {
    id?: string;
    label: string;
    required?: boolean;
  }[];
}

export async function updateEvent(
  eventId: string,
  organiserId: string,
  input: UpdateEventInput
): Promise<EventItem> {
  /*
   * Always verify ownership first.
   *
   * This prevents an organiser from editing another organiser's
   * event simply by changing the event ID sent by the browser.
   */
  const existing = await prisma.event.findFirst({
    where: {
      id: eventId,
      organiserId,
    },

    include: {
      ticketTypes: true,
      customQuestions: true,
    },
  });

  if (!existing) {
    throw new Error("Event not found");
  }

  /*
   * -------------------------------------------------------------
   * VALIDATE TICKET TYPES
   * -------------------------------------------------------------
   *
   * Ticket types with existing sales cannot be removed because
   * attendees reference their ticketType IDs.
   */

  const existingTicketIds = new Set(
    existing.ticketTypes.map((ticket) => ticket.id)
  );

  const incomingTicketIds = new Set(
    input.ticketTypes
      .map((ticket) => ticket.id)
      .filter((id): id is string => Boolean(id))
  );

  const soldTicketsBeingRemoved = existing.ticketTypes.some(
    (ticket) =>
      ticket.quantitySold > 0 &&
      !incomingTicketIds.has(ticket.id)
  );

  if (soldTicketsBeingRemoved) {
    throw new Error(
      "A ticket type with tickets already sold cannot be removed."
    );
  }

  /*
   * Quantity cannot be reduced below the amount already sold.
   */

  for (const ticket of input.ticketTypes) {
    if (!ticket.id) {
      continue;
    }

    const existingTicket = existing.ticketTypes.find(
      (item) => item.id === ticket.id
    );

    if (
      existingTicket &&
      ticket.quantityTotal < existingTicket.quantitySold
    ) {
      throw new Error(
        `${existingTicket.name} cannot have its quantity reduced below ${existingTicket.quantitySold} tickets sold.`
      );
    }
  }

  /*
   * -------------------------------------------------------------
   * VALIDATE CUSTOM QUESTIONS
   * -------------------------------------------------------------
   */

  const existingQuestionIds = new Set(
    existing.customQuestions.map(
      (question) => question.id
    )
  );

  const incomingQuestionIds = new Set(
    input.customQuestions
      .map((question) => question.id)
      .filter((id): id is string => Boolean(id))
  );

  /*
   * -------------------------------------------------------------
   * UPDATE EVERYTHING IN ONE TRANSACTION
   * -------------------------------------------------------------
   */

  const result = await prisma.$transaction(async (tx) => {
    /*
     * Update the main event.
     *
     * We deliberately do not change the slug here.
     * This keeps existing public URLs stable if the organiser
     * changes the event title.
     */

    const event = await tx.event.update({
      where: {
        id: eventId,
      },

      data: {
        title: input.title,
        description: input.description,
        state: input.state,
        venue: input.venue,
        date: new Date(input.date),
        startTime: input.startTime,
        endTime: input.endTime ?? existing.endTime,
        timezone: input.timezone ?? existing.timezone,
        category: input.category,
        coverImageUrl: input.coverImageUrl || null,
        tags: input.tags ?? [],
        refundPolicy: input.refundPolicy || null,
        minAge: input.minAge ?? null,
      },
    });

    /*
     * -----------------------------------------------------------
     * UPDATE / CREATE TICKET TYPES
     * -----------------------------------------------------------
     */

    for (const ticket of input.ticketTypes) {
      if (
        ticket.id &&
        existingTicketIds.has(ticket.id)
      ) {
        await tx.ticketType.update({
          where: {
            id: ticket.id,
          },

          data: {
            name: ticket.name,
            price: ticket.price,
            quantityTotal: ticket.quantityTotal,
          },
        });
      } else {
        await tx.ticketType.create({
          data: {
            name: ticket.name,
            price: ticket.price,
            quantityTotal: ticket.quantityTotal,
            eventId,
          },
        });
      }
    }

    /*
     * -----------------------------------------------------------
     * DELETE UNUSED TICKET TYPES
     * -----------------------------------------------------------
     *
     * Only ticket types with zero sales can be removed.
     */

    for (const existingTicket of existing.ticketTypes) {
      if (
        !incomingTicketIds.has(existingTicket.id) &&
        existingTicket.quantitySold === 0
      ) {
        await tx.ticketType.delete({
          where: {
            id: existingTicket.id,
          },
        });
      }
    }

    /*
     * -----------------------------------------------------------
     * UPDATE / CREATE CUSTOM QUESTIONS
     * -----------------------------------------------------------
     */

    for (const question of input.customQuestions) {
      if (
        question.id &&
        existingQuestionIds.has(question.id)
      ) {
        await tx.customQuestion.update({
          where: {
            id: question.id,
          },

          data: {
            label: question.label,
            required: question.required ?? false,
          },
        });
      } else {
        await tx.customQuestion.create({
          data: {
            label: question.label,
            required: question.required ?? false,
            eventId,
          },
        });
      }
    }

    /*
     * -----------------------------------------------------------
     * DELETE UNUSED QUESTIONS
     * -----------------------------------------------------------
     *
     * Existing attendee answers reference question IDs.
     *
     * If attendees already exist, we preserve old questions so
     * their historical answers remain meaningful.
     */

    const attendeeCount = await tx.attendee.count({
      where: {
        eventId,
      },
    });

    if (attendeeCount === 0) {
      for (const existingQuestion of existing.customQuestions) {
        if (
          !incomingQuestionIds.has(existingQuestion.id)
        ) {
          await tx.customQuestion.delete({
            where: {
              id: existingQuestion.id,
            },
          });
        }
      }
    }

    if (input.date !== existing.date.toISOString().slice(0, 10) || input.startTime !== existing.startTime || (input.endTime ?? existing.endTime) !== existing.endTime || (input.timezone ?? existing.timezone) !== existing.timezone) {
      await rescheduleEventEmails(tx, eventId);
    }

    await recordAudit({ action: "event.updated", actorId: organiserId, entityType: "event", entityId: event.id, summary: `Updated event: ${event.title}`, metadata: { fields: "Event details, ticket types and registration questions" } }, tx);
    return event;
  }, { timeout: 15000 });

  /*
   * -------------------------------------------------------------
   * RELOAD COMPLETE EVENT
   * -------------------------------------------------------------
   *
   * The transaction above only returns the Event itself.
   * Reload it with all relations so mapEvent() receives the same
   * structure as every other event query.
   */

  const fullEvent = await prisma.event.findUnique({
    where: {
      id: result.id,
    },

    include: eventInclude,
  });

  if (!fullEvent) {
    throw new Error("Updated event could not be loaded.");
  }

  return mapEvent(fullEvent);
}

/* ===============================================================
   DELETE EVENT
=============================================================== */

export async function deleteEvent(
  eventId: string,
  organiserId: string
): Promise<void> {
  /*
   * Verify that the event belongs to this organiser.
   */

  const event = await prisma.event.findFirst({
    where: {
      id: eventId,
      organiserId,
    },

    select: {
      id: true,
      title: true,
    },
  });

  if (!event) {
    throw new Error("Event not found");
  }

  /*
   * Do not allow deletion here if attendees exist.
   *
   * The API route also performs this check, but keeping the
   * protection in the data layer means the rule cannot be
   * bypassed by another server-side caller.
   */

  const attendeeCount = await prisma.attendee.count({
    where: {
      eventId,
    },
  });

  if (attendeeCount > 0) {
    throw new Error(
      "This event cannot be deleted because tickets have already been issued. Disable the event instead."
    );
  }

  /*
   * With no attendees, Prisma can safely cascade-delete the
   * event's ticket types, custom questions and listing fee record
   * according to the relations in the Prisma schema.
   */

  await prisma.$transaction(async tx => {
    await tx.event.delete({ where: { id: event.id } });
    await recordAudit({ action: "event.deleted", actorId: organiserId, entityType: "event", entityId: event.id, summary: `Deleted event: ${event.title}` }, tx);
  });
}
