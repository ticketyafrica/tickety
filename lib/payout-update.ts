import { PayoutPinStore, requirePayoutPin } from "./payout-pin";
import { getSubaccount, updateSubaccount } from "./paystack";
import { verifyPayoutVerificationToken } from "./payout-verification";

export class PayoutUpdateError extends Error {
  constructor(message: string, public status: number) { super(message); }
}

export async function updateVerifiedPayoutAccount(
  user: { id: string; name: string; paystackSubaccountCode: string | null },
  body: { bankCode?: unknown; accountNumber?: unknown; businessName?: unknown; verificationToken?: unknown; confirmed?: unknown; currency?: unknown },
  provider = { getSubaccount, updateSubaccount }
) {
  const code = user.paystackSubaccountCode?.trim();
  if (!code) throw new PayoutUpdateError("Connect a payout account before changing it.", 409);
  if (body.currency !== undefined && body.currency !== "NGN") {
    throw new PayoutUpdateError("This form updates naira payouts. Contact support for USD account changes.", 400);
  }
  if (body.confirmed !== true) throw new PayoutUpdateError("Confirm the verified account details before saving.", 400);
  const bankCode = String(body.bankCode ?? "").trim();
  const accountNumber = String(body.accountNumber ?? "").trim();
  const businessName = String(body.businessName ?? "").trim() || user.name;
  if (!bankCode || !/^\d{10}$/.test(accountNumber) || businessName.length > 100) {
    throw new PayoutUpdateError("Provide a bank, a 10-digit account number and an organiser name of at most 100 characters.", 400);
  }
  const verified = verifyPayoutVerificationToken(String(body.verificationToken ?? ""));
  if (!verified || verified.userId !== user.id || verified.bankCode !== bankCode || verified.accountNumber !== accountNumber) {
    throw new PayoutUpdateError("Bank verification has expired or the details changed. Verify this account again.", 400);
  }
  // The code comes from the authenticated user's database record, never the request.
  const current = await provider.getSubaccount(code);
  if (current.subaccount_code !== code || current.currency !== "NGN") {
    throw new PayoutUpdateError("This payout account cannot be changed using the naira form. Contact support.", 409);
  }
  const updated = await provider.updateSubaccount(code, { bankCode, accountNumber, businessName });
  if (updated.subaccount_code !== code || updated.currency !== "NGN" || updated.account_number !== accountNumber) {
    throw new PayoutUpdateError("Paystack did not confirm the requested account details. Refresh your payout details before retrying.", 502);
  }
  return {
    accountName: updated.account_name || verified.accountName,
    bankName: updated.settlement_bank ?? "",
    accountLast4: updated.account_number.slice(-4),
    businessName: updated.business_name || businessName,
  };
}

export async function updateSecurePayoutAccount(
  user: Parameters<typeof updateVerifiedPayoutAccount>[0],
  body: Parameters<typeof updateVerifiedPayoutAccount>[1] & { pin?: unknown },
  store: PayoutPinStore,
  provider?: Parameters<typeof updateVerifiedPayoutAccount>[2],
  onAuthorized?: () => Promise<void>
) {
  await requirePayoutPin(user.id, body.pin, store);
  if (onAuthorized) await onAuthorized();
  return updateVerifiedPayoutAccount(user, body, provider);
}
