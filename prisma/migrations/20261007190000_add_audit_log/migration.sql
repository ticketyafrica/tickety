BEGIN;
CREATE TABLE "AuditLog" (
 "id" TEXT NOT NULL, "action" TEXT NOT NULL, "actorId" TEXT, "actorName" TEXT,
 "entityType" TEXT NOT NULL, "entityId" TEXT, "summary" TEXT NOT NULL,
 "metadata" JSONB, "dedupeKey" TEXT, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "AuditLog_dedupeKey_key" ON "AuditLog"("dedupeKey");
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");
CREATE INDEX "AuditLog_actorId_createdAt_idx" ON "AuditLog"("actorId", "createdAt");
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");
CREATE INDEX "AuditLog_action_createdAt_idx" ON "AuditLog"("action", "createdAt");
COMMIT;
