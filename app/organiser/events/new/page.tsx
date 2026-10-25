import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import OrganiserNav from "@/components/organiser/OrganiserNav";
import EventForm from "@/components/organiser/EventForm";

export const dynamic = "force-dynamic";

export default async function NewEventPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/organiser/events/new");
  }

  if (session.user.role !== "ORGANISER") {
    redirect("/organiser/dashboard");
  }

  const organiser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      paystackSubaccountCode: true,
      payoutPinHash: true,
    },
  });

  if (!organiser) {
    redirect("/login");
  }

  const payoutConfigured =
    Boolean(organiser.payoutPinHash) &&
    Boolean(organiser.paystackSubaccountCode?.trim());

  if (!payoutConfigured) {
    redirect("/organiser/payouts?required=1");
  }

  return (
    <div>
      <OrganiserNav active="new-event" />

      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <h1 className="font-display text-2xl font-semibold text-ink sm:text-3xl">
          Create an event
        </h1>

        <p className="mt-1 text-ink-light">
          Set it up once — ticket types, prices, and attendee
          questions all flow straight into your event listing
          and checkout flow.
        </p>

        <div className="mt-8">
          <EventForm />
        </div>
      </div>
    </div>
  );
}
