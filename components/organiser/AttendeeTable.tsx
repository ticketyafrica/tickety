"use client";

import { useMemo, useState } from "react";
import { Attendee } from "@/lib/types";
import { formatMoney, formatCurrencyTotals } from "@/lib/currency";
import {
  ArrowUpDown,
  Check,
  Search,
  Ticket,
  UserRound,
  X,
} from "lucide-react";

type SortKey = "name" | "amountPaid" | "purchaseDate";

export default function AttendeeTable({
  attendees,
}: {
  attendees: Attendee[];
}) {
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] =
    useState<SortKey>("purchaseDate");

  const rows = useMemo(() => {
    const filtered = attendees.filter((a) => {
      const search = query.toLowerCase();

      return (
        a.name.toLowerCase().includes(search) ||
        a.email.toLowerCase().includes(search) ||
        a.phone.toLowerCase().includes(search) ||
        a.ticketId.toLowerCase().includes(search)
      );
    });

    return [...filtered].sort((a, b) => {
      if (sortKey === "amountPaid") {
        return b.amountPaid - a.amountPaid;
      }

      if (sortKey === "purchaseDate") {
        return b.purchaseDate.localeCompare(
          a.purchaseDate
        );
      }

      return a.name.localeCompare(b.name);
    });
  }, [attendees, query, sortKey]);

  const checkedInCount = attendees.filter(
    (a) => a.checkInStatus
  ).length;

  const pendingCount = attendees.filter(
    (a) => a.paymentStatus === "pending"
  ).length;


  return (
    <div className="relative overflow-hidden rounded-[30px] border border-black/[0.07] bg-[#0B0910] shadow-[0_30px_80px_rgba(0,0,0,0.14)]">
      {/* =====================================================
          AMBIENT BACKGROUND
      ===================================================== */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-[20%] -top-[30%] h-[500px] w-[500px] rounded-full bg-[#7C3AED]/10 blur-[130px]" />

        <div className="absolute -bottom-[30%] -right-[10%] h-[450px] w-[450px] rounded-full bg-[#9333EA]/[0.06] blur-[130px]" />

        <div
          className="absolute inset-0 opacity-[0.018]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255,255,255,.8) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,.8) 1px, transparent 1px)
            `,
            backgroundSize: "80px 80px",
          }}
        />
      </div>

      {/* =====================================================
          HEADER
      ===================================================== */}
      <div className="relative border-b border-white/[0.07] p-5 sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-[#7C3AED]/15">
                <UserRound
                  size={14}
                  className="text-[#C084FC]"
                />
              </div>

              <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-white/35">
                Attendees
              </p>
            </div>

            <h3 className="mt-3 font-display text-2xl font-semibold tracking-[-0.035em] text-white">
              Guest list
            </h3>

            <p className="mt-1 text-xs leading-5 text-white/35">
              Search and manage everyone attending
              your event.
            </p>
          </div>

          {/* Search + sort */}
          <div className="flex flex-col gap-2.5 sm:flex-row">
            <div className="relative">
              <Search
                size={15}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-white/25"
              />

              <input
                value={query}
                onChange={(e) =>
                  setQuery(e.target.value)
                }
                placeholder="Search attendee..."
                className="h-11 w-full rounded-[13px] border border-white/10 bg-white/[0.045] pl-10 pr-10 text-xs text-white outline-none transition-all placeholder:text-white/25 focus:border-[#8B5CF6]/50 focus:bg-white/[0.065] focus:ring-4 focus:ring-[#7C3AED]/10 sm:w-72"
              />

              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="absolute right-3 top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-full bg-white/[0.08] text-white/35 transition-colors hover:bg-white/[0.14] hover:text-white"
                  aria-label="Clear search"
                >
                  <X size={10} />
                </button>
              )}
            </div>

            <div className="relative">
              <ArrowUpDown
                size={13}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-white/25"
              />

              <select
                value={sortKey}
                onChange={(e) =>
                  setSortKey(
                    e.target.value as SortKey
                  )
                }
                className="h-11 w-full appearance-none rounded-[13px] border border-white/10 bg-white/[0.045] pl-9 pr-4 text-xs font-medium text-white outline-none transition-all focus:border-[#8B5CF6]/50 sm:w-[150px]"
              >
                <option
                  value="purchaseDate"
                  className="bg-[#111014]"
                >
                  Newest
                </option>

                <option
                  value="amountPaid"
                  className="bg-[#111014]"
                >
                  Highest amount
                </option>

                <option
                  value="name"
                  className="bg-[#111014]"
                >
                  A–Z
                </option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* =====================================================
          STATS
      ===================================================== */}
      <div className="relative grid grid-cols-2 border-b border-white/[0.07] lg:grid-cols-4">
        <Stat
          label="Total attendees"
          value={attendees.length.toLocaleString()}
        />

        <Stat
          label="Checked in"
          value={checkedInCount.toLocaleString()}
          accent
        />

        <Stat
          label="Revenue"
          value={formatCurrencyTotals(attendees.filter((a) => a.paymentStatus === "paid").map((a) => ({ amount: a.amountPaid, currency: a.currency })))}
        />

        <Stat
          label="Pending"
          value={pendingCount.toLocaleString()}
          warning
        />
      </div>

      {/* =====================================================
          SEARCH RESULT SIGNAL
      ===================================================== */}
      <div className="relative flex items-center justify-between border-b border-white/[0.05] px-5 py-3.5 sm:px-6">
        <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-white/25">
          {query ? "Search results" : "All attendees"}
        </p>

        <p className="text-[9px] text-white/20">
          {rows.length}{" "}
          {rows.length === 1
            ? "attendee"
            : "attendees"}
        </p>
      </div>

      {/* =====================================================
          TABLE
      ===================================================== */}
      <div className="relative overflow-x-auto">
        <table className="w-full min-w-[980px] text-left">
          <thead>
            <tr className="border-b border-white/[0.07]">
              <th className="px-5 py-4 text-[9px] font-semibold uppercase tracking-[0.15em] text-white/30 sm:px-6">
                Attendee
              </th>

              <th className="px-5 py-4 text-[9px] font-semibold uppercase tracking-[0.15em] text-white/30">
                Phone
              </th>

              <th className="px-5 py-4 text-[9px] font-semibold uppercase tracking-[0.15em] text-white/30">
                Ticket
              </th>

              <th className="px-5 py-4 text-[9px] font-semibold uppercase tracking-[0.15em] text-white/30">
                Amount
              </th>

              <th className="px-5 py-4 text-[9px] font-semibold uppercase tracking-[0.15em] text-white/30">
                Payment
              </th>

              <th className="px-5 py-4 text-[9px] font-semibold uppercase tracking-[0.15em] text-white/30">
                Check-in
              </th>

              <th className="px-5 py-4 text-[9px] font-semibold uppercase tracking-[0.15em] text-white/30">
                Answers
              </th>
            </tr>
          </thead>

          <tbody>
            {rows.map((attendee) => (
              <tr
                key={attendee.id}
                className="group border-b border-white/[0.045] transition-colors duration-200 hover:bg-white/[0.025]"
              >
                {/* =================================================
                    ATTENDEE
                ================================================= */}
                <td className="px-5 py-4 sm:px-6">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[11px] bg-white/[0.05] text-[10px] font-semibold text-white/45 transition-colors group-hover:bg-[#7C3AED]/10 group-hover:text-[#C4B5FD]">
                      {attendee.name
                        .charAt(0)
                        .toUpperCase()}
                    </div>

                    <div className="min-w-0">
                      <p className="truncate text-xs font-semibold text-white">
                        {attendee.name}
                      </p>

                      <p className="mt-1 max-w-[190px] truncate text-[10px] text-white/30">
                        {attendee.email}
                      </p>
                    </div>
                  </div>
                </td>

                {/* =================================================
                    PHONE
                ================================================= */}
                <td className="px-5 py-4">
                  <p className="whitespace-nowrap text-xs text-white/60">
                    {attendee.phone}
                  </p>
                </td>

                {/* =================================================
                    TICKET
                ================================================= */}
                <td className="px-5 py-4">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-7 w-7 items-center justify-center rounded-[8px] bg-[#7C3AED]/[0.08]">
                      <Ticket
                        size={12}
                        className="text-[#A78BFA]"
                      />
                    </div>

                    <div>
                      <p className="text-xs font-medium text-white/75">
                        {attendee.ticketType}
                      </p>

                      <p className="mt-1 font-mono text-[9px] text-white/25">
                        {attendee.ticketId}
                      </p>
                    </div>
                  </div>
                </td>

                {/* =================================================
                    AMOUNT
                ================================================= */}
                <td className="px-5 py-4">
                  <p className="text-xs font-semibold text-white">
                    {formatMoney(attendee.amountPaid, attendee.currency)}
                  </p>
                </td>

                {/* =================================================
                    PAYMENT
                ================================================= */}
                <td className="px-5 py-4">
                  <StatusBadge
                    type="payment"
                    status={
                      attendee.paymentStatus
                    }
                  />
                </td>

                {/* =================================================
                    CHECK-IN
                ================================================= */}
                <td className="px-5 py-4">
                  <StatusBadge
                    type="checkin"
                    checkedIn={
                      attendee.checkInStatus
                    }
                  />
                </td>

                {/* =================================================
                    ANSWERS
                ================================================= */}
                <td className="px-5 py-4">
                  <p
                    className="max-w-[220px] truncate text-[11px] text-white/35"
                    title={attendee.answers}
                  >
                    {attendee.answers || "—"}
                  </p>
                </td>
              </tr>
            ))}

            {/* =====================================================
                EMPTY STATE
            ===================================================== */}
            {rows.length === 0 && (
              <tr>
                <td
                  colSpan={7}
                  className="px-6 py-20 text-center"
                >
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-[15px] bg-white/[0.05]">
                    <Search
                      size={17}
                      className="text-white/25"
                    />
                  </div>

                  <p className="mt-5 text-sm font-medium text-white/60">
                    No attendees found
                  </p>

                  <p className="mt-1.5 text-xs text-white/25">
                    Try adjusting your search.
                  </p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* =====================================================
          FOOTER
      ===================================================== */}
      <div className="relative flex flex-col gap-3 border-t border-white/[0.07] px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="flex items-center gap-2">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#25D366]/40" />

            <span className="relative h-1.5 w-1.5 rounded-full bg-[#25D366]" />
          </span>

          <span className="text-[8px] font-medium uppercase tracking-[0.14em] text-white/25">
            Attendee data synced
          </span>
        </div>

        <span className="text-[8px] text-white/20">
          {rows.length} of {attendees.length} displayed
        </span>
      </div>
    </div>
  );
}

/* ===============================================================
   STAT
=============================================================== */

function Stat({
  label,
  value,
  accent = false,
  warning = false,
}: {
  label: string;
  value: string;
  accent?: boolean;
  warning?: boolean;
}) {
  return (
    <div className="border-r border-white/[0.07] p-5 last:border-r-0">
      <p className="text-[9px] font-semibold uppercase tracking-[0.13em] text-white/25">
        {label}
      </p>

      <p
        className={[
          "mt-2 truncate font-display text-xl font-semibold tracking-[-0.03em]",
          accent
            ? "text-[#C4B5FD]"
            : warning
              ? "text-amber-300"
              : "text-white",
        ].join(" ")}
      >
        {value}
      </p>
    </div>
  );
}

/* ===============================================================
   STATUS BADGE
=============================================================== */

function StatusBadge({
  type,
  status,
  checkedIn,
}: {
  type: "payment" | "checkin";
  status?: string;
  checkedIn?: boolean;
}) {
  if (type === "checkin") {
    return (
      <span
        className={[
          "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[9px] font-semibold",
          checkedIn
            ? "bg-[#25D366]/10 text-[#5EEA91]"
            : "bg-white/[0.05] text-white/30",
        ].join(" ")}
      >
        <span
          className={[
            "flex h-3.5 w-3.5 items-center justify-center rounded-full",
            checkedIn
              ? "bg-[#25D366]/15"
              : "bg-white/[0.06]",
          ].join(" ")}
        >
          {checkedIn ? (
            <Check
              size={8}
              strokeWidth={3}
            />
          ) : (
            <span className="h-1 w-1 rounded-full bg-white/20" />
          )}
        </span>

        {checkedIn
          ? "Checked in"
          : "Not yet"}
      </span>
    );
  }

  const isPaid = status === "paid";
  const isPending = status === "pending";

  return (
    <span
      className={[
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[9px] font-semibold capitalize",
        isPaid
          ? "bg-[#25D366]/10 text-[#5EEA91]"
          : isPending
            ? "bg-amber-500/10 text-amber-300"
            : "bg-red-500/10 text-red-300",
      ].join(" ")}
    >
      <span
        className={[
          "h-1.5 w-1.5 rounded-full",
          isPaid
            ? "bg-[#25D366]"
            : isPending
              ? "bg-amber-400"
              : "bg-red-400",
        ].join(" ")}
      />

      {status}
    </span>
  );
}