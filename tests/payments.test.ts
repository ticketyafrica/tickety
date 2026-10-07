import assert from "node:assert/strict";
import { test, mock } from "node:test";
import { Prisma } from "@prisma/client";
import { calculateTicketServiceFee, calculateTicketCommission } from "../lib/constants";
import { formatMoney, formatCurrencyTotals, isValidPrice, toMinorUnits } from "../lib/currency";
import { matchesTicketPayment } from "../lib/payment-validation";
import { initializeTransaction } from "../lib/paystack";
import { bookingEmail, bookingAlert } from "../lib/email/templates";

test("NGN fees retain whole-naira rounding, cap and free bookings", () => {
  for (const [amount, fee] of [[0, 0], [500, 25], [510, 26], [10000, 500], [20000, 1000], [25000, 1250], [50000, 2500], [100000, 2500]]) {
    assert.equal(calculateTicketServiceFee(amount), fee);
  }
  assert.equal(calculateTicketCommission(500), 50);
});

test("USD fees and splits round from integer cents and cap per order", () => {
  assert.equal(calculateTicketServiceFee(0, "USD"), 0);
  assert.equal(calculateTicketServiceFee(20, "USD"), 1);
  assert.equal(calculateTicketServiceFee(20.10, "USD"), 1.01);
  assert.equal(calculateTicketServiceFee(100, "USD"), 5);
  assert.equal(calculateTicketServiceFee(250, "USD"), 5);
  assert.equal(calculateTicketCommission(20.10, "USD"), 2.01);
  assert.equal(toMinorUnits(20.10 + calculateTicketServiceFee(20.10, "USD")), 2111);
  assert.equal(toMinorUnits(20.10 - calculateTicketCommission(20.10, "USD")), 1809);
});

test("invalid prices and fractional cents are rejected; reports keep currencies separate", () => {
  for (const amount of [-1, NaN, Infinity, 1.001, 10000001]) assert.equal(isValidPrice(amount), false);
  for (const amount of [0, 0.01, 20.10, 500]) assert.equal(isValidPrice(amount), true);
  assert.throws(() => toMinorUnits(NaN));
  assert.equal(formatMoney(20.10, "USD"), "US$20.10");
  assert.equal(formatCurrencyTotals([{ amount: 500, currency: "NGN" }, { amount: 20, currency: "USD" }, { amount: 5, currency: "USD" }]), "₦500 · US$25.00");
});

test("payment confirmation rejects wrong currency, amount or reference", () => {
  const order = { amount: new Prisma.Decimal("21.11"), currency: "USD" as const, paystackRef: "usd-ref" };
  const payment = { amount: 2111, currency: "USD", reference: "usd-ref" };
  assert.equal(matchesTicketPayment(order, payment), true);
  assert.equal(matchesTicketPayment(order, { ...payment, currency: "NGN" }), false);
  assert.equal(matchesTicketPayment(order, { ...payment, amount: 2110 }), false);
  assert.equal(matchesTicketPayment(order, { ...payment, reference: "other-ref" }), false);
  assert.equal(matchesTicketPayment(order, { amount: 2111, reference: "usd-ref" }), false);
  assert.equal(matchesTicketPayment({ ...order, paystackRef: "PENDING-order" }, payment), true);
});

test("Paystack receives explicit currency, integer cents and the USD split", async () => {
  const previous = process.env.PAYSTACK_SECRET_KEY;
  process.env.PAYSTACK_SECRET_KEY = "sk_test_placeholder";
  const bodies: any[] = [];
  try {
    mock.method(globalThis, "fetch", async (_url: unknown, init?: RequestInit) => {
      bodies.push(JSON.parse(init!.body as string));
      return new Response(JSON.stringify({ status: true, data: { authorization_url: "https://checkout.paystack.com/test", reference: "ref", access_code: "code" } }));
    });
    await initializeTransaction({ email: "guest@example.com", amountKobo: 2111, currency: "USD", callbackUrl: "https://example.com/callback", split: { currency: "USD", type: "flat", bearer_type: "account", subaccounts: [{ subaccount: "ACCT_USD", share: 1809 }] } });
    assert.equal(bodies[0].currency, "USD");
    assert.equal(bodies[0].amount, 2111);
    assert.equal(bodies[0].split.currency, "USD");
    assert.equal(bodies[0].split.subaccounts[0].share, 1809);
    await initializeTransaction({ email: "guest@example.com", amountKobo: 52500, callbackUrl: "https://example.com/callback" });
    assert.equal(bodies[1].currency, "NGN");
    assert.equal(bodies[1].amount, 52500);
  } finally {
    mock.restoreAll();
    if (previous === undefined) delete process.env.PAYSTACK_SECRET_KEY;
    else process.env.PAYSTACK_SECRET_KEY = previous;
  }
});

test("USD receipts support database decimals and show dollar cents", async () => {
  const order = {
    id: "usd-order", reference: "USD-REF", name: "Ada", email: "guest@example.com", currency: "USD" as const,
    amount: new Prisma.Decimal("21.11"), ticketAmount: new Prisma.Decimal("20.10"), serviceFee: new Prisma.Decimal("1.01"), paidAt: new Date(),
    event: { id: "event", slug: "event", title: "Dollar Event", date: "2099-11-14", startTime: "18:00", endTime: "23:00", timezone: "Africa/Lagos", venue: "Lagos", state: "Lagos" },
    attendees: [], items: [{ quantity: 1, unitPrice: new Prisma.Decimal("20.10"), ticketType: { name: "Regular" } }],
  };
  const receipt = await bookingEmail(order);
  assert.ok(receipt.text.includes("$21.11"));
  assert.ok(receipt.text.includes("$20.10"));
  assert.ok(receipt.text.includes("$1.01"));
  assert.ok(!receipt.text.includes("₦"));
  assert.ok(bookingAlert(order, "organiser@example.com", false).text.includes("$21.11"));
});

test("Paystack fee amounts use minor units and reject invalid provider values", async () => {
  const { paystackFeeAmount, netAfterFees } = await import("../lib/payment-fees");
  assert.equal(paystackFeeAmount(788, 52500), 7.88);
  assert.equal(paystackFeeAmount(82, 2100), 0.82);
  assert.equal(paystackFeeAmount(0, 2100), 0);
  for (const fee of [undefined, null, "788", -1, 1.5, NaN, Infinity, 52501]) assert.equal(paystackFeeAmount(fee, 52500), null);
  assert.equal(netAfterFees(75, 7.88), 67.12);
  assert.equal(netAfterFees(0, 7.88), -7.88);
});
test("fee reconciliation accepts only the matching successful payment", async () => {
  const { verifiedFeeForPayment } = await import("../lib/fee-reconciliation");
  const record = { reference: "owned-ref", amount: 21, currency: "USD" };
  const payment = { reference: "owned-ref", amount: 2100, currency: "USD", status: "success", fees: 82 };
  assert.equal(verifiedFeeForPayment(record, payment), 0.82);
  for (const change of [{ reference: "other" }, { currency: "NGN" }, { amount: 2099 }, { status: "failed" }, { fees: null }]) assert.equal(verifiedFeeForPayment(record, { ...payment, ...change }), null);
});
