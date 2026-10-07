import { ArrowUpRight, Camera, Check, HeartHandshake, Megaphone, QrCode, ScanLine, Sparkles, Ticket } from "lucide-react";

export default function ServiceArtwork({ type }: { type: string }) {
  return (
    <div aria-hidden="true" className="relative flex h-56 items-center justify-center overflow-hidden rounded-[24px] bg-[#F0ECF7] sm:h-64">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_20%,#ffffff_0%,transparent_60%)]" />
      <div className="absolute h-64 w-64 rounded-full border border-[#6D28D9]/10" />
      <div className="absolute h-44 w-44 rounded-full border border-[#6D28D9]/10" />
      {type === "ticket" ? (
        <div className="relative w-64 -rotate-6 rounded-2xl bg-[#6D28D9] p-5 text-white shadow-[12px_20px_0_#DFD3F5]">
          <div className="flex justify-between text-[9px] font-semibold uppercase tracking-[0.18em]"><span>Tickety / Your next moment</span><Ticket size={16} /></div>
          <p className="mt-7 font-display text-3xl font-semibold tracking-[-0.05em]">You’re on the list.</p>
          <div className="mt-5 flex items-center justify-between border-t border-dashed border-white/30 pt-4"><span className="text-[10px] uppercase tracking-widest">One ticket.<br />So much possibility.</span><QrCode size={38} strokeWidth={1.5} /></div>
          <span className="absolute -left-2 top-[126px] h-4 w-4 rounded-full bg-[#F0ECF7]" /><span className="absolute -right-2 top-[126px] h-4 w-4 rounded-full bg-[#F0ECF7]" />
        </div>
      ) : type === "scan" ? (
        <div className="relative flex h-40 w-40 items-center justify-center rounded-3xl border border-white bg-white/70 shadow-xl shadow-purple-900/5">
          <QrCode size={94} strokeWidth={1.3} className="text-[#36204C]" />
          <div className="absolute inset-x-3 top-20 h-0.5 bg-[#6D28D9] shadow-[0_0_15px_#8B5CF6]" />
          <div className="absolute -bottom-4 -right-9 flex items-center gap-2 rounded-full bg-[#DDF7AE] px-4 py-2.5 text-xs font-semibold text-[#31421A]"><Check size={15} /> Welcome in.</div>
          <ScanLine className="absolute -left-7 -top-5 text-[#6D28D9]" size={29} />
        </div>
      ) : type === "megaphone" ? (
        <div className="relative flex h-32 w-32 rotate-[-12deg] items-center justify-center rounded-full bg-[#DDF7AE] text-[#40324F] shadow-[14px_14px_0_#E1D8EF]">
          <Megaphone size={65} strokeWidth={1.4} />
          <span className="absolute -right-14 -top-7 rotate-12 rounded-full bg-white px-4 py-2 text-xs font-semibold shadow-sm">Make some noise.</span>
          <Sparkles size={28} className="absolute -bottom-9 -left-7 text-[#6D28D9]" />
          <ArrowUpRight size={45} className="absolute -right-14 bottom-0 text-[#6D28D9]" />
        </div>
      ) : type === "camera" ? (
        <div className="relative h-40 w-52 -rotate-6 rounded-[20px] bg-[#38234E] p-4 text-white shadow-[12px_12px_0_#D4C4EA]">
          <div className="flex justify-between text-[9px] uppercase tracking-widest"><span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-[#DDF7AE]" /> Capture the feeling</span><span>REC</span></div>
          <Camera size={58} strokeWidth={1.2} className="mx-auto mt-6 text-[#DDF7AE]" />
          <span className="absolute -bottom-5 -right-6 rotate-6 rounded-full bg-white px-4 py-2 text-xs font-semibold text-[#38234E]">Worth remembering.</span>
        </div>
      ) : (
        <div className="relative flex h-32 w-32 items-center justify-center rounded-[36px] bg-[#6D28D9] text-white shadow-[12px_12px_0_#D5C6EB]">
          <HeartHandshake size={65} strokeWidth={1.2} />
          <span className="absolute -left-16 -top-6 -rotate-6 rounded-full bg-white px-4 py-2 text-xs font-semibold text-[#38234E]">We’re with you.</span>
          <span className="absolute -bottom-7 -right-14 rotate-6 rounded-full bg-[#DDF7AE] px-4 py-2 text-xs font-semibold text-[#38234E]">Every step of the way.</span>
        </div>
      )}
    </div>
  );
}
