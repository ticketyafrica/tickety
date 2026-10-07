import { prisma } from "../lib/db";
import { getSubaccount } from "../lib/paystack";

// Support provisioning: validate a USD subaccount created under Tickety's
// Paystack integration. Never reuse an NGN account or overwrite a connection.
async function main() {
  const value = (flag: string) => {
    const index = process.argv.indexOf(flag);
    return index < 0 ? undefined : process.argv[index + 1];
  };
  const email = value("--email")?.trim().toLowerCase();
  const code = value("--subaccount")?.trim();
  if (!email || !code?.startsWith("ACCT_")) {
    throw new Error("Usage: --email organiser@example.com --subaccount ACCT_xxx [--apply]");
  }
  const user = await prisma.user.findFirst({ where: { email: { equals: email, mode: "insensitive" }, role: "ORGANISER" } });
  if (!user) throw new Error("Organiser not found");
  if (!user.payoutPinHash) throw new Error("The organiser must set a payout PIN before connecting USD bank details");
  if (user.paystackUsdSubaccountCode && user.paystackUsdSubaccountCode !== code) {
    throw new Error("A USD account is already connected. Review it before replacing it.");
  }
  const account = await getSubaccount(code);
  if (account.currency !== "USD" || account.active === false || account.subaccount_code !== code) {
    throw new Error("This is not an active USD subaccount");
  }
  if (account.primary_contact_email?.trim().toLowerCase() !== user.email.trim().toLowerCase()) {
    throw new Error("Set the USD subaccount primary contact email to the organiser's verified account email first");
  }
  if (process.argv.includes("--apply")) {
    const result = await prisma.user.updateMany({
      where: { id: user.id, OR: [{ paystackUsdSubaccountCode: null }, { paystackUsdSubaccountCode: code }] },
      data: { paystackUsdSubaccountCode: code },
    });
    if (result.count !== 1) throw new Error("The connection changed; review before retrying");
    console.log("USD payout account connected. No payment was made.");
  } else {
    console.log("USD payout account verified. Dry run; add --apply to save the connection.");
  }
}
main().catch((error) => { console.error(error instanceof Error ? error.message : "USD setup failed"); process.exitCode = 1; }).finally(() => prisma.$disconnect());
