import { pageMetadata, absoluteUrl, serializeJsonLd } from "@/lib/seo";
export const metadata = pageMetadata({ title: "Discover Events & Book Tickets in Nigeria and Africa", path: "/" });
import ServicesIntro from "@/components/landing/ServicesIntro";
import Hero from "@/components/landing/Hero";
import HowItWorks from "@/components/landing/HowItWorks";
import HybridExplainer from "@/components/landing/HybridExplainer";
import FeaturedEvents from "@/components/landing/FeaturedEvents";
import ForOrganisers from "@/components/landing/ForOrganisers";
import CTASection from "@/components/landing/CTASection";

// Event discovery must reflect current listings rather than build-time database data.
export const dynamic = "force-dynamic";

export default function HomePage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd({ "@context": "https://schema.org", "@graph": [
        { "@type": "Organization", "@id": absoluteUrl("/#organization"), name: "Tickety Africa", url: absoluteUrl("/"), logo: absoluteUrl("/images/logo/logos.png") },
        { "@type": "WebSite", "@id": absoluteUrl("/#website"), name: "Tickety Africa", alternateName: "Tickety", url: absoluteUrl("/"), publisher: { "@id": absoluteUrl("/#organization") } }
      ] }) }} />
      <Hero />
      <HowItWorks />
      <ServicesIntro />
      <FeaturedEvents />
      <HybridExplainer />
      <ForOrganisers />
      <CTASection />
    </>
  );
}
