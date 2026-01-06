"use client";

import { Hero } from "~/components/hero";
import { FeaturesSection } from "~/components/features-section";
import { PricingSection } from "~/components/pricing-section";
import { CTASection } from "~/components/cta-section";
import { Footer } from "~/components/footer";
import { authClient } from "~/lib/auth-client";
import { LoggedInHome } from "~/components/logged-in-home";

export default function Home() {
  const { data: session, isPending } = authClient.useSession();

  // show loading state
  if (isPending) {
    return (
      <div className="bg-background flex min-h-screen items-center justify-center">
        <div className="bg-muted h-8 w-8 animate-pulse rounded-full" />
      </div>
    );
  }

  // logged-in user: show dashboard
  if (session) {
    return <LoggedInHome />;
  }

  // guest: show landing page
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
