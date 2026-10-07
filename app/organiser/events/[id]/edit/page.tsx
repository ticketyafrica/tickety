import { getServerSession } from "next-auth";
import { redirect, notFound } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import OrganiserNav from "@/components/organiser/OrganiserNav";
import EditEventForm from "@/components/organiser/EditEventForm";

export const dynamic = "force-dynamic";

export default async function EditEventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  const { id } = await params;

  const event = await prisma.event.findFirst({
    where: {
      id,
      organiserId: session.user.id,
    },
    include: {
      ticketTypes: {
        orderBy: {
          id: "asc",
        },
      },
      customQuestions: {
        orderBy: {
          id: "asc",
        },
      },
    },
  });

  if (!event) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-[#F7F5F2] text-[#111014]">
      <OrganiserNav active="dashboard" />

      <main>
        <div className="mx-auto max-w-5xl px-5 pb-32 pt-10 sm:px-8 lg:px-10">
          <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="mb-3 flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-[#7C3AED]" />
                <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-black/35">
                  Event editor
                </span>
              </div>

              <h1 className="font-display text-4xl font-semibold tracking-[-0.055em] sm:text-5xl">
                Edit event
              </h1>

              <p className="mt-3 max-w-xl text-sm leading-6 text-black/45">
                Update your event details, ticket information and
                attendee questions.
              </p>
            </div>

            <div className="max-w-[260px]">
              <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-black/30">
                Editing
              </p>
              <p className="mt-1 truncate text-sm font-semibold">
                {event.title}
              </p>
            </div>
          </div>

          <EditEventForm
            event={{
              id: event.id,
              currency: event.currency,
              title: event.title,
              venue: event.venue,
              state: event.state,
              date: event.date.toISOString().slice(0, 10),
              startTime: event.startTime,
              endTime: event.endTime,
              timezone: event.timezone,
              category: event.category,
              description: event.description,
              coverImageUrl: event.coverImageUrl ?? "",
              tags: event.tags.join(", "),
              refundPolicy: event.refundPolicy ?? "",
              minAge:
                event.minAge === null
                  ? ""
                  : String(event.minAge),
              ticketTypes: event.ticketTypes.map((ticket) => ({
                id: ticket.id,
                name: ticket.name,
                price: String(ticket.price),
                quantity: String(ticket.quantityTotal),
                quantitySold: ticket.quantitySold,
              })),
              customQuestions: event.customQuestions.map(
                (question) => ({
                  id: question.id,
                  label: question.label,
                  required: question.required,
                })
              ),
            }}
          />
        </div>
      </main>
    </div>
  );
}
