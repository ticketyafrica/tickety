import { recordAudit } from "./audit";
import { prisma } from "./db";
import { PAYOUT_PIN_LOCK_MS, PAYOUT_PIN_MAX_ATTEMPTS, PayoutPinStore } from "./payout-pin";

export const payoutPinStore: PayoutPinStore = {
  async getSecurity(userId) {
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { payoutPinHash: true, passwordHash: true, payoutPinLockedUntil: true } });
    return user ? { pinHash: user.payoutPinHash, passwordHash: user.passwordHash, lockedUntil: user.payoutPinLockedUntil } : null;
  },
  async reserveAttempt(userId, now) {
    // Reset only expired locks; simultaneous requests cannot reset a new lock.
    await prisma.user.updateMany({ where: { id: userId, payoutPinLockedUntil: { lte: now } }, data: { payoutPinFailedAttempts: 0, payoutPinLockedUntil: null } });
    const result = await prisma.user.updateMany({
      where: { id: userId, payoutPinLockedUntil: null, payoutPinFailedAttempts: { lt: PAYOUT_PIN_MAX_ATTEMPTS } },
      data: { payoutPinFailedAttempts: { increment: 1 } },
    });
    return result.count === 1;
  },
  async lockIfExhausted(userId, now) {
    await prisma.$transaction(async tx => {
      const result = await tx.user.updateMany({ where: { id: userId, payoutPinFailedAttempts: { gte: PAYOUT_PIN_MAX_ATTEMPTS }, payoutPinLockedUntil: null }, data: { payoutPinLockedUntil: new Date(now.getTime() + PAYOUT_PIN_LOCK_MS) } });
      if (result.count) await recordAudit({ action: "payout.security_locked", actorId: userId, entityType: "user", entityId: userId, summary: "Payout actions locked after repeated incorrect security attempts" }, tx);
    });
  },
  async clearAttempts(userId, expectedHash) {
    const result = await prisma.user.updateMany({ where: { id: userId, payoutPinHash: expectedHash }, data: { payoutPinFailedAttempts: 0, payoutPinLockedUntil: null } });
    return result.count === 1;
  },
  async setPinIfMissing(userId, hash) {
    return prisma.$transaction(async tx => {
      const result = await tx.user.updateMany({ where: { id: userId, payoutPinHash: null }, data: { payoutPinHash: hash, payoutPinFailedAttempts: 0, payoutPinLockedUntil: null } });
      if (result.count) await recordAudit({ action: "payout.pin_set", actorId: userId, entityType: "user", entityId: userId, summary: "Set payout security PIN" }, tx);
      return result.count === 1;
    });
  },
};
