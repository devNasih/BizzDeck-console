import { Hero } from "@/components/landing/Hero";
import { Problems } from "@/components/landing/Problems";
import { DashboardPreview } from "@/components/landing/DashboardPreview";
import { SoaSection } from "@/components/landing/SoaSection";
import { ExpertSupport } from "@/components/landing/ExpertSupport";
import { WhyBizzDeck } from "@/components/landing/WhyBizzDeck";
import { Pricing } from "@/components/landing/Pricing";
import { FinalCta } from "@/components/landing/FinalCta";
import { Nav } from "@/components/site/Nav";
import { Footer } from "@/components/site/Footer";

export default function Home() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <Problems />
        <DashboardPreview />
        <SoaSection />
        <ExpertSupport />
        <WhyBizzDeck />
        <Pricing />
        <FinalCta />
      </main>
      <Footer />
    </>
  );
}
