"use client";
import { useId, useState } from "react";
import { formatMoney } from "@/lib/currency";
export default function RevenueChart({ data, currency }: { data: { date: string; gross: number; platform: number; tickets: number }[]; currency: "NGN" | "USD" }) {
  const [metric, setMetric] = useState<"gross" | "platform" | "tickets">("gross");
  const [selected, setSelected] = useState<number | null>(null); const id = useId().replace(/:/g, "");
  const width = 800, height = 240, pad = 12; const maxValue = Math.max(...data.map(d => d[metric]), 0); const max = Math.max(maxValue, 1);
  const points = data.map((d, i) => [pad + i * (width - pad * 2) / Math.max(data.length - 1, 1), height - pad - d[metric] / max * (height - pad * 2)]);
  const path = points.map(([x, y], i) => `${i ? "L" : "M"}${x},${y}`).join(" ");
  const value = (amount: number) => metric === "tickets" ? amount.toLocaleString() : formatMoney(amount, currency);
  const active = selected === null ? null : data[selected];
  return <div>
    <div className="flex flex-wrap items-start justify-between gap-4"><div><h2 className="text-sm font-semibold">Money collected over time</h2><p className="mt-1 text-[11px] text-[#998CA6]">Daily activity across the selected period</p></div><div className="flex rounded-lg bg-[#F5F2F9] p-1">{(["gross", "platform", "tickets"] as const).map(key => <button key={key} aria-pressed={metric === key} onClick={() => { setMetric(key); setSelected(null); }} className={`rounded-md px-3 py-1.5 text-[10px] ${metric === key ? "bg-white font-semibold text-violet-700 shadow-sm" : "text-[#94849F]"}`}>{key === "gross" ? "Collected" : key === "platform" ? "Tickety before fees" : "Tickets"}</button>)}</div></div>
    <div className="mt-6 flex min-h-8 items-center justify-between text-[10px] text-[#998BA5]"><span>{value(maxValue)}</span><span aria-live="polite">{active ? `${active.date} · ${value(active[metric])}` : "Hover or use arrow keys to explore"}</span></div>
    <svg viewBox={`0 0 ${width} ${height}`} className="h-60 w-full touch-pan-y overflow-visible outline-none focus-visible:ring-2 focus-visible:ring-violet-300" role="img" aria-label="Daily revenue chart. Arrow keys select a date." tabIndex={0} onKeyDown={e => { if (e.key === "ArrowLeft" || e.key === "ArrowRight") { e.preventDefault(); setSelected(current => Math.max(0, Math.min(data.length - 1, (current ?? 0) + (e.key === "ArrowRight" ? 1 : -1)))); } }} onMouseMove={e => { const rect = e.currentTarget.getBoundingClientRect(); const x = (e.clientX - rect.left) / rect.width * width; setSelected(Math.max(0, Math.min(data.length - 1, Math.round((x - pad) / (width - pad * 2) * (data.length - 1))))); }} onMouseLeave={() => setSelected(null)}>
      <defs><linearGradient id={id} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#8B5CF6" stopOpacity=".24" /><stop offset="100%" stopColor="#8B5CF6" stopOpacity=".01" /></linearGradient></defs>
      {[0, 1, 2, 3].map(i => <line key={i} x1={pad} x2={width - pad} y1={pad + i * (height - 2 * pad) / 3} y2={pad + i * (height - 2 * pad) / 3} stroke="#EBE5F2" strokeDasharray="4 6" />)}
      {points.length > 0 && <><path d={`${path} L${points[points.length - 1][0]},${height - pad} L${pad},${height - pad} Z`} fill={`url(#${id})`} /><path d={path} fill="none" stroke="#7C3AED" strokeWidth="3" strokeLinejoin="round" />{selected !== null && points[selected] && <><line x1={points[selected][0]} x2={points[selected][0]} y1={pad} y2={height - pad} stroke="#C4A5EC" strokeDasharray="4 4" /><circle cx={points[selected][0]} cy={points[selected][1]} r="5" fill="#7C3AED" stroke="white" strokeWidth="3" /></>}</>}
    </svg><div className="flex justify-between text-[10px] text-[#A496AF]"><span>{data[0]?.date}</span><span>{data[data.length - 1]?.date}</span></div>
    <details className="mt-5 text-[10px] text-[#94849F]"><summary className="cursor-pointer">View daily data</summary><div className="mt-2 max-h-48 overflow-auto"><table className="w-full text-left"><thead><tr><th>Date</th><th>Collected</th><th>Tickety before Paystack</th><th>Tickets</th></tr></thead><tbody>{data.map(d => <tr key={d.date}><td className="py-1">{d.date}</td><td>{formatMoney(d.gross, currency)}</td><td>{formatMoney(d.platform, currency)}</td><td>{d.tickets}</td></tr>)}</tbody></table></div></details>
  </div>;
}
