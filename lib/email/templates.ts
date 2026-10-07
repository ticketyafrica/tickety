import { Currency, formatMoney } from "../currency";
import QRCode from "qrcode";
import { eventInstant, REMINDERS, SchedulableEvent } from "./schedule";
import type { EmailAttachment, EmailMessage } from "./provider";

export const EMAIL_FROM = "Tickety <experience@tickety.africa>";
export const EMAIL_REPLY_TO = "experience@tickety.africa";

export function appUrl(path = "/") {
  const origin = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || "https://tickety.africa";
  const url = new URL(path, origin);
  if (!['http:', 'https:'].includes(url.protocol)) throw new Error("Invalid application URL");
  return url.href;
}

export function escapeHtml(value: unknown): string {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]!));
}

type MoneyValue = number | { toString(): string };
const money = (amount: MoneyValue, currency: Currency = "NGN") => formatMoney(Number(amount), currency);
const paragraph = (text: string) => `<p style="margin:0 0 18px;font-size:16px;line-height:26px;color:#64606d">${escapeHtml(text)}</p>`;
export const button = (label: string, url: string) => `<table role="presentation" cellspacing="0" cellpadding="0" style="margin:26px 0"><tr><td style="border-radius:12px;background:#6D28D9"><a href="${escapeHtml(url)}" style="display:inline-block;padding:15px 24px;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none">${escapeHtml(label)} &rarr;</a></td></tr></table>`;

function details(rows: [string, string][]) {
  return `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border:1px solid #e9e5ef;border-radius:16px;margin:22px 0;background:#faf8ff">${rows.map(([label, value]) => `<tr><td style="padding:12px 16px;border-bottom:1px solid #eee9f5;font-size:13px;color:#777180;vertical-align:top;width:35%">${escapeHtml(label)}</td><td style="padding:12px 16px;border-bottom:1px solid #eee9f5;font-size:14px;font-weight:600;color:#21172f;word-break:break-word">${escapeHtml(value)}</td></tr>`).join("")}</table>`;
}

export function brandedEmail(input: { to: string; subject: string; eyebrow: string; heading: string; body: string; text: string; unsubscribeUrl?: string; attachments?: EmailAttachment[] }): EmailMessage {
  const unsubscribe = input.unsubscribeUrl
    ? `<p style="font-size:12px;line-height:20px;color:#8b8495">You’re receiving updates for this event. <a href="${escapeHtml(input.unsubscribeUrl)}" style="color:#6D28D9">Manage event emails</a>.</p>` : "";
  return {
    from: EMAIL_FROM, to: [input.to], reply_to: EMAIL_REPLY_TO, subject: input.subject,
    html: `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(input.subject)}</title></head><body style="margin:0;padding:0;background:#f5f2f8;font-family:Arial,Helvetica,sans-serif;color:#21172f"><div style="display:none;max-height:0;overflow:hidden;opacity:0">${escapeHtml(input.subject)}. ${escapeHtml(input.heading)}</div><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f5f2f8"><tr><td align="center" style="padding:32px 12px"><table role="presentation" width="600" cellspacing="0" cellpadding="0" style="width:100%;max-width:600px;background:#fff;border-radius:24px;overflow:hidden"><tr><td style="height:6px;background:#6D28D9"></td></tr><tr><td style="padding:32px 28px 20px"><a href="${escapeHtml(appUrl())}"><img src="${escapeHtml(appUrl('/images/logo/logos.png'))}" width="132" alt="Tickety Africa" style="display:block;border:0;width:132px;height:auto"></a></td></tr><tr><td style="padding:12px 28px 30px"><p style="margin:0 0 12px;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#6D28D9">${escapeHtml(input.eyebrow)}</p><h1 style="margin:0 0 22px;font-size:30px;line-height:37px;letter-spacing:-1px;color:#21172f">${escapeHtml(input.heading)}</h1>${input.body}</td></tr><tr><td style="padding:24px 28px;background:#faf8fc;border-top:1px solid #eee9f5"><p style="margin:0 0 8px;font-size:14px;font-weight:700;color:#352044">Good moments. Great memories.</p><p style="margin:0;font-size:12px;line-height:20px;color:#8b8495">Tickety Africa · Discover. Book. Experience.<br>Need a hand? <a href="mailto:experience@tickety.africa" style="color:#6D28D9">experience@tickety.africa</a></p>${unsubscribe}</td></tr></table></td></tr></table></body></html>`,
    text: `${input.text}\n\nNeed a hand? experience@tickety.africa\nTickety Africa · Discover. Book. Experience.${input.unsubscribeUrl ? `\nManage event emails: ${input.unsubscribeUrl}` : ""}`,
    ...(input.attachments?.length ? { attachments: input.attachments } : {}),
    ...(input.unsubscribeUrl ? { headers: {
      "List-Unsubscribe": `<${input.unsubscribeUrl.replace('/email/preferences/', '/api/email/unsubscribe/')}>`,
      "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
    } } : {}),
  };
}

