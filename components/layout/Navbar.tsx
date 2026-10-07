"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  ChevronRight,
  Compass,
  LogIn,
  Menu,
  Plus,
  Ticket,
  X,
} from "lucide-react";
import { useSession, signOut } from "next-auth/react";
import Button from "@/components/ui/Button";

const publicLinks = [
  { href: "/", label: "Home" },
  { href: "/explore", label: "Explore Events" },
  { href: "/what-we-offer", label: "What We Offer" },
];

export default function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const { data: session, status } = useSession();

  const isAuthenticated =
    status === "authenticated" && !!session?.user;

  const closeMenu = () => setOpen(false);

  return (
    <header className="fixed left-0 right-0 top-0 z-50 w-full">
      <nav className="mx-auto w-[92%] max-w-[1440px] pt-4 sm:pt-5 lg:pt-6">
        <div className="relative">
          {/* Floating white navbar */}
          <div
            className="
              relative
              flex h-[68px] items-center
              rounded-full
              border border-black/[0.07]
              bg-white/[0.94]
              px-3
              shadow-[0_12px_40px_rgba(0,0,0,0.10),0_4px_14px_rgba(109,40,217,0.08)]
              backdrop-blur-2xl
              sm:px-4
              lg:h-[74px]
              lg:px-5
            "
          >
            {/* Subtle purple edge highlight */}
            <div
              aria-hidden="true"
              className="
                pointer-events-none
                absolute inset-0
                rounded-full
                border border-[#6D28D9]/[0.06]
              "
            />

            {/* Logo */}
            <Link
              href="/"
              onClick={closeMenu}
              aria-label="Tickety home"
              className="
                group relative
                flex shrink-0 items-center
                rounded-full
                px-2
                transition-opacity duration-200
                hover:opacity-80
                sm:px-3
              "
            >
              <img
                src="/images/logo/logos.png"
                alt="Tickety"
                className="
                  h-8 w-auto
                  object-contain
                  sm:h-9
                  lg:h-[39px]
                "
              />
            </Link>

            {/* Desktop navigation */}
            <div className="relative hidden flex-1 items-center justify-center lg:flex">
              <div
                className="
                  flex items-center
                  rounded-full
                  border border-black/[0.05]
                  bg-[#F7F5FA]
                  p-1
                "
              >
                {publicLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    aria-current={pathname === link.href ? "page" : undefined}
                    className="
                      group relative
                      flex h-10 items-center
                      rounded-full
                      px-3 xl:px-5
                      text-[13px]
                      font-medium
                      text-black/50
                      transition-all duration-200
                      aria-[current=page]:bg-white
                      aria-[current=page]:text-[#6D28D9]
                      hover:bg-white
                      hover:text-[#111014]
                      hover:shadow-[0_2px_8px_rgba(0,0,0,0.06)]
                    "
                  >
                    {link.label}

                    <span
                      className="
                        absolute bottom-1.5
                        left-1/2
                        h-[2px]
                        w-1
                        -translate-x-1/2
                        rounded-full
                        bg-[#6D28D9]
                        opacity-0
                        transition-all duration-200
                        group-hover:w-5
                        group-hover:opacity-100
                      "
                    />
                  </Link>
                ))}

                {isAuthenticated && (
                  <Link
                    href="/organiser/dashboard"
                    className="
                      group relative
                      flex h-10 items-center
                      rounded-full
                      px-3 xl:px-5
                      text-[13px]
                      font-medium
                      text-black/50
                      transition-all duration-200
                      hover:bg-white
                      hover:text-[#111014]
                      hover:shadow-[0_2px_8px_rgba(0,0,0,0.06)]
                    "
                  >
                    My events

                    <span
                      className="
                        absolute bottom-1.5
                        left-1/2
                        h-[2px]
                        w-1
                        -translate-x-1/2
                        rounded-full
                        bg-[#6D28D9]
                        opacity-0
                        transition-all duration-200
                        group-hover:w-5
                        group-hover:opacity-100
                      "
                    />
                  </Link>
                )}

                {session?.user?.role === "ADMIN" && (
                  <Link
                    href="/admin"
                    className="
                      group relative
                      flex h-10 items-center
                      rounded-full
                      px-3 xl:px-5
                      text-[13px]
                      font-medium
                      text-black/50
                      transition-all duration-200
                      hover:bg-white
                      hover:text-[#111014]
                      hover:shadow-[0_2px_8px_rgba(0,0,0,0.06)]
                    "
                  >
                    Admin

                    <span
                      className="
                        absolute bottom-1.5
                        left-1/2
                        h-[2px]
                        w-1
                        -translate-x-1/2
                        rounded-full
                        bg-[#6D28D9]
                        opacity-0
                        transition-all duration-200
                        group-hover:w-5
                        group-hover:opacity-100
                      "
                    />
                  </Link>
                )}
              </div>
            </div>

            {/* Desktop account actions */}
            <div className="relative hidden items-center gap-2 lg:flex">
              {isAuthenticated ? (
                <>
                  <Link
                    href="/organiser/dashboard"
                    className="
                      group
                      flex h-11 items-center gap-2.5
                      rounded-full
                      px-3
                      transition-all duration-200
                      hover:bg-[#F7F5FA]
                    "
                  >
                    <span
                      className="
                        flex h-8 w-8 shrink-0
                        items-center justify-center
                        rounded-full
                        bg-[#6D28D9]/10
                        ring-1 ring-[#6D28D9]/10
                      "
                    >
                      <span className="text-[10px] font-semibold uppercase text-[#6D28D9]">
                        {session.user.name?.charAt(0) || "U"}
                      </span>
                    </span>

                    <span className="hidden text-xs font-medium text-black/45 lg:block">
                      Hi,{" "}
                      <span className="text-black/80">
                        {session.user.name?.split(" ")[0]}
                      </span>
                    </span>
                  </Link>

                  <Button
                    variant="ghost"
                    size="md"
                    onClick={() =>
                      signOut({
                        callbackUrl: "/",
                      })
                    }
                    className="
                      h-10
                      rounded-full
                      border border-black/[0.08]
                      bg-[#F8F7FA]
                      px-4
                      text-xs
                      font-medium
                      text-black/55
                      transition-all duration-200
                      hover:border-black/[0.12]
                      hover:bg-[#F1EFF5]
                      hover:text-black
                    "
                  >
                    Log out
                  </Button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="
                      flex h-10 items-center
                      rounded-full
                      px-4
                      text-[13px]
                      font-medium
                      text-black/50
                      transition-colors duration-200
                      hover:text-black
                    "
                  >
                    Log in
                  </Link>

                  <Link
                    href="/signup"
                    className="
                      group
                      flex h-11 items-center gap-2
                      rounded-full
                      bg-[#6D28D9]
                      px-3 xl:px-5
                      text-[13px]
                      font-semibold
                      text-white
                      shadow-[0_5px_16px_rgba(109,40,217,0.20)]
                      transition-all duration-200
                      hover:-translate-y-0.5
                      hover:bg-[#5B21B6]
                      hover:shadow-[0_7px_20px_rgba(109,40,217,0.25)]
                    "
                  >
                    Sign up

                    <ArrowUpRight
                      size={14}
                      strokeWidth={2}
                      className="
                        transition-transform duration-200
                        group-hover:-translate-y-0.5
                        group-hover:translate-x-0.5
                      "
                    />
                  </Link>
                </>
              )}
            </div>

            {/* Mobile menu button */}
            <button
              type="button"
              onClick={() => setOpen((value) => !value)}
              aria-label={open ? "Close menu" : "Open menu"}
              aria-expanded={open}
              className="
                relative ml-auto
                flex h-11 w-11
                items-center justify-center
                rounded-full
                border border-black/[0.08]
                bg-[#F7F5FA]
                text-black/70
                shadow-sm
                transition-all duration-200
                hover:bg-[#F0EDF5]
                lg:hidden
              "
            >
              {open ? <X size={19} /> : <Menu size={19} />}
            </button>
          </div>

          {/* Mobile floating menu */}
          {open && (
            <div
              className="
                absolute
                left-0 right-0
                top-[78px]
                overflow-hidden
                rounded-[28px]
                border border-black/[0.07]
                bg-white/[0.97]
                shadow-[0_18px_55px_rgba(0,0,0,0.14),0_8px_25px_rgba(109,40,217,0.08)]
                backdrop-blur-2xl
                lg:hidden
              "
            >
              <div className="p-3 sm:p-4">
                {/* Discover */}
                <div>
                  <div className="mb-2 flex items-center justify-between px-2">
                    <span className="text-[9px] font-semibold uppercase tracking-[0.2em] text-black/35">
                      Discover
                    </span>

                    <span className="text-[9px] font-medium uppercase tracking-[0.16em] text-[#6D28D9]/45">
                      Tickety
                    </span>
                  </div>

                  <div
                    className="
                      overflow-hidden
                      rounded-[20px]
                      border border-black/[0.06]
                      bg-[#F8F7FA]
                    "
                  >
                    {publicLinks.map((link, index) => (
                      <Link
                        key={link.href}
                        href={link.href}
                        aria-current={pathname === link.href ? "page" : undefined}
                        onClick={closeMenu}
                        className={`
                          group
                          flex min-h-[62px]
                          items-center justify-between
                          px-4
                          transition-colors duration-200
                          hover:bg-white
                          ${
                            index !== publicLinks.length - 1
                              ? "border-b border-black/[0.06]"
                              : ""
                          }
                        `}
                      >
                        <div className="flex items-center gap-3.5">
                          <span
                            className="
                              flex h-10 w-10
                              items-center justify-center
                              rounded-[13px]
                              bg-[#6D28D9]/[0.08]
                              text-[#6D28D9]
                              transition-all duration-200
                              group-hover:bg-[#6D28D9]/[0.14]
                            "
                          >
                            {link.href === "/explore" ? (
                              <Compass size={17} />
                            ) : (
                              <Ticket size={17} />
                            )}
                          </span>

                          <span className="text-sm font-medium text-black/70 group-hover:text-black">
                            {link.label}
                          </span>
                        </div>

                        <ChevronRight
                          size={16}
                          className="
                            text-black/20
                            transition-all duration-200
                            group-hover:translate-x-0.5
                            group-hover:text-[#6D28D9]
                          "
                        />
                      </Link>
                    ))}
                  </div>
                </div>

                {/* Account */}
                {isAuthenticated && (
                  <div className="mt-5">
                    <div className="mb-2 px-2">
                      <span className="text-[9px] font-semibold uppercase tracking-[0.2em] text-black/35">
                        Your account
                      </span>
                    </div>

                    <div
                      className="
                        overflow-hidden
                        rounded-[20px]
                        border border-black/[0.06]
                        bg-[#F8F7FA]
                      "
                    >
                      <Link
                        href="/organiser/dashboard"
                        onClick={closeMenu}
                        className="
                          group
                          flex min-h-[62px]
                          items-center justify-between
                          px-4
                          transition-colors
                          hover:bg-white
                        "
                      >
                        <div className="flex items-center gap-3.5">
                          <span
                            className="
                              flex h-10 w-10
                              items-center justify-center
                              rounded-[13px]
                              bg-[#6D28D9]/[0.08]
                            "
                          >
                            <CalendarDays
                              size={17}
                              className="text-[#6D28D9]"
                            />
                          </span>

                          <div>
                            <p className="text-sm font-medium text-black/80">
                              My events
                            </p>

                            <p className="mt-0.5 text-[10px] text-black/35">
                              Manage your events
                            </p>
                          </div>
                        </div>

                        <ChevronRight
                          size={16}
                          className="text-black/20"
                        />
                      </Link>

                      {session?.user?.role === "ADMIN" && (
                        <Link
                          href="/admin"
                          onClick={closeMenu}
                          className="
                            group
                            flex min-h-[62px]
                            items-center justify-between
                            border-t border-black/[0.06]
                            px-4
                            transition-colors
                            hover:bg-white
                          "
                        >
                          <div className="flex items-center gap-3.5">
                            <span
                              className="
                                flex h-10 w-10
                                items-center justify-center
                                rounded-[13px]
                                bg-black/[0.04]
                                text-xs font-bold
                                text-black/50
                              "
                            >
                              A
                            </span>

                            <span className="text-sm font-medium text-black/70">
                              Admin
                            </span>
                          </div>

                          <ChevronRight
                            size={16}
                            className="text-black/20"
                          />
                        </Link>
                      )}
                    </div>
                  </div>
                )}

                {/* Authentication */}
                <div className="mt-5">
                  {isAuthenticated ? (
                    <div
                      className="
                        rounded-[20px]
                        border border-black/[0.06]
                        bg-[#F8F7FA]
                        p-4
                      "
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="
                            flex h-11 w-11 shrink-0
                            items-center justify-center
                            rounded-full
                            bg-[#6D28D9]/10
                            ring-1 ring-[#6D28D9]/10
                          "
                        >
                          <span className="text-xs font-semibold uppercase text-[#6D28D9]">
                            {session.user.name?.charAt(0) || "U"}
                          </span>
                        </div>

                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-black/80">
                            {session.user.name || "Account"}
                          </p>

                          <p className="mt-0.5 text-[10px] text-black/35">
                            Signed in to Tickety
                          </p>
                        </div>
                      </div>

                      <Button
                        variant="secondary"
                        size="md"
                        onClick={() =>
                          signOut({
                            callbackUrl: "/",
                          })
                        }
                        className="
                          mt-4
                          h-11 w-full
                          rounded-full
                          border-black/[0.08]
                          bg-white
                          text-sm
                          text-black/70
                          hover:bg-[#F1EFF5]
                        "
                      >
                        Log out
                      </Button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2.5">
                      <Link
                        href="/login"
                        onClick={closeMenu}
                        className="
                          flex h-12
                          items-center justify-center gap-2
                          rounded-full
                          border border-black/[0.08]
                          bg-[#F8F7FA]
                          text-sm
                          font-medium
                          text-black/65
                          transition-colors
                          hover:bg-[#F0EDF5]
                          hover:text-black
                        "
                      >
                        <LogIn size={15} />
                        Log in
                      </Link>

                      <Link
                        href="/signup"
                        onClick={closeMenu}
                        className="
                          flex h-12
                          items-center justify-center gap-2
                          rounded-full
                          bg-[#6D28D9]
                          text-sm
                          font-semibold
                          text-white
                          shadow-[0_5px_16px_rgba(109,40,217,0.18)]
                          transition-colors
                          hover:bg-[#5B21B6]
                        "
                      >
                        Sign up
                        <ArrowUpRight size={14} />
                      </Link>
                    </div>
                  )}
                </div>

                {/* Create event */}
                {!isAuthenticated && (
                  <Link
                    href="/signup"
                    onClick={closeMenu}
                    className="
                      group
                      mt-3
                      flex items-center justify-between
                      rounded-[20px]
                      border border-[#6D28D9]/10
                      bg-[#6D28D9]/[0.06]
                      px-4 py-4
                      transition-colors
                      hover:bg-[#6D28D9]/[0.10]
                    "
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className="
                          flex h-10 w-10
                          items-center justify-center
                          rounded-[13px]
                          bg-[#6D28D9]/10
                        "
                      >
                        <Plus
                          size={17}
                          className="text-[#6D28D9]"
                        />
                      </span>

                      <div>
                        <p className="text-sm font-semibold text-black/80">
                          Create an event
                        </p>

                        <p className="mt-0.5 text-[10px] text-black/35">
                          Sell tickets on Tickety
                        </p>
                      </div>
                    </div>

                    <ArrowRight
                      size={16}
                      className="
                        text-[#6D28D9]/50
                        transition-transform duration-200
                        group-hover:translate-x-1
                        group-hover:text-[#6D28D9]
                      "
                    />
                  </Link>
                )}

                {/* Brand signature */}
                <div className="flex items-center justify-center gap-2 pb-1 pt-5">
                  <span className="h-1 w-1 rounded-full bg-[#6D28D9]/50" />

                  <span
                    className="
                      text-[9px]
                      font-medium
                      uppercase
                      tracking-[0.2em]
                      text-black/25
                    "
                  >
                    Discover · Book · Experience
                  </span>

                  <span className="h-1 w-1 rounded-full bg-[#6D28D9]/50" />
                </div>
              </div>
            </div>
          )}
        </div>
      </nav>
    </header>
  );
}