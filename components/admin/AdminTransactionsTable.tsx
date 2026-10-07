"use client";

import {
  ArrowDownRight,
  ArrowUpRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  CreditCard,
  Receipt,
  WalletCards,
  XCircle,
} from "lucide-react";

import { Transaction } from "@/lib/types";
import { formatMoney } from "@/lib/currency";

export default function AdminTransactionsTable({
  transactions,
}: {
  transactions: Transaction[];
}) {
  return (
    <div className="w-full">
      {/* ========================================================
          DESKTOP
      ======================================================== */}

      <div className="hidden overflow-hidden rounded-[24px] border border-black/[0.07] bg-white shadow-[0_12px_45px_rgba(17,16,20,0.05)] md:block">
        {/* Header */}

        <div className="border-b border-black/[0.06] bg-[#FAFAF9] px-5 py-4">
          <div className="grid grid-cols-[minmax(250px,1.5fr)_130px_140px_130px_110px] items-center gap-6">
            <TableHeading>Transaction</TableHeading>
            <TableHeading>Amount</TableHeading>
            <TableHeading>Platform fee</TableHeading>
            <TableHeading>Date</TableHeading>
            <TableHeading>Status</TableHeading>
          </div>
        </div>

        {/* Rows */}

        {transactions.length === 0 ? (
          <EmptyState />
        ) : (
          <div>
            {transactions.map((txn) => (
              <div
                key={txn.id}
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
                <div className="grid grid-cols-[minmax(250px,1.5fr)_130px_140px_130px_110px] items-center gap-6">
                  {/* TRANSACTION */}

                  <div className="flex min-w-0 items-center gap-3">
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
                      <Receipt
                        size={15}
                        className="text-[#7C3AED]"
                      />
                    </div>

                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold tracking-[-0.01em] text-[#111014]">
                        {txn.eventTitle}
                      </p>

                      <p className="mt-0.5 truncate text-[10px] text-black/35">
                        {txn.organiserName}
                      </p>
                    </div>
                  </div>

                  {/* AMOUNT */}

                  <div>
                    <p className="text-sm font-semibold tracking-[-0.01em] text-[#111014]">
                      {formatMoney(txn.amount, txn.currency)}
                    </p>

                    <p className="mt-0.5 text-[9px] uppercase tracking-[0.1em] text-black/25">
                      Transaction
                    </p>
                  </div>

                  {/* PLATFORM FEE */}

                  <div>
                    <p className="text-sm font-medium text-black/60">
                      {formatMoney(txn.platformFee, txn.currency)}
                    </p>

                    <div className="mt-1 flex items-center gap-1">
                      <ArrowUpRight
                        size={10}
                        className="text-[#7C3AED]"
                      />

                      <span className="text-[9px] uppercase tracking-[0.1em] text-black/25">
                        Platform
                      </span>
                    </div>
                  </div>

                  {/* DATE */}

                  <div className="flex items-center gap-2">
                    <CalendarDays
                      size={13}
                      className="shrink-0 text-black/25"
                    />

                    <span className="text-xs text-black/50">
                      {txn.date}
                    </span>
                  </div>

                  {/* STATUS */}

                  <TransactionStatus
                    status={txn.status}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ========================================================
          MOBILE
      ======================================================== */}

      <div className="space-y-3 md:hidden">
        {transactions.length === 0 ? (
          <EmptyState />
        ) : (
          transactions.map((txn) => (
            <div
              key={txn.id}
              className="
                overflow-hidden
                rounded-[22px]
                border
                border-black/[0.07]
                bg-white
                shadow-[0_8px_30px_rgba(17,16,20,0.045)]
              "
            >
              {/* Transaction identity */}

              <div className="flex items-start justify-between gap-3 p-4">
                <div className="flex min-w-0 items-center gap-3">
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
                    <Receipt
                      size={15}
                      className="text-[#7C3AED]"
                    />
                  </div>

                  <div className="min-w-0">
                    <p className="line-clamp-2 text-sm font-semibold leading-5 tracking-[-0.01em] text-[#111014]">
                      {txn.eventTitle}
                    </p>

                    <p className="mt-0.5 truncate text-[10px] text-black/35">
                      {txn.organiserName}
                    </p>
                  </div>
                </div>

                <TransactionStatus
                  status={txn.status}
                />
              </div>

              {/* Amount */}

              <div className="border-y border-black/[0.055] bg-[#FAFAF9] px-4 py-4">
                <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-black/30">
                  Transaction amount
                </p>

                <p className="mt-1 text-2xl font-semibold tracking-[-0.04em] text-[#111014]">
                  {formatMoney(txn.amount, txn.currency)}
                </p>
              </div>

              {/* Details */}

              <div className="grid grid-cols-2">
                <div className="border-r border-black/[0.055] px-4 py-3">
                  <div className="flex items-center gap-2">
                    <WalletCards
                      size={13}
                      className="text-black/25"
                    />

                    <span className="text-[9px] font-bold uppercase tracking-[0.12em] text-black/30">
                      Platform fee
                    </span>
                  </div>

                  <p className="mt-1 text-sm font-semibold text-[#111014]">
                    {formatMoney(txn.platformFee, txn.currency)}
                  </p>
                </div>

                <div className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <CalendarDays
                      size={13}
                      className="text-black/25"
                    />

                    <span className="text-[9px] font-bold uppercase tracking-[0.12em] text-black/30">
                      Date
                    </span>
                  </div>

                  <p className="mt-1 truncate text-xs font-medium text-black/60">
                    {txn.date}
                  </p>
                </div>
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

function TransactionStatus({
  status,
}: {
  status: Transaction["status"];
}) {
  if (status === "paid") {
    return (
      <div className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-[#25D366]/[0.09] px-2.5 py-1.5">
        <CheckCircle2
          size={12}
          className="text-[#168A43]"
        />

        <span className="text-[9px] font-bold uppercase tracking-[0.1em] text-[#168A43]">
          Paid
        </span>
      </div>
    );
  }

  if (status === "pending") {
    return (
      <div className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1.5">
        <Clock3
          size={12}
          className="text-amber-500"
        />

        <span className="text-[9px] font-bold uppercase tracking-[0.1em] text-amber-600">
          Pending
        </span>
      </div>
    );
  }

  return (
    <div className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-1.5">
      <XCircle
        size={12}
        className="text-red-500"
      />

      <span className="text-[9px] font-bold uppercase tracking-[0.1em] text-red-500">
        Failed
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
        <CreditCard
          size={19}
          className="text-[#7C3AED]"
        />
      </div>

      <p className="mt-4 text-sm font-semibold text-[#111014]">
        No transactions yet
      </p>

      <p className="mt-1 text-xs text-black/35">
        Completed and pending transactions will
        appear here.
      </p>
    </div>
  );
}