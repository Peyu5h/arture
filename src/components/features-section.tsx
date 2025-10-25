"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, Palette, Layers } from "lucide-react";
import { PointerHighlight } from "./ui/pointer-highlight";

export function FeaturesSection() {
  const [isVisible, setIsVisible] = useState(false);
  const [activeFeature, setActiveFeature] = useState(0);
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

  // Auto-scroll through features
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveFeature((prev) => (prev + 1) % 3);
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  const features = [
    {
      icon: Sparkles,
      title: "AI Prompt to Design",
      description:
        "Just describe what you need. 'Create a Satyanarayan Puja invitation in Marathi' - our AI understands and generates culturally perfect designs instantly.",
    },
    {
      icon: Palette,
      title: "Fully Editable Canvas",
      description:
        "Unlike static AI outputs, every design is completely editable. Drag, resize, reprompt 'make background more golden' - professional control meets AI magic.",
    },
    {
      icon: Layers,
      title: "Smart Templates",
      description:
        "Access thousands of Indian-specific templates. From Puja invitations to gym posters, all optimized for local culture and context.",
    },
  ];

  return (
    <section
      ref={sectionRef}
      className="from-background via-accent/5 to-background relative mt-[-200px] overflow-hidden bg-gradient-to-b px-6 py-32"
    >
      {/* Background gradient orb */}
      <div className="bg-gradient-radial from-primary/10 pointer-events-none absolute top-1/2 left-1/2 h-[800px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full via-transparent to-transparent blur-3xl" />

      <div className="relative z-10 mx-auto max-w-[1400px]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isVisible ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="mb-20 text-center"
        >
          <div className="border-accent/30 bg-accent/10 mb-6 inline-flex items-center gap-2 rounded-full border px-4 py-2 backdrop-blur-sm">
            <Sparkles className="text-accent-foreground h-4 w-4" />
            <span className="text-accent-foreground text-xs font-medium">
              Powerful workflow features
            </span>
          </div>

          <h2 className="mx-auto mb-6 flex items-center justify-center gap-4 text-4xl font-light tracking-tight md:text-6xl">
            Professional design for{" "}
            <PointerHighlight>
              <span>everyone</span>
            </PointerHighlight>
          </h2>

          <p className="text-muted-foreground mx-auto max-w-2xl text-lg">
            Arture combines AI intelligence with professional design tools to
            make creating beautiful, culturally relevant designs effortless.
          </p>
        </motion.div>

        <div className="grid items-center gap-16 md:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={isVisible ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="space-y-6"
          >
            <h3 className="mb-8 text-3xl font-light tracking-tight md:text-4xl">
              Build workflows that work for your team
            </h3>

            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={index}
                  className={`cursor-pointer border-l-2 py-4 pl-6 transition-all duration-300 ${
                    activeFeature === index
                      ? "border-accent bg-accent/5"
                      : "border-border/30 hover:border-border"
                  }`}
                  onClick={() => setActiveFeature(index)}
                >
                  <div className="mb-2 flex items-center gap-3">
                    <Icon
                      className={`h-5 w-5 ${
                        activeFeature === index
                          ? "text-accent-foreground"
                          : "text-muted-foreground"
                      }`}
                    />
                    <h4
                      className={`text-xl font-medium transition-colors ${
                        activeFeature === index
                          ? "text-accent-foreground"
                          : "text-foreground"
                      }`}
                    >
                      {feature.title}
                    </h4>
                  </div>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={isVisible ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="relative"
          >
            <div className="from-accent/20 via-card to-primary/20 border-border/50 relative aspect-[4/3] overflow-hidden rounded-2xl border bg-gradient-to-br p-8 backdrop-blur-sm">
              {/* Glassmorphic inner container */}
              <div className="bg-card/80 border-border/50 flex h-full w-full items-center justify-center rounded-lg border backdrop-blur-md transition-opacity duration-300">
                <div className="space-y-4 p-6 text-center">
                  {activeFeature === 0 && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="bg-accent/20 border-accent/30 inline-flex items-center gap-2 rounded-lg border px-3 py-1.5">
                        <span className="text-accent-foreground text-xs font-medium">
                          Prompt
                        </span>
                        <span className="text-sm font-semibold">→ Design</span>
                      </div>
                      <p className="text-muted-foreground mx-auto mt-4 max-w-xs text-sm">
                        Type "Create a wedding invitation" and watch AI generate
                        a complete,
                        <span className="text-accent-foreground font-medium">
                          {" "}
                          culturally perfect{" "}
                        </span>
                        design in seconds.
                      </p>
                    </motion.div>
                  )}
                  {activeFeature === 1 && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="bg-accent/20 border-accent/30 inline-flex items-center gap-2 rounded-lg border px-3 py-1.5">
                        <span className="text-accent-foreground text-xs font-medium">
                          Edit
                        </span>
                        <span className="text-sm font-semibold">
                          Everything
                        </span>
                      </div>
                      <p className="text-muted-foreground mx-auto mt-4 max-w-xs text-sm">
                        Drag elements, change colors, or reprompt
                        <span className="text-accent-foreground font-medium">
                          {" "}
                          "make it more festive"{" "}
                        </span>
                        - full control meets AI intelligence.
                      </p>
                    </motion.div>
                  )}
                  {activeFeature === 2 && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="bg-accent/20 border-accent/30 inline-flex items-center gap-2 rounded-lg border px-3 py-1.5">
                        <span className="text-accent-foreground text-xs font-medium">
                          Templates
                        </span>
                        <span className="text-sm font-semibold">Ready</span>
                      </div>
                      <p className="text-muted-foreground mx-auto mt-4 max-w-xs text-sm">
                        Thousands of Indian-specific templates from
                        <span className="text-accent-foreground font-medium">
                          {" "}
                          Puja invitations{" "}
                        </span>
                        to business posters, all AI-ready.
                      </p>
                    </motion.div>
                  )}
                </div>
              </div>

              {/* Animated glow */}
              <div className="from-primary/20 via-accent/20 to-primary/20 absolute -inset-1 rounded-2xl bg-gradient-to-r opacity-50 blur-xl" />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
