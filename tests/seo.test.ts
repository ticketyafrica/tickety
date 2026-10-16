import { test } from "node:test";
import assert from "node:assert/strict";
import { eventMetadata, eventStructuredData, pageMetadata, plainDescription, serializeJsonLd, absoluteUrl } from "../lib/seo";
import type { EventItem } from "../lib/types";

const event: EventItem = {
  id: "event-1", slug: "lagos-live", title: "Lagos Live", description: "A night of live music in Lagos.",
  state: "Lagos", venue: "The Hall", date: "2026-12-20", startTime: "18:00", endTime: "22:00", timezone: "Africa/Lagos",
  status: "live", category: "Music", organiserName: "Live Collective", currency: "NGN", coverImageUrl: "https://example.com/flyer.png",
  tags: ["Afrobeats"], ticketTypes: [{ id: "t1", name: "General", price: 5000, quantityTotal: 10, quantitySold: 8, quantityReserved: 2 }],
  customQuestions: [], featured: false, trending: false, coverGradient: "",
};

test("event preview uses event content and flyer across social platforms", () => {
  const meta = eventMetadata(event);
  assert.deepEqual(meta.title, { absolute: "Lagos Live | Tickety Africa" });
  assert.equal(meta.description, event.description);
  assert.equal(meta.alternates?.canonical, absoluteUrl("/events/lagos-live"));
  assert.deepEqual(meta.openGraph?.images, [{ url: event.coverImageUrl, alt: "Lagos Live event flyer" }]);
  assert.deepEqual(meta.twitter?.images, meta.openGraph?.images);
  assert.ok((meta.keywords as string[]).includes("Music events in Lagos"));
});

test("default and missing event images use the requested absolute fallback", () => {
  for (const meta of [pageMetadata({ title: "Explore", path: "/explore" }), eventMetadata({ ...event, coverImageUrl: undefined })]) {
    assert.equal((meta.openGraph?.images as { url: string }[])[0].url, absoluteUrl("/images/event.png"));
  }
});

test("event schema uses real timezone, currency and reserved inventory", () => {
  const schema = eventStructuredData(event);
  assert.equal(schema.startDate, "2026-12-20T17:00:00.000Z");
  assert.equal(schema.endDate, "2026-12-20T21:00:00.000Z");
  assert.equal(schema.offers[0].availability, "https://schema.org/SoldOut");
  assert.equal(schema.offers[0].priceCurrency, "NGN");
  assert.equal(schema.isAccessibleForFree, false);
  const free = eventStructuredData({ ...event, ticketTypes: [{ ...event.ticketTypes[0], price: 0, quantityReserved: 0 }] });
  assert.equal(free.isAccessibleForFree, true);
  assert.equal(free.offers[0].availability, "https://schema.org/InStock");
});

test("descriptions stay concise and JSON-LD cannot close its script element", () => {
  assert.equal(plainDescription("<p>Hello</p>  world\n again"), "Hello world again");
  assert.ok(plainDescription("long description ".repeat(30)).length <= 160);
  const payload = { name: "</script><script>alert(1)</script>" };
  const serialized = serializeJsonLd(payload);
  assert.ok(!serialized.includes("<"));
  assert.deepEqual(JSON.parse(serialized), payload);
});

test("private metadata explicitly prevents indexing", () => {
  const meta = pageMetadata({ title: "Admin", noIndex: true });
  assert.deepEqual(meta.robots, { index: false, follow: false });
  assert.equal(meta.alternates, undefined);
});
