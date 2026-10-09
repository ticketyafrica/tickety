import assert from "node:assert/strict";
import { test } from "node:test";
import bcrypt from "bcryptjs";
import { PrismaClient, SignupVerification } from "@prisma/client";
import { requestSignupCode, verifySignupCode, signupDetails, signupCodeEmail, SignupError } from "../lib/signup-verification";

const details = { name: " Ada ", email: " ADA@EXAMPLE.COM ", password: "safe-password" };
function fixture() {
  let pending: SignupVerification | null = null;
  const users: Record<string, unknown>[] = [];
  const jobs: unknown[] = [];
  const audits: unknown[] = [];
  const rates = new Map<string, { requests: number; expiresAt: Date }>();
  let sentCode = "";
  let queue: Promise<unknown> = Promise.resolve();
  const tx = {
    $queryRaw: async () => [],
    emailSubscriptionRateLimit: { upsert: async ({ where, create }: any) => {
      const value = rates.get(where.key);
      if (value) value.requests++;
      else rates.set(where.key, { requests: 1, expiresAt: create.expiresAt });
      return rates.get(where.key)!;
    } },
    signupVerification: {
      findUnique: async ({ where }: any) => pending && (where.id === pending.id || where.email === pending.email) ? { ...pending } : null,
      upsert: async ({ create }: any) => { pending = { ...create }; return pending; },
      update: async () => { if (pending) pending.attempts++; return pending; },
      updateMany: async ({ where, data }: any) => { if (!pending || pending.id !== where.id) return { count: 0 }; Object.assign(pending, data); return { count: 1 }; },
      delete: async () => { pending = null; },
    },
    user: {
      findUnique: async ({ where }: any) => users.find((user) => user.email === where.email) || null,
      create: async ({ data }: any) => { const user = { id: "user-1", ...data }; users.push(user); return user; },
    },
    emailNotification: { upsert: async ({ create }: any) => { jobs.push(create); return create; } },
    auditLog: { create: async ({ data }: any) => { audits.push(data); return data; } },
  };
  const db = { signupVerification: tx.signupVerification, $transaction: (cb: any) => {
    const result = queue.then(() => cb(tx));
    queue = result.catch(() => {});
    return result;
  } } as unknown as PrismaClient;
  const deliver = async (message: { text: string }) => { sentCode = message.text.match(/code is (\d{6})/)![1]; return "email-1"; };
  return { db, deliver, users, jobs, audits, getPending: () => pending!, getCode: () => sentCode,
    age: () => { pending!.sentAt = new Date(Date.now() - 61_000); } };
}

test("signup validates and normalizes details, including bcrypt's password limit", () => {
  assert.deepEqual(signupDetails(details), { name: "Ada", email: "ada@example.com", password: details.password });
  for (const input of [null, {}, { ...details, email: "bad" }, { ...details, password: "short" }, { ...details, password: "é".repeat(37) }, { ...details, name: 42 }]) assert.throws(() => signupDetails(input), SignupError);
});

test("sending a code stores only hashes and does not create an account or welcome email", async () => {
  const f = fixture();
  const result = await requestSignupCode(details, "ip-1", f.db, f.deliver);
  assert.equal(result.email, "ada@example.com");
  assert.match(f.getCode(), /^\d{6}$/);
  assert.notEqual(f.getPending().codeHash, f.getCode());
  assert.equal(await bcrypt.compare(f.getCode(), f.getPending().codeHash), true);
  assert.equal(await bcrypt.compare(details.password, f.getPending().passwordHash), true);
  assert.equal(f.users.length, 0);
  assert.equal(f.jobs.length, 0);
});

test("correct OTP creates a verified account and enqueues welcome exactly once; replay fails", async () => {
  const f = fixture();
  const { verificationId } = await requestSignupCode(details, "ip", f.db, f.deliver);
  const input = { verificationId, code: f.getCode() };
  const results = await Promise.allSettled([verifySignupCode(input, f.db), verifySignupCode(input, f.db)]);
  assert.equal(results.filter((r) => r.status === "fulfilled").length, 1);
  assert.equal(f.users.length, 1);
  assert.ok(f.users[0].emailVerifiedAt instanceof Date);
  assert.equal(f.jobs.length, 1);
  assert.equal(f.audits.length, 1);
  await assert.rejects(verifySignupCode(input, f.db), SignupError);
});

test("five incorrect attempts block even the correct code", async () => {
  const f = fixture();
  const { verificationId } = await requestSignupCode(details, "ip", f.db, f.deliver);
  const wrong = f.getCode() === "999999" ? "888888" : "999999";
  for (let i = 0; i < 5; i++) await assert.rejects(verifySignupCode({ verificationId, code: wrong }, f.db), /Incorrect/);
  assert.equal(f.getPending().attempts, 5);
  await assert.rejects(verifySignupCode({ verificationId, code: f.getCode() }, f.db), /Too many incorrect/);
  assert.equal(f.users.length, 0);
});

test("expired and malformed codes cannot create accounts", async () => {
  const f = fixture();
  const { verificationId } = await requestSignupCode(details, "ip", f.db, f.deliver);
  for (const code of [123456, "12", "abcdef", null]) await assert.rejects(verifySignupCode({ verificationId, code }, f.db), SignupError);
  f.getPending().expiresAt = new Date(Date.now() - 1);
  await assert.rejects(verifySignupCode({ verificationId, code: f.getCode() }, f.db), /expired/);
  assert.equal(f.users.length, 0);
});

test("resend enforces cooldown and replaces the previous challenge", async () => {
  const f = fixture();
  const first = await requestSignupCode(details, "ip", f.db, f.deliver);
  const firstCode = f.getCode();
  await assert.rejects(requestSignupCode(details, "ip", f.db, f.deliver), (e: unknown) => e instanceof SignupError && e.status === 429 && !!e.retryAfter);
  f.age();
  const second = await requestSignupCode(details, "ip", f.db, f.deliver);
  assert.notEqual(first.verificationId, second.verificationId);
  await assert.rejects(verifySignupCode({ verificationId: first.verificationId, code: firstCode }, f.db), SignupError);
  await verifySignupCode({ verificationId: second.verificationId, code: f.getCode() }, f.db);
});

test("recipient send limit persists across different IPs", async () => {
  const f = fixture();
  for (let i = 0; i < 5; i++) { await requestSignupCode(details, `ip-${i}`, f.db, f.deliver); f.age(); }
  await assert.rejects(requestSignupCode(details, "new-ip", f.db, f.deliver), /Too many requests/);
});

test("delivery failure leaves no login account and invalidates the code", async () => {
  const f = fixture();
  await assert.rejects(requestSignupCode(details, "ip", f.db, async () => { throw new Error("provider unavailable"); }), (e: unknown) => e instanceof SignupError && e.status === 503);
  assert.equal(f.users.length, 0);
  assert.equal(f.getPending().expiresAt.getTime(), 0);
});

test("existing accounts cannot be replaced by signup", async () => {
  const f = fixture();
  f.users.push({ email: "ada@example.com" });
  await assert.rejects(requestSignupCode(details, "ip", f.db, f.deliver), (e: unknown) => e instanceof SignupError && e.status === 409);
  assert.equal(f.users.length, 1);
});

test("verification email contains both HTML and plain text code and expiry", () => {
  const message = signupCodeEmail("ada@example.com", "012345");
  assert.match(message.html, /012345/);
  assert.match(message.text, /012345/);
  assert.match(message.text, /10 minutes/);
  assert.deepEqual(message.to, ["ada@example.com"]);
});