export type EmailEvent = SchedulableEvent & { id: string; slug: string; title: string; venue: string; state: string; organiser?: { name: string } };
export type EmailTicket = { ticketId: string; name: string; checkInStatus: boolean; ticketStatus: string; ticketType: { name: string }; amountPaid: MoneyValue };
export type EmailOrder = {
  id: string; reference: string; name: string; email: string; currency?: Currency; amount: MoneyValue; ticketAmount: MoneyValue; serviceFee: MoneyValue;
  paidAt: Date | null; event: EmailEvent; attendees: EmailTicket[];
  items: { quantity: number; unitPrice: MoneyValue; ticketType: { name: string } }[];
};

function eventRows(event: EmailEvent): [string, string][] {
  const format = (time: string) => new Intl.DateTimeFormat("en-GB", {
    timeZone: event.timezone, dateStyle: "full", timeStyle: "short",
  }).format(eventInstant(event.date, time, event.timezone));
  return [["Event", event.title], ["Starts", `${format(event.startTime)} (${event.timezone})`], ["Ends", `${format(event.endTime)} (${event.timezone})`], ["Venue", `${event.venue}, ${event.state}`], ...(event.organiser ? [["Organiser", event.organiser.name] as [string, string]] : [])];
}

export async function bookingEmail(order: EmailOrder): Promise<EmailMessage> {
  const attachments: EmailAttachment[] = [];
  const tickets: string[] = [];
  for (const [index, ticket] of order.attendees.entries()) {
    if (ticket.ticketStatus === "cancelled" || ticket.ticketStatus === "transferred") continue;
    const cid = `ticket-${index}`;
    const qr = await QRCode.toBuffer(JSON.stringify({ ticketId: ticket.ticketId, reference: order.reference, eventId: order.event.id }), { width: 320, margin: 2, errorCorrectionLevel: "M" });
    attachments.push({ filename: `${ticket.ticketId}.png`, content: qr.toString("base64"), content_type: "image/png", content_id: cid });
    tickets.push(`<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;border:1px dashed #b8a5d5;border-radius:16px"><tr><td align="center" style="padding:24px"><p style="margin:0 0 8px;color:#6D28D9;font-size:11px;font-weight:700;letter-spacing:2px">YOUR ENTRY TICKET · ${index + 1}</p><h2 style="margin:0 0 8px;font-size:20px">${escapeHtml(ticket.ticketType.name)}</h2><p style="margin:0;color:#64606d;font-size:14px">${escapeHtml(ticket.name)}</p><img src="cid:${cid}" width="220" height="220" alt="Entry QR code for ${escapeHtml(ticket.ticketId)}" style="display:block;margin:16px auto;width:220px;height:220px"><p style="margin:0;font-family:monospace;font-size:16px;font-weight:700">${escapeHtml(ticket.ticketId)}</p><p style="margin:12px 0 0;font-size:12px;color:#777180">Present this QR code at the gate. Valid for one admission.</p></td></tr></table>`);
  }
  const url = appUrl(`/tickets/${encodeURIComponent(order.reference)}`);
  const receipt: [string, string][] = [
    ["Booking reference", order.reference],
    ...order.items.map((item): [string, string] => [`${item.ticketType.name} × ${item.quantity}`, money(Number(item.unitPrice) * item.quantity, order.currency)]),
    ["Tickets subtotal", money(order.ticketAmount, order.currency)], ["Service fee", money(order.serviceFee, order.currency)], ["Total paid", money(order.amount, order.currency)],
    ["Payment status", Number(order.amount) === 0 ? "Confirmed · Free booking" : "Paid"],
    ...(order.paidAt ? [["Confirmed on", new Intl.DateTimeFormat("en-GB", { timeZone: order.event.timezone, dateStyle: "medium", timeStyle: "short" }).format(order.paidAt)] as [string, string]] : []),
  ];
  return brandedEmail({ to: order.email, subject: `You're booked: ${order.event.title} — receipt & tickets`, eyebrow: "Booking confirmed", heading: "Your next great moment is booked.",
    body: paragraph(`Hi ${order.name}, your booking is confirmed. Here’s your receipt and every ticket in your order. We can’t wait to see you there.`) + details(eventRows(order.event)) + button("View your booking", url) + `<h2 style="font-size:20px;margin:28px 0 8px">Your receipt</h2>` + details(receipt) + tickets.join("") + paragraph("Keep these QR codes private. If images are hidden, open the attached ticket PNG files. Each ticket has its own QR code."),
    text: `Hi ${order.name}, your booking is confirmed.\n${[...eventRows(order.event), ...receipt].map(([key, value]) => `${key}: ${value}`).join('\n')}\nTickets:\n${order.attendees.map((ticket) => `${ticket.ticketType.name}: ${ticket.ticketId}`).join('\n')}\nYour QR codes are attached as PNG files. Keep them private.\nView booking: ${url}`, attachments });
}

