import { servicesWhatsAppUrl } from "@/lib/services";
import Link from "next/link";
import {
  ArrowUpRight,
  Instagram,
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
                href="https://www.instagram.com/tickety.africa/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Follow Tickety on Instagram"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.025] text-white/35 transition-all hover:border-white/20 hover:bg-white/[0.07] hover:text-white"
              >
                <Instagram size={15} aria-hidden="true" />
              </a>

              <a
                href="https://www.tiktok.com/@tickety.africa"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Follow Tickety on TikTok"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.025] text-white/35 transition-all hover:border-white/20 hover:bg-white/[0.07] hover:text-white"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
                </svg>
              </a>

              <a
                href={servicesWhatsAppUrl()}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Contact Tickety on WhatsApp"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.025] text-white/35 transition-all hover:border-[#25D366]/20 hover:bg-[#25D366]/[0.08] hover:text-[#25D366]"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M20.52 3.48A11.9 11.9 0 0 0 12.05 0C5.46 0 .1 5.36.1 11.95c0 2.11.55 4.17 1.6 5.99L0 24l6.23-1.63a11.93 11.93 0 0 0 5.82 1.48h.01C18.65 23.85 24 18.49 24 11.9c0-3.19-1.24-6.19-3.48-8.42ZM12.06 21.83a9.9 9.9 0 0 1-5.05-1.38l-.36-.21-3.7.97.99-3.61-.24-.37a9.88 9.88 0 0 1-1.52-5.28c0-5.48 4.46-9.94 9.94-9.94 2.66 0 5.15 1.04 7.03 2.92a9.87 9.87 0 0 1 2.91 7.03c0 5.48-4.46 9.94-10 9.87Zm5.45-7.44c-.3-.15-1.77-.87-2.04-.97-.28-.1-.48-.15-.68.15s-.77.97-.94 1.17c-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.18.2-.3.3-.5.1-.2.05-.38-.03-.53-.07-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.49s1.07 2.89 1.22 3.09c.15.2 2.1 3.2 5.09 4.49.71.3 1.27.49 1.7.63.71.22 1.36.19 1.87.12.57-.09 1.77-.73 2.02-1.44.25-.7.25-1.3.17-1.43-.07-.12-.27-.2-.57-.35Z" />
                </svg>
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
                      target={link.href.startsWith("https://") ? "_blank" : undefined}
                      rel={link.href.startsWith("https://") ? "noopener noreferrer" : undefined}
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
