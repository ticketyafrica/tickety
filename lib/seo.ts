import type { Metadata } from "next";
import type { EventItem } from "./types";
import { getEventStart, getEventEnd } from "./event-time";

const configuredUrl = process.env.NEXT_PUBLIC_APP_URL || "https://tickety.africa";
export const siteUrl = new URL(configuredUrl).origin;
export const siteName = "Tickety Africa";
export const defaultImage = "/images/social-preview.jpg";
export const defaultDescription = "Discover events in Nigeria and across Africa. Book tickets for concerts, comedy, tech, food and networking events, or create and manage your own event with Tickety.";
const keywords = ["Tickety Africa", "event tickets", "events in Nigeria", "events in Africa", "online event ticketing", "concert tickets", "event registration"];

export function absoluteUrl(path: string): string {
  return new URL(path, `${siteUrl}/`).toString();
}

export function plainDescription(value: string, limit = 160): string {
  const text = value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  if (text.length <= limit) return text;
  const shortened = text.slice(0, limit - 1);
  const boundary = shortened.lastIndexOf(" ");
  return `${shortened.slice(0, boundary > limit * 0.6 ? boundary : shortened.length)}…`;
}

export function pageMetadata({ title, description = defaultDescription, path, image = defaultImage, imageAlt = "Events and experiences on Tickety Africa", extraKeywords = [], noIndex = false }: {
  title: string; description?: string; path?: string; image?: string; imageAlt?: string; extraKeywords?: string[]; noIndex?: boolean;
}): Metadata {
  const fullTitle = `${title} | ${siteName}`;
  const imageUrl = absoluteUrl(image);
  const socialImage = {
    url: imageUrl,
    alt: imageAlt,
    ...(imageUrl === absoluteUrl(defaultImage)
      ? { width: 1200, height: 630, type: "image/jpeg" }
      : {}),
  };
  return {
    title: { absolute: fullTitle }, description,
    keywords: [...new Set([...keywords, ...extraKeywords])],
    ...(path ? { alternates: { canonical: absoluteUrl(path) } } : {}),
    robots: noIndex ? { index: false, follow: false } : { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 } },
    openGraph: { type: "website", locale: "en_NG", siteName, title: fullTitle, description, ...(path ? { url: absoluteUrl(path) } : {}), images: [socialImage] },
    twitter: { card: "summary_large_image", title: fullTitle, description, images: [{ url: imageUrl, alt: imageAlt }] },
  };
}

export function eventMetadata(event: EventItem): Metadata {
  return pageMetadata({ title: event.title, description: plainDescription(event.description) || `Book tickets for ${event.title} at ${event.venue}, ${event.state}. View event details and ticket options on Tickety Africa.`, path: `/events/${encodeURIComponent(event.slug)}`, image: event.coverImageUrl || defaultImage, imageAlt: `${event.title} event flyer`, extraKeywords: [event.title, event.category, `${event.category} events in ${event.state}`, event.venue, event.state, event.organiserName, ...(event.tags || [])] });
}

export function eventStructuredData(event: EventItem) {
  const url = absoluteUrl(`/events/${encodeURIComponent(event.slug)}`);
  const start = getEventStart(event);
  const end = getEventEnd(event);
  return {
    "@context": "https://schema.org", "@type": "Event", "@id": `${url}#event`, name: event.title,
    description: plainDescription(event.description, 5000), url,
    image: [absoluteUrl(event.coverImageUrl || defaultImage)],
    startDate: start.toISOString(), ...(end > start ? { endDate: end.toISOString() } : {}),
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    location: { "@type": "Place", name: event.venue, address: { "@type": "PostalAddress", addressRegion: event.state } },
    organizer: { "@type": "Organization", name: event.organiserName },
    offers: event.ticketTypes.map(ticket => ({ "@type": "Offer", name: ticket.name, url: `${url}/checkout`, price: ticket.price, priceCurrency: event.currency || "NGN", availability: ticket.quantityTotal - ticket.quantitySold - ticket.quantityReserved > 0 ? "https://schema.org/InStock" : "https://schema.org/SoldOut" })),
    ...(event.ticketTypes.length ? { isAccessibleForFree: event.ticketTypes.every(ticket => ticket.price === 0) } : {}),
  };
}

// Escape user-authored text before embedding JSON-LD in an HTML script element.
export function serializeJsonLd(value: unknown): string {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}
