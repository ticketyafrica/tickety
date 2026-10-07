"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { KeyRound, Loader2, ShieldCheck } from "lucide-react";

export default function PayoutPinSetup({ existingAccount = false }: { existingAccount?: boolean }) {
  const router = useRouter();
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError("");
    if (!/^\d{6}$/.test(pin) || pin !== confirmPin) { setError("Enter and confirm a matching 6-digit PIN."); return; }
    setSaving(true);
    try {
      const response = await fetch("/api/organiser/payout/pin", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ pin, confirmPin, password }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to set payout PIN.");
      setPin(""); setConfirmPin(""); setPassword(""); setSuccess(true); router.refresh();
    } catch (error) { setError(error instanceof Error ? error.message : "Unable to set payout PIN."); }
    finally { setSaving(false); }
  }
  const inputClass = "mt-2 h-12 w-full rounded-[13px] border border-black/10 bg-white px-4 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100 disabled:opacity-50";
  return (
    <form onSubmit={submit} className="p-6 sm:p-8 lg:p-10">
      <div className="flex h-12 w-12 items-center justify-center rounded-[14px] bg-violet-50 text-violet-700"><KeyRound size={22} /></div>
      <p className="mt-6 text-[9px] font-bold uppercase tracking-[0.18em] text-violet-700">Payout security / First step</p>
      <h2 className="mt-2 font-display text-2xl font-semibold tracking-[-0.04em]">Set your payout PIN.</h2>
      <p className="mt-3 text-sm leading-6 text-black/50">Create a 6-digit PIN before {existingAccount ? "managing your connected bank account" : "adding your bank details"}. You’ll need it to connect an account or change payout details. This is your Tickety payout PIN; choose your own PIN rather than entering your bank or card PIN.</p>
      {existingAccount && <p className="mt-3 text-xs leading-6 text-black/50">Your existing payout account stays connected. Set a PIN to protect changes to it.</p>}
      <div className="mt-7 space-y-5">
        <label className="block text-xs font-semibold">Current login password<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" maxLength={200} disabled={saving || success} className={inputClass} /></label>
        <div className="grid gap-5 sm:grid-cols-2">
          <label className="block text-xs font-semibold">New payout PIN<input type="password" inputMode="numeric" value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))} required pattern="[0-9]{6}" minLength={6} maxLength={6} autoComplete="off" disabled={saving || success} className={`${inputClass} tracking-[0.3em]`} /></label>
          <label className="block text-xs font-semibold">Confirm payout PIN<input type="password" inputMode="numeric" value={confirmPin} onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, "").slice(0, 6))} required pattern="[0-9]{6}" minLength={6} maxLength={6} autoComplete="off" disabled={saving || success} className={`${inputClass} tracking-[0.3em]`} /></label>
        </div>
      </div>
      {error && <p role="alert" className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-xs leading-6 text-red-700">{error}</p>}
      {success && <p role="status" className="mt-5 text-sm text-green-700">Payout PIN set. Loading your bank settings...</p>}
      <button type="submit" disabled={saving || success || pin.length !== 6 || confirmPin.length !== 6 || !password} className="mt-7 flex min-h-12 w-full items-center justify-center gap-2 rounded-[13px] bg-[#111014] px-4 py-3 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-40">{saving ? <><Loader2 size={16} className="animate-spin" /> Setting PIN...</> : <><ShieldCheck size={16} /> Set PIN and continue</>}</button>
      <p className="mt-4 text-xs leading-6 text-black/45">Your login password confirms it’s you. Your PIN is stored securely and won’t be displayed. Five incorrect attempts temporarily lock payout actions for 15 minutes.</p>
    </form>
  );
}
