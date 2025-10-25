"use client";

import { Button } from "~/components/ui/button";
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, BookOpen } from "lucide-react";
import { RainbowButton } from "./ui/rainbow-button";

export function CTASection() {
  const [isVisible, setIsVisible] = useState(false);
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

  return (
    <section ref={sectionRef} className="px-4 py-20 sm:px-6 sm:py-32">
      <div className="mx-auto max-w-[1000px]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isVisible ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="from-card/80 via-card/50 border-border/50 relative space-y-6 overflow-hidden rounded-2xl border bg-gradient-to-br to-transparent p-8 text-center backdrop-blur-xl sm:space-y-8 sm:rounded-3xl sm:p-12"
        >
          {/* Background glow effect */}
          <div className="from-primary/20 via-accent/20 to-primary/20 absolute -inset-1 -z-10 rounded-2xl bg-gradient-to-r opacity-50 blur-2xl sm:rounded-3xl" />

          {/* Animated gradient orbs */}
          <div className="bg-gradient-radial from-primary/30 pointer-events-none absolute top-0 left-1/4 h-40 w-40 animate-pulse rounded-full to-transparent blur-3xl sm:h-64 sm:w-64" />
          <div
            className="bg-gradient-radial from-accent/30 pointer-events-none absolute right-1/4 bottom-0 h-40 w-40 animate-pulse rounded-full to-transparent blur-3xl sm:h-64 sm:w-64"
            style={{ animationDelay: "1s" }}
          />

          <div className="relative z-10">
            <h2 className="text-2xl font-light tracking-tight sm:text-3xl md:text-4xl lg:text-5xl">
              Start creating in seconds
            </h2>

            <p className="text-muted-foreground mx-auto mt-4 max-w-2xl px-4 text-base sm:px-0 sm:text-lg">
              No design skills needed. Just describe what you want, and let AI
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
