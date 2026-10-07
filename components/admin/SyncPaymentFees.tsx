"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, RefreshCw } from "lucide-react";
export default function SyncPaymentFees({ eventId }: { eventId?: string }) {
  const router = useRouter(); const [busy, setBusy] = useState(false); const [message, setMessage] = useState("");
  const [cursor, setCursor] = useState<{ orderCursor?: string; listingCursor?: string }>({});
  async function sync() {
    setBusy(true); setMessage("");
    try { const response = await fetch(eventId ? `/api/admin/events/${eventId}/sync-fees` : "/api/admin/payments/sync-fees", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(cursor) }); const data = await response.json(); if (!response.ok) throw new Error(data.error || "Unable to fetch fees."); setCursor(data.more ? { orderCursor: data.orderCursor, listingCursor: data.listingCursor } : {}); setMessage(`${data.synced} payment fees confirmed. ${data.remaining ? `${data.remaining} still need confirmation${data.more ? "; run again to fetch the next batch" : "; Paystack could not verify these payments"}.` : "All processing fees are recorded."}`); router.refresh(); }
    catch (error) { setMessage(error instanceof Error ? error.message : "Unable to fetch fees."); }
    finally { setBusy(false); }
  }
  return <div className="max-w-md"><button onClick={sync} disabled={busy} className="flex min-h-10 items-center gap-2 rounded-xl border border-[#DDD4E9] bg-white px-4 text-xs font-semibold text-violet-700 hover:bg-violet-50 disabled:opacity-50">{busy ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />} {busy ? "Fetching Paystack fees..." : "Fetch confirmed Paystack fees"}</button>{message && <p role="status" className="mt-2 text-[10px] leading-5 text-[#9784A5]">{message}</p>}</div>;
}
