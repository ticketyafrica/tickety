import { paystackFeeAmount } from "./payment-fees";
import { toMinorUnits } from "./currency";
export function verifiedFeeForPayment(record: { reference: string; amount: number; currency: string }, payment: { reference?: string; status?: string; amount?: number; currency?: string; fees?: unknown }): number | null {
  if (payment.reference !== record.reference || payment.status !== "success" || payment.currency !== record.currency || payment.amount !== toMinorUnits(record.amount)) return null;
  return paystackFeeAmount(payment.fees, payment.amount);
}
