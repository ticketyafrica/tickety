import assert from "node:assert/strict";
import { test, mock } from "node:test";
import { createPayoutVerificationToken } from "../lib/payout-verification";
import { PayoutUpdateError, updateVerifiedPayoutAccount } from "../lib/payout-update";
import { updateSubaccount, PaystackSubaccount } from "../lib/paystack";

const user = { id: "organiser-1", name: "Event Company", paystackSubaccountCode: "ACCT_owned" };
const verifiedDetails = { userId: user.id, bankCode: "058", accountNumber: "0123456789", accountName: "VERIFIED HOLDER" };
const current: PaystackSubaccount = { subaccount_code: "ACCT_owned", currency: "NGN", account_number: "9876543210", business_name: "Old company" };

async function withSecret(run: () => Promise<void>) {
  const previous = process.env.NEXTAUTH_SECRET;
  process.env.NEXTAUTH_SECRET = "payout-test-secret";
  try { await run(); }
  finally { mock.restoreAll(); if (previous === undefined) delete process.env.NEXTAUTH_SECRET; else process.env.NEXTAUTH_SECRET = previous; }
}
const body = () => ({ ...verifiedDetails, confirmed: true, businessName: "Updated company", verificationToken: createPayoutVerificationToken(verifiedDetails) });

function providerMock() {
  const calls: { code: string; params: unknown }[] = [];
  return { calls, provider: {
    getSubaccount: async (code: string) => { assert.equal(code, user.paystackSubaccountCode); return current; },
    updateSubaccount: async (code: string, params: { bankCode: string; accountNumber: string; businessName: string }) => {
      calls.push({ code, params });
      return { ...current, account_number: params.accountNumber, business_name: params.businessName, account_name: verifiedDetails.accountName, settlement_bank: "Test Bank" };
    },
  } };
}

test("update uses the organiser's existing subaccount and returns masked details", async () => withSecret(async () => {
  const { calls, provider } = providerMock();
  const result = await updateVerifiedPayoutAccount(user, { ...body(), subaccountCode: "ACCT_someone_else" } as ReturnType<typeof body>, provider);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].code, "ACCT_owned");
  assert.deepEqual(calls[0].params, { bankCode: "058", accountNumber: "0123456789", businessName: "Updated company" });
  assert.deepEqual(result, { accountName: "VERIFIED HOLDER", bankName: "Test Bank", accountLast4: "6789", businessName: "Updated company" });
  assert.ok(!JSON.stringify(result).includes("0123456789"));
}));

test("unconfirmed, mismatched, tampered or unsupported updates never reach Paystack", async () => withSecret(async () => {
  for (const overrides of [
    { confirmed: false }, { bankCode: "999" }, { accountNumber: "0000000000" },
    { accountNumber: "123" }, { verificationToken: "tampered.token" },
    { currency: "USD" }, { businessName: "x".repeat(101) },
    { verificationToken: createPayoutVerificationToken({ ...verifiedDetails, userId: "another-user" }) },
  ]) {
    const { calls, provider } = providerMock();
    let fetched = false;
    provider.getSubaccount = async () => { fetched = true; return current; };
    await assert.rejects(updateVerifiedPayoutAccount(user, { ...body(), ...overrides }, provider), (error: unknown) => error instanceof PayoutUpdateError && error.status === 400);
    assert.equal(calls.length, 0);
    assert.equal(fetched, false);
  }
}));

test("expired verification cannot change bank details", async () => withSecret(async () => {
  const request = body();
  const now = Date.now();
  mock.method(Date, "now", () => now + 11 * 60 * 1000);
  const { calls, provider } = providerMock();
  await assert.rejects(updateVerifiedPayoutAccount(user, request, provider), PayoutUpdateError);
  assert.equal(calls.length, 0);
}));

test("missing, wrong-currency and mismatched subaccounts cannot be updated", async () => withSecret(async () => {
  const request = body();
  const { calls, provider } = providerMock();
  await assert.rejects(updateVerifiedPayoutAccount({ ...user, paystackSubaccountCode: null }, request, provider), (error: unknown) => error instanceof PayoutUpdateError && error.status === 409);
  for (const overrides of [{ currency: "USD" }, { subaccount_code: "ACCT_other" }]) {
    provider.getSubaccount = async () => ({ ...current, ...overrides });
    await assert.rejects(updateVerifiedPayoutAccount(user, request, provider), PayoutUpdateError);
  }
  assert.equal(calls.length, 0);
}));

test("provider failures and unconfirmed changes are not reported as successful", async () => withSecret(async () => {
  const { provider } = providerMock();
  provider.updateSubaccount = async () => { throw new Error("Provider unavailable"); };
  await assert.rejects(updateVerifiedPayoutAccount(user, body(), provider), /Provider unavailable/);
  provider.updateSubaccount = async () => ({ ...current, account_number: "9876543210", account_name: "HOLDER", settlement_bank: "Bank", business_name: "Company" });
  await assert.rejects(updateVerifiedPayoutAccount(user, body(), provider), (error: unknown) => error instanceof PayoutUpdateError && error.status === 502);
}));

test("Paystack update uses PUT and sends only editable bank details", async () => {
  const previous = process.env.PAYSTACK_SECRET_KEY;
  process.env.PAYSTACK_SECRET_KEY = "sk_test_placeholder";
  try {
    mock.method(globalThis, "fetch", async (url: unknown, init?: RequestInit) => {
      assert.equal(url, "https://api.paystack.co/subaccount/ACCT_owned");
      assert.equal(init?.method, "PUT");
      assert.deepEqual(JSON.parse(init!.body as string), { bank_code: "058", account_number: "0123456789", business_name: "Company" });
      return new Response(JSON.stringify({ status: true, data: current }));
    });
    assert.equal((await updateSubaccount("ACCT_owned", { bankCode: "058", accountNumber: "0123456789", businessName: "Company" })).subaccount_code, "ACCT_owned");
  } finally { mock.restoreAll(); if (previous === undefined) delete process.env.PAYSTACK_SECRET_KEY; else process.env.PAYSTACK_SECRET_KEY = previous; }
});
