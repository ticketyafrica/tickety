import { isCurrency, isValidPrice } from "@/lib/currency";
import { eventInstant, DEFAULT_EVENT_TIMEZONE } from "@/lib/email/schedule";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getEvents, createEvent } from "@/lib/data";
import { prisma } from "@/lib/db";
import { initializeTransaction } from "@/lib/paystack";
import {
  LISTING_FEE_KOBO,
  LISTING_FEE_NAIRA,
} from "@/lib/constants";

export async function GET() {
  try {
    const events = await getEvents();

    return NextResponse.json({ events });
  } catch (error) {
    console.error("Failed to fetch events:", error);

    return NextResponse.json(
      { error: "Failed to fetch events." },
      { status: 500 }
    );
  }
}

function slugify(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json(
      {
        error: "You need to be logged in to create an event.",
      },
      { status: 401 }
    );
  }

  let body: any;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      {
        error: "Invalid request body.",
      },
      { status: 400 }
    );
  }

  /*
   * ------------------------------------------------------------
   * REQUIRED FIELDS
   * ------------------------------------------------------------
   */

  const currency = body.currency ?? "NGN";
  if (!isCurrency(currency)) {
    return NextResponse.json({ error: "Choose NGN or USD as the event currency." }, { status: 400 });
  }
  if (!body.isFree && currency === "USD") {
    const organiser = await prisma.user.findUnique({ where: { id: session.user.id } });
    if (process.env.PAYSTACK_USD_ENABLED !== "true" || !organiser?.paystackUsdSubaccountCode) {
      return NextResponse.json({ error: "USD sales require USD payments to be enabled and a connected USD payout account." }, { status: 409 });
    }
  }

  const required = [
    "title",
    "description",
    "state",
    "venue",
    "date",
    "startTime",
    "endTime",
    "category",
  ];

  for (const field of required) {
    if (
      body?.[field] === undefined ||
      body?.[field] === null ||
      String(body[field]).trim() === ""
    ) {
      return NextResponse.json(
        {
          error: `Missing field: ${field}`,
        },
        { status: 400 }
      );
    }
  }

  /*
   * ------------------------------------------------------------
   * VALIDATE EVENT DATE + TIMES
   * ------------------------------------------------------------
   */

  const timezone = typeof body.timezone === "string" ? body.timezone : DEFAULT_EVENT_TIMEZONE;
  let eventStart: Date;
  let eventEnd: Date;
  try {
    eventStart = eventInstant(String(body.date), String(body.startTime), timezone);
    eventEnd = eventInstant(String(body.date), String(body.endTime), timezone);
  } catch {
    return NextResponse.json({ error: "Please provide a valid event date, start time, end time and timezone." }, { status: 400 });
  }

  if (eventEnd <= eventStart) {
    return NextResponse.json(
      {
        error: "Event end time must be after the start time.",
      },
      { status: 400 }
    );
  }

  /*
   * Do not allow events to be created in the past.
   */
  if (eventEnd <= new Date()) {
    return NextResponse.json(
      {
        error: "The event end time must be in the future.",
      },
      { status: 400 }
    );
  }

  /*
   * ------------------------------------------------------------
   * GENERATE UNIQUE SLUG
   * ------------------------------------------------------------
   */

  const baseSlug = slugify(body.title);

  if (!baseSlug) {
    return NextResponse.json(
      {
        error: "Please provide a valid event title.",
      },
      { status: 400 }
    );
  }

  let slug = baseSlug;
  let suffix = 1;

  while (await prisma.event.findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${suffix++}`;
  }

  /*
   * ------------------------------------------------------------
   * TAGS
   * ------------------------------------------------------------
   */

  const tags: string[] =
    typeof body.tags === "string"
      ? body.tags
          .split(",")
          .map((tag: string) => tag.trim())
          .filter(Boolean)
      : Array.isArray(body.tags)
        ? body.tags
            .map((tag: unknown) => String(tag).trim())
            .filter(Boolean)
        : [];

  /*
   * ------------------------------------------------------------
   * FREE / PAID EVENT
   * ------------------------------------------------------------
   */

  const isFree = Boolean(body.isFree);

  /*
   * ------------------------------------------------------------
   * TICKET TYPES
   * ------------------------------------------------------------
   */

  if (!isFree && Array.isArray(body.ticketTypes) &&
      body.ticketTypes.some((ticket: { price?: unknown } | null) => !isValidPrice(Number(ticket?.price)))) {
    return NextResponse.json({ error: "Ticket prices must be valid amounts with at most two decimal places." }, { status: 400 });
  }

  const ticketTypes = isFree
    ? [
        {
          name: "General Admission",
          price: 0,
          quantityTotal:
            Number(body.freeCapacity) > 0
              ? Number(body.freeCapacity)
              : 100,
        },
      ]
    : Array.isArray(body.ticketTypes)
      ? body.ticketTypes
          .map(
            (ticket: {
              name?: string;
              price?: string | number;
              quantity?: string | number;
            }) => ({
              name: String(ticket.name ?? "").trim(),
              price: Number(ticket.price),
              quantityTotal: Number(ticket.quantity) || 0,
            })
          )
          .filter(
            (ticket: {
              name: string;
              price: number;
              quantityTotal: number;
            }) =>
              ticket.name &&
              ticket.quantityTotal > 0 &&
              ticket.price >= 0
          )
      : [];

  if (ticketTypes.some((ticket: { price: number }) => !isValidPrice(ticket.price))) {
    return NextResponse.json({ error: "Ticket prices must be valid amounts with at most two decimal places." }, { status: 400 });
  }

  if (ticketTypes.length === 0) {
    return NextResponse.json(
      {
        error: "Please add at least one valid ticket type.",
      },
      { status: 400 }
    );
  }

  /*
   * ------------------------------------------------------------
   * CUSTOM QUESTIONS
   * ------------------------------------------------------------
   */

  const customQuestions = Array.isArray(body.customQuestions)
    ? body.customQuestions
        .map((question: { label?: string }) => ({
          label: String(question.label ?? "").trim(),
        }))
        .filter((question: { label: string }) => question.label)
    : [];

  /*
   * ------------------------------------------------------------
   * CREATE EVENT
   * ------------------------------------------------------------
   *
   * Paid events:
   *   → go live immediately
   *
   * Free events:
   *   → remain pending until listing fee is paid
   */

  let event;

  try {
    event = await createEvent({
      currency,
      title: String(body.title).trim(),
      slug,
      description: String(body.description).trim(),
      state: String(body.state).trim(),
      venue: String(body.venue).trim(),
      date: String(body.date),
      startTime: String(body.startTime),
      endTime: String(body.endTime),
      timezone,
      category: String(body.category).trim(),
      organiserId: session.user.id,

      status: isFree ? "pending" : "live",

      coverImageUrl:
        typeof body.coverImageUrl === "string" &&
        body.coverImageUrl.trim()
          ? body.coverImageUrl.trim()
          : undefined,

      tags,

      refundPolicy:
        typeof body.refundPolicy === "string" &&
        body.refundPolicy.trim()
          ? body.refundPolicy.trim()
          : undefined,

      minAge:
        body.minAge !== undefined &&
        body.minAge !== null &&
        body.minAge !== ""
          ? Number(body.minAge)
          : undefined,

      ticketTypes,

      customQuestions,
    });
  } catch (error) {
    console.error("Failed to create event:", error);

    return NextResponse.json(
      {
        error: "Failed to create event.",
      },
      { status: 500 }
    );
  }

  /*
   * ------------------------------------------------------------
   * PAID EVENT
   * ------------------------------------------------------------
   *
   * Paid events go live immediately.
   * The platform earns its fee from ticket transactions.
   */

  if (!isFree) {
    return NextResponse.json(
      {
        event,
      },
      { status: 201 }
    );
  }

  /*
   * ------------------------------------------------------------
   * FREE EVENT LISTING FEE
   * ------------------------------------------------------------
   */

  if (!session.user.email) {
    return NextResponse.json(
      {
        error:
          "Your account has no email on file, so we can't start payment. The event was saved but isn't live yet — contact support.",
      },
      { status: 400 }
    );
  }

  try {
    const origin = request.nextUrl.origin;

    const { authorization_url, reference } =
      await initializeTransaction({
        email: session.user.email,
        amountKobo: LISTING_FEE_KOBO,
        callbackUrl: `${origin}/api/payments/listing-fee/callback`,
        metadata: {
          paymentType: "EVENT_LISTING_FEE",
          eventId: event.id,
        },
      });

    await prisma.listingFeePayment.create({
      data: {
        eventId: event.id,
        amount: LISTING_FEE_NAIRA,
        paystackRef: reference,
        status: "pending",
      },
    });

    return NextResponse.json(
      {
        event,
        redirectUrl: authorization_url,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(
      "Failed to start listing fee payment:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Your event was saved but we couldn't start the payment. It won't go live until the fee is paid — try again from your dashboard.",
      },
      { status: 500 }
    );
  }
}