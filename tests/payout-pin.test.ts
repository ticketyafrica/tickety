import assert from "node:assert/strict";
import { test, mock } from "node:test";
import bcrypt from "bcryptjs";
import { PayoutPinError, PayoutPinStore, PAYOUT_PIN_MAX_ATTEMPTS, PAYOUT_PIN_LOCK_MS, requirePayoutPin, setInitialPayoutPin } from "../lib/payout-pin";
import { updateSecurePayoutAccount } from "../lib/payout-update";
import { createPayoutVerificationToken } from "../lib/payout-verification";

function makeStore(initialPin: string | null = null) {
  let pinHash = initialPin ? bcrypt.hashSync(initialPin, 4) : null;
  const passwordHash = bcrypt.hashSync("login-password", 4);
  let failures = 0;
  let lockedUntil: Date | null = null;
  let assignments = 0;
  const store: PayoutPinStore = {
    async getSecurity(id) { return id === "organiser" ? { pinHash, passwordHash, lockedUntil } : null; },
    async reserveAttempt(_id, now) {
      if (lockedUntil && lockedUntil <= now) { failures = 0; lockedUntil = null; }
      if (lockedUntil || failures >= PAYOUT_PIN_MAX_ATTEMPTS) return false;
      failures++; return true;
    },
    async lockIfExhausted(_id, now) { if (failures >= PAYOUT_PIN_MAX_ATTEMPTS && !lockedUntil) lockedUntil = new Date(now.getTime() + PAYOUT_PIN_LOCK_MS); },
    async clearAttempts(_id, expectedHash) { if (pinHash !== expectedHash) return false; failures = 0; lockedUntil = null; return true; },
    async setPinIfMissing(_id, hash) { if (pinHash) return false; pinHash = hash; failures = 0; lockedUntil = null; assignments++; return true; },
  };
  return { store, snapshot: () => ({ pinHash, failures, lockedUntil, assignments }) };
}
const setup = { pin: "123456", confirmPin: "123456", password: "login-password" };

test("setting the first PIN requires the login password and stores only a hash", async () => {
  const { store, snapshot } = makeStore();
  await assert.rejects(setInitialPayoutPin("organiser", { ...setup, password: "wrong" }, store), (e: unknown) => e instanceof PayoutPinError && e.status === 403);
  assert.equal(snapshot().pinHash, null);
  await setInitialPayoutPin("organiser", setup, store);
  assert.notEqual(snapshot().pinHash, setup.pin);
  assert.equal(await bcrypt.compare(setup.pin, snapshot().pinHash!), true);
  assert.equal(snapshot().failures, 0);
});

test("a PIN cannot be overwritten through the setup endpoint", async () => {
  const { store, snapshot } = makeStore("123456");
  const original = snapshot().pinHash;
  await assert.rejects(setInitialPayoutPin("organiser", { ...setup, pin: "654321", confirmPin: "654321" }, store), (e: unknown) => e instanceof PayoutPinError && e.status === 409);
  assert.equal(snapshot().pinHash, original);
  assert.equal(snapshot().assignments, 0);
});

test("PIN setup validates length, confirmation and password before saving", async () => {
  for (const request of [{ ...setup, pin: "1234", confirmPin: "1234" }, { ...setup, confirmPin: "654321" }, { ...setup, password: "" }, { ...setup, pin: 123456 }]) {
    const { store, snapshot } = makeStore();
    await assert.rejects(setInitialPayoutPin("organiser", request, store), PayoutPinError);
    assert.equal(snapshot().assignments, 0);
  }
});

test("missing, malformed and wrong PINs reject payout authorisation", async () => {
  await assert.rejects(requirePayoutPin("organiser", "123456", makeStore().store), (e: unknown) => e instanceof PayoutPinError && e.status === 409);
  const { store } = makeStore("123456");
  for (const pin of [undefined, "1234", 123456, "999999"]) await assert.rejects(requirePayoutPin("organiser", pin, store), PayoutPinError);
  await requirePayoutPin("organiser", "123456", store);
});

test("five incorrect PINs lock further attempts, including the correct PIN, until expiry", async () => {
  const { store, snapshot } = makeStore("123456");
  for (let i = 0; i < 5; i++) await assert.rejects(requirePayoutPin("organiser", "999999", store), PayoutPinError);
  assert.equal(snapshot().failures, 5);
  assert.ok(snapshot().lockedUntil);
  await assert.rejects(requirePayoutPin("organiser", "123456", store), (e: unknown) => e instanceof PayoutPinError && e.status === 429);
  const now = Date.now();
  const NativeDate = Date;
  class LaterDate extends NativeDate { constructor(value?: any) { super(value ?? now + PAYOUT_PIN_LOCK_MS + 1000); } }
  mock.method(globalThis, "Date", LaterDate as typeof Date);
  try { await requirePayoutPin("organiser", "123456", store); }
  finally { mock.restoreAll(); }
  assert.equal(snapshot().failures, 0);
  assert.equal(snapshot().lockedUntil, null);
});

test("login password guessing during first PIN setup is also locked", async () => {
  const { store, snapshot } = makeStore();
  for (let i = 0; i < 5; i++) await assert.rejects(setInitialPayoutPin("organiser", { ...setup, password: "wrong" }, store), PayoutPinError);
  await assert.rejects(setInitialPayoutPin("organiser", setup, store), (e: unknown) => e instanceof PayoutPinError && e.status === 429);
  assert.equal(snapshot().pinHash, null);
});

test("simultaneous guesses cannot reserve more than five attempts", async () => {
  const { store, snapshot } = makeStore("123456");
  const results = await Promise.allSettled(Array.from({ length: 12 }, () => requirePayoutPin("organiser", "999999", store)));
  assert.equal(results.filter(result => result.status === "fulfilled").length, 0);
  assert.equal(snapshot().failures, 5);
  assert.ok(snapshot().lockedUntil);
});

test("Paystack is never contacted until the payout PIN is correct", async () => {
  const previous = process.env.NEXTAUTH_SECRET;
  process.env.NEXTAUTH_SECRET = "pin-test-secret";
  try {
    const { store } = makeStore("123456");
    const user = { id: "organiser", name: "Events", paystackSubaccountCode: "ACCT_owned" };
    const verified = { userId: user.id, bankCode: "058", accountNumber: "0123456789", accountName: "HOLDER" };
    const body = { ...verified, confirmed: true, verificationToken: createPayoutVerificationToken(verified), pin: "999999" };
    let reads = 0; let writes = 0;
    const provider = {
      async getSubaccount() { reads++; return { currency: "NGN", subaccount_code: "ACCT_owned" }; },
      async updateSubaccount() { writes++; return { currency: "NGN", subaccount_code: "ACCT_owned", account_number: verified.accountNumber }; },
    };
    await assert.rejects(updateSecurePayoutAccount(user, body, store, provider), PayoutPinError);
    assert.equal(reads, 0); assert.equal(writes, 0);
    await updateSecurePayoutAccount(user, { ...body, pin: "123456" }, store, provider);
    assert.equal(reads, 1); assert.equal(writes, 1);
  } finally { if (previous === undefined) delete process.env.NEXTAUTH_SECRET; else process.env.NEXTAUTH_SECRET = previous; }
});
