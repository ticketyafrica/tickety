import ServicesIntro from "@/components/landing/ServicesIntro";
import Hero from "@/components/landing/Hero";
import HowItWorks from "@/components/landing/HowItWorks";
import HybridExplainer from "@/components/landing/HybridExplainer";
import FeaturedEvents from "@/components/landing/FeaturedEvents";
import ForOrganisers from "@/components/landing/ForOrganisers";
import CTASection from "@/components/landing/CTASection";

export default function HomePage() {
  return (
    <>
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
