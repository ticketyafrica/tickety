"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
export default function EventStatusControl({ id, status }: { id: string; status: string }) {
  const router = useRouter(); const [next, setNext] = useState(status); const [saving, setSaving] = useState(false); const [error, setError] = useState("");
  async function save() {
    setSaving(true); setError("");
    try { const response = await fetch(`/api/admin/events/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: next }) }); const data = await response.json(); if (!response.ok) throw new Error(data.error || "Unable to update event"); router.refresh(); }
    catch (e) { setError(e instanceof Error ? e.message : "Unable to update event"); } finally { setSaving(false); }
  }
  return <div><div className="flex flex-wrap items-center gap-2"><select value={next} onChange={e => setNext(e.target.value)} disabled={saving} aria-label="Event status" className="h-10 rounded-lg border bg-white px-3 text-xs">{["live", "pending", "disabled", "archived"].map(s => <option key={s}>{s}</option>)}</select><button onClick={save} disabled={saving || next === status} className="flex h-10 items-center gap-2 rounded-lg bg-violet-700 px-3 text-xs font-semibold text-white disabled:opacity-40">{saving && <Loader2 size={13} className="animate-spin" />} Save status</button></div>{error && <p role="alert" className="mt-2 text-xs text-red-600">{error}</p>}</div>;
}
