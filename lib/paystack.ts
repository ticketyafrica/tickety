import type { Currency } from "./currency";
const PAYSTACK_BASE = "https://api.paystack.co";

/**
 * ---------------------------------------------------------
 * Shared helpers
 * ---------------------------------------------------------
 */

function getPaystackSecret() {
  const secret = process.env.PAYSTACK_SECRET_KEY;

  if (!secret) {
    throw new Error(
      "PAYSTACK_SECRET_KEY is not set — add it to your .env file."
    );
  }

  return secret;
}

async function parsePaystackResponse(res: Response) {
  let data: any;

  try {
    data = await res.json();
  } catch {
    throw new Error(
      `Paystack returned an invalid response (${res.status}).`
    );
  }

  return data;
}

/**
 * ---------------------------------------------------------
 * Transaction Initialization
 * ---------------------------------------------------------
 */

interface DynamicSplitSubaccount {
  subaccount: string;
  share: number;
}

interface DynamicSplit {
  currency?: Currency;
  type: "flat" | "percentage";
  bearer_type:
    | "account"
    | "subaccount"
    | "all"
    | "all-proportional";
  subaccounts: DynamicSplitSubaccount[];
  bearer_subaccount?: string;
  reference?: string;
}

interface InitializeParams {
  currency?: Currency;
  email: string;
  amountKobo: number;
  callbackUrl: string;
  metadata?: Record<string, unknown>;

  /**
   * Optional Paystack dynamic split configuration.
   *
   * For Tickety ticket payments we can use:
   *
   * type: "flat"
   * bearer_type: "account"
   *
   * This allows the exact organiser amount to be routed
   * to the organiser's Paystack subaccount.
   */
  split?: DynamicSplit;
}

interface InitializeResult {
  authorization_url: string;
  access_code: string;
  reference: string;
}

export async function initializeTransaction(
  params: InitializeParams
): Promise<InitializeResult> {
  const secret = getPaystackSecret();

  const body: Record<string, unknown> = {
    email: params.email,
    amount: params.amountKobo,
    currency: params.currency ?? "NGN",
    callback_url: params.callbackUrl,
    metadata: params.metadata,
  };

  /**
   * Only include split when one is provided.
   *
   * This keeps existing payment flows working normally.
   */
  if (params.split) {
    body.split = params.split;
  }

  const res = await fetch(
    `${PAYSTACK_BASE}/transaction/initialize`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secret}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    }
  );

  const data = await parsePaystackResponse(res);

  if (!res.ok || !data.status) {
    throw new Error(
      data.message ??
        "Failed to initialize payment with Paystack"
    );
  }

  return data.data as InitializeResult;
}

/**
 * ---------------------------------------------------------
 * Transaction Verification
 * ---------------------------------------------------------
 */

interface VerifyResult {
  fees?: number | null;
  currency: string;
  status: string;
  amount: number;
  reference: string;
  metadata?: Record<string, unknown>;

  [key: string]: unknown;
}

export async function verifyTransaction(
  reference: string,
  options: { signal?: AbortSignal } = {}
): Promise<VerifyResult> {
  const secret = getPaystackSecret();

  const res = await fetch(
    `${PAYSTACK_BASE}/transaction/verify/${encodeURIComponent(
      reference
    )}`,
    {
      headers: {
        Authorization: `Bearer ${secret}`,
      },
      signal: options.signal,
    }
  );

  const data = await parsePaystackResponse(res);

  if (!res.ok || !data.status) {
    throw new Error(
      data.message ??
        "Failed to verify payment with Paystack"
    );
  }

  return data.data as VerifyResult;
}

/**
 * ---------------------------------------------------------
 * Paystack Subaccounts
 * ---------------------------------------------------------
 */

export interface CreateSubaccountParams {
  businessName: string;
  bankCode: string;
  accountNumber: string;
  percentageCharge?: number;
  description?: string;
  primaryContactEmail?: string;
  primaryContactName?: string;
  primaryContactPhone?: string;
}

export interface CreateSubaccountResult {
  id: number;
  subaccount_code: string;
  business_name: string;
  description?: string | null;
  primary_contact_name?: string | null;
  primary_contact_email?: string | null;
  primary_contact_phone?: string | null;
  percentage_charge?: number;
  settlement_bank?: string;
  account_number?: string;

  [key: string]: unknown;
}

/**
 * Creates a Paystack subaccount for an organiser.
 *
 * IMPORTANT:
 * This function does NOT resolve the bank account.
 *
 * Bank verification happens separately through
 * resolveAccountNumber() before this function is called.
 */
export async function createSubaccount(
  params: CreateSubaccountParams
): Promise<CreateSubaccountResult> {
  const secret = getPaystackSecret();

  const body: Record<string, unknown> = {
    business_name: params.businessName,
    bank_code: params.bankCode,
    account_number: params.accountNumber,
  };

  if (params.percentageCharge !== undefined) {
    body.percentage_charge = params.percentageCharge;
  }

  if (params.description) {
    body.description = params.description;
  }

  if (params.primaryContactEmail) {
    body.primary_contact_email =
      params.primaryContactEmail;
  }

  if (params.primaryContactName) {
    body.primary_contact_name =
      params.primaryContactName;
  }

  if (params.primaryContactPhone) {
    body.primary_contact_phone =
      params.primaryContactPhone;
  }

  const res = await fetch(
    `${PAYSTACK_BASE}/subaccount`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secret}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    }
  );

  const data = await parsePaystackResponse(res);

  if (!res.ok || !data.status) {
    throw new Error(
      data.message ??
        "Failed to create Paystack subaccount"
    );
  }

  return data.data as CreateSubaccountResult;
}

