import { notFound } from "next/navigation";
import Link from "next/link";
import PrintTicketButton from "@/components/tickets/PrintTicketButton";
import QRCode from "qrcode";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Check,
  MapPin,
  ShieldCheck,
  Ticket,
} from "lucide-react";
import { formatMoney } from "@/lib/currency";
import { prisma } from "@/lib/db";
import { formatEventDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

type TicketPageProps = {
  params: {
    reference: string;
  };
};

export default async function TicketPage({
  params,
}: TicketPageProps) {
  const order = await prisma.order.findUnique({
    where: {
      reference: params.reference,
    },
    include: {
      event: true,
      attendees: {
        include: {
          ticketType: true,
        },
        orderBy: {
          purchaseDate: "asc",
        },
      },
      items: {
        include: {
          ticketType: true,
        },
      },
    },
  });

  if (!order) {
    notFound();
  }

  if (order.status !== "paid") {
    notFound();
  }

  if (order.attendees.length === 0) {
    notFound();
  }

  const firstAttendee = order.attendees[0];

  const qrData = JSON.stringify({
    ticketId: firstAttendee.ticketId,
    reference: order.reference,
    eventId: order.eventId,
  });

  const qrCode = await QRCode.toDataURL(qrData, {
    width: 320,
    margin: 2,
    errorCorrectionLevel: "M",
  });

  const totalTickets = order.items.reduce(
    (sum, item) => sum + item.quantity,
    0
  );

  const totalAmount = order.items.reduce(
    (sum, item) => sum + Number(item.unitPrice) * item.quantity,
    0
  );

  return (
    <main className="min-h-screen bg-[#FBFAFC] text-zinc-950">
      <div className="mx-auto max-w-[760px] px-4 pb-16 pt-24 sm:px-6 sm:pt-28">
        {/* Back */}
        <Link
          href={`/events/${order.event.slug}`}
          className="group inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-400 transition-colors hover:text-violet-600"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-full border border-zinc-200 bg-white transition-colors group-hover:border-violet-200 group-hover:bg-violet-50">
            <ArrowLeft
              className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5"
              strokeWidth={1.8}
            />
          </span>

          Back to event
        </Link>

        {/* Confirmation */}
        <div className="mt-10 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
            <Check
              className="h-6 w-6"
              strokeWidth={2.2}
            />
          </div>

          <p className="mt-5 text-[9px] font-semibold uppercase tracking-[0.2em] text-violet-600">
            Ticket confirmed
          </p>

          <h1 className="mt-2 text-[2.35rem] font-semibold leading-[0.98] tracking-[-0.055em] text-zinc-950 sm:text-[3.4rem]">
            You're going to {order.event.title}.
          </h1>

          <p className="mx-auto mt-4 max-w-[520px] text-sm leading-6 text-zinc-500">
            Your ticket has been issued successfully. Keep this
            page handy when you arrive at the event.
          </p>
        </div>

        {/* Ticket */}
        <div className="mt-10 overflow-hidden rounded-[28px] border border-zinc-200 bg-white shadow-[0_20px_60px_rgba(24,24,27,0.06)]">
          {/* Event header */}
          <div className="relative overflow-hidden bg-zinc-950 px-6 py-7 text-white sm:px-8 sm:py-8">
            {order.event.coverImageUrl && (
              <img
                src={order.event.coverImageUrl}
                alt=""
                className="absolute inset-0 h-full w-full object-cover opacity-20"
              />
            )}

            <div className="absolute inset-0 bg-zinc-950/60" />

            <div className="relative">
              <div className="flex items-center gap-2 text-[9px] font-semibold uppercase tracking-[0.18em] text-white/60">
                <Ticket className="h-3.5 w-3.5" />
                Tickety ticket
              </div>

              <h2 className="mt-4 max-w-[580px] text-2xl font-semibold leading-tight tracking-[-0.04em] sm:text-3xl">
                {order.event.title}
              </h2>

              <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-[11px] font-medium text-white/65">
                <span className="inline-flex items-center gap-1.5">
                  <CalendarDays className="h-3.5 w-3.5" />
                {formatEventDate(
  order.event.date.toISOString(),
  order.event.startTime
)}
                </span>

                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5" />
                  {order.event.venue}, {order.event.state}
                </span>
              </div>
            </div>
          </div>

          {/* Ticket body */}
          <div className="p-6 sm:p-8">
            {/* Attendee */}
            <div>
              <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-zinc-400">
                Attendee
              </p>

              <p className="mt-2 text-xl font-semibold tracking-[-0.035em] text-zinc-950">
                {firstAttendee.name}
              </p>

              <p className="mt-1 text-xs text-zinc-400">
                {firstAttendee.email}
              </p>
            </div>

            {/* Ticket details */}
            <div className="mt-7 grid grid-cols-2 gap-x-6 gap-y-6 border-t border-zinc-100 pt-6 sm:grid-cols-3">
              <TicketDetail
                label="Ticket"
                value={firstAttendee.ticketType.name}
              />

              <TicketDetail
                label="Quantity"
                value={`${totalTickets} ${
                  totalTickets === 1
                    ? "ticket"
                    : "tickets"
                }`}
              />

              <TicketDetail
                label="Order"
                value={order.reference}
                mono
              />

              <TicketDetail
                label="Date"
                value={new Date(
                  order.event.date
                ).toLocaleDateString("en-NG", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              />

              <TicketDetail
                label="Time"
                value={order.event.startTime}
              />

              <TicketDetail
                label="Amount"
                value={
                  totalAmount === 0
                    ? "Free"
                    : formatMoney(Number(totalAmount), order.currency)
                }
              />
            </div>

            {/* QR */}
            <div className="mt-8 border-t border-zinc-100 pt-8">
              <div className="flex flex-col items-center text-center">
                <div className="rounded-2xl border border-zinc-200 bg-white p-3">
                  <img
                    src={qrCode}
                    alt={`QR code for ticket ${firstAttendee.ticketId}`}
                    className="h-[220px] w-[220px]"
                  />
                </div>

                <p className="mt-5 text-[9px] font-semibold uppercase tracking-[0.18em] text-zinc-400">
                  Scan at entry
                </p>

                <p className="mt-2 font-mono text-xs font-semibold tracking-[0.08em] text-zinc-700">
                  {firstAttendee.ticketId}
                </p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-dashed border-zinc-200 bg-zinc-50 px-6 py-5 sm:px-8">
            <div className="flex items-start gap-2">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-zinc-400" />

              <p className="text-[10px] leading-5 text-zinc-400">
                This ticket is linked to your order and can be
                verified at the event entrance using the QR code
                above.
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <PrintTicketButton />

          <Link
            href={`/events/${order.event.slug}`}
            className="flex h-12 items-center justify-center gap-2 rounded-xl bg-violet-600 text-xs font-semibold text-white transition-colors hover:bg-violet-700"
          >
            View Event
            <ArrowRight
              className="h-4 w-4"
              strokeWidth={2}
            />
          </Link>
        </div>

        {/* Reference */}
        <p className="mt-7 text-center text-[10px] leading-5 text-zinc-400">
          Order reference:{" "}
          <span className="font-mono text-zinc-500">
            {order.reference}
          </span>
        </p>
      </div>

      {/* Print styles */}
      <style>{`
        @media print {
          body {
            background: white !important;
          }

          main {
            min-height: auto !important;
            background: white !important;
          }

          main > div {
            max-width: 760px !important;
            padding-top: 20px !important;
          }

          main > div > a:first-child,
          main > div > div:first-of-type,
          main > div > .grid,
          main > div > p:last-child {
            display: none !important;
          }

          .shadow-\\[0_20px_60px_rgba\\(24\\,24\\,27\\,0\\.06\\)\\] {
            box-shadow: none !important;
          }
        }
      `}</style>
    </main>
  );
}

function TicketDetail({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="min-w-0">
      <p className="text-[9px] font-semibold uppercase tracking-[0.15em] text-zinc-400">
        {label}
      </p>

      <p
        className={[
          "mt-1.5 truncate text-xs font-semibold text-zinc-800",
          mono ? "font-mono text-[10px]" : "",
        ].join(" ")}
      >
        {value}
      </p>
    </div>
  );
}