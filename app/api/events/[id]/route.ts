import { isValidPrice } from "@/lib/currency";
import { eventInstant } from "@/lib/email/schedule";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getEventById, updateEvent, deleteEvent } from "@/lib/data";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(
  _request: NextRequest,
  context: RouteContext
) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json(
      { error: "You need to be logged in." },
      { status: 401 }
    );
  }

  const { id } = await context.params;

  const event = await prisma.event.findFirst({
    where: {
      id,
      organiserId: session.user.id,
    },
    include: {
      ticketTypes: true,
      customQuestions: true,
    },
  });

  if (!event) {
    return NextResponse.json(
      { error: "Event not found." },
      { status: 404 }
    );
  }

  return NextResponse.json({ event });
}

export async function PUT(
  request: NextRequest,
  context: RouteContext
) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json(
      { error: "You need to be logged in." },
      { status: 401 }
    );
  }

  const { id } = await context.params;

  const event = await prisma.event.findFirst({
    where: {
      id,
      organiserId: session.user.id,
    },
    select: {
      id: true,
      endTime: true,
      timezone: true,
      currency: true,
    },
  });

  if (!event) {
    return NextResponse.json(
      { error: "Event not found or you do not have permission to edit it." },
      { status: 404 }
    );
  }

  try {
    const body = await request.json();

    const required = [
      "title",
      "description",
      "state",
      "venue",
      "date",
      "startTime",
      "category",
    ];

    for (const field of required) {
      if (!body?.[field]) {
        return NextResponse.json(
          { error: `Missing field: ${field}` },
          { status: 400 }
        );
      }
    }

    const timezone = typeof body.timezone === "string" ? body.timezone : event.timezone;
    const endTime = typeof body.endTime === "string" ? body.endTime : event.endTime;
    try {
      const start = eventInstant(String(body.date), String(body.startTime), timezone);
      const end = eventInstant(String(body.date), endTime, timezone);
      if (end <= start) throw new Error("End time must be after start time");
    } catch {
      return NextResponse.json({ error: "Provide valid start and end times and an event timezone. End time must be after start time." }, { status: 400 });
    }

    if (body.currency !== undefined && body.currency !== event.currency) {
      return NextResponse.json({ error: "An event’s currency cannot be changed. Create a new event to use another currency." }, { status: 400 });
    }

    const tags =
      typeof body.tags === "string"
        ? body.tags
            .split(",")
            .map((tag: string) => tag.trim())
            .filter(Boolean)
        : Array.isArray(body.tags)
          ? body.tags
          : [];

    const ticketTypes = Array.isArray(body.ticketTypes)
      ? body.ticketTypes
          .map(
            (ticket: {
              id?: string;
              name?: string;
              price?: string | number;
              quantity?: string | number;
              quantityTotal?: string | number;
            }) => ({
              id: ticket.id,
              name: String(ticket.name ?? "").trim(),
              price: Number(ticket.price),
              quantityTotal:
                Number(
                  ticket.quantityTotal ?? ticket.quantity
                ) || 0,
            })
          )
          .filter(
            (ticket: {
              name: string;
              quantityTotal: number;
            }) => ticket.name && ticket.quantityTotal >= 0
          )
      : [];

    if (ticketTypes.some((ticket: { price: number }) => !isValidPrice(ticket.price))) {
      return NextResponse.json({ error: "Ticket prices must be valid amounts with at most two decimal places." }, { status: 400 });
    }

    if (ticketTypes.length === 0) {
      return NextResponse.json(
        { error: "Add at least one ticket type." },
        { status: 400 }
      );
    }

    const customQuestions = Array.isArray(body.customQuestions)
      ? body.customQuestions
          .map(
            (question: {
              id?: string;
              label?: string;
              required?: boolean;
            }) => ({
              id: question.id,
              label: String(question.label ?? "").trim(),
              required: Boolean(question.required),
            })
          )
          .filter(
            (question: { label: string }) => question.label
          )
      : [];

    const updatedEvent = await updateEvent(
      id,
      session.user.id,
      {
        title: String(body.title).trim(),
        description: String(body.description).trim(),
        state: String(body.state).trim(),
        venue: String(body.venue).trim(),
        date: String(body.date),
        startTime: String(body.startTime),
        endTime,
        timezone,
        category: String(body.category).trim(),
        coverImageUrl: body.coverImageUrl
          ? String(body.coverImageUrl)
          : undefined,
        tags,
        refundPolicy: body.refundPolicy
          ? String(body.refundPolicy).trim()
          : undefined,
        minAge:
          body.minAge !== "" &&
          body.minAge !== null &&
          body.minAge !== undefined
            ? Number(body.minAge)
            : undefined,
        ticketTypes,
        customQuestions,
      }
    );

    return NextResponse.json({
      event: updatedEvent,
    });
  } catch (error) {
    console.error("Failed to update event:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to update event.",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  context: RouteContext
) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json(
      { error: "You need to be logged in." },
      { status: 401 }
    );
  }

  const { id } = await context.params;

  try {
    await deleteEvent(id, session.user.id);

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error("Failed to delete event:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to delete event.",
      },
      { status: 500 }
    );
  }
}