export function bookingAlert(order: EmailOrder, recipient: string, admin: boolean) {
  const url = appUrl(admin ? "/admin" : `/organiser/events/${order.event.id}`);
  const rows: [string, string][] = [["Event", order.event.title], ["Customer", order.name], ["Customer email", order.email], ["Reference", order.reference], ...order.items.map((item): [string, string] => ["Tickets", `${item.ticketType.name} × ${item.quantity}`]), ["Total paid", money(order.amount, order.currency)]];
  return brandedEmail({ to: recipient, subject: `New booking: ${order.event.title}`, eyebrow: admin ? "Platform booking notification" : "New event booking", heading: "Another guest. Another great moment.", body: paragraph("A confirmed booking has been added to the event. Tickets have been issued to the customer.") + details(rows) + button("View dashboard", url), text: `Confirmed booking\n${rows.map(([key, value]) => `${key}: ${value}`).join('\n')}\nDashboard: ${url}` });
}

export function lifecycleEmail(event: EmailEvent, recipient: string, kind: string, preferenceToken: string, orders: EmailOrder[], legacyTickets: EmailTicket[] = []) {
  const tickets = [...orders.flatMap((order) => order.attendees), ...legacyTickets].filter((ticket) => !["cancelled", "transferred"].includes(ticket.ticketStatus));
  const attended = tickets.some((ticket) => ticket.checkInStatus);
  const followUp = kind === "event_follow_up";
  const milestone = REMINDERS.find((reminder) => reminder.kind === kind);
  const heading = followUp ? (attended ? "Thanks for being part of it." : tickets.length ? "We missed you this time." : "Until the next great moment.") : milestone?.label || "Your event update";
  const copy = followUp
    ? attended ? `Thank you for coming to ${event.title}. You helped make it a moment to remember. We hope you had an amazing time, and we’d love to welcome you again.`
      : tickets.length ? `We missed you at ${event.title}. Plans change, and that’s okay. We hope to see you at the next one.`
        : `${event.title} has wrapped up. Thank you for following the event with Tickety. Explore what’s coming next — we hope to see you there.`
    : kind === "event_started" ? `${event.title} has started! ${tickets.length ? "Have your ticket ready at the gate." : "Visit the event page for the latest ticket availability."}`
      : `The countdown is on for ${event.title}. ${tickets.length ? "Your booking is confirmed. Here are the details to help you plan your visit." : "You asked us to keep you updated. Here are the details — book your ticket if you’d like to join us."}`;
  const url = followUp ? appUrl('/explore') : orders[0] ? appUrl(`/tickets/${orders[0].reference}`) : appUrl(`/events/${event.slug}`);
  const label = followUp ? "Discover your next event" : orders.length ? "Open your tickets" : tickets.length ? "View event details" : "View event & tickets";
  return brandedEmail({ to: recipient, subject: `${heading} ${event.title}`, eyebrow: followUp ? "Until next time" : "Your event countdown", heading, body: paragraph(copy) + (!followUp ? details(eventRows(event)) : "") + button(label, url), text: `${copy}\n${!followUp ? eventRows(event).map(([key, value]) => `${key}: ${value}`).join('\n') : ''}\n${label}: ${url}`, unsubscribeUrl: appUrl(`/email/preferences/${preferenceToken}`) });
}

export function simpleEmail(to: string, subject: string, heading: string, copy: string, label: string, url: string) {
  return brandedEmail({ to, subject, heading, eyebrow: "A little note from Tickety", body: paragraph(copy) + button(label, url), text: `${copy}\n${label}: ${url}` });
}
