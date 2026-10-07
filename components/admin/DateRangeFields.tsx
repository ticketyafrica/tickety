"use client";
import { useState } from "react";
export default function DateRangeFields({ range, start, end }: { range: string; start: string; end: string }) {
  const [selected, setSelected] = useState(range);
  const field = "mt-1 block h-10 rounded-lg border border-[#E4DEEB] bg-white px-3 text-xs outline-none focus:border-violet-500";
  return <><label className="text-[10px] font-medium text-[#8B7C98]">Period<select name="range" value={selected} onChange={e => setSelected(e.target.value)} className={field}><option value="today">Today</option><option value="7d">Last 7 days</option><option value="30d">Last 30 days</option><option value="90d">Last 90 days</option><option value="year">This year</option><option value="custom">Custom dates</option></select></label><label className="text-[10px] font-medium text-[#8B7C98]">From<input type="date" name="start" defaultValue={start} onChange={() => setSelected("custom")} className={`${field} w-[145px]`} /></label><label className="text-[10px] font-medium text-[#8B7C98]">To<input type="date" name="end" defaultValue={end} onChange={() => setSelected("custom")} className={`${field} w-[145px]`} /></label></>;
}
