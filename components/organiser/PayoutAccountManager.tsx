"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Landmark, Loader2, Pencil, ShieldCheck } from "lucide-react";
import PayoutSetupForm from "./PayoutSetupForm";

type AccountDetails = { accountName: string; bankName: string; accountLast4: string; businessName: string };

export default function PayoutAccountManager({ name, email }: { name: string; email: string }) {
  const [editing, setEditing] = useState(false);
  const [details, setDetails] = useState<AccountDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updated, setUpdated] = useState(false);
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    async function loadDetails() {
      setLoading(true); setError("");
      try {
        const response = await fetch("/api/organiser/payout?details=1", { cache: "no-store", signal: controller.signal });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Unable to load payout details.");
        setDetails(data.details ?? null);
      } catch (error) {
        if (!controller.signal.aborted) setError(error instanceof Error ? error.message : "Unable to load payout details.");
      } finally { if (!controller.signal.aborted) setLoading(false); }
    }
    loadDetails();
    return () => controller.abort();
  }, [revision]);

  if (editing) return <PayoutSetupForm mode="edit" initialBusinessName={details?.businessName || name} onCancel={() => setEditing(false)} onSaved={() => { setEditing(false); setDetails(null); setUpdated(true); setRevision((value) => value + 1); }} />;

  return (
    <div className="p-6 sm:p-8 lg:p-10">
      <div className="flex h-12 w-12 items-center justify-center rounded-[14px] bg-[#ECFDF3] text-[#16803C]"><CheckCircle2 size={23} strokeWidth={1.8} /></div>
      <p className="mt-6 text-[9px] font-bold uppercase tracking-[0.18em] text-[#16803C]">NGN payouts connected</p>
      <h2 className="mt-2 font-display text-2xl font-semibold tracking-[-0.04em]">Your payout account is ready.</h2>
      <p className="mt-2 max-w-lg text-sm leading-6 text-black/45">Your event earnings are routed to your connected Nigerian bank account.</p>
      {updated && <p role="status" className="mt-5 rounded-xl border border-green-200 bg-green-50 p-4 text-xs leading-5 text-green-800">Your payout account has been updated successfully.</p>}
      <div className="mt-7 rounded-[16px] border border-black/[0.07] bg-[#FAFAF9] p-5">
        <div className="flex items-center gap-2 text-xs font-semibold"><Landmark size={16} className="text-violet-600" /> Connected bank account</div>
        {loading ? <p role="status" className="mt-4 flex items-center gap-2 text-xs text-black/45"><Loader2 size={14} className="animate-spin" /> Loading payout details...</p> : error ? <div className="mt-4"><p role="alert" className="text-xs leading-5 text-red-700">{error}</p><button type="button" onClick={() => setRevision((value) => value + 1)} className="mt-2 min-h-10 text-xs font-semibold text-violet-700">Try again</button></div> : details ? <div className="mt-4 grid gap-4 sm:grid-cols-2"><Detail label="Bank" value={details.bankName || "Connected bank"} /><Detail label="Account number" value={details.accountLast4 ? `••••••${details.accountLast4}` : "Not available"} /><Detail label="Account holder" value={details.accountName || "Not available"} /><Detail label="Business or organiser name" value={details.businessName || name} /></div> : <p className="mt-4 text-xs text-black/45">Your account is connected.</p>}
      </div>
      <button type="button" onClick={() => { setUpdated(false); setEditing(true); }} className="mt-6 inline-flex min-h-12 items-center gap-2 rounded-[13px] bg-[#111014] px-5 text-sm font-semibold text-white transition-colors hover:bg-violet-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-violet-600"><Pencil size={15} /> Change payout account</button>
      <div className="mt-8 grid gap-5 border-t border-black/[0.07] pt-6 sm:grid-cols-2"><Detail label="Organiser" value={name} /><Detail label="Email" value={email} /></div>
      <p className="mt-6 flex items-start gap-2 text-xs leading-6 text-black/45"><ShieldCheck size={16} className="mt-1 shrink-0 text-violet-600" />New bank details must be verified before you can confirm a change. USD payout settings are managed separately.</p>
    </div>
  );
}
function Detail({ label, value }: { label: string; value: string }) {
  return <div><p className="text-[9px] font-bold uppercase tracking-[0.14em] text-black/40">{label}</p><p className="mt-1.5 break-words text-sm font-medium text-[#111014]">{value}</p></div>;
}
