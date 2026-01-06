"use client";

import { memo, ElementType, ComponentPropsWithoutRef } from "react";
import { motion } from "framer-motion";
import { cn } from "~/lib/utils";

type ShimmerProps<T extends ElementType = "span"> = {
  as?: T;
  className?: string;
  duration?: number;
  spread?: number;
  children?: React.ReactNode;
} & Omit<ComponentPropsWithoutRef<T>, "as" | "className" | "children">;

function ShimmerInner<T extends ElementType = "span">({
  as,
  className,
  duration = 2,
  spread,
  children,
  ...props
}: ShimmerProps<T>) {
  const Component = as || "span";
  const textLength = typeof children === "string" ? children.length : 20;
  const calculatedSpread = spread ?? Math.max(1, Math.min(textLength / 10, 3));

  return (
    <Component className={cn("relative inline-block", className)} {...props}>
      <motion.span
        className="bg-clip-text text-transparent"
        style={{
          backgroundImage: `linear-gradient(
            90deg,
            hsl(var(--muted-foreground)) 0%,
            hsl(var(--muted-foreground)) 40%,
            hsl(var(--foreground)) 50%,
            hsl(var(--muted-foreground)) 60%,
            hsl(var(--muted-foreground)) 100%
          )`,
          backgroundSize: `${100 + calculatedSpread * 50}% 100%`,
          WebkitBackgroundClip: "text",
          backgroundClip: "text",
        }}
        animate={{
          backgroundPosition: ["200% center", "-200% center"],
        }}
        transition={{
          duration,
          repeat: Infinity,
          ease: "linear",
        }}
      >
        {children}
      </motion.span>
    </Component>
  );
}

export const Shimmer = memo(ShimmerInner) as typeof ShimmerInner;
