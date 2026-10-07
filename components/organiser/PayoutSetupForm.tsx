"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import {
  CheckCircle2,
  ChevronDown,
  Loader2,
  LockKeyhole,
  ShieldCheck,
} from "lucide-react";

type Bank = {
  id: number;
  name: string;
  code: string;
  active?: boolean;
  country?: string;
  currency?: string;
};

type PayoutResponse = {
  success?: boolean;
  connected?: boolean;
  subaccountCode?: string;
  accountName?: string;
  accountNumber?: string;
  bankCode?: string;
  verificationToken?: string;
  error?: string;
};

type BanksResponse = {
  banks?: Bank[];
  connected?: boolean;
  subaccountCode?: string;
  error?: string;
};

type FormState =
  | "idle"
  | "loading-banks"
  | "verifying"
  | "saving";

export default function PayoutSetupForm({
  mode = "connect", initialBusinessName = "", onCancel, onSaved,
}: {
  mode?: "connect" | "edit";
  initialBusinessName?: string;
  onCancel?: () => void;
  onSaved?: () => void;
} = {}) {
  const router = useRouter();
  const editing = mode === "edit";
  const [pin, setPin] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [banks, setBanks] = useState<Bank[]>([]);

  const [bankCode, setBankCode] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState("");
  const [businessName, setBusinessName] = useState(initialBusinessName);

  /*
   * This token is returned by the server after Paystack
   * successfully verifies the account.
   *
   * The Connect request sends this token instead of
   * making another /bank/resolve request.
   */
  const [verificationToken, setVerificationToken] =
    useState("");

  const [formState, setFormState] =
    useState<FormState>("loading-banks");

  const [error, setError] = useState("");
  const [verified, setVerified] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    async function loadBanks() {
      try {
        setError("");

        const response = await fetch(
          editing ? "/api/organiser/payout?banks=1" : "/api/organiser/payout",
          {
            method: "GET",
            cache: "no-store",
          }
        );

        const data =
          (await response.json()) as BanksResponse;

        if (!response.ok) {
          throw new Error(
            data.error || "Unable to load banks."
          );
        }

        setBanks(data.banks ?? []);

        if (data.connected && !editing) {
          setSuccess(true);
        }

        setFormState("idle");
      } catch (error) {
        setError(
          error instanceof Error
            ? error.message
            : "Unable to load banks."
        );

        setFormState("idle");
      }
    }

    loadBanks();
  }, [editing]);

  function clearVerification() {
    setConfirmed(false);
    setVerified(false);
    setAccountName("");
    setVerificationToken("");
  }

  function handleAccountNumberChange(value: string) {
    const cleaned = value
      .replace(/\D/g, "")
      .slice(0, 10);

    setAccountNumber(cleaned);

    clearVerification();

    if (error) {
      setError("");
    }
  }

  function handleBankChange(value: string) {
    setBankCode(value);

    clearVerification();

    if (error) {
      setError("");
    }
  }

  async function verifyAccount() {
    if (!bankCode) {
      setError("Select your bank first.");
      return;
    }

    if (!/^\d{10}$/.test(accountNumber)) {
      setError("Enter your 10-digit account number.");
      return;
    }

    try {
      setFormState("verifying");
      setError("");

      clearVerification();

      const response = await fetch(
        "/api/organiser/payout/verify",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            bankCode,
            accountNumber,
          }),
        }
      );

      const data =
        (await response.json()) as PayoutResponse;

      if (!response.ok) {
        throw new Error(
          data.error || "Unable to verify this account."
        );
      }

      if (!data.accountName) {
        throw new Error(
          "We could not retrieve the name attached to this account."
        );
      }

      if (!data.verificationToken) {
        throw new Error(
          "Account was verified, but the verification token was not returned."
        );
      }

      setAccountName(data.accountName);

      /*
       * Store the secure server-generated token.
       */
      setVerificationToken(
        data.verificationToken
      );

      setVerified(true);
      setFormState("idle");
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Unable to verify this account."
      );

      setFormState("idle");
    }
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!bankCode) {
      setError("Select your bank first.");
      return;
    }

    if (!/^\d{10}$/.test(accountNumber)) {
      setError("Enter your 10-digit account number.");
      return;
    }

    if (!verified || !accountName) {
      setError(
        "Verify your bank account before continuing."
      );
      return;
    }

    if (!verificationToken) {
      setError(
        "Your bank verification has expired. Please verify the account again."
      );
      return;
    }

    if (editing && !confirmed) {
      setError("Confirm the verified account details before saving.");
      return;
    }

    try {
      setFormState("saving");
      setError("");

      const response = await fetch(
        "/api/organiser/payout",
        {
          method: editing ? "PATCH" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            pin,
            confirmed: editing ? confirmed : undefined,
            bankCode,
            accountNumber,
            businessName:
              businessName.trim() || undefined,
            verificationToken,
          }),
        }
      );

      const data =
        (await response.json()) as PayoutResponse;

      if (!response.ok) {
        throw new Error(
          data.error ||
            (editing ? "Unable to update your payout account." : "Unable to connect your payout account.")
        );
      }

      setPin("");
      setFormState("idle");
      if (onSaved) onSaved();
      else { setSuccess(true); router.refresh(); }
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : (editing ? "Unable to update your payout account." : "Unable to connect your payout account.")
      );

      setFormState("idle");
    }
  }

  if (success) {
    return (
      <div className="p-6 sm:p-8 lg:p-10">
        <div className="flex h-12 w-12 items-center justify-center rounded-[14px] bg-[#ECFDF3] text-[#16803C]">
          <CheckCircle2
            size={23}
            strokeWidth={1.8}
          />
        </div>

        <p className="mt-6 text-[9px] font-bold uppercase tracking-[0.18em] text-[#16803C]">
          Payout account connected
        </p>

        <h2 className="mt-2 font-display text-2xl font-semibold tracking-[-0.04em]">
          You&apos;re ready to receive payouts.
        </h2>

        <p className="mt-2 max-w-lg text-sm leading-6 text-black/45">
          Your bank account has been connected
          successfully. Eligible ticket-sale proceeds can
          now be routed to your payout account.
        </p>

        <div className="mt-8 flex items-start gap-3 rounded-[16px] border border-black/[0.07] bg-[#FAFAF9] p-4">
          <ShieldCheck
            size={17}
            className="mt-0.5 shrink-0 text-[#7C3AED]"
          />

          <div>
            <p className="text-xs font-semibold text-[#111014]">
              Your payout details are protected
            </p>

            <p className="mt-1 text-[11px] leading-5 text-black/40">
              Tickety uses Paystack to securely process your
              payout connection. Your full bank details are
              not displayed here.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const selectedBank = banks.find(
    (bank) => bank.code === bankCode
  );

  const isVerifying = formState === "verifying";
  const isSaving = formState === "saving";
  const isLoadingBanks =
    formState === "loading-banks";

  return (
    <form onSubmit={handleSubmit}>
      <div className="border-b border-black/[0.07] p-6 sm:p-8 lg:p-10">
        <div className="flex h-11 w-11 items-center justify-center rounded-[13px] bg-[#F3E8FF] text-[#7C3AED]">
          <LockKeyhole
            size={19}
            strokeWidth={1.7}
          />
        </div>

        <p className="mt-6 text-[9px] font-bold uppercase tracking-[0.18em] text-black/30">
          {editing ? "Update NGN payouts" : "Payout setup"}
        </p>

        <h2 className="mt-2 font-display text-2xl font-semibold tracking-[-0.04em]">
          {editing ? "Change your payout account." : "Connect your bank account."}
        </h2>

        <p className="mt-2 max-w-lg text-sm leading-6 text-black/45">
          {editing
            ? "Enter your new bank details, verify the account holder’s name, then confirm the change. Your current account stays connected until you save."
            : "Add the Nigerian bank account where you want your event earnings to be settled. We’ll verify the account before connecting it."}
        </p>
      </div>

      <div className="space-y-6 p-6 sm:p-8 lg:p-10">
        {/* Bank */}
        <div>
          <label
            htmlFor="bank"
            className="mb-2 block text-[10px] font-bold uppercase tracking-[0.14em] text-black/40"
          >
            Bank
          </label>

          <div className="relative">
            <select
              id="bank"
              value={bankCode}
              onChange={(event) =>
                handleBankChange(event.target.value)
              }
              disabled={
                isLoadingBanks ||
                isVerifying ||
                isSaving
              }
              className="h-12 w-full appearance-none rounded-[13px] border border-black/[0.09] bg-white px-4 pr-11 text-sm text-[#111014] outline-none transition-colors focus:border-[#7C3AED]/45 focus:ring-2 focus:ring-[#7C3AED]/10 disabled:cursor-not-allowed disabled:bg-[#FAFAF9] disabled:text-black/35"
            >
              <option value="">
                {isLoadingBanks
                  ? "Loading banks..."
                  : "Select your bank"}
              </option>

              {banks.map((bank) => (
                <option
                  key={bank.id}
                  value={bank.code}
                >
                  {bank.name}
                </option>
              ))}
            </select>

            <ChevronDown
              size={16}
              className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-black/35"
            />
          </div>

          {selectedBank && (
            <p className="mt-2 text-[10px] text-black/35">
              {selectedBank.name}
            </p>
          )}
        </div>

        {/* Account number */}
        <div>
          <label
            htmlFor="accountNumber"
            className="mb-2 block text-[10px] font-bold uppercase tracking-[0.14em] text-black/40"
          >
            Account number
          </label>

          <div className="flex gap-2">
            <input
              id="accountNumber"
              type="text"
              inputMode="numeric"
              autoComplete="off"
              value={accountNumber}
              onChange={(event) =>
                handleAccountNumberChange(
                  event.target.value
                )
              }
              maxLength={10}
              placeholder="0000000000"
              disabled={isVerifying || isSaving}
              className="h-12 min-w-0 flex-1 rounded-[13px] border border-black/[0.09] bg-white px-4 text-sm tracking-[0.04em] text-[#111014] outline-none transition-colors placeholder:text-black/20 focus:border-[#7C3AED]/45 focus:ring-2 focus:ring-[#7C3AED]/10 disabled:cursor-not-allowed disabled:bg-[#FAFAF9]"
            />

            <button
              type="button"
              onClick={verifyAccount}
              disabled={
                isVerifying ||
                isSaving ||
                isLoadingBanks ||
                !bankCode ||
                accountNumber.length !== 10
              }
              className="h-12 shrink-0 rounded-[13px] border border-black/[0.09] bg-white px-4 text-xs font-semibold text-black/65 transition-all hover:border-black/15 hover:bg-[#FAFAF9] hover:text-black disabled:cursor-not-allowed disabled:opacity-40"
            >
              {isVerifying ? (
                <span className="flex items-center gap-2">
                  <Loader2
                    size={14}
                    className="animate-spin"
                  />
                  Checking
                </span>
              ) : (
                "Verify"
              )}
            </button>
          </div>

          <p className="mt-2 text-[10px] leading-5 text-black/35">
            Enter the 10-digit account number registered
            with your bank.
          </p>
        </div>

        {/* Verified account */}
        {verified && accountName && (
          <div className="rounded-[15px] border border-[#BBF7D0] bg-[#F0FDF4] p-4">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#DCFCE7] text-[#16803C]">
                <CheckCircle2 size={15} />
              </div>

              <div className="min-w-0">
                <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-[#16803C]">
                  Account verified
                </p>

                <p className="mt-1 break-words text-sm font-semibold text-[#166534]">
                  {accountName}
                </p>

                <p className="mt-1 text-[10px] text-[#16803C]/70">
                  {selectedBank?.name} ••••{" "}
                  {accountNumber.slice(-4)}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Business name */}
        <div>
          <label
            htmlFor="businessName"
            className="mb-2 block text-[10px] font-bold uppercase tracking-[0.14em] text-black/40"
          >
            Business or organiser name
            <span className="ml-1 font-normal normal-case tracking-normal text-black/25">
              Optional
            </span>
          </label>

          <input
            id="businessName"
            type="text"
            value={businessName}
            onChange={(event) =>
              { setBusinessName(event.target.value); setConfirmed(false); }
            }
            placeholder="e.g. Acme Events"
            disabled={isSaving}
            maxLength={100}
            className="h-12 w-full rounded-[13px] border border-black/[0.09] bg-white px-4 text-sm text-[#111014] outline-none transition-colors placeholder:text-black/20 focus:border-[#7C3AED]/45 focus:ring-2 focus:ring-[#7C3AED]/10 disabled:cursor-not-allowed disabled:bg-[#FAFAF9]"
          />

          <p className="mt-2 text-[10px] leading-5 text-black/35">
            This helps identify your payout account on
            Paystack. You can leave it blank if you&apos;re
            using your name.
          </p>
        </div>

        {editing && verified && accountName && (
          <label className="flex cursor-pointer items-start gap-3 rounded-[15px] border border-violet-200 bg-violet-50 p-4">
            <input type="checkbox" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} disabled={isSaving} className="mt-0.5 h-4 w-4 shrink-0 accent-violet-600" />
            <span className="text-xs leading-6 text-violet-950">
              I confirm that <strong>{accountName}</strong> at <strong>{selectedBank?.name}</strong>,
              account ending <strong>{accountNumber.slice(-4)}</strong>, is the account I want to use for my event payouts.
            </span>
          </label>
        )}

        <div>
          <label htmlFor="payoutPin" className="mb-2 block text-[10px] font-bold uppercase tracking-[0.14em] text-black/40">Your payout PIN</label>
          <input id="payoutPin" type="password" inputMode="numeric" autoComplete="off" value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))} maxLength={6} minLength={6} pattern="[0-9]{6}" required disabled={isSaving || isVerifying} placeholder="6-digit Tickety PIN" className="h-12 w-full rounded-[13px] border border-black/10 px-4 text-sm tracking-[0.15em] outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100" />
          <p className="mt-2 text-[10px] leading-5 text-black/45">Enter the payout PIN you set on Tickety to authorise this {editing ? "change" : "connection"}. <a href="mailto:experience@tickety.africa?subject=Forgotten%20payout%20PIN" className="font-semibold text-violet-700 underline underline-offset-2">Forgot your PIN?</a></p>
        </div>

        {/* Error */}
        {error && (
          <div
            role="alert"
            className="rounded-[13px] border border-red-200 bg-red-50 px-4 py-3 text-xs leading-5 text-red-700"
          >
            {error}
          </div>
        )}

        {/* Submit */}
        <div className="border-t border-black/[0.07] pt-6">
          <button
            type="submit"
            disabled={
              isSaving ||
              isVerifying ||
              isLoadingBanks ||
              !verified ||
              !accountName ||
              !verificationToken ||
              (editing && !confirmed) ||
              pin.length !== 6
            }
            className="flex h-12 w-full items-center justify-center gap-2 rounded-[13px] bg-[#111014] px-5 text-sm font-semibold text-white transition-all hover:bg-[#7C3AED] disabled:cursor-not-allowed disabled:opacity-40"
          >
            {isSaving ? (
              <>
                <Loader2
                  size={16}
                  className="animate-spin"
                />
                {editing ? "Updating account..." : "Connecting account..."}
              </>
            ) : (
              <>
                {editing ? "Confirm and update payout account" : "Connect payout account"}
                <CheckCircle2 size={15} />
              </>
            )}
          </button>

          {editing && onCancel && (
            <button type="button" onClick={onCancel} disabled={isSaving || isVerifying} className="mt-3 flex min-h-11 w-full items-center justify-center rounded-[13px] border border-black/10 text-xs font-semibold text-black/60 hover:bg-black/5 disabled:opacity-40">Cancel changes</button>
          )}

          <div className="mt-4 flex items-start justify-center gap-2 text-center">
            <ShieldCheck
              size={13}
              className="mt-0.5 shrink-0 text-black/25"
            />

            <p className="max-w-sm text-[10px] leading-5 text-black/30">
              Your account details are verified securely
              through Paystack. Tickety does not store your
              banking password or PIN.
            </p>
          </div>
        </div>
      </div>
    </form>
  );
}