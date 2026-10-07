import { Prisma } from "@prisma/client";
import { prisma } from "./db";
const metadataKeys = ["from", "to", "currency", "amount", "ticketCount", "reason", "status", "eventTitle", "name", "format", "section", "start", "end", "fields", "targetId"] as const;
type MetadataKey = typeof metadataKeys[number];
export function safeAuditMetadata(input: Record<string, unknown> = {}): Record<string, string | number | boolean | null> {
  const result: Record<string, string | number | boolean | null> = {};
  for (const key of metadataKeys) {
    const value = input[key];
    if (value === null || typeof value === "boolean" || (typeof value === "number" && Number.isFinite(value))) result[key] = value;
    else if (typeof value === "string") result[key] = value.slice(0, 500);
  }
  return result;
}
export async function recordAudit(input: {
  action: string; actorId?: string; actorName?: string; entityType: string; entityId?: string;
  summary: string; metadata?: Partial<Record<MetadataKey, string | number | boolean | null>>; dedupeKey?: string;
}, tx: Pick<Prisma.TransactionClient, "auditLog"> & Partial<Pick<Prisma.TransactionClient, "user">> = prisma) {
  let actorName = input.actorName;
  if (input.actorId && !actorName && tx.user) {
    const actor = await tx.user.findUnique({ where: { id: input.actorId }, select: { name: true } });
    actorName = actor?.name || "Unknown account";
  }
  const data = { ...input, actorName, metadata: safeAuditMetadata(input.metadata) };
  if (input.dedupeKey) return tx.auditLog.upsert({ where: { dedupeKey: input.dedupeKey }, update: {}, create: data });
  return tx.auditLog.create({ data });
}
