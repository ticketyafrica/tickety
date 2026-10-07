import { roundMoney } from "../currency";
import { netAfterFees } from "../payment-fees";
import { AdminFilters, lagosDay } from "./filters";
export type RevenueRow = { date: Date; gross: number; tickets: number; serviceFee: number; commission: number; organiser: number; listing: number; platform?: number; paystackFee?: number | null; ticketCount: number; eventId?: string; eventTitle?: string };
export function revenueTotals(rows: RevenueRow[]) {
  const total = rows.reduce((sum, row) => {
    const platform = row.platform ?? row.commission + row.serviceFee + row.listing;
    const fee = row.gross === 0 ? 0 : row.paystackFee;
    const feeKnown = typeof fee === "number";
    const splitKnown = Math.abs(netAfterFees(row.gross, platform + row.organiser)) < 0.005;
    return {
      gross: roundMoney(sum.gross + row.gross), tickets: roundMoney(sum.tickets + row.tickets),
      serviceFee: roundMoney(sum.serviceFee + row.serviceFee), commission: roundMoney(sum.commission + row.commission),
      organiser: roundMoney(sum.organiser + row.organiser), listing: roundMoney(sum.listing + row.listing),
      ticketCount: sum.ticketCount + row.ticketCount, platform: roundMoney(sum.platform + platform),
      paystack: roundMoney(sum.paystack + (feeKnown ? fee : 0)),
      missingFees: sum.missingFees + (feeKnown ? 0 : 1),
      missingSplits: sum.missingSplits + (splitKnown ? 0 : 1),
      confirmedNet: netAfterFees(sum.confirmedNet + (feeKnown && splitKnown ? platform : 0), feeKnown && splitKnown ? fee : 0),
    };
  }, { gross: 0, tickets: 0, serviceFee: 0, commission: 0, organiser: 0, listing: 0, ticketCount: 0, platform: 0, paystack: 0, missingFees: 0, missingSplits: 0, confirmedNet: 0 });
  return { ...total, recordedNet: total.missingFees === 0 ? netAfterFees(total.platform, total.paystack) : null, net: total.missingFees === 0 && total.missingSplits === 0 ? netAfterFees(total.platform, total.paystack) : null };
}
export type RevenueTotals = ReturnType<typeof revenueTotals>;
export function revenueGrowth(current: number, previous: number): number | null { return previous === 0 ? null : ((current - previous) / previous) * 100; }
export function dailyRevenue(rows: RevenueRow[], filters: Pick<AdminFilters, "start" | "end">) {
  const days = new Map<string, RevenueRow[]>();
  for (let time = filters.start.getTime(); time < filters.end.getTime(); time += 86400000) days.set(lagosDay(new Date(time)), []);
  for (const row of rows) days.get(lagosDay(row.date))?.push(row);
  return [...days].map(([date, rows]) => { const t = revenueTotals(rows); return { date, gross: t.gross, platform: t.platform, tickets: t.ticketCount, organiser: t.organiser, paystack: t.missingFees ? null : t.paystack, knownPaystackFees: t.paystack, net: t.net, recordedNet: t.recordedNet, missingFees: t.missingFees, missingSplits: t.missingSplits }; });
}
