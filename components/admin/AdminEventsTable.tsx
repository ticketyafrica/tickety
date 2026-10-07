"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Eye,
  Loader2,
  MoreHorizontal,
  Power,
  Ticket,
  Users,
} from "lucide-react";

import { AdminEventSummary } from "@/lib/types";
import { formatMoney } from "@/lib/currency";

export default function AdminEventsTable({
  events,
}: {
  events: AdminEventSummary[];
}) {
  const [rows, setRows] = useState(events);
  const [pendingId, setPendingId] =
    useState<string | null>(null);

  async function toggleStatus(
    id: string,
    currentStatus: AdminEventSummary["status"]
  ) {
    const nextStatus =
      currentStatus === "disabled"
        ? "live"
        : "disabled";

    setPendingId(id);

    setRows((prev) =>
      prev.map((event) =>
        event.id === id
          ? {
              ...event,
              status: nextStatus,
            }
          : event
      )
    );

    try {
      const res = await fetch(
        `/api/admin/events/${id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status: nextStatus,
          }),
        }
      );

      if (!res.ok) {
        throw new Error("Request failed");
      }
    } catch {
      setRows((prev) =>
        prev.map((event) =>
          event.id === id
            ? {
                ...event,
                status: currentStatus,
              }
            : event
        )
      );
    } finally {
      setPendingId(null);
    }
  }

  return (
    <div className="w-full">
      {/* ========================================================
          DESKTOP TABLE
      ======================================================== */}

      <div className="hidden overflow-hidden rounded-[24px] border border-black/[0.07] bg-white shadow-[0_12px_45px_rgba(17,16,20,0.05)] md:block">
        {/* Table header */}

        <div className="border-b border-black/[0.06] bg-[#FAFAF9] px-5 py-4">
          <div className="grid grid-cols-[minmax(260px,1.7fr)_minmax(160px,1fr)_110px_90px_130px_145px] items-center gap-5">
            <TableHeading>
              Event
            </TableHeading>

            <TableHeading>
              Organiser
            </TableHeading>

            <TableHeading>
              Status
            </TableHeading>

            <TableHeading>
              Sold
            </TableHeading>

            <TableHeading>
              Gross
            </TableHeading>

            <span />
          </div>
        </div>

        {/* Rows */}

        <div>
          {rows.length === 0 ? (
            <EmptyState />
          ) : (
            rows.map((event) => (
              <div
                key={event.id}
                className="
                  group
                  border-b
                  border-black/[0.055]
                  px-5
                  py-4
                  last:border-0
                  transition-colors
                  hover:bg-[#FAFAF9]/70
                "
              >
                <div className="grid grid-cols-[minmax(260px,1.7fr)_minmax(160px,1fr)_110px_90px_130px_145px] items-center gap-5">
                  {/* EVENT */}

                  <div className="min-w-0">
                    <div className="flex items-center gap-3">
                      <div
                        className="
                          flex
                          h-10
                          w-10
                          shrink-0
                          items-center
                          justify-center
                          rounded-[12px]
                          bg-[#7C3AED]/[0.07]
                        "
                      >
                        <CalendarDays
                          size={15}
                          className="text-[#7C3AED]"
                        />
                      </div>

                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold tracking-[-0.01em] text-[#111014]">
                          {event.title}
                        </p>

                        <p className="mt-0.5 truncate text-[10px] text-black/30">
                          Event ID · {event.id}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* ORGANISER */}

                  <div className="min-w-0">
                    <p className="truncate text-xs font-medium text-black/60">
                      {event.organiserName}
                    </p>

                    <p className="mt-0.5 text-[10px] text-black/25">
                      Organiser
                    </p>
                  </div>

                  {/* STATUS */}

                  <StatusBadge
                    status={event.status}
                  />

                  {/* SOLD */}

                  <div className="flex items-center gap-2">
                    <Ticket
                      size={14}
                      className="text-black/20"
                    />

                    <span className="text-sm font-semibold text-[#111014]">
                      {event.ticketsSold}
                    </span>
                  </div>

                  {/* GROSS */}

                  <div>
                    <p className="text-sm font-semibold tracking-[-0.01em] text-[#111014]">
                      {formatMoney(event.gross, event.currency)}
                    </p>

                    <p className="mt-0.5 text-[10px] text-black/25">
                      Gross sales
                    </p>
                  </div>

                  {/* ACTION */}

                  <div className="flex items-center justify-end gap-2">
                    <Link
                      href={`/events/${event.id}`}
                      className="
                        flex
                        h-9
                        items-center
                        gap-1.5
                        rounded-full
                        border
                        border-black/[0.08]
                        px-3
                        text-[10px]
                        font-semibold
                        text-black/45
                        transition-all
                        hover:border-black/15
                        hover:bg-white
                        hover:text-black/75
                      "
                    >
                      <Eye size={13} />
                      View
                    </Link>

                    <button
                      type="button"
                      disabled={
                        pendingId ===
                        event.id
                      }
                      onClick={() =>
                        toggleStatus(
                          event.id,
                          event.status
                        )
                      }
                      className={[
                        "flex h-9 items-center gap-1.5 rounded-full px-3 text-[10px] font-semibold transition-all",
                        event.status ===
                        "disabled"
                          ? "bg-[#25D366]/[0.08] text-[#168A43] hover:bg-[#25D366]/[0.14]"
                          : "bg-red-50 text-red-500 hover:bg-red-100",
                        pendingId ===
                          event.id
                          ? "cursor-wait opacity-50"
                          : "",
                      ].join(" ")}
                    >
                      {pendingId ===
                      event.id ? (
                        <Loader2
                          size={13}
                          className="animate-spin"
                        />
                      ) : (
                        <Power
                          size={13}
                        />
                      )}

                      {event.status ===
                      "disabled"
                        ? "Enable"
                        : "Disable"}
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ========================================================
          MOBILE CARDS
      ======================================================== */}

      <div className="space-y-3 md:hidden">
        {rows.length === 0 ? (
          <EmptyState />
        ) : (
          rows.map((event) => (
            <div
              key={event.id}
              className="
                overflow-hidden
                rounded-[22px]
                border
                border-black/[0.07]
                bg-white
                shadow-[0_8px_30px_rgba(17,16,20,0.045)]
              "
            >
              {/* Top */}

              <div className="flex items-start justify-between gap-3 p-4">
                <div className="flex min-w-0 gap-3">
                  <div
                    className="
                      flex
                      h-10
                      w-10
                      shrink-0
                      items-center
                      justify-center
                      rounded-[12px]
                      bg-[#7C3AED]/[0.07]
                    "
                  >
                    <CalendarDays
                      size={15}
                      className="text-[#7C3AED]"
                    />
                  </div>

                  <div className="min-w-0">
                    <p className="line-clamp-2 text-sm font-semibold leading-5 tracking-[-0.01em] text-[#111014]">
                      {event.title}
                    </p>

                    <p className="mt-1 truncate text-[10px] text-black/30">
                      {event.organiserName}
                    </p>
                  </div>
                </div>

                <StatusBadge
                  status={event.status}
                />
              </div>

              {/* Metrics */}

              <div className="grid grid-cols-2 border-y border-black/[0.055] bg-[#FAFAF9]">
                <div className="border-r border-black/[0.055] px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Ticket
                      size={13}
                      className="text-black/25"
                    />

                    <span className="text-[10px] font-medium uppercase tracking-[0.1em] text-black/30">
                      Sold
                    </span>
                  </div>

                  <p className="mt-1 text-lg font-semibold tracking-[-0.03em] text-[#111014]">
                    {event.ticketsSold}
                  </p>
                </div>

                <div className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="text-[12px] font-bold text-black/25">
                      {event.currency === "USD" ? "$" : "₦"}
                    </span>

                    <span className="text-[10px] font-medium uppercase tracking-[0.1em] text-black/30">
                      Gross
                    </span>
                  </div>

                  <p className="mt-1 truncate text-lg font-semibold tracking-[-0.03em] text-[#111014]">
                    {formatMoney(event.gross, event.currency)}
                  </p>
                </div>
              </div>

              {/* Actions */}

              <div className="flex items-center gap-2 p-3">
                <Link
                  href={`/events/${event.id}`}
                  className="
                    flex
                    h-10
                    flex-1
                    items-center
                    justify-center
                    gap-2
                    rounded-full
                    border
                    border-black/[0.08]
                    text-xs
                    font-semibold
                    text-black/50
                    transition-all
                    hover:bg-[#FAFAF9]
                    hover:text-black/80
                  "
                >
                  <Eye size={14} />
                  View event
                </Link>

                <button
                  type="button"
                  disabled={
                    pendingId ===
                    event.id
                  }
                  onClick={() =>
                    toggleStatus(
                      event.id,
                      event.status
                    )
                  }
                  className={[
                    "flex h-10 flex-1 items-center justify-center gap-2 rounded-full text-xs font-semibold transition-all",
                    event.status ===
                    "disabled"
                      ? "bg-[#25D366]/[0.09] text-[#168A43] hover:bg-[#25D366]/[0.15]"
                      : "bg-red-50 text-red-500 hover:bg-red-100",
                    pendingId ===
                      event.id
                      ? "cursor-wait opacity-50"
                      : "",
                  ].join(" ")}
                >
                  {pendingId ===
                  event.id ? (
                    <Loader2
                      size={14}
                      className="animate-spin"
                    />
                  ) : (
                    <Power size={14} />
                  )}

                  {event.status ===
                  "disabled"
                    ? "Re-enable"
                    : "Disable"}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

/* ===============================================================
   STATUS
=============================================================== */

function StatusBadge({
  status,
}: {
  status: AdminEventSummary["status"];
}) {
  if (status === "live") {
    return (
      <div className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-[#25D366]/[0.09] px-2.5 py-1.5">
        <span className="relative flex h-1.5 w-1.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#25D366]/50" />

          <span className="relative h-1.5 w-1.5 rounded-full bg-[#25D366]" />
        </span>

        <span className="text-[9px] font-bold uppercase tracking-[0.1em] text-[#168A43]">
          Live
        </span>
      </div>
    );
  }

  if (status === "pending") {
    return (
      <div className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1.5">
        <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />

        <span className="text-[9px] font-bold uppercase tracking-[0.1em] text-amber-600">
          Pending
        </span>
      </div>
    );
  }

  return (
    <div className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-1.5">
      <span className="h-1.5 w-1.5 rounded-full bg-red-400" />

      <span className="text-[9px] font-bold uppercase tracking-[0.1em] text-red-500">
        Disabled
      </span>
    </div>
  );
}

/* ===============================================================
   TABLE HEADING
=============================================================== */

function TableHeading({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-black/30">
      {children}
    </span>
  );
}

/* ===============================================================
   EMPTY STATE
=============================================================== */

function EmptyState() {
  return (
    <div className="rounded-[22px] border border-dashed border-black/10 bg-white px-6 py-14 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-[15px] bg-[#7C3AED]/[0.07]">
        <CalendarDays
          size={19}
          className="text-[#7C3AED]"
        />
      </div>

      <p className="mt-4 text-sm font-semibold text-[#111014]">
        No events yet
      </p>

      <p className="mt-1 text-xs text-black/35">
        Events will appear here when they are
        created.
      </p>
    </div>
  );
}