// Paystack reports transaction fees in the payment currency's minor units.
export function paystackFeeAmount(fees: unknown, amountMinor: number): number | null {
  return Number.isSafeInteger(amountMinor) && amountMinor >= 0 && typeof fees === "number" && Number.isSafeInteger(fees) && fees >= 0 && fees <= amountMinor ? fees / 100 : null;
}
export function netAfterFees(gross: number, fees: number): number {
  return (Math.round(gross * 100) - Math.round(fees * 100)) / 100;
}
