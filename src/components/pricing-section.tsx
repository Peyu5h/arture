"use client";

import { Button } from "~/components/ui/button";
import { Check } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

export function PricingSection() {
  const [isVisible, setIsVisible] = useState(false);
  const [isAnnual, setIsAnnual] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 },
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const plans = [
    {
      name: "Basic",
      description: "A basic plan for startups and small teams getting started.",
      price: "₹0",
      period: "forever",
      features: [
        "10 AI designs per month",
        "Basic templates",
        "Canvas editor",
        "Export to PNG",
        "Community support",
      ],
      cta: "Start Free",
      highlighted: false,
    },
    {
      name: "Premium",
      description: "A premium plan for growing teams with advanced needs.",
      price: isAnnual ? "₹249" : "₹299",
      period: "per month",
      badge: "2 MONTHS FREE 🔥",
      features: [
        "Unlimited AI designs",
        "All premium templates",
        "Advanced canvas tools",
        "Export PNG, PDF, SVG",
        "Background removal",
        "Priority AI processing",
        "No watermarks",
      ],
      cta: "Start Pro Trial",
      highlighted: true,
    },
    {
      name: "Enterprise",
      description:
        "An enterprise plan with advanced features for large organizations.",
      price: isAnnual ? "₹849" : "₹999",
      period: "per month",
      features: [
        "Everything in Pro",
        "Up to 5 team members",
        "Brand kit storage",
        "Shared templates",
        "Priority support",
        "API access",
      ],
      cta: "Contact Sales",
      highlighted: false,
    },
  ];

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden px-6 py-32"
      id="pricing"
    >
      {/* Background gradient */}
      <div className="from-primary/5 to-accent/5 pointer-events-none absolute inset-0 bg-gradient-to-b via-transparent" />

      <div className="relative z-10 mx-auto max-w-[1400px]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isVisible ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="mb-16 text-center"
        >
          <div className="border-accent/30 bg-accent/10 mb-6 inline-flex items-center gap-2 rounded-full border px-4 py-2 backdrop-blur-sm">
            <span className="text-accent-foreground text-xs font-medium">
              Pricing
            </span>
          </div>

          <h2 className="mb-6 text-4xl font-light tracking-tight md:text-6xl">
            Simple pricing for everyone
          </h2>

          <p className="text-muted-foreground mx-auto mb-8 max-w-2xl text-lg">
            Choose an affordable plan that's packed with the best features for
            engaging your audience, creating customer loyalty, and driving
            sales.
          </p>

          {/* Annual toggle */}
          <div className="flex items-center justify-center gap-4">
            <span
              className={`text-sm ${
                !isAnnual ? "text-foreground" : "text-muted-foreground"
              }`}
            >
              Monthly
            </span>
            <button
              onClick={() => setIsAnnual(!isAnnual)}
              className={`relative h-7 w-14 rounded-full transition-colors ${
                isAnnual ? "bg-primary" : "bg-border"
              }`}
            >
              <div
                className={`bg-background absolute top-1 h-5 w-5 rounded-full transition-transform ${
                  isAnnual ? "translate-x-8" : "translate-x-1"
                }`}
              />
            </button>
            <span
              className={`text-sm ${
                isAnnual ? "text-foreground" : "text-muted-foreground"
              }`}
            >
              Annual
            </span>
            {isAnnual && (
              <span className="bg-accent/20 text-accent-foreground rounded-full px-2 py-1 text-xs">
                Save 17%
              </span>
            )}
          </div>
        </motion.div>

        <div className="grid gap-6 md:grid-cols-3">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              animate={isVisible ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className={`relative rounded-2xl p-8 transition-all duration-300 hover:-translate-y-1 ${
                plan.highlighted
                  ? "from-accent/10 border-accent/50 border-2 bg-gradient-to-b to-transparent shadow-xl"
                  : "bg-card/50 border-border/50 border backdrop-blur-sm"
              }`}
            >
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-accent text-accent-foreground inline-block rounded-full px-3 py-1 text-xs font-medium">
                    {plan.badge}
                  </span>
                </div>
              )}

              <div className="mb-6">
                <h3 className="mb-2 text-xl font-semibold">{plan.name}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {plan.description}
                </p>
              </div>

              <div className="mb-6">
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span className="text-muted-foreground text-sm">
                    {plan.period}
                  </span>
                </div>
              </div>

              <ul className="mb-8 space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <Check
                      className={`mt-0.5 h-5 w-5 flex-shrink-0 ${
                        plan.highlighted
                          ? "text-accent-foreground"
                          : "text-primary"
                      }`}
                    />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                className={`w-full rounded-lg ${
                  plan.highlighted
                    ? "bg-accent hover:bg-accent/90 text-accent-foreground"
                    : "border-border hover:bg-accent/5 border"
                }`}
                variant={plan.highlighted ? "default" : "outline"}
              >
                {plan.cta}
              </Button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
