import { Currency, toMinorUnits } from "./currency";

export function matchesTicketPayment(
  order: { amount: number | { toString(): string }; currency: Currency; paystackRef: string },
  payment: { amount?: number; currency?: string; reference?: string }
): boolean {
  return payment.amount === toMinorUnits(Number(order.amount)) &&
    payment.currency === order.currency && Boolean(payment.reference) &&
    (order.paystackRef === payment.reference || order.paystackRef.startsWith("PENDING-"));
}
