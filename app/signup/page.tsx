"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";
import {
  ArrowRight,
  Check,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  ShieldCheck,
  UserRound,
} from "lucide-react";

export default function SignupPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [verificationId, setVerificationId] = useState("");
  const [code, setCode] = useState("");
  const [resendIn, setResendIn] = useState(0);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    if (resendIn <= 0) return;
    const timer = window.setTimeout(() => setResendIn((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearTimeout(timer);
  }, [resendIn]);

  async function sendCode() {
    if (loading) return;
    setLoading(true);
    setError("");
    setNotice("");
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), email: email.trim(), password }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(body.error || "We couldn't send your code. Please try again.");
        const retryAfter = Number(res.headers.get("Retry-After"));
        if (retryAfter > 0) setResendIn(retryAfter);
        return;
      }
      setEmail(body.email);
      setVerificationId(body.verificationId);
      setCode("");
      setResendIn(body.resendAfter || 60);
      setNotice("We've sent a six-digit code to your email. Check your inbox or spam folder. The code expires in 10 minutes.");
    } catch {
      setError("Something went wrong. Please check your connection and try again.");
    } finally { setLoading(false); }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (loading) return;
    if (!verificationId) { await sendCode(); return; }
    setLoading(true);
    setError("");
    let accountCreated = false;
    try {
      const res = await fetch("/api/auth/signup/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ verificationId, code }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) { setError(body.error || "We couldn't verify your email. Please try again."); return; }
      accountCreated = true;
      const signInRes = await signIn("credentials", { email, password, redirect: false });
      if (!signInRes || signInRes.error) { router.push("/login"); return; }
      router.push("/organiser/dashboard");
      router.refresh();
    } catch {
      if (accountCreated) { router.push("/login"); return; }
      setError("Something went wrong. Please check your connection and try again.");
    } finally { setLoading(false); }
  }

  return (
    <main className="min-h-[calc(100vh-73px)] bg-[#08070B]">
  <div className="mx-auto grid max-w-6xl lg:grid-cols-[1fr_460px] lg:gap-20 lg:px-10">
        {/* =========================================================
            DESKTOP BRAND MESSAGE
        ========================================================= */}

       <section className="hidden lg:flex lg:items-start lg:pt-[132px]">
          <div className="max-w-xl">
            <div className="mb-7 flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-[#7C3AED]" />

              <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/40">
                Built for organisers
              </span>
            </div>

            <h1 className="font-display text-[4.5rem] font-semibold leading-[0.96] tracking-[-0.055em] text-white">
              Put your event
              <br />
              <span className="text-white/30">in front of</span>
              <br />
              the right people.
            </h1>

            <p className="mt-7 max-w-md text-base leading-7 text-white/45">
              Create your organiser account and get everything you need to
              publish, sell and manage tickets from one place.
            </p>

            <div className="mt-10 space-y-4">
              <Benefit text="Create and publish events in minutes" />
              <Benefit text="Manage tickets and attendee information" />
              <Benefit text="Let attendees discover, book, and receive tickets on the platform" />
            </div>

            <div className="mt-10 flex items-center gap-3 text-[10px] uppercase tracking-[0.14em] text-white/20">
              <span className="h-px w-8 bg-white/10" />
              <span>One account. Every event.</span>
            </div>
          </div>
        </section>

        {/* =========================================================
            SIGNUP AREA
        ========================================================= */}

       <section className="flex items-start px-5 pb-12 pt-[124px] sm:px-8 sm:pb-16 sm:pt-[132px] lg:px-0 lg:pt-[132px]">
          <div className="mx-auto w-full max-w-[460px]">
            {/* Mobile brand */}

            <div className="mb-8 flex justify-center lg:hidden">
              <Link href="/" className="flex items-center gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-[11px] bg-[#7C3AED] font-display text-sm font-bold text-white">
                  T
                </span>

                <span className="font-display text-base font-semibold text-white">
                  tickety
                  <span className="text-[#A78BFA]">.africa</span>
                </span>
              </Link>
            </div>

            {/* =====================================================
                FORM CARD
            ===================================================== */}

            <div className="overflow-hidden rounded-[24px] border border-white/[0.08] bg-white">
              <div className="p-6 sm:p-9">
                {/* Header */}

                <div>
                  <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-[13px] bg-[#111014]">
                    <UserRound size={17} className="text-white" />
                  </div>

                  <h2 className="font-display text-3xl font-semibold tracking-[-0.04em] text-[#111014]">
                    {verificationId ? "Verify your email" : "Create your account"}
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-black/40">
                    {verificationId ? `Enter the code sent to ${email}.` : "Start organising better events with Tickety."}
                  </p>
                </div>

                {/* Error */}

                {error && (
                  <div className="mt-6 flex items-start gap-3 rounded-[12px] border border-red-200 bg-red-50 px-4 py-3">
                    <span className="mt-[6px] h-1.5 w-1.5 shrink-0 rounded-full bg-red-500" />

                    <p role="alert" className="text-xs leading-5 text-red-600">
                      {error}
                    </p>
                  </div>
                )}

                {notice && <p role="status" className="mt-5 rounded-xl bg-purple-50 px-4 py-3 text-xs leading-5 text-purple-800">{notice}</p>}

                {/* =================================================
                    FORM
                ================================================= */}

                <form
                  onSubmit={handleSubmit}
                  className="mt-7 space-y-5"
                >
                  {!verificationId && <fieldset disabled={loading} className="space-y-5">
                  {/* Name */}

                  <label className="block">
                    <span className="mb-2 block text-xs font-semibold text-[#111014]">
                      Full name
                    </span>

                    <div className="relative">
                      <UserRound
                        size={16}
                        className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-black/25"
                      />

                      <input
                        required
                        type="text"
                        autoComplete="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Your full name"
                        className="
                          h-[52px]
                          w-full
                          rounded-[14px]
                          border
                          border-black/[0.09]
                          bg-[#FAFAF9]
                          pl-11
                          pr-4
                          text-sm
                          text-[#111014]
                          outline-none
                          placeholder:text-black/25
                          focus:border-[#7C3AED]/50
                          focus:bg-white
                          focus:ring-2
                          focus:ring-[#7C3AED]/10
                        "
                      />
                    </div>
                  </label>

                  {/* Email */}

                  <label className="block">
                    <span className="mb-2 block text-xs font-semibold text-[#111014]">
                      Email address
                    </span>

                    <div className="relative">
                      <Mail
                        size={16}
                        className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-black/25"
                      />

                      <input
                        required
                        type="email"
                        autoComplete="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        className="
                          h-[52px]
                          w-full
                          rounded-[14px]
                          border
                          border-black/[0.09]
                          bg-[#FAFAF9]
                          pl-11
                          pr-4
                          text-sm
                          text-[#111014]
                          outline-none
                          placeholder:text-black/25
                          focus:border-[#7C3AED]/50
                          focus:bg-white
                          focus:ring-2
                          focus:ring-[#7C3AED]/10
                        "
                      />
                    </div>
                  </label>

                  {/* Password */}

                  <label className="block">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-xs font-semibold text-[#111014]">
                        Password
                      </span>

                      <span className="text-[10px] text-black/30">
                        8+ characters
                      </span>
                    </div>

                    <div className="relative">
                      <LockKeyhole
                        size={16}
                        className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-black/25"
                      />

                      <input
                        required
                        type={showPassword ? "text" : "password"}
                        minLength={8}
                        autoComplete="new-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Create a password"
                        className="
                          h-[52px]
                          w-full
                          rounded-[14px]
                          border
                          border-black/[0.09]
                          bg-[#FAFAF9]
                          pl-11
                          pr-12
                          text-sm
                          text-[#111014]
                          outline-none
                          placeholder:text-black/25
                          focus:border-[#7C3AED]/50
                          focus:bg-white
                          focus:ring-2
                          focus:ring-[#7C3AED]/10
                        "
                      />

                      <button
                        type="button"
                        onClick={() =>
                          setShowPassword((value) => !value)
                        }
                        className="
                          absolute
                          right-2
                          top-1/2
                          flex
                          h-9
                          w-9
                          -translate-y-1/2
                          items-center
                          justify-center
                          rounded-full
                          text-black/30
                        "
                        aria-label={
                          showPassword
                            ? "Hide password"
                            : "Show password"
                        }
                      >
                        {showPassword ? (
                          <EyeOff size={16} />
                        ) : (
                          <Eye size={16} />
                        )}
                      </button>
                    </div>

                    <div className="mt-2 flex items-center gap-1.5">
                      <Check
                        size={12}
                        className={
                          password.length >= 8
                            ? "text-[#16A34A]"
                            : "text-black/15"
                        }
                      />

                      <span
                        className={
                          password.length >= 8
                            ? "text-[10px] text-[#16A34A]"
                            : "text-[10px] text-black/30"
                        }
                      >
                        At least 8 characters
                      </span>
                    </div>
                  </label>

                  </fieldset>}

                  {verificationId && (
                    <div className="space-y-4">
                      <label className="block">
                        <span className="mb-2 block text-xs font-semibold text-[#111014]">Verification code</span>
                        <input autoFocus required type="text" inputMode="numeric" autoComplete="one-time-code"
                          pattern="[0-9]{6}" maxLength={6} value={code} disabled={loading}
                          onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, "").slice(0, 6))}
                          placeholder="000000" aria-describedby="code-help"
                          className="h-[52px] w-full rounded-[14px] border border-black/10 bg-[#FAFAF9] px-4 text-center text-xl tracking-[0.4em] text-[#111014] outline-none focus:border-[#7C3AED]/50 focus:ring-2 focus:ring-[#7C3AED]/10" />
                      </label>
                      <p id="code-help" className="text-xs text-black/50">Use the most recent code. Each code can only be used once.</p>
                      <div className="flex items-center justify-between gap-3 text-xs">
                        <button type="button" disabled={loading || resendIn > 0} onClick={sendCode}
                          className="font-semibold text-[#6D28D9] disabled:opacity-50">
                          {resendIn > 0 ? `Resend code in ${resendIn}s` : "Resend code"}
                        </button>
                        <button type="button" disabled={loading} className="text-black/50"
                          onClick={() => { setVerificationId(""); setCode(""); setError(""); setNotice(""); }}>Change details</button>
                      </div>
                    </div>
                  )}

                  {/* Submit */}

                  <button
                    type="submit"
                    disabled={loading || (!verificationId && resendIn > 0)}
                    className="
                      flex
                      h-[54px]
                      w-full
                      items-center
                      justify-center
                      gap-2
                      rounded-full
                      bg-[#111014]
                      px-6
                      text-sm
                      font-semibold
                      text-white
                      disabled:cursor-not-allowed
                      disabled:opacity-60
                    "
                  >
                    {loading ? (
                      <>
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/25 border-t-white" />

                        <span>{verificationId ? "Verifying..." : "Sending code..."}</span>
                      </>
                    ) : (
                      <>
                        <span>{verificationId ? "Verify email & create account" : resendIn > 0 ? `Try again in ${resendIn}s` : "Send verification code"}</span>
                        <ArrowRight size={16} />
                      </>
                    )}
                  </button>
                </form>

                {/* Login */}

                <div className="mt-7 border-t border-black/[0.06] pt-6 text-center">
                  <p className="text-sm text-black/40">
                    Already have an account?{" "}
                    <Link
                      href="/login"
                      className="font-semibold text-[#6D28D9]"
                    >
                      Log in
                    </Link>
                  </p>
                </div>

                {/* Security */}

                <div className="mt-5 flex items-center justify-center gap-1.5 text-[10px] text-black/25">
                  <ShieldCheck size={13} />

                  <span>Your organiser account is secure</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

/* ===============================================================
   BENEFIT
=============================================================== */

function Benefit({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/[0.06]">
        <Check
          size={13}
          className="text-[#A78BFA]"
          strokeWidth={2.5}
        />
      </div>

      <span className="text-sm text-white/45">{text}</span>
    </div>
  );
}
