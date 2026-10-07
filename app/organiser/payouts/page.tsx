import PayoutPinSetup from "@/components/organiser/PayoutPinSetup";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  CheckCircle2,
  Landmark,
  ShieldCheck,
} from "lucide-react";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import OrganiserNav from "@/components/organiser/OrganiserNav";
import PayoutAccountManager from "@/components/organiser/PayoutAccountManager";
import PayoutSetupForm from "@/components/organiser/PayoutSetupForm";

export const dynamic = "force-dynamic";

export default async function OrganiserPayoutsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: {
      id: session.user.id,
    },
    select: {
      name: true,
      email: true,
      paystackSubaccountCode: true,
      payoutPinHash: true,
      paystackUsdSubaccountCode: true,
    },
  });

  if (!user) {
    redirect("/login");
  }

  const isConnected = Boolean(user.paystackSubaccountCode);

  return (
    <div className="min-h-screen bg-[#F7F5F2] text-[#111014]">
      <OrganiserNav active="payouts" />

      <main>
        <section className="border-b border-black/[0.06] bg-white">
          <div className="mx-auto max-w-7xl px-5 pb-10 pt-10 sm:px-8 lg:px-10 lg:pb-12">
            <div className="max-w-2xl">
              <div className="mb-4 flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-[#7C3AED]" />

                <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-black/35">
                  Organiser payouts
                </span>
              </div>

              <h1 className="font-display text-4xl font-semibold tracking-[-0.055em] text-[#111014] sm:text-5xl">
                Get paid for your tickets.
              </h1>

              <p className="mt-3 max-w-xl text-sm leading-6 text-black/45">
                Connect the bank account where you want your event earnings
                settled. Tickety uses Paystack to securely handle your
                payouts.
              </p>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-5 pt-8 sm:px-8 lg:px-10">
          <div className="rounded-[24px] border border-black/[0.07] bg-white p-6">
            <h2 className="text-lg font-semibold">US dollar payouts</h2>
            <p className="mt-2 text-sm leading-6 text-black/50">
              {user.paystackUsdSubaccountCode && process.env.PAYSTACK_USD_ENABLED === "true"
                ? "Your USD payout account is connected. You can publish dollar-priced events."
                : "Dollar sales need a verified USD payout account, separate from your naira account. Contact Tickety support to arrange USD payout setup before publishing dollar-priced tickets."}
            </p>
            {!user.paystackUsdSubaccountCode && <a href="mailto:experience@tickety.africa?subject=USD%20payout%20setup" className="mt-3 inline-block text-sm font-semibold text-violet-700">Request USD payout setup →</a>}
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-5 py-8 sm:px-8 sm:py-10 lg:px-10 lg:py-12">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="overflow-hidden rounded-[24px] border border-black/[0.07] bg-white">
              {!user.payoutPinHash ? (
                <PayoutPinSetup existingAccount={isConnected} />
              ) : isConnected ? (
                <PayoutAccountManager
                  name={user.name}
                  email={user.email}
                />
              ) : (
                <PayoutSetupForm />
              )}
            </div>

            <aside className="h-fit">
              <div className="rounded-[22px] border border-black/[0.07] bg-white p-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-[#F5F5F4] text-black/55">
                  <ShieldCheck size={18} strokeWidth={1.7} />
                </div>

                <h2 className="mt-5 text-sm font-semibold tracking-[-0.015em]">
                  How payouts work
                </h2>

                <div className="mt-5 space-y-4">
                  <InfoItem
                    icon={<Landmark size={14} />}
                    title="Connect your bank"
                    description="Your account is verified before it can receive event earnings."
                  />

                  <InfoItem
                    icon={<CheckCircle2 size={14} />}
                    title="Sell your tickets"
                    description="Customers pay securely through Tickety using Paystack."
                  />

                  <InfoItem
                    icon={<ArrowRight size={14} />}
                    title="Receive your share"
                    description="Your share of each ticket sale is routed to your connected payout account."
                  />
                </div>
              </div>
            </aside>
          </div>
        </section>
      </main>
    </div>
  );
}

function InfoItem({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex gap-3">
      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-[9px] bg-[#F5F5F4] text-black/45">
        {icon}
      </div>

      <div>
        <p className="text-xs font-semibold text-[#111014]">{title}</p>

        <p className="mt-1 text-[11px] leading-5 text-black/40">
          {description}
        </p>
      </div>
    </div>
  );
}
