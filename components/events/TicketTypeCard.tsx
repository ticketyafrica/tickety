import { formatMoney } from "@/lib/currency";
import { TicketType } from "@/lib/types";
import {
  ticketsLeft,
} from "@/lib/utils";
import {
  AlertCircle,
  ArrowUpRight,
  Check,
  Ticket,
} from "lucide-react";

export default function TicketTypeCard({
  ticket,
  currency = "NGN",
}: {
  ticket: TicketType;
  currency?: "NGN" | "USD";
}) {
  const formatPrice = (amount: number) => formatMoney(amount, currency);
  const left = ticketsLeft(
    ticket.quantityTotal,
    ticket.quantitySold
  );

  const lowStock =
    left > 0 &&
    left <= ticket.quantityTotal * 0.15;

  const soldOut = left <= 0;

  return (
    <div
      className={[
        "group relative overflow-hidden rounded-[20px] border bg-white transition-all duration-300",
        soldOut
          ? "border-black/[0.06] opacity-65"
          : lowStock
            ? "border-amber-500/20 hover:border-amber-500/30 hover:shadow-[0_12px_35px_rgba(245,158,11,0.08)]"
            : "border-black/[0.07] hover:-translate-y-0.5 hover:border-[#7C3AED]/15 hover:shadow-[0_15px_40px_rgba(0,0,0,0.07)]",
      ].join(" ")}
    >
      {/* =====================================================
          LEFT TICKET NOTCH
      ===================================================== */}
      <span className="absolute -left-[9px] top-1/2 h-[18px] w-[18px] -translate-y-1/2 rounded-full border-r border-black/[0.07] bg-[#F7F5F2]" />

      {/* =====================================================
          RIGHT TICKET NOTCH
      ===================================================== */}
      <span className="absolute -right-[9px] top-1/2 h-[18px] w-[18px] -translate-y-1/2 rounded-full border-l border-black/[0.07] bg-[#F7F5F2]" />

      {/* =====================================================
          CONTENT
      ===================================================== */}
      <div className="flex items-center justify-between gap-4 px-4 py-4 sm:px-5">
        {/* ===================================================
            LEFT
        =================================================== */}
        <div className="flex min-w-0 items-center gap-3">
          {/* Ticket icon */}
          <div
            className={[
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px]",
              soldOut
                ? "bg-black/[0.035] text-black/25"
                : lowStock
                  ? "bg-amber-500/[0.08] text-amber-600"
                  : "bg-[#7C3AED]/[0.07] text-[#7C3AED]",
            ].join(" ")}
          >
            <Ticket
              size={17}
              strokeWidth={1.8}
            />
          </div>

          {/* Ticket information */}
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold tracking-[-0.01em] text-[#111014]">
              {ticket.name}
            </p>

            <div className="mt-1.5 flex items-center gap-1.5">
              {soldOut ? (
                <>
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-black/[0.06]">
                    <AlertCircle
                      size={9}
                      className="text-black/40"
                    />
                  </span>

                  <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-black/35">
                    Sold out
                  </span>
                </>
              ) : lowStock ? (
                <>
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />

                  <span className="text-[10px] font-semibold text-amber-600">
                    Only {left} left
                  </span>
                </>
              ) : (
                <>
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#25D366]/10">
                    <Check
                      size={9}
                      strokeWidth={2.5}
                      className="text-[#25D366]"
                    />
                  </span>

                  <span className="text-[10px] font-medium text-black/35">
                    {left} left
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* ===================================================
            PRICE + ACTION
        =================================================== */}
        <div className="flex shrink-0 items-center gap-3">
          <div className="text-right">
            <p className="text-[8px] font-semibold uppercase tracking-[0.14em] text-black/25">
              Price
            </p>

            <p className="mt-0.5 font-display text-base font-semibold tracking-[-0.025em] text-[#111014] sm:text-lg">
              {formatPrice(ticket.price)}
            </p>
          </div>

          {/* Arrow */}
          <div
            className={[
              "hidden h-8 w-8 items-center justify-center rounded-full border transition-all duration-300 sm:flex",
              soldOut
                ? "border-black/[0.06] text-black/15"
                : "border-black/[0.07] text-black/25 group-hover:border-[#7C3AED]/20 group-hover:bg-[#7C3AED]/[0.06] group-hover:text-[#7C3AED]",
            ].join(" ")}
          >
            <ArrowUpRight
              size={13}
              className="transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
            />
          </div>
        </div>
      </div>

      {/* =====================================================
          TICKET SEPARATOR
      ===================================================== */}
      <div className="absolute left-[58px] right-[110px] top-1/2 border-t border-dashed border-black/[0.045]" />

      {/* =====================================================
          LOW STOCK PROGRESS SIGNAL
      ===================================================== */}
      {lowStock && !soldOut && (
        <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-amber-500/10">
          <div
            className="h-full bg-amber-500/60"
            style={{
              width: `${Math.max(
                4,
                Math.min(
                  100,
                  (left / ticket.quantityTotal) * 100
                )
              )}%`,
            }}
          />
        </div>
      )}

      {/* =====================================================
          NORMAL HOVER ACCENT
      ===================================================== */}
      {!lowStock && !soldOut && (
        <div className="absolute bottom-0 left-0 right-0 h-[2px] origin-left scale-x-0 bg-gradient-to-r from-[#7C3AED] to-[#A855F7] transition-transform duration-500 group-hover:scale-x-100" />
      )}
    </div>
  );
}