/**
 * ---------------------------------------------------------
 * Paystack Banks
 * ---------------------------------------------------------
 */

export interface PaystackBank {
  id: number;
  name: string;
  slug: string;
  code: string;
  longcode?: string;
  gateway?: string | null;
  pay_with_bank?: boolean;
  active?: boolean;
  country?: string;
  currency?: string;
  type?: string;
  is_deleted?: boolean;
  createdAt?: string;
  updatedAt?: string;

  [key: string]: unknown;
}

export interface ListBanksOptions {
  country?: string;
  useCursor?: boolean;
  perPage?: number;
  payWithBankTransfer?: boolean;
  payWithBank?: boolean;
}

/**
 * Returns banks available through Paystack.
 */
export async function listBanks(
  options: ListBanksOptions = {}
): Promise<PaystackBank[]> {
  const secret = getPaystackSecret();

  const searchParams = new URLSearchParams();

  if (options.country) {
    searchParams.set(
      "country",
      options.country
    );
  }

  if (options.useCursor !== undefined) {
    searchParams.set(
      "use_cursor",
      String(options.useCursor)
    );
  }

  if (options.perPage !== undefined) {
    searchParams.set(
      "perPage",
      String(options.perPage)
    );
  }

  if (options.payWithBankTransfer !== undefined) {
    searchParams.set(
      "pay_with_bank_transfer",
      String(options.payWithBankTransfer)
    );
  }

  if (options.payWithBank !== undefined) {
    searchParams.set(
      "pay_with_bank",
      String(options.payWithBank)
    );
  }

  const query = searchParams.toString();

  const res = await fetch(
    `${PAYSTACK_BASE}/bank${
      query ? `?${query}` : ""
    }`,
    {
      headers: {
        Authorization: `Bearer ${secret}`,
      },
    }
  );

  const data = await parsePaystackResponse(res);

  if (!res.ok || !data.status) {
    throw new Error(
      data.message ??
        "Failed to retrieve banks from Paystack"
    );
  }

  return data.data as PaystackBank[];
}

/**
 * ---------------------------------------------------------
 * Resolve / Verify Bank Account
 * ---------------------------------------------------------
 */

export interface ResolveAccountResult {
  account_number: string;
  account_name: string;
  bank_id?: number;

  [key: string]: unknown;
}

/**
 * Resolves a Nigerian bank account through Paystack.
 *
 * IMPORTANT:
 *
 * Paystack Test Mode limits live-bank account resolutions.
 * If the limit is reached, we return a clear error rather
 * than exposing the raw Paystack message.
 */
export async function resolveAccountNumber(
  accountNumber: string,
  bankCode: string
): Promise<ResolveAccountResult> {
  const secret = getPaystackSecret();

  const searchParams = new URLSearchParams({
    account_number: accountNumber,
    bank_code: bankCode,
  });

  const res = await fetch(
    `${PAYSTACK_BASE}/bank/resolve?${searchParams.toString()}`,
    {
      headers: {
        Authorization: `Bearer ${secret}`,
      },
    }
  );

  const data = await parsePaystackResponse(res);

  if (!res.ok || !data.status) {
    const message = String(
      data.message ?? ""
    ).toLowerCase();

    /*
     * Paystack Test Mode specific limitation.
     *
     * Your current Paystack response is:
     *
     * "Test mode daily limit of 3 live bank resolves exceeded.
     * Use test bank codes 001 or upgrade to live mode."
     */
    if (
      message.includes(
        "test mode daily limit"
      ) &&
      message.includes("live bank resolves")
    ) {
      throw new Error(
        "Paystack Test Mode has reached its daily bank verification limit. Use a Paystack test bank with bank code 001, or wait for the test limit to reset."
      );
    }

    throw new Error(
      data.message ??
        "Unable to verify bank account details"
    );
  }

  if (!data.data?.account_name) {
    throw new Error(
      "Paystack could not retrieve the name attached to this account."
    );
  }

  return data.data as ResolveAccountResult;
}
export interface PaystackSubaccount {
  currency: string;
  active?: boolean;
  primary_contact_email?: string;
  subaccount_code: string;
  account_number?: string;
  account_name?: string;
  settlement_bank?: string;
  business_name?: string;
}

export async function getSubaccount(code: string) {
  const res = await fetch(`${PAYSTACK_BASE}/subaccount/${encodeURIComponent(code)}`, {
    headers: { Authorization: `Bearer ${getPaystackSecret()}` }, cache: "no-store",
  });
  const data = await parsePaystackResponse(res);
  if (!res.ok || !data.status) throw new Error("Unable to retrieve payout account from Paystack");
  return data.data as PaystackSubaccount;
}

export async function updateSubaccount(code: string, params: {
  bankCode: string; accountNumber: string; businessName: string;
}) {
  const res = await fetch(`${PAYSTACK_BASE}/subaccount/${encodeURIComponent(code)}`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${getPaystackSecret()}`, "Content-Type": "application/json" },
    body: JSON.stringify({ bank_code: params.bankCode, account_number: params.accountNumber, business_name: params.businessName }),
  });
  const data = await parsePaystackResponse(res);
  if (!res.ok || !data.status) throw new Error(data.message ?? "Unable to update payout account with Paystack");
  return data.data as PaystackSubaccount;
}
