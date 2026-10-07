import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { resolveAccountNumber } from "@/lib/paystack";
import { createPayoutVerificationToken } from "@/lib/payout-verification";

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return "Unable to verify bank account";
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          error: "Unauthorized",
        },
        {
          status: 401,
        }
      );
    }

    if (session.user.role !== "ORGANISER") {
      return NextResponse.json(
        {
          error: "Only organisers can verify payout accounts",
        },
        {
          status: 403,
        }
      );
    }

    const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { payoutPinHash: true } });
    if (!user?.payoutPinHash) {
      return NextResponse.json({ error: "Set your payout PIN before adding bank details." }, { status: 409 });
    }

    const body = await request.json();

    const bankCode = String(body.bankCode ?? "").trim();
    const accountNumber = String(body.accountNumber ?? "").trim();

    if (!bankCode) {
      return NextResponse.json(
        {
          error: "Bank is required",
        },
        {
          status: 400,
        }
      );
    }

    if (!/^\d{10}$/.test(accountNumber)) {
      return NextResponse.json(
        {
          error: "Account number must be 10 digits",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * IMPORTANT:
     *
     * This is the ONLY place where we call Paystack's
     * /bank/resolve endpoint.
     */
    const account = await resolveAccountNumber(
      accountNumber,
      bankCode
    );

    const verificationToken = createPayoutVerificationToken({
      userId: session.user.id,
      bankCode,
      accountNumber,
      accountName: account.account_name,
    });

    return NextResponse.json({
      success: true,
      accountName: account.account_name,
      accountNumber,
      bankCode,
      verificationToken,
    });
  } catch (error) {
    console.error("Payout verification error:", error);

    return NextResponse.json(
      {
        error: getErrorMessage(error),
      },
      {
        status: 500,
      }
    );
  }
}