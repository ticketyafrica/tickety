import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getContactsForOrganiser } from "@/lib/data";
import { toCsv } from "@/lib/csv";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const contacts = await getContactsForOrganiser(session.user.id);
  const csv = toCsv(contacts, [
    { key: "eventTitle", header: "Event" },
    { key: "name", header: "Name" },
    { key: "phone", header: "Phone" },
    { key: "email", header: "Email" },
    { key: "ticketType", header: "Ticket Type" },
    { key: "amountPaid", header: "Amount Paid" },
    { key: "currency", header: "Currency" },
    { key: "paymentStatus", header: "Payment Status" },
    { key: "purchaseDate", header: "Date" },
    { key: "answers", header: "Question Answers" },
  ]);

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": 'attachment; filename="contacts.csv"',
    },
  });
}