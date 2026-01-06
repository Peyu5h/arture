"use client";

import { memo } from "react";
import { motion } from "framer-motion";
import { cn } from "~/lib/utils";

interface ShimmerTextProps {
  children: React.ReactNode;
  className?: string;
  duration?: number;
}

function ShimmerTextInner({
  children,
  className,
  duration = 2,
}: ShimmerTextProps) {
  return (
    <span className={cn("relative inline-block overflow-hidden", className)}>
      <span className="text-muted-foreground">{children}</span>
      <motion.span
        className="absolute inset-0 bg-gradient-to-r from-transparent via-foreground/80 to-transparent"
        style={{
          backgroundSize: "200% 100%",
          WebkitBackgroundClip: "text",
          backgroundClip: "text",
          WebkitTextFillColor: "transparent",
          mixBlendMode: "overlay",
        }}
        animate={{
          backgroundPosition: ["-200% center", "200% center"],
        }}
        transition={{
          duration,
          repeat: Infinity,
          ease: "linear",
        }}
      >
        {children}
      </motion.span>
    </span>
  );
}

export const ShimmerText = memo(ShimmerTextInner);
