import { recordAudit } from "@/lib/audit";
import { NextResponse } from "next/server";
import crypto from "crypto";
import bcrypt from "bcryptjs";

import { prisma } from "@/lib/db";

function hashToken(token: string) {
  return crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const token =
      typeof body.token === "string"
        ? body.token.trim()
        : "";

    const name =
      typeof body.name === "string"
        ? body.name.trim()
        : "";

    const password =
      typeof body.password === "string"
        ? body.password
        : "";

    if (!token || !name || !password) {
      return NextResponse.json(
        {
          error:
            "Name, password and invitation token are required.",
        },
        { status: 400 }
      );
    }

    if (name.length < 2) {
      return NextResponse.json(
        {
          error: "Enter your full name.",
        },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        {
          error:
            "Your password must be at least 8 characters.",
        },
        { status: 400 }
      );
    }

    const tokenHash = hashToken(token);

    const invitation =
      await prisma.staffInvitation.findUnique({
        where: {
          tokenHash,
        },
        include: {
          event: {
            select: {
              id: true,
              title: true,
            },
          },
        },
      });

    if (!invitation) {
      return NextResponse.json(
        {
          error: "This invitation is invalid.",
        },
        { status: 400 }
      );
    }

    if (invitation.revokedAt) {
      return NextResponse.json(
        {
          error: "This invitation has been revoked.",
        },
        { status: 400 }
      );
    }

    if (invitation.acceptedAt) {
      return NextResponse.json(
        {
          error:
            "This invitation has already been accepted.",
        },
        { status: 400 }
      );
    }

    if (invitation.expiresAt <= new Date()) {
      return NextResponse.json(
        {
          error:
            "This invitation has expired. Ask the organiser to send a new one.",
        },
        { status: 400 }
      );
    }

    const passwordHash = await bcrypt.hash(
      password,
      12
    );

    const result = await prisma.$transaction(
      async (tx) => {
        let user = await tx.user.findUnique({
          where: {
            email: invitation.email,
          },
        });

        if (user) {
          if (user.role !== "CHECKIN_STAFF") {
            throw new Error(
              "EMAIL_BELONGS_TO_EXISTING_ACCOUNT"
            );
          }

          user = await tx.user.update({
            where: {
              id: user.id,
            },
            data: {
              name,
              passwordHash,
            },
          });
        } else {
          user = await tx.user.create({
            data: {
              name,
              email: invitation.email,
              passwordHash,
              role: "CHECKIN_STAFF",
            },
          });
        }

        await tx.eventStaff.upsert({
          where: {
            eventId_userId: {
              eventId: invitation.eventId,
              userId: user.id,
            },
          },
          update: {},
          create: {
            eventId: invitation.eventId,
            userId: user.id,
          },
        });

        await tx.staffInvitation.update({
          where: {
            id: invitation.id,
          },
          data: {
            acceptedAt: new Date(),
          },
        });

        await recordAudit({ action: "staff.invitation_accepted", actorId: user.id, actorName: user.name, entityType: "event", entityId: invitation.eventId, summary: "Accepted event staff invitation", dedupeKey: `staff-accepted/${invitation.id}` }, tx);
        return {
          userId: user.id,
          email: user.email,
          name: user.name,
          eventId: invitation.eventId,
          eventTitle: invitation.event.title,
        };
      }
    );

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message ===
        "EMAIL_BELONGS_TO_EXISTING_ACCOUNT"
    ) {
      return NextResponse.json(
        {
          error:
            "This email already belongs to an organiser or admin account.",
        },
        { status: 409 }
      );
    }

    console.error(
      "Accept staff invitation error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "We couldn't activate your staff account.",
      },
      { status: 500 }
    );
  }
}