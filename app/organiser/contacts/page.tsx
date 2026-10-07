import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import OrganiserNav from "@/components/organiser/OrganiserNav";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import { getContactsForOrganiser } from "@/lib/data";
import { formatMoney } from "@/lib/currency";
import { Download } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function OrganiserContactsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  const contacts = await getContactsForOrganiser(
    session.user.id
  );

  /*
   * ============================================================
   * DEDUPLICATE CONTACTS
   * ============================================================
   *
   * A customer can purchase tickets multiple times.
   * We identify a contact by email address so the same customer
   * only appears once in this table.
   *
   * The contacts returned by getContactsForOrganiser() are already
   * ordered by purchaseDate DESC, so the first occurrence of an
   * email is the customer's most recent booking.
   */
  const uniqueContacts = Array.from(
    new Map(
      contacts
        .filter((contact) => contact.email?.trim())
        .map((contact) => [
          contact.email.trim().toLowerCase(),
          contact,
        ])
    ).values()
  );

  return (
    <div>
      <OrganiserNav active="contacts" />

      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        {/* ======================================================
            HEADER
        ======================================================= */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-display text-2xl font-semibold text-ink sm:text-3xl">
              Contacts
            </h1>

            <p className="mt-1 text-ink-light">
              Everyone who has bought a ticket or registered across
              all your events.
            </p>
          </div>

          <Button
            href="/api/organiser/contacts/export"
            variant="primary"
            icon={<Download size={16} />}
          >
            Export CSV
          </Button>
        </div>

        {/* ======================================================
            EMPTY STATE
        ======================================================= */}
        {uniqueContacts.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-dashed border-sand-200 bg-white p-12 text-center">
            <p className="text-ink">
              No contacts yet.
            </p>

            <p className="mt-1 text-sm text-ink-light">
              They&apos;ll show up here as soon as someone buys a
              ticket to one of your events.
            </p>
          </div>
        ) : (
          <>
            {/* Contact count */}
            <div className="mt-8 mb-3 flex items-center justify-between">
              <p className="text-xs text-ink-light">
                {uniqueContacts.length}{" "}
                {uniqueContacts.length === 1
                  ? "contact"
                  : "contacts"}
              </p>

              {contacts.length !== uniqueContacts.length && (
                <p className="text-xs text-ink-light">
                  {contacts.length - uniqueContacts.length}{" "}
                  repeat{" "}
                  {contacts.length - uniqueContacts.length === 1
                    ? "booking"
                    : "bookings"}{" "}
                  grouped
                </p>
              )}
            </div>

            {/* ==================================================
                CONTACTS TABLE
            =================================================== */}
            <div className="overflow-x-auto rounded-2xl border border-sand-200 bg-white shadow-card">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-sand-200 text-ink-light">
                    <th className="px-4 py-3 font-medium">
                      Name
                    </th>

                    <th className="px-4 py-3 font-medium">
                      Phone
                    </th>

                    <th className="px-4 py-3 font-medium">
                      Event
                    </th>

                    <th className="px-4 py-3 font-medium">
                      Ticket
                    </th>

                    <th className="px-4 py-3 font-medium">
                      Amount
                    </th>

                    <th className="px-4 py-3 font-medium">
                      Status
                    </th>

                    <th className="px-4 py-3 font-medium">
                      Answers
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {uniqueContacts.map((contact) => (
                    <tr
                      key={contact.email
                        .trim()
                        .toLowerCase()}
                      className="border-b border-sand-100 last:border-0"
                    >
                      {/* Name + Email */}
                      <td className="px-4 py-3">
                        <p className="font-medium text-ink">
                          {contact.name}
                        </p>

                        <p className="text-xs text-ink-light">
                          {contact.email}
                        </p>
                      </td>

                      {/* Phone */}
                      <td className="px-4 py-3 text-ink">
                        {contact.phone}
                      </td>

                      {/* Most recent event */}
                      <td className="px-4 py-3 text-ink-light">
                        {contact.eventTitle}
                      </td>

                      {/* Most recent ticket */}
                      <td className="px-4 py-3 text-ink">
                        {contact.ticketType}
                      </td>

                      {/* Most recent amount */}
                      <td className="px-4 py-3 text-ink">
                        {formatMoney(contact.amountPaid, contact.currency)}
                      </td>

                      {/* Payment status */}
                      <td className="px-4 py-3">
                        <Badge
                          tone={
                            contact.paymentStatus ===
                            "paid"
                              ? "leaf"
                              : contact.paymentStatus ===
                                  "pending"
                                ? "amber"
                                : "red"
                          }
                        >
                          {contact.paymentStatus}
                        </Badge>
                      </td>

                      {/* Answers */}
                      <td
                        className="max-w-xs truncate px-4 py-3 text-ink-light"
                        title={contact.answers}
                      >
                        {contact.answers || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}