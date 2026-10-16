import { pageMetadata } from "@/lib/seo";
export const metadata = pageMetadata({ title: "Explore Events & Find Your Next Experience", description: "Find concerts, comedy shows, tech meetups, food experiences and networking events. Explore events by category and location and book your tickets on Tickety Africa.", path: "/explore" });
import { getEvents } from "@/lib/data";
import ExploreClient from "@/components/events/ExploreClient";

export const dynamic = "force-dynamic";

export default async function ExplorePage() {
  const events = await getEvents();
  return <ExploreClient events={events} />;
}
