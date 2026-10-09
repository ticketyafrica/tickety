ALTER TABLE "User" ADD COLUMN "emailVerifiedAt" TIMESTAMP(3);
CREATE TABLE "SignupVerification" (
  "id" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "passwordHash" TEXT NOT NULL,
  "codeHash" TEXT NOT NULL,
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SignupVerification_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "SignupVerification_email_key" ON "SignupVerification"("email");
CREATE INDEX "SignupVerification_expiresAt_idx" ON "SignupVerification"("expiresAt");
