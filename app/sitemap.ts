import type { MetadataRoute } from "next";
import { getEvents } from "@/lib/data";
import { absoluteUrl } from "@/lib/seo";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const events = await getEvents();
  return [
    ...["/", "/explore", "/what-we-offer"].map(path => ({ url: absoluteUrl(path) })),
    ...events.map(event => ({ url: absoluteUrl(`/events/${encodeURIComponent(event.slug)}`) })),
  ];
}
