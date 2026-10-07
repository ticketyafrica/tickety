import Link from "next/link";
import { ArrowUpRight, Camera, HeartHandshake, Megaphone, ScanLine, Ticket } from "lucide-react";
import { SERVICES } from "@/lib/services";

const icons = [Ticket, ScanLine, Megaphone, Camera, HeartHandshake];

export default function ServicesIntro() {
  return (
    <section aria-labelledby="services-intro-title" className="relative overflow-hidden border-y border-[#E9E2EE] bg-[#F2EDF7] px-6 py-16 sm:px-10 lg:px-16 lg:py-24">
      <div className="mx-auto grid max-w-[1312px] items-center gap-10 lg:grid-cols-[1.1fr_1fr] lg:gap-24">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#6D28D9]">What we offer / Beyond the ticket</p>
          <h2 id="services-intro-title" className="mt-5 font-display text-[clamp(2.4rem,4.5vw,4.4rem)] font-semibold leading-[1.04] tracking-[-0.06em] text-[#30203D]">The moment is yours.<br /><span className="text-[#6D28D9]">The support is ours.</span></h2>
          <p className="mt-6 max-w-md text-sm leading-7 text-[#766580]">From selling your first ticket to capturing the final encore, we help you bring every part of your event together. A platform, a creative partner and a team in your corner.</p>
          <Link href="/what-we-offer" className="group mt-8 inline-flex min-h-12 items-center gap-4 rounded-full bg-[#6D28D9] py-3 pl-6 pr-3 text-sm font-semibold text-white transition-colors hover:bg-[#5520AC] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-violet-600">Discover what we offer <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15"><ArrowUpRight size={17} className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 motion-reduce:transform-none" /></span></Link>
        </div>
        <div className="relative">
          <div aria-hidden="true" className="absolute -right-7 -top-7 h-28 w-28 rounded-full bg-[#DDF7AE]" />
          <div className="relative rounded-[28px] border border-white/80 bg-[#FDFBF9] p-3 shadow-[0_18px_60px_#36204708] sm:p-5">
            {SERVICES.map((service, index) => {
              const Icon = icons[index];
              return <Link key={service.id} href={`/what-we-offer#${service.id}`} className="group flex min-h-[74px] items-center gap-4 rounded-2xl px-3 py-4 transition-colors hover:bg-[#F2EDF7] focus-visible:outline focus-visible:outline-2 focus-visible:outline-violet-600 sm:px-4"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F2EDF7] text-[#6D28D9]"><Icon size={19} strokeWidth={1.5} /></span><span className="flex-1 text-sm font-medium text-[#443050]">{service.title}</span><span className="text-[10px] text-[#A494AF] group-hover:hidden">/{service.number}</span><ArrowUpRight size={16} className="hidden text-[#6D28D9] group-hover:block" /></Link>;
            })}
            <div className="mx-3 mt-2 border-t border-[#EBE3F1] pt-4 pb-2 text-center text-[10px] uppercase tracking-[0.14em] text-[#9D8CA9]">One vision. Five ways to make it happen.</div>
          </div>
        </div>
      </div>
    </section>
  );
}
