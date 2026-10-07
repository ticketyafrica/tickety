import { Currency, toMinorUnits } from "./currency";
export const LISTING_FEE_NAIRA = 50000;
export const LISTING_FEE_KOBO = LISTING_FEE_NAIRA * 100;
export const TICKET_SERVICE_FEE_PERCENT = 5;
export const TICKET_SERVICE_FEE_CAP_NAIRA = 2500;
export const TICKET_SERVICE_FEE_CAP_USD = 5;

// Charged once per order: whole naira for NGN, cents for USD.
export function calculateTicketServiceFee(ticketSubtotal: number, currency: Currency = "NGN"): number {
  if (ticketSubtotal <= 0) return 0;
  return Math.min(
    (currency === "USD"
      ? Math.round((toMinorUnits(ticketSubtotal) * TICKET_SERVICE_FEE_PERCENT) / 100) / 100
      : Math.round((ticketSubtotal * TICKET_SERVICE_FEE_PERCENT) / 100)),
    currency === "USD" ? TICKET_SERVICE_FEE_CAP_USD : TICKET_SERVICE_FEE_CAP_NAIRA
  );
}
export const TICKET_COMMISSION_PERCENT = 10;
export function calculateTicketCommission(ticketSubtotal: number, currency: Currency = "NGN"): number {
  return currency === "USD"
    ? Math.round((toMinorUnits(ticketSubtotal) * TICKET_COMMISSION_PERCENT) / 100) / 100
    : Math.round((ticketSubtotal * TICKET_COMMISSION_PERCENT) / 100);
}
