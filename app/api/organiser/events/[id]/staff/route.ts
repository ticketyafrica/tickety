import { recordAudit } from "@/lib/audit";
import { NextRequest, NextResponse } from "next/server";
import { randomBytes, createHash } from "crypto";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { enqueueEmail } from "@/lib/email/queue";
import { appUrl } from "@/lib/email/templates";

export const dynamic = "force-dynamic";

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function normaliseEmail(email: string) {
  return email.trim().toLowerCase();
}

async function getOrganiserEvent(eventId: string, userId: string) {
  return prisma.event.findFirst({
    where: {
      id: eventId,
      organiserId: userId,
    },
    select: {
      id: true,
      title: true,
      organiserId: true,
    },
  });
}

/**
 * GET
 *
 * Returns:
 * - staff already assigned to the event
 * - pending invitations for the event
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: "You must be logged in." },
        { status: 401 }
      );
    }

    if (
      session.user.role !== "ORGANISER" &&
      session.user.role !== "ADMIN"
    ) {
      return NextResponse.json(
        { error: "You do not have permission to manage staff." },
        { status: 403 }
      );
    }

    const event = await getOrganiserEvent(
      params.id,
      session.user.id
    );

    if (!event) {
      return NextResponse.json(
        { error: "Event not found." },
        { status: 404 }
      );
    }

    const [staff, invitations] = await Promise.all([
      prisma.eventStaff.findMany({
        where: {
          eventId: event.id,
        },
        orderBy: {
          createdAt: "asc",
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
        },
      }),

      prisma.staffInvitation.findMany({
        where: {
          eventId: event.id,
          acceptedAt: null,
          revokedAt: null,
          expiresAt: {
            gt: new Date(),
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        select: {
          id: true,
          email: true,
          expiresAt: true,
          createdAt: true,
        },
      }),
    ]);

    return NextResponse.json({
      event: {
        id: event.id,
        title: event.title,
      },
      staff,
      invitations,
    });
  } catch (error) {
    console.error("GET /staff error:", error);

    return NextResponse.json(
      { error: "Something went wrong while loading event staff." },
      { status: 500 }
    );
  }
}

/**
 * POST
 *
 * Creates a staff invitation.
 *
 * Expected body:
 * {
 *   email: "staff@example.com"
 * }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: "You must be logged in." },
        { status: 401 }
      );
    }

    if (
      session.user.role !== "ORGANISER" &&
      session.user.role !== "ADMIN"
    ) {
      return NextResponse.json(
        { error: "You do not have permission to invite staff." },
        { status: 403 }
      );
    }

    const event = await getOrganiserEvent(
      params.id,
      session.user.id
    );

    if (!event) {
      return NextResponse.json(
        { error: "Event not found." },
        { status: 404 }
      );
    }

    let body: { email?: string };

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid request body." },
        { status: 400 }
      );
    }

    const email =
      typeof body.email === "string"
        ? normaliseEmail(body.email)
        : "";

    if (!email) {
      return NextResponse.json(
        { error: "Please enter a staff email address." },
        { status: 400 }
      );
    }

    if (!email.includes("@") || email.length > 254) {
      return NextResponse.json(
        { error: "Please enter a valid email address." },
        { status: 400 }
      );
    }

    /*
     * If the user already has a Tickety account,
     * don't create another staff assignment.
     */
    const existingUser = await prisma.user.findUnique({
      where: {
        email,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });

    if (existingUser) {
      const existingAssignment = await prisma.eventStaff.findUnique({
        where: {
          eventId_userId: {
            eventId: event.id,
            userId: existingUser.id,
          },
        },
      });

      if (existingAssignment) {
        return NextResponse.json(
          {
            error: "This person is already assigned to this event.",
          },
          { status: 409 }
        );
      }

      /*
       * An existing organiser/admin should not silently
       * become check-in staff.
       */
      if (
        existingUser.role === "ORGANISER" ||
        existingUser.role === "ADMIN"
      ) {
        return NextResponse.json(
          {
            error:
              "This email already belongs to an organiser or admin account.",
          },
          { status: 409 }
        );
      }
    }

    /*
     * Don't allow multiple active invitations
     * for the same email/event.
     */
    const existingInvitation =
      await prisma.staffInvitation.findFirst({
        where: {
          eventId: event.id,
          email,
          acceptedAt: null,
          revokedAt: null,
          expiresAt: {
            gt: new Date(),
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });

    if (existingInvitation) {
      return NextResponse.json(
        {
          error:
            "An active invitation already exists for this email.",
          invitationId: existingInvitation.id,
        },
        { status: 409 }
      );
    }

    /*
     * Generate a secure invitation token.
     *
     * We store only the SHA-256 hash in the database.
     */
    const rawToken = randomBytes(32).toString("hex");
    const tokenHash = hashToken(rawToken);

    /*
     * Invitation expires in 48 hours.
     */
    const expiresAt = new Date(
      Date.now() + 48 * 60 * 60 * 1000
    );

    const invitationUrl = appUrl(`/staff/invite/${rawToken}`);
    const invitation = await prisma.$transaction(async (tx) => {
      const created = await tx.staffInvitation.create({
        data: { email, eventId: event.id, invitedById: session.user.id, tokenHash, expiresAt },
        select: { id: true, email: true, expiresAt: true },
      });
      await recordAudit({ action: "staff.invited", actorId: session.user.id, actorName: session.user.name || "Organiser", entityType: "event", entityId: event.id, summary: "Invited event check-in staff", metadata: { targetId: created.id }, dedupeKey: `staff-invited/${created.id}` }, tx);
      await enqueueEmail(tx, { dedupeKey: `staff-invite/${created.id}`, kind: "staff_invitation", recipient: email, eventId: event.id, invitationId: created.id, expiresAt, context: { inviteUrl: invitationUrl } });
      return created;
    });

    return NextResponse.json(
      {
        message: "Staff invitation created and email queued.",
        invitation,
        invitationUrl,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /staff error:", error);

    return NextResponse.json(
      { error: "Something went wrong while inviting staff." },
      { status: 500 }
    );
  }
}

/**
 * DELETE
 *
 * Removes an existing staff member from the event.
 *
 * Expected body:
 * {
 *   userId: "..."
 * }
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: "You must be logged in." },
        { status: 401 }
      );
    }

    if (
      session.user.role !== "ORGANISER" &&
      session.user.role !== "ADMIN"
    ) {
      return NextResponse.json(
        { error: "You do not have permission to remove staff." },
        { status: 403 }
      );
    }

    const event = await getOrganiserEvent(
      params.id,
      session.user.id
    );

    if (!event) {
      return NextResponse.json(
        { error: "Event not found." },
        { status: 404 }
      );
    }

    let body: { userId?: string };

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid request body." },
        { status: 400 }
      );
    }

    if (!body.userId) {
      return NextResponse.json(
        { error: "Staff user ID is required." },
        { status: 400 }
      );
    }

    const assignment = await prisma.eventStaff.findUnique({
      where: {
        eventId_userId: {
          eventId: event.id,
          userId: body.userId,
        },
      },
    });

    if (!assignment) {
      return NextResponse.json(
        { error: "This staff member is not assigned to this event." },
        { status: 404 }
      );
    }

    await prisma.$transaction(async tx => {
      await tx.eventStaff.delete({ where: { id: assignment.id } });
      await recordAudit({ action: "staff.removed", actorId: session.user.id, actorName: session.user.name || "Organiser", entityType: "event", entityId: event.id, summary: "Removed event staff access", metadata: { targetId: assignment.userId } }, tx);
    });

    return NextResponse.json({
      message: "Staff member removed from this event.",
    });
  } catch (error) {
    console.error("DELETE /staff error:", error);

    return NextResponse.json(
      { error: "Something went wrong while removing staff." },
      { status: 500 }
    );
  }
}