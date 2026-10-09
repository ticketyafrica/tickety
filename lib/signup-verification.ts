import { createHash, randomInt, randomUUID } from "crypto";
import bcrypt from "bcryptjs";
import { Prisma, PrismaClient } from "@prisma/client";
import { prisma } from "./db";
import { recordAudit } from "./audit";
import { enqueueEmail } from "./email/queue";
import { sendEmail } from "./email/provider";
import { brandedEmail, escapeHtml } from "./email/templates";

export const SIGNUP_CODE_TTL_MS = 10 * 60_000;
export const SIGNUP_RESEND_SECONDS = 60;
export const SIGNUP_MAX_ATTEMPTS = 5;
export class SignupError extends Error {
  constructor(message: string, public status = 400, public retryAfter?: number) { super(message); }
}

export function signupDetails(input: unknown) {
  const body = input as Record<string, unknown> | null;
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body?.password === "string" ? body.password : "";
  if (!name || name.length > 100) throw new SignupError("Enter your full name (up to 100 characters).");
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new SignupError("Enter a valid email address.");
  // bcrypt only uses the first 72 bytes; do not silently truncate passwords.
  if (password.length < 8 || Buffer.byteLength(password, "utf8") > 72) throw new SignupError("Password must be at least 8 characters and at most 72 bytes.");
  return { name, email, password };
}

export function signupCodeEmail(email: string, code: string) {
  return brandedEmail({
    to: email, subject: "Verify your Tickety email address", eyebrow: "Email verification", heading: "Verify your email",
    body: `<p>Enter this code on the signup page to finish creating your account:</p><p style="font-size:32px;font-weight:700;letter-spacing:8px;color:#6D28D9">${escapeHtml(code)}</p><p>This code expires in 10 minutes. Never share it with anyone.</p><p>If you did not request this code, you can ignore this email.</p>`,
    text: `Your Tickety verification code is ${code}. Enter it on the signup page. It expires in 10 minutes. Never share it with anyone. If you did not request this code, ignore this email.`,
  });
}

async function lockEmail(tx: Prisma.TransactionClient, email: string) {
  // Serialize sends and verification across all server instances.
  await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtextextended(${`signup/${email}`}, 0))::text AS locked`;
}

export async function requestSignupCode(input: unknown, ip: string, db: PrismaClient = prisma, deliver = sendEmail) {
  const details = signupDetails(input);
  const code = randomInt(0, 1_000_000).toString().padStart(6, "0");
  const id = randomUUID();
  const now = new Date();
  const result = await db.$transaction(async (tx) => {
    const hash = (value: string) => createHash("sha256").update(value).digest("hex");
    for (const bucket of [
      { key: `signup/ip/${hash(ip)}/${Math.floor(now.getTime() / 600_000)}`, max: 20, duration: 600_000 },
      { key: `signup/email/${hash(details.email)}/${Math.floor(now.getTime() / 3_600_000)}`, max: 5, duration: 3_600_000 },
    ]) {
      const rate = await tx.emailSubscriptionRateLimit.upsert({ where: { key: bucket.key }, update: { requests: { increment: 1 } }, create: { key: bucket.key, expiresAt: new Date(now.getTime() + bucket.duration) } });
      if (rate.requests > bucket.max) return new SignupError("Too many requests. Please try again later.", 429, Math.ceil((rate.expiresAt.getTime() - now.getTime()) / 1000));
    }
    await lockEmail(tx, details.email);
    if (await tx.user.findUnique({ where: { email: details.email } })) return new SignupError("An account with this email already exists.", 409);
    const pending = await tx.signupVerification.findUnique({ where: { email: details.email } });
    if (pending && pending.sentAt.getTime() + SIGNUP_RESEND_SECONDS * 1000 > now.getTime()) {
      return new SignupError("Please wait before requesting another code.", 429, Math.ceil((pending.sentAt.getTime() + 60_000 - now.getTime()) / 1000));
    }
    const [passwordHash, codeHash] = await Promise.all([bcrypt.hash(details.password, 10), bcrypt.hash(code, 10)]);
    const data = { id, email: details.email, name: details.name, passwordHash, codeHash, attempts: 0, sentAt: now, expiresAt: new Date(now.getTime() + SIGNUP_CODE_TTL_MS) };
    await tx.signupVerification.upsert({ where: { email: details.email }, create: data, update: data });
    return { verificationId: id, email: details.email, resendAfter: SIGNUP_RESEND_SECONDS };
  });
  if (result instanceof SignupError) throw result;
  try {
    // Send immediately: signup should not wait for the cron email worker.
    await deliver(signupCodeEmail(details.email, code), `signup-verification/${id}`);
  } catch {
    // Preserve throttling but invalidate a code whose delivery failed.
    await db.signupVerification.updateMany({ where: { id }, data: { expiresAt: new Date(0) } });
    throw new SignupError("We couldn't send your verification code. Please wait a minute and try again.", 503, 60);
  }
  return result;
}

export async function verifySignupCode(input: unknown, db: PrismaClient = prisma) {
  const body = input as Record<string, unknown> | null;
  if (typeof body?.verificationId !== "string" || !/^[0-9a-f-]{36}$/i.test(body.verificationId) || typeof body?.code !== "string" || !/^\d{6}$/.test(body.code)) {
    throw new SignupError("Enter the six-digit code from your email.");
  }
  const { verificationId, code } = body as { verificationId: string; code: string };
  const result = await db.$transaction(async (tx) => {
    const initial = await tx.signupVerification.findUnique({ where: { id: verificationId } });
    if (!initial) return new SignupError("This code is no longer valid. Request a new code.");
    await lockEmail(tx, initial.email);
    const pending = await tx.signupVerification.findUnique({ where: { id: verificationId } });
    if (!pending || pending.expiresAt <= new Date()) return new SignupError("This code has expired. Request a new code.");
    if (pending.attempts >= SIGNUP_MAX_ATTEMPTS) return new SignupError("Too many incorrect attempts. Request a new code.", 429);
    await tx.signupVerification.update({ where: { id: verificationId }, data: { attempts: { increment: 1 } } });
    if (!await bcrypt.compare(code, pending.codeHash)) return new SignupError("Incorrect verification code. Please try again.");
    if (await tx.user.findUnique({ where: { email: pending.email } })) return new SignupError("An account with this email already exists.", 409);
    const created = await tx.user.create({ data: { name: pending.name, email: pending.email, passwordHash: pending.passwordHash, role: "ORGANISER", emailVerifiedAt: new Date() } });
    await enqueueEmail(tx, { dedupeKey: `welcome/${created.id}`, kind: "welcome", recipient: created.email, userId: created.id });
    await recordAudit({ action: "account.signed_up", actorId: created.id, actorName: created.name, entityType: "user", entityId: created.id, summary: `New verified organiser signup: ${created.name}` }, tx);
    await tx.signupVerification.delete({ where: { id: verificationId } });
    return { id: created.id, email: created.email };
  }, { timeout: 10_000 });
  // Throw outside the transaction so incorrect attempts are committed.
  if (result instanceof SignupError) throw result;
  return result;
}
