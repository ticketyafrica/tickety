import { prisma } from "../db";
import { verifyTransaction } from "../paystack";
import { verifiedFeeForPayment } from "../fee-reconciliation";

export async function syncPaystackFees(options: { eventId?: string; orderCursor?: string; listingCursor?: string } = {}) {
  const orderWhere = { status: "paid" as const, paystackFee: null, amount: { gt: 0 }, ...(options.eventId ? { eventId: options.eventId } : {}) };
  const listingWhere = { status: "paid" as const, paystackFee: null, ...(options.eventId ? { eventId: options.eventId } : {}) };
  const [orders, listings] = await Promise.all([
    prisma.order.findMany({ where: { ...orderWhere, ...(options.orderCursor ? { id: { gt: options.orderCursor } } : {}) }, select: { id: true, amount: true, currency: true, paystackRef: true }, orderBy: { id: "asc" }, take: 20 }),
    prisma.listingFeePayment.findMany({ where: { ...listingWhere, ...(options.listingCursor ? { id: { gt: options.listingCursor } } : {}) }, select: { id: true, amount: true, paystackRef: true }, orderBy: { id: "asc" }, take: 20 }),
  ]);
  const records = [...orders.map(o => ({ id: o.id, reference: o.paystackRef, amount: Number(o.amount), currency: o.currency, kind: "order" })), ...listings.map(l => ({ id: l.id, reference: l.paystackRef, amount: l.amount, currency: "NGN", kind: "listing" }))];
  let synced = 0;
  let orderCursor = options.orderCursor || "", listingCursor = options.listingCursor || "";
  const deadline = Date.now() + 30000;
  // Process in small parallel batches. Fees come only from verified transactions.
  for (let index = 0; index < records.length; index += 4) {
    if (Date.now() >= deadline) break;
    const batch = records.slice(index, index + 4);
    await Promise.all(batch.map(async record => {
      try {
        const verification = await verifyTransaction(record.reference, { signal: AbortSignal.timeout(10000) });
        const fee = verifiedFeeForPayment(record, verification);
        if (fee === null) return;
        const result = record.kind === "order"
          ? await prisma.order.updateMany({ where: { id: record.id, paystackRef: record.reference, status: "paid", paystackFee: null }, data: { paystackFee: fee } })
          : await prisma.listingFeePayment.updateMany({ where: { id: record.id, paystackRef: record.reference, status: "paid", paystackFee: null }, data: { paystackFee: fee } });
        synced += result.count;
      } catch { /* Keep unverified fees unknown; another integration/key may own the reference. */ }
    }));
    for (const record of batch) {
      if (record.kind === "order") orderCursor = record.id;
      else listingCursor = record.id;
    }
  }
  const [remainingOrders, remainingListings, laterOrders, laterListings] = await Promise.all([
    prisma.order.count({ where: orderWhere }), prisma.listingFeePayment.count({ where: listingWhere }),
    prisma.order.count({ where: { ...orderWhere, ...(orderCursor ? { id: { gt: orderCursor } } : {}) } }),
    prisma.listingFeePayment.count({ where: { ...listingWhere, ...(listingCursor ? { id: { gt: listingCursor } } : {}) } }),
  ]);
  return { synced, remaining: remainingOrders + remainingListings, more: laterOrders + laterListings > 0, orderCursor, listingCursor };
}
