import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  ChevronRight,
  Clock3,
  MapPin,
  ScanLine,
  Ticket,
} from "lucide-react";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getEventEnd, getEventStart } from "@/lib/event-time";
import StaffLogoutButton from "@/components/staff/StaffLogoutButton";

export const dynamic = "force-dynamic";

export default async function StaffCheckInPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login");
  }

  if (session.user.role !== "CHECKIN_STAFF") {
    redirect("/organiser/check-in");
  }

  const assignments = await prisma.eventStaff.findMany({
    where: {
      userId: session.user.id,
    },
    include: {
      event: {
        select: {
          id: true,
          title: true,
          venue: true,
          date: true,
          startTime: true,
          endTime: true,
          endDate: true,
          timezone: true,
          status: true,
        },
      },
    },
    orderBy: {
      event: {
        date: "asc",
      },
    },
  });

  const now = new Date();

  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  );

  const endOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + 1
  );

  const events = assignments
    .map((assignment) => assignment.event)
    .filter((event) => {
      if (
        event.status === "disabled" ||
        event.status === "archived"
      ) {
        return false;
      }

      return getEventEnd(event) > now;
    });

  const todayEvents = events.filter((event) => {
    return (
      getEventStart(event) < endOfToday &&
      getEventEnd(event) > startOfToday
    );
  });

  const upcomingEvents = events.filter((event) => {
    const eventDate = new Date(event.date);

    return eventDate >= endOfToday;
  });

  const firstName =
    session.user.name?.trim().split(/\s+/)[0] || "there";

  return (
    <main className="min-h-screen bg-[#F8F7F5] text-[#111014]">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-black/[0.07] bg-[#F8F7F5]/95 backdrop-blur">
        <div className="mx-auto flex h-[68px] max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link
            href="/staff/check-in"
            className="group flex items-center gap-3"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-[#111014] text-white">
              <ScanLine size={17} strokeWidth={2.2} />
            </div>

            <div className="leading-none">
              <p className="text-[13px] font-bold tracking-[-0.02em]">
                tickety
              </p>

              <p className="mt-1 text-[9px] font-semibold uppercase tracking-[0.16em] text-black/30">
                Staff
              </p>
            </div>
          </Link>

          <div className="flex items-center gap-2">
            <div className="hidden items-center gap-2 rounded-full border border-black/[0.07] bg-white px-3 py-2 sm:flex">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />

              <span className="text-[11px] font-semibold text-black/55">
                Check-in staff
              </span>
            </div>

            <StaffLogoutButton />
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 pb-12 pt-8 sm:px-6 sm:pb-16 sm:pt-12">
        {/* Intro */}
        <section>
          <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#6D28D9]">
                Staff workspace
              </p>

              <h1 className="mt-2 text-[30px] font-semibold tracking-[-0.045em] sm:text-[38px]">
                Good to see you, {firstName}.
              </h1>

              <p className="mt-2 max-w-lg text-sm leading-6 text-black/45">
                Choose an event below to open the check-in
                scanner and manage the gate.
              </p>
            </div>

            {events.length > 0 && (
              <div className="flex items-center gap-3 self-start rounded-xl border border-black/[0.07] bg-white px-4 py-3 sm:self-auto">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#F2F0ED]">
                  <Ticket
                    size={15}
                    className="text-black/55"
                  />
                </div>

                <div>
                  <p className="text-sm font-semibold">
                    {events.length}
                  </p>

                  <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-black/35">
                    Active {events.length === 1 ? "event" : "events"}
                  </p>
                </div>
              </div>
            )}
          </div>
        </section>

        {events.length === 0 ? (
          /* Empty state */
          <section className="mt-10 overflow-hidden rounded-[24px] border border-black/[0.07] bg-white">
            <div className="px-6 py-16 text-center sm:px-10 sm:py-20">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F3F1EE]">
                <CalendarDays
                  size={22}
                  className="text-black/40"
                />
              </div>

              <h2 className="mt-5 text-lg font-semibold tracking-[-0.02em]">
                Nothing assigned yet
              </h2>

              <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-black/40">
                You don't have any active events assigned to
                your account. Ask the organiser to give you
                access to an event.
              </p>
            </div>
          </section>
        ) : (
          <div className="mt-10 space-y-10">
            {/* Today's events */}
            {todayEvents.length > 0 && (
              <section>
                <div className="mb-4 flex items-end justify-between">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#6D28D9]">
                      Today
                    </p>

                    <h2 className="mt-1 text-lg font-semibold tracking-[-0.025em]">
                      Events happening today
                    </h2>
                  </div>

                  <span className="text-xs font-medium text-black/35">
                    {todayEvents.length}{" "}
                    {todayEvents.length === 1
                      ? "event"
                      : "events"}
                  </span>
                </div>

                <div className="space-y-3">
                  {todayEvents.map((event) => (
                    <StaffEventCard
                      key={event.id}
                      event={event}
                      featured
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Upcoming events */}
            {upcomingEvents.length > 0 && (
              <section>
                <div className="mb-4 flex items-end justify-between">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-black/30">
                      Upcoming
                    </p>

                    <h2 className="mt-1 text-lg font-semibold tracking-[-0.025em]">
                      Your upcoming events
                    </h2>
                  </div>

                  <span className="text-xs font-medium text-black/35">
                    {upcomingEvents.length}{" "}
                    {upcomingEvents.length === 1
                      ? "event"
                      : "events"}
                  </span>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  {upcomingEvents.map((event) => (
                    <StaffEventCard
                      key={event.id}
                      event={event}
                    />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </main>
  );
}

function StaffEventCard({
  event,
  featured = false,
}: {
  event: {
    id: string;
    title: string;
    venue: string;
    date: Date;
    startTime: string;
    endTime: string;
    status: "live" | "pending" | "disabled" | "archived";
  };
  featured?: boolean;
}) {
  const date = new Date(event.date);

  const formattedDate = new Intl.DateTimeFormat("en-NG", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);

  return (
    <Link
      href={`/staff/check-in/${event.id}`}
      className={[
        "group relative block overflow-hidden rounded-[20px] border bg-white transition-all duration-200",
        featured
          ? "border-[#6D28D9]/20 shadow-[0_12px_35px_rgba(109,40,217,0.07)] hover:border-[#6D28D9]/35 hover:shadow-[0_18px_45px_rgba(109,40,217,0.11)]"
          : "border-black/[0.07] hover:border-black/[0.14] hover:shadow-[0_12px_35px_rgba(0,0,0,0.055)]",
      ].join(" ")}
    >
      <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:p-6">
        {/* Date block */}
        <div
          className={[
            "flex h-[72px] w-[72px] shrink-0 flex-col items-center justify-center rounded-2xl border",
            featured
              ? "border-[#6D28D9]/10 bg-[#F5F1FF]"
              : "border-black/[0.06] bg-[#F7F6F4]",
          ].join(" ")}
        >
          <span
            className={[
              "text-[10px] font-bold uppercase tracking-[0.12em]",
              featured
                ? "text-[#6D28D9]"
                : "text-black/35",
            ].join(" ")}
          >
            {new Intl.DateTimeFormat("en-NG", {
              month: "short",
            }).format(date)}
          </span>

          <span className="mt-0.5 text-2xl font-semibold leading-none tracking-[-0.04em]">
            {date.getDate()}
          </span>
        </div>

        {/* Main information */}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h3 className="truncate text-[17px] font-semibold tracking-[-0.025em] sm:text-lg">
                {event.title}
              </h3>

              <p className="mt-1 text-xs font-medium text-black/40">
                {formattedDate}
              </p>
            </div>

            {featured && (
              <span className="hidden shrink-0 items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1.5 text-[10px] font-bold text-emerald-700 sm:inline-flex">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Today
              </span>
            )}
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
            <span className="inline-flex items-center gap-1.5 text-xs text-black/45">
              <Clock3 size={13} />
              {event.startTime}
              {event.endTime
                ? ` – ${event.endTime}`
                : ""}
            </span>

            {event.venue && (
              <span className="inline-flex max-w-[260px] items-center gap-1.5 truncate text-xs text-black/45">
                <MapPin size={13} />
                <span className="truncate">
                  {event.venue}
                </span>
              </span>
            )}
          </div>
        </div>

        {/* Action */}
        <div className="flex shrink-0 items-center justify-between border-t border-black/[0.06] pt-4 sm:border-0 sm:pt-0">
          <span
            className={[
              "inline-flex h-10 items-center gap-2 rounded-xl px-4 text-xs font-semibold transition",
              featured
                ? "bg-[#111014] text-white group-hover:bg-[#6D28D9]"
                : "border border-black/[0.08] bg-white text-black/65 group-hover:border-black/[0.14] group-hover:text-black",
            ].join(" ")}
          >
            <ScanLine size={14} />
            Open scanner
            <ArrowRight
              size={13}
              className="transition-transform group-hover:translate-x-0.5"
            />
          </span>

          <ChevronRight
            size={17}
            className="text-black/20 sm:hidden"
          />
        </div>
      </div>
    </Link>
  );
}