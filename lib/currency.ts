export type Currency = "NGN" | "USD";
export function isCurrency(value: unknown): value is Currency {
  return value === "NGN" || value === "USD";
}
export function formatMoney(amount: number, currency: Currency = "NGN"): string {
  return new Intl.NumberFormat("en-NG", {
    style: "currency", currency,
    minimumFractionDigits: currency === "USD" ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(amount);
}
export function toMinorUnits(amount: number): number {
  const result = Math.round(amount * 100);
  if (!Number.isFinite(amount) || amount < 0 || !Number.isSafeInteger(result)) {
    throw new Error("Invalid payment amount");
  }
  return result;
}
export function isValidPrice(amount: number): boolean {
  return Number.isFinite(amount) && amount >= 0 && amount <= 10_000_000 &&
    Math.abs(amount * 100 - Math.round(amount * 100)) < 0.000001;
}
export function roundMoney(amount: number): number {
  return toMinorUnits(amount) / 100;
}
export function formatCurrencyTotals(items: { amount: number; currency?: Currency }[]): string {
  const totals: Partial<Record<Currency, number>> = {};
  for (const item of items) {
    const currency = item.currency ?? "NGN";
    totals[currency] = (totals[currency] ?? 0) + item.amount;
  }
  return Object.entries(totals).map(([currency, amount]) => formatMoney(amount, currency as Currency)).join(" · ") || formatMoney(0);
}
