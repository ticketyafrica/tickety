import { recordAudit } from "@/lib/audit";
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { enqueueEmail } from "@/lib/email/queue";

export async function POST(request: NextRequest) {
  const { name, email, password } = await request.json();

  if (!name || !email || !password) {
    return NextResponse.json({ error: "All fields are required" }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.$transaction(async (tx) => {
    const created = await tx.user.create({
      data: { name, email, passwordHash, role: "ORGANISER" },
    });
    await enqueueEmail(tx, { dedupeKey: `welcome/${created.id}`, kind: "welcome", recipient: created.email, userId: created.id });
    await recordAudit({ action: "account.signed_up", actorId: created.id, actorName: created.name, entityType: "user", entityId: created.id, summary: `New organiser signup: ${created.name}` }, tx);
    return created;
  });

  return NextResponse.json({ id: user.id, email: user.email }, { status: 201 });
}
