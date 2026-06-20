"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
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
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.replace("/dashboard");
    }
  }, [user, loading, router]);

  if (loading || user) {
    return (
      <div className="flex min-h-[100svh] items-center justify-center bg-bd-bg">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-bd-border border-t-bd-teal" />
      </div>
    );
  }

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
