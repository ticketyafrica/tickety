-- Preserve existing NGN values while allowing cent-priced USD tickets.
BEGIN;
CREATE TYPE "Currency" AS ENUM ('NGN', 'USD');
ALTER TABLE "Event" ADD COLUMN "currency" "Currency" NOT NULL DEFAULT 'NGN';
ALTER TABLE "Order" ADD COLUMN "currency" "Currency" NOT NULL DEFAULT 'NGN';
ALTER TABLE "User" ADD COLUMN "paystackUsdSubaccountCode" TEXT;
ALTER TABLE "TicketType" ALTER COLUMN "price" TYPE DECIMAL(14,2);
ALTER TABLE "Order" ALTER COLUMN "amount" TYPE DECIMAL(14,2);
ALTER TABLE "Order" ALTER COLUMN "ticketAmount" TYPE DECIMAL(14,2);
ALTER TABLE "Order" ALTER COLUMN "serviceFee" TYPE DECIMAL(14,2);
ALTER TABLE "Order" ALTER COLUMN "organiserAmount" TYPE DECIMAL(14,2);
ALTER TABLE "Order" ALTER COLUMN "commissionAmount" TYPE DECIMAL(14,2);
ALTER TABLE "Order" ALTER COLUMN "platformFee" TYPE DECIMAL(14,2);
ALTER TABLE "OrderItem" ALTER COLUMN "unitPrice" TYPE DECIMAL(14,2);
ALTER TABLE "Attendee" ALTER COLUMN "amountPaid" TYPE DECIMAL(14,2);
ALTER TABLE "Transaction" ALTER COLUMN "amount" TYPE DECIMAL(14,2);
ALTER TABLE "Transaction" ALTER COLUMN "platformFee" TYPE DECIMAL(14,2);
COMMIT;
