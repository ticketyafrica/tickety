import { servicesWhatsAppUrl } from "@/lib/services";
import Link from "next/link";
import {
  ArrowUpRight,
  Instagram,
  MessageCircle,
  Ticket,
} from "lucide-react";

const columns = [
  {
    title: "Product",
    links: [
      { label: "Explore events", href: "/explore" },
      { label: "For organisers", href: "/organiser/dashboard" },
      { label: "Gate check-in", href: "/checkin" },
    ],
  },
  {
    title: "Company",
    links: [
      
      { label: "What we offer", href: "/what-we-offer" },
      { label: "Contact", href: servicesWhatsAppUrl() },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="relative isolate overflow-hidden bg-[#07060B] text-white">
      {/* =========================================================
          BACKGROUND
      ========================================================= */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {/* Base */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,#1D0D32_0%,#0D0914_38%,#07060B_72%)]" />

        {/* Purple atmosphere */}
        <div className="absolute -left-[15%] -top-[35%] h-[600px] w-[600px] rounded-full bg-[#7C3AED]/15 blur-[150px]" />

        <div className="absolute -right-[20%] bottom-[-35%] h-[600px] w-[600px] rounded-full bg-[#4C1D95]/15 blur-[150px]" />

        {/* Grid */}
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255,255,255,.8) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,.8) 1px, transparent 1px)
            `,
            backgroundSize: "90px 90px",
          }}
        />

        {/* Grain */}
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 180 180' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.7'/%3E%3C/svg%3E\")",
          }}
        />
      </div>

      <div className="relative mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
        {/* =======================================================
            LARGE BRAND STATEMENT
        ======================================================= */}
        <div className="border-b border-white/[0.08] py-20 sm:py-24 lg:py-28">
          <div className="grid gap-10 lg:grid-cols-[1.3fr_.7fr] lg:items-end">
            {/* Brand */}
            <div>
              <div className="flex items-center">
  <img
    src="/images/logo/logos.png"
    alt="Tickety"
    className="h-11 w-auto object-contain brightness-0 invert"
  />
</div>

              <h2 className="mt-8 max-w-3xl font-display text-4xl font-semibold leading-[0.95] tracking-[-0.055em] text-white sm:text-5xl lg:text-6xl">
                Find the moment.
                <br />
                <span className="text-white/30">
                  We'll get you there.
                </span>
              </h2>
            </div>

            {/* Description */}
            <div className="lg:pb-1">
              <p className="max-w-sm text-sm leading-7 text-white/45 sm:text-base sm:leading-7">
                Discover events, complete checkout, and manage attendance in one
                simple Tickety experience.
              </p>

              <Link
                href="/explore"
                className="group mt-6 inline-flex items-center gap-2 text-xs font-semibold text-white/70 transition-colors hover:text-white"
              >
                Explore events

                <span className="flex h-7 w-7 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] transition-all group-hover:border-white/20 group-hover:bg-white/[0.08]">
                  <ArrowUpRight
                    size={13}
                    className="transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                  />
                </span>
              </Link>
            </div>
          </div>
        </div>

        {/* =======================================================
            NAVIGATION AREA
        ======================================================= */}
        <div className="grid gap-12 py-14 sm:grid-cols-2 lg:grid-cols-[1.5fr_.6fr_.6fr] lg:py-16">
          {/* Product philosophy */}
          <div>
            <div className="flex h-9 w-9 items-center justify-center rounded-[11px] border border-white/10 bg-white/[0.04]">
              <Ticket
                size={15}
                className="text-[#A78BFA]"
              />
            </div>

            <p className="mt-5 max-w-xs text-sm leading-6 text-white/35">
              A simpler way to discover, sell and enter events across Nigeria.
            </p>

            {/* Social */}
            <div className="mt-6 flex items-center gap-2">
              <a
                href="#"
                aria-label="Instagram"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.025] text-white/35 transition-all hover:border-white/20 hover:bg-white/[0.07] hover:text-white"
              >
                <Instagram size={15} />
              </a>

              <a
                href={servicesWhatsAppUrl()}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Contact Tickety on WhatsApp"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.025] text-white/35 transition-all hover:border-[#25D366]/20 hover:bg-[#25D366]/[0.08] hover:text-[#25D366]"
              >
                <MessageCircle size={15} />
              </a>
            </div>
          </div>

          {/* Navigation columns */}
          {columns.map((column) => (
            <div key={column.title}>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/30">
                {column.title}
              </p>

              <ul className="mt-5 space-y-3.5">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="group inline-flex items-center gap-1.5 text-sm text-white/55 transition-colors hover:text-white"
                    >
                      {link.label}

                      <ArrowUpRight
                        size={11}
                        className="translate-y-0.5 opacity-0 transition-all duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:opacity-60"
                      />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* =======================================================
            BOTTOM BAR
        ======================================================= */}
        <div className="border-t border-white/[0.08] py-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            {/* Copyright */}
            <p className="text-[10px] font-medium tracking-[0.02em] text-white/25">
              © {new Date().getFullYear()} Tickety.africa
            </p>

            {/* Center */}
            <div className="flex items-center gap-2 text-[9px] font-semibold uppercase tracking-[0.16em] text-white/20">
              <span>Discover</span>

              <span className="h-1 w-1 rounded-full bg-[#7C3AED]/60" />

              <span>Sell</span>

              <span className="h-1 w-1 rounded-full bg-[#7C3AED]/60" />

              <span>Scan</span>
            </div>

            {/* Location */}
            <p className="text-[10px] font-medium text-white/25 sm:text-right">
              Built for organisers across Nigeria.
            </p>
          </div>
        </div>

        {/* =======================================================
            GIANT BACKGROUND WORDMARK
        ======================================================= */}
        <div className="pointer-events-none relative -mb-3 mt-2 overflow-hidden">
          <p className="select-none whitespace-nowrap text-center font-display text-[18vw] font-semibold leading-[0.72] tracking-[-0.09em] text-white/[0.025]">
            tickety
          </p>
        </div>
      </div>
    </footer>
  );
}