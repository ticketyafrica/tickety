import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowDown, ArrowRight, ArrowUpRight, Check, MessageCircle, Sparkles, Ticket } from "lucide-react";
import { SERVICES, servicesWhatsAppUrl } from "@/lib/services";
import ServiceArtwork from "@/components/services/ServiceArtwork";

export const metadata: Metadata = {
  title: "What We Offer — Ticketing, Promotion & Event Support | Tickety",
  description: "From event ticketing and QR check-in to promotion, content creation and event support. Discover what Tickety can do for your next event and talk to our team on WhatsApp.",
};
const contactClass = "group inline-flex min-h-12 items-center justify-center gap-3 rounded-full px-6 py-3 text-sm font-semibold transition-all hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-violet-600 motion-reduce:transform-none";

export default function WhatWeOfferPage() {
  return (
    <main className="overflow-hidden bg-[#F8F6F0] text-[#251B30]">
      <section className="relative mx-auto max-w-[1440px] px-6 pb-16 pt-36 sm:px-10 sm:pt-44 lg:px-16 lg:pb-24">
        <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_1fr] lg:gap-16">
          <div>
            <p className="flex items-center gap-3 text-[10px] font-semibold uppercase tracking-[0.22em] text-[#6D28D9]"><span className="h-2 w-2 rounded-full bg-[#6D28D9]" /> What we offer / Made for your next event</p>
            <h1 className="mt-7 font-display text-[clamp(3rem,6.4vw,6.3rem)] font-semibold leading-[0.98] tracking-[-0.065em]">You bring<br />the vision.<br /><span className="text-[#6D28D9]">We bring it<br className="hidden sm:block" /> to life.</span></h1>
            <p className="mt-7 max-w-md text-base leading-7 text-[#746B7C]">The tickets. The welcome. The buzz. The memories.<br className="hidden sm:block" /> Everything that helps your event become an experience.</p>
            <div className="mt-8 flex flex-wrap items-center gap-5">
              <a href={servicesWhatsAppUrl()} target="_blank" rel="noopener noreferrer" className={`${contactClass} bg-[#6D28D9] text-white hover:bg-[#5420AE]`}><MessageCircle size={18} /> Let’s talk about your event <ArrowUpRight size={17} /></a>
              <a href="#services" className="inline-flex min-h-12 items-center gap-2 text-sm font-medium text-[#564A61] hover:text-[#6D28D9]">Explore our services <ArrowDown size={15} /></a>
            </div>
            <p className="mt-5 text-xs text-[#746B7C]">One conversation. A clearer plan for your event.</p>
          </div>
          <div className="relative mx-auto w-full max-w-[540px] pb-8 pt-6 lg:pt-0">
            <div className="absolute -right-6 top-0 h-36 w-36 rounded-full border border-[#6D28D9]/15 sm:h-48 sm:w-48" aria-hidden="true" />
            <div className="relative aspect-[4/4.2] overflow-hidden rounded-[180px_180px_28px_28px] bg-[#38234E] sm:rounded-[230px_230px_32px_32px]">
              <Image src="/images/event-poster.jpg" alt="A crowd sharing a live event under purple stage lights" fill priority sizes="(max-width: 1024px) 90vw, 540px" className="object-cover brightness-[0.7] saturate-[0.85]" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#21132F] via-transparent to-transparent" />
              <span className="absolute left-7 top-24 flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-[10px] uppercase tracking-[0.16em] text-white backdrop-blur-md"><Sparkles size={13} /> For the moments that matter</span>
              <div className="absolute bottom-8 left-8 right-8 text-white"><p className="text-[10px] uppercase tracking-[0.2em] text-white/70">From the first idea to the final encore.</p><p className="mt-3 font-display text-[26px] font-medium leading-[1.05] tracking-[-0.05em] sm:text-5xl">A little less logistics.<br />A lot more magic.</p></div>
            </div>
            <div className="absolute -left-3 top-[26%] max-w-[180px] sm:top-[45%] sm:max-w-[210px] -rotate-6 rounded-2xl border border-[#E9E0F0] bg-white p-3 shadow-[0_16px_50px_#251B3020] sm:-left-7 sm:p-5" aria-hidden="true">
              <div className="flex items-center gap-2 text-[9px] uppercase tracking-[0.14em] text-[#8E7DA0]"><Ticket size={15} className="text-[#6D28D9]" /> Your next great moment</div><p className="mt-4 font-display text-lg font-semibold tracking-[-0.04em] sm:text-xl">Starts with Tickety.</p><div className="mt-4 border-t border-dashed border-[#DFD4EC] pt-3 text-[10px] text-[#736180]">Plan it. Share it. Make it happen.</div>
            </div>
            <div className="absolute -bottom-1 right-1 flex rotate-3 items-center gap-3 rounded-2xl bg-[#DDF7AE] px-5 py-4 text-[#354623] shadow-lg shadow-black/5"><span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#354623]/10"><Check size={18} /></span><div><p className="text-xs font-semibold">Your event, supported.</p><p className="mt-0.5 text-[10px] text-[#354623]/70">Before. During. And after.</p></div></div>
          </div>
        </div>
      </section>

      <div className="border-y border-[#E4DFE8] bg-white/40 px-6 py-5"><div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-7 gap-y-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#6A5C78]">{["Ticketing", "Registration & check-in", "Promotion", "Content creation", "Event support"].map((item, index) => <span key={item} className="flex items-center gap-7">{index > 0 && <span aria-hidden="true" className="hidden h-1 w-1 rounded-full bg-[#A28AAF] sm:block" />}{item}</span>)}</div></div>

      <section id="services" className="mx-auto max-w-[1440px] scroll-mt-28 px-6 py-20 sm:px-10 lg:px-16 lg:py-28">
        <div className="mb-12 grid gap-6 md:grid-cols-2 md:items-end">
          <div><p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#6D28D9]">Five ways we make it happen</p><h2 className="mt-4 font-display text-4xl font-semibold leading-[1.03] tracking-[-0.055em] sm:text-5xl lg:text-6xl">Every great event<br />has a great team.</h2></div>
          <p className="max-w-sm text-sm leading-7 text-[#746B7C] md:justify-self-end">Choose the support you need. Whether you’re opening ticket sales or bringing the whole experience together, we’re here to help.</p>
        </div>
        <div className="grid gap-5 md:grid-cols-2 lg:gap-6">
          {SERVICES.map((service, index) => (
            <article id={service.id} key={service.id} className={`group scroll-mt-28 rounded-[32px] border p-6 sm:p-8 ${index === 0 ? "border-[#6D28D9] bg-[#6D28D9] text-white md:col-span-2" : "border-[#E6E0EB] bg-[#FDFCF9]"}`}>
              <div className={index === 0 ? "grid gap-8 md:grid-cols-2 md:items-center" : ""}>
                <div>
                  <div className="flex items-center justify-between"><p className={`text-[10px] font-semibold uppercase tracking-[0.13em] ${index === 0 ? "text-white/80" : "text-[#6D28D9]"}`}>{service.title}</p><span className={`font-display text-sm ${index === 0 ? "text-white/55" : "text-[#AA99B8]"}`}>/{service.number}</span></div>
                  <h3 className="mt-6 whitespace-pre-line font-display text-[32px] font-semibold leading-[1.08] tracking-[-0.05em] sm:text-[38px]">{service.headline}</h3>
                  <p className={`mt-5 max-w-lg text-sm leading-7 ${index === 0 ? "text-white/80" : "text-[#746B7C]"}`}>{service.description}</p>
                  <ul className={`mt-6 flex flex-wrap gap-2 ${index === 0 ? "text-white/90" : "text-[#665475]"}`}>{service.features.map((feature) => <li key={feature} className={`rounded-full border px-3 py-2 text-[10px] ${index === 0 ? "border-white/20" : "border-[#E7DEEF]"}`}>{feature}</li>)}</ul>
                  <a href={servicesWhatsAppUrl(service.title)} target="_blank" rel="noopener noreferrer" className={`mt-7 inline-flex min-h-11 items-center gap-2 text-xs font-semibold underline decoration-transparent underline-offset-4 transition-colors hover:decoration-current focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 ${index === 0 ? "text-[#DDF7AE]" : "text-[#6D28D9]"}`}>Let’s talk {service.title.toLowerCase()} <ArrowUpRight size={16} /></a>
                </div>
                <div className={index === 0 ? "" : "mt-5"}><ServiceArtwork type={service.icon} /><p className={`mt-4 text-center text-[10px] ${index === 0 ? "text-white/65" : "text-[#8D7D99]"}`}>{service.note}</p></div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="bg-[#EDE7F5] px-6 py-16 sm:px-10 lg:py-24"><div className="mx-auto max-w-[1312px]">
        <div className="grid gap-10 lg:grid-cols-[1fr_1.5fr]"><div><p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#6D28D9]">From “what if” to “we did it”</p><h2 className="mt-4 font-display text-4xl font-semibold leading-[1.05] tracking-[-0.05em]">A simple start.<br />A shared journey.</h2><a href={servicesWhatsAppUrl()} target="_blank" rel="noopener noreferrer" className="mt-6 inline-flex min-h-11 items-center gap-2 text-xs font-semibold text-[#6D28D9]">Start the conversation <ArrowUpRight size={16} /></a></div>
        <ol className="grid gap-8 sm:grid-cols-3">{[{ title: "Tell us your idea", text: "Share your event, your audience and what you need help with." }, { title: "Shape the plan", text: "We’ll discuss the right mix of services and agree on the next steps." }, { title: "Make it happen", text: "Bring your event to life with support where you need it most." }].map((step, index) => <li key={step.title} className="border-t border-[#CBBEDA] pt-5"><span className="font-display text-4xl font-medium tracking-[-0.05em] text-[#A98ABF]">0{index + 1}</span><h3 className="mt-6 text-sm font-semibold">{step.title}</h3><p className="mt-3 text-xs leading-6 text-[#746B7C]">{step.text}</p></li>)}</ol></div>
      </div></section>

      <section className="relative isolate overflow-hidden bg-[#251634] px-6 py-20 text-white sm:px-10 lg:py-28">
        <div aria-hidden="true" className="pointer-events-none absolute -right-28 top-0 h-[450px] w-[450px] rounded-full border-[60px] border-[#A28AC0]/10" />
        <div className="relative mx-auto grid max-w-[1312px] items-end gap-10 md:grid-cols-[1.3fr_1fr]">
          <div><p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#DDF7AE]">Big idea? Let’s hear it.</p><h2 className="mt-6 font-display text-5xl font-semibold leading-[1.02] tracking-[-0.055em] sm:text-6xl lg:text-7xl">Your next event<br />could start with<br /><span className="text-[#DDF7AE]">a simple hello.</span></h2></div>
          <div className="max-w-sm md:justify-self-end"><MessageCircle size={36} strokeWidth={1.2} className="text-[#DDF7AE]" /><p className="mt-5 text-sm leading-7 text-[#D0C2DC]">Tell us what you’re planning. We’ll help you find the right support to bring it together.</p><a href={servicesWhatsAppUrl()} target="_blank" rel="noopener noreferrer" className={`${contactClass} mt-7 w-full bg-[#DDF7AE] text-[#251634] hover:bg-[#CDF08E]`}>Chat with us on WhatsApp <ArrowUpRight size={18} /></a><p className="mt-4 text-center text-xs text-[#C2ACD2]">0815 205 8238</p><Link href="/organiser/events/new" className="mt-7 inline-flex min-h-11 items-center gap-2 text-xs text-[#D0C2DC] hover:text-white">Ready to sell tickets? Create your event <ArrowRight size={14} /></Link></div>
        </div>
        <p aria-hidden="true" className="pointer-events-none mx-auto -mb-20 mt-14 max-w-[1312px] select-none font-display text-[16vw] font-semibold leading-none tracking-[-0.08em] text-white/[0.035]">make it happen.</p>
      </section>
    </main>
  );
}
