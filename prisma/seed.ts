import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import {
  events,
  attendees,
  transactions,
  adminEvents,
} from "../lib/mock-data";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding...");

  // Clear existing data in dependency order.
  await prisma.transaction.deleteMany();
  await prisma.attendee.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.customQuestion.deleteMany();
  await prisma.ticketType.deleteMany();
  await prisma.listingFeePayment.deleteMany();
  await prisma.event.deleteMany();
  await prisma.user.deleteMany();

  // Demo password for every seeded organiser account.
  // Change these before using this seed data anywhere except local development.
  const demoPasswordHash = await bcrypt.hash("password123", 10);

  // Create admin account.
  await prisma.user.create({
    data: {
      name: "Tickety Admin",
      email: "admin@tickety.africa",
      passwordHash: await bcrypt.hash("admin12345", 10),
      role: "ADMIN",
    },
  });

  // Create organiser accounts.
  const organiserNames = Array.from(
    new Set(events.map((event) => event.organiserName))
  );

  const organisersByName = new Map<string, string>();

  for (const name of organiserNames) {
    const email = `${name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, ".")}@tickety.africa`;

    const organiser = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash: demoPasswordHash,
        role: "ORGANISER",
      },
    });

    organisersByName.set(name, organiser.id);
  }

  // Track created ticket type IDs by:
  // "eventSlug::ticketTypeName"
  //
  // This allows mock attendee records to reference ticket
  // types by their names.
  const ticketTypeIdByKey = new Map<string, string>();

  // Create events.
  for (const event of events) {
    const organiserId = organisersByName.get(event.organiserName);

    if (!organiserId) {
      throw new Error(
        `Could not find organiser for event: ${event.title}`
      );
    }

    const created = await prisma.event.create({
      data: {
        slug: event.slug,
        title: event.title,
        description: event.description,
        state: event.state,
        venue: event.venue,
        date: new Date(event.date),
        startTime: event.startTime,

        // New required Event field.
        // Falls back to 23:00 for older mock-data records.
        endTime: event.endTime ?? "23:00",

        category: event.category,
        featured: event.featured,
        trending: event.trending,
        coverGradient: event.coverGradient,

        organiserId,

        ticketTypes: {
          create: event.ticketTypes.map((ticket) => ({
            name: ticket.name,
            price: ticket.price,
            quantityTotal: ticket.quantityTotal,
            quantitySold: ticket.quantitySold,
          })),
        },

        customQuestions: {
          create: event.customQuestions.map((question) => ({
            label: question.label,
            type: question.type,
            options: question.options ?? [],
            required: question.required,
          })),
        },
      },

      include: {
        ticketTypes: true,
      },
    });

    // Save ticket type IDs for attendee creation later.
    for (const ticketType of created.ticketTypes) {
      ticketTypeIdByKey.set(
        `${event.slug}::${ticketType.name}`,
        ticketType.id
      );
    }

    // Apply admin status overrides from mock data.
    const adminOverride = adminEvents.find(
      (adminEvent) => adminEvent.title === event.title
    );

    if (adminOverride && adminOverride.status !== "live") {
      await prisma.event.update({
        where: {
          id: created.id,
        },
        data: {
          status: adminOverride.status,
        },
      });
    }
  }

  // Demo event used for attendee/transaction seed data.
  const demoEventSlug = "afrobeats-picnic-lagos";

  const demoEvent = await prisma.event.findUnique({
    where: {
      slug: demoEventSlug,
    },
  });

  if (!demoEvent) {
    throw new Error(
      `Demo event "${demoEventSlug}" was not found after seeding.`
    );
  }

  const createdAttendeeIds = new Map<string, string>();

  // Create attendees.
  for (const attendee of attendees) {
    const ticketTypeId = ticketTypeIdByKey.get(
      `${demoEventSlug}::${attendee.ticketType}`
    );

    if (!ticketTypeId) {
      console.warn(
        `Skipping attendee "${attendee.name}" because ticket type "${attendee.ticketType}" was not found.`
      );
      continue;
    }

    const created = await prisma.attendee.create({
      data: {
        name: attendee.name,
        email: attendee.email,
        phone: attendee.phone,
        ticketId: attendee.ticketId,
        amountPaid: attendee.amountPaid,
        purchaseDate: new Date(attendee.purchaseDate),
        paymentStatus: attendee.paymentStatus,
        checkInStatus: attendee.checkInStatus,
        checkInTime: attendee.checkInTime
          ? new Date(attendee.checkInTime)
          : null,
        ticketStatus: attendee.ticketStatus,

        eventId: demoEvent.id,
        ticketTypeId,
      },
    });

    createdAttendeeIds.set(attendee.ticketId, created.id);
  }

  // Create transactions.
  for (const transaction of transactions) {
    const candidate = attendees.find(
      (attendee) =>
        Number(attendee.amountPaid) === transaction.amount &&
        createdAttendeeIds.has(attendee.ticketId)
    );

    if (!candidate) {
      continue;
    }

    const attendeeId = createdAttendeeIds.get(candidate.ticketId);

    if (!attendeeId) {
      continue;
    }

    await prisma.transaction.create({
      data: {
        amount: transaction.amount,
        platformFee: transaction.platformFee,
        status: transaction.status,
        date: new Date(transaction.date),
        attendeeId,
      },
    });
  }

  console.log("Seed complete.");
  console.log(
    "Log in with: admin@tickety.africa / admin12345 (admin)"
  );
  console.log(
    "Or any seeded organiser email / password123 (e.g. spotlite.events.co.@tickety.africa)"
  );
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });