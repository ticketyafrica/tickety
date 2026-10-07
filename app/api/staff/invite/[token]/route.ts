import { recordAudit } from "@/lib/audit";
import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import bcrypt from "bcryptjs";
import { getServerSession } from "next-auth";
import { Prisma } from "@prisma/client";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function normaliseEmail(email: string) {
  return email.trim().toLowerCase();
}

export async function POST(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const token = params.token?.trim();

    if (!token) {
      return NextResponse.json(
        { error: "Invalid invitation." },
        { status: 400 }
      );
    }

    const body = await request.json();

    const name =
      typeof body.name === "string"
        ? body.name.trim()
        : "";

    const password =
      typeof body.password === "string"
        ? body.password
        : "";

    const tokenHash = hashToken(token);

    const invitation =
      await prisma.staffInvitation.findUnique({
        where: {
          tokenHash,
        },
        select: {
          id: true,
          email: true,
          eventId: true,
          expiresAt: true,
          acceptedAt: true,
          revokedAt: true,
        },
      });

    if (!invitation) {
      return NextResponse.json(
        { error: "This invitation is invalid." },
        { status: 404 }
      );
    }

    if (invitation.revokedAt) {
      return NextResponse.json(
        { error: "This invitation has been revoked." },
        { status: 410 }
      );
    }

    if (invitation.acceptedAt) {
      return NextResponse.json(
        { error: "This invitation has already been accepted." },
        { status: 409 }
      );
    }

    if (invitation.expiresAt <= new Date()) {
      return NextResponse.json(
        { error: "This invitation has expired." },
        { status: 410 }
      );
    }

    const email = normaliseEmail(invitation.email);

    if (password.length < 8) {
      return NextResponse.json(
        {
          error:
            "Your password must be at least 8 characters.",
        },
        { status: 400 }
      );
    }

    const session = await getServerSession(authOptions);

    /*
     * Check whether an account already exists.
     */
    const existingUser = await prisma.user.findUnique({
      where: {
        email,
      },
      select: {
        id: true,
        name: true,
        email: true,
        passwordHash: true,
        role: true,
      },
    });

    /*
     * Existing account flow.
     *
     * The client has already signed the person in with
     * NextAuth before reaching this point.
     */
    if (existingUser) {
      if (
        existingUser.role === "ORGANISER" ||
        existingUser.role === "ADMIN"
      ) {
        return NextResponse.json(
          {
            error:
              "This email belongs to an organiser or admin account and cannot be assigned as check-in staff.",
          },
          { status: 403 }
        );
      }

      if (!session?.user) {
        return NextResponse.json(
          {
            error:
              "Please sign in before accepting this invitation.",
          },
          { status: 401 }
        );
      }

      if (
        normaliseEmail(session.user.email ?? "") !== email
      ) {
        return NextResponse.json(
          {
            error:
              "The signed-in account does not match this invitation.",
          },
          { status: 403 }
        );
      }

      await prisma.$transaction(
        async (tx) => {
          await tx.eventStaff.upsert({
            where: {
              eventId_userId: {
                eventId: invitation.eventId,
                userId: existingUser.id,
              },
            },
            create: {
              eventId: invitation.eventId,
              userId: existingUser.id,
            },
            update: {},
          });

          await recordAudit({ action: "staff.invitation_accepted", actorId: existingUser.id, actorName: session.user.name || "Event staff", entityType: "event", entityId: invitation.eventId, summary: "Accepted event staff invitation", dedupeKey: `staff-accepted/${invitation.id}` }, tx);

          await tx.staffInvitation.update({
            where: {
              id: invitation.id,
            },
            data: {
              acceptedAt: new Date(),
            },
          });
        },
        {
          isolationLevel:
            Prisma.TransactionIsolationLevel.Serializable,
          timeout: 10000,
        }
      );

      return NextResponse.json({
        message: "Invitation accepted.",
        userId: existingUser.id,
        eventId: invitation.eventId,
      });
    }

    /*
     * New staff account.
     */
    if (!name) {
      return NextResponse.json(
        { error: "Your name is required." },
        { status: 400 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const result = await prisma.$transaction(
      async (tx) => {
        /*
         * Re-check the invitation inside the transaction
         * to protect against two simultaneous acceptances.
         */
        const currentInvitation =
          await tx.staffInvitation.findUnique({
            where: {
              id: invitation.id,
            },
            select: {
              id: true,
              email: true,
              eventId: true,
              acceptedAt: true,
              revokedAt: true,
              expiresAt: true,
            },
          });

        if (!currentInvitation) {
          throw new Error("INVITATION_NOT_FOUND");
        }

        if (currentInvitation.acceptedAt) {
          throw new Error("INVITATION_ALREADY_ACCEPTED");
        }

        if (currentInvitation.revokedAt) {
          throw new Error("INVITATION_REVOKED");
        }

        if (currentInvitation.expiresAt <= new Date()) {
          throw new Error("INVITATION_EXPIRED");
        }

        const user = await tx.user.create({
          data: {
            name,
            email,
            passwordHash,
            role: "CHECKIN_STAFF",
          },
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        });

        await tx.eventStaff.create({
          data: {
            eventId: currentInvitation.eventId,
            userId: user.id,
          },
        });

        await tx.staffInvitation.update({
          where: {
            id: currentInvitation.id,
          },
          data: {
            acceptedAt: new Date(),
          },
        });

        await recordAudit({ action: "staff.invitation_accepted", actorId: user.id, actorName: user.name, entityType: "event", entityId: invitation.eventId, summary: "Created staff account and accepted invitation", dedupeKey: `staff-accepted/${invitation.id}` }, tx);
        return user;
      },
      {
        isolationLevel:
          Prisma.TransactionIsolationLevel.Serializable,
        timeout: 10000,
      }
    );

    /*
     * The newly-created account does not yet have a browser
     * session. The client will be redirected to the login
     * page so NextAuth can establish the session.
     */
    return NextResponse.json({
      message: "Staff account created and invitation accepted.",
      user: result,
      requiresLogin: true,
    });
  } catch (error) {
    console.error(
      "POST /api/staff/invite/[token] error:",
      error
    );

    if (error instanceof Error) {
      if (error.message === "INVITATION_NOT_FOUND") {
        return NextResponse.json(
          { error: "This invitation is no longer valid." },
          { status: 404 }
        );
      }

      if (
        error.message === "INVITATION_ALREADY_ACCEPTED"
      ) {
        return NextResponse.json(
          { error: "This invitation has already been accepted." },
          { status: 409 }
        );
      }

      if (error.message === "INVITATION_REVOKED") {
        return NextResponse.json(
          { error: "This invitation has been revoked." },
          { status: 410 }
        );
      }

      if (error.message === "INVITATION_EXPIRED") {
        return NextResponse.json(
          { error: "This invitation has expired." },
          { status: 410 }
        );
      }
    }

    /*
     * Prisma unique constraint.
     *
     * This can happen if two requests try to create the
     * same account simultaneously.
     */
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        {
          error:
            "An account with this email already exists. Please sign in and accept the invitation again.",
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      {
        error:
          "Something went wrong while accepting the invitation.",
      },
      { status: 500 }
    );
  }
}