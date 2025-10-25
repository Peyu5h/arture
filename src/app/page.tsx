"use client";

import { Hero } from "~/components/hero";
import { FeaturesSection } from "~/components/features-section";
import { PricingSection } from "~/components/pricing-section";
import { CTASection } from "~/components/cta-section";
import { Footer } from "~/components/footer";

export default function Home() {
  return (
    <div className="bg-background text-foreground min-h-screen antialiased">
      <Hero />
      <FeaturesSection />
      <PricingSection />
      <CTASection />
      <Footer />
    </div>
  );
}
