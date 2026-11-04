export function formatNaira(amount: number): string {
  if (amount === 0) return "Free";
  return `\u20A6${amount.toLocaleString("en-NG")}`;
}

export function formatEventDate(iso: string, startTime: string): string {
  const date = new Date(iso);
  const formatted = date.toLocaleDateString("en-NG", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
  return `${formatted} \u00B7 ${startTime}`;
}

export function formatEventDateRange(event: { date: string; endDate?: string; startTime: string; endTime: string }): string {
  const start = formatEventDate(event.date, event.startTime);
  if (!event.endDate || event.endDate === event.date) return `${start} – ${event.endTime}`;
  return `${start} – ${formatEventDate(event.endDate, event.endTime)}`;
}

export function ticketsLeft(quantityTotal: number, quantitySold: number): number {
  return Math.max(quantityTotal - quantitySold, 0);
}

export function priceFrom(ticketTypes: { price: number }[]): number {
  if (ticketTypes.length === 0) return 0;
  return Math.min(...ticketTypes.map((t) => t.price));
}

/**
 * Builds the wa.me deep link that hands an attendee off from the website
 * to the WhatsApp bot, pre-loaded with the event so the bot never has to
 * ask "which event do you mean?"
 *
 * The phone number below is a placeholder — swap in the real WhatsApp
 * Business number once the Cloud API integration is live.
 */
export function buildWhatsAppDeepLink(eventSlug: string, eventTitle: string): string {
  const businessNumber = "2349000000000";
  const prefilledText = `Hi! I'd like a ticket for ${eventTitle} (${eventSlug})`;
  return `https://wa.me/${businessNumber}?text=${encodeURIComponent(prefilledText)}`;
}

export const NIGERIAN_STATES = [
  "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue",
  "Borno", "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu",
  "FCT (Abuja)", "Gombe", "Imo", "Jigawa", "Kaduna", "Kano", "Katsina",
  "Kebbi", "Kogi", "Kwara", "Lagos", "Nasarawa", "Niger", "Ogun", "Ondo",
  "Osun", "Oyo", "Plateau", "Rivers", "Sokoto", "Taraba", "Yobe", "Zamfara",
] as const;

export const EVENT_CATEGORIES = [
  "Music", "Comedy", "Tech", "Food & Drink", "Networking", "Arts",
] as const;

export function cx(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(" ");
}
