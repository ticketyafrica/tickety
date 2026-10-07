import bcrypt from "bcryptjs";

export const PAYOUT_PIN_LENGTH = 6;
export const PAYOUT_PIN_MAX_ATTEMPTS = 5;
export const PAYOUT_PIN_LOCK_MS = 15 * 60 * 1000;
export class PayoutPinError extends Error {
  constructor(message: string, public status: number) { super(message); }
}
export type PayoutSecurity = { pinHash: string | null; passwordHash: string; lockedUntil: Date | null };
export interface PayoutPinStore {
  getSecurity(userId: string): Promise<PayoutSecurity | null>;
  reserveAttempt(userId: string, now: Date): Promise<boolean>;
  lockIfExhausted(userId: string, now: Date): Promise<void>;
  clearAttempts(userId: string, expectedHash: string): Promise<boolean>;
  setPinIfMissing(userId: string, hash: string): Promise<boolean>;
}
const validPin = (pin: unknown): pin is string => typeof pin === "string" && /^\d{6}$/.test(pin);
async function reserve(userId: string, state: PayoutSecurity, store: PayoutPinStore) {
  const now = new Date();
  if ((state.lockedUntil && state.lockedUntil > now) || !await store.reserveAttempt(userId, now)) {
    await store.lockIfExhausted(userId, now);
    throw new PayoutPinError("Too many incorrect attempts. Please try again in 15 minutes.", 429);
  }
}

export async function setInitialPayoutPin(userId: string, input: { pin?: unknown; confirmPin?: unknown; password?: unknown }, store: PayoutPinStore) {
  if (!validPin(input.pin) || input.pin !== input.confirmPin) {
    throw new PayoutPinError("Enter and confirm a matching 6-digit payout PIN.", 400);
  }
  if (typeof input.password !== "string" || !input.password || input.password.length > 200) {
    throw new PayoutPinError("Enter your current login password to set a payout PIN.", 400);
  }
  const state = await store.getSecurity(userId);
  if (!state) throw new PayoutPinError("User not found.", 404);
  if (state.pinHash) throw new PayoutPinError("A payout PIN is already set. Contact support if you have forgotten it.", 409);
  await reserve(userId, state, store);
  if (!await bcrypt.compare(input.password, state.passwordHash)) {
    await store.lockIfExhausted(userId, new Date());
    throw new PayoutPinError("Your login password is incorrect.", 403);
  }
  const hash = await bcrypt.hash(input.pin, 12);
  if (!await store.setPinIfMissing(userId, hash)) {
    throw new PayoutPinError("A payout PIN is already set. Refresh the page.", 409);
  }
}

export async function requirePayoutPin(userId: string, pin: unknown, store: PayoutPinStore) {
  const state = await store.getSecurity(userId);
  if (!state) throw new PayoutPinError("User not found.", 404);
  if (!state.pinHash) throw new PayoutPinError("Set your payout PIN before connecting or changing bank details.", 409);
  if (!validPin(pin)) throw new PayoutPinError("Enter your 6-digit payout PIN.", 400);
  await reserve(userId, state, store);
  if (!await bcrypt.compare(pin, state.pinHash)) {
    await store.lockIfExhausted(userId, new Date());
    throw new PayoutPinError("Incorrect payout PIN.", 403);
  }
  if (!await store.clearAttempts(userId, state.pinHash)) {
    throw new PayoutPinError("Your payout security settings changed. Please try again.", 409);
  }
}
