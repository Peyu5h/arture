"use client";

import { memo } from "react";
import { motion } from "framer-motion";
import { cn } from "~/lib/utils";

export type SpinnerVariant =
  | "default"
  | "throbber"
  | "pinwheel"
  | "circle-filled"
  | "ellipsis"
  | "ring"
  | "bars"
  | "infinite";

export interface SpinnerProps {
  variant?: SpinnerVariant;
  className?: string;
  size?: "sm" | "md" | "lg";
}

const sizeClasses = {
  sm: "h-4 w-4",
  md: "h-6 w-6",
  lg: "h-8 w-8",
};

const DefaultSpinner = ({ className, size = "md" }: Omit<SpinnerProps, "variant">) => (
  <motion.div
    className={cn(
      "border-primary/30 border-t-primary rounded-full border-2",
      sizeClasses[size],
      className
    )}
    animate={{ rotate: 360 }}
    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
  />
);

const ThrobberSpinner = ({ className, size = "md" }: Omit<SpinnerProps, "variant">) => (
  <motion.div
    className={cn("bg-primary rounded-full", sizeClasses[size], className)}
    animate={{ scale: [1, 1.2, 1], opacity: [1, 0.5, 1] }}
    transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
  />
);

const PinwheelSpinner = ({ className, size = "md" }: Omit<SpinnerProps, "variant">) => (
  <motion.div
    className={cn("relative", sizeClasses[size], className)}
    animate={{ rotate: 360 }}
    transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
  >
    {[0, 90, 180, 270].map((deg) => (
      <div
        key={deg}
        className="bg-primary absolute left-1/2 top-0 h-1/2 w-1 origin-bottom -translate-x-1/2 rounded-full"
        style={{ transform: `translateX(-50%) rotate(${deg}deg)` }}
      />
    ))}
  </motion.div>
);

const CircleFilledSpinner = ({ className, size = "md" }: Omit<SpinnerProps, "variant">) => (
  <div className={cn("relative", sizeClasses[size], className)}>
    <motion.div
      className="bg-primary absolute inset-0 rounded-full"
      animate={{ scale: [0, 1], opacity: [1, 0] }}
      transition={{ duration: 1, repeat: Infinity, ease: "easeOut" }}
    />
    <div className="bg-primary/30 absolute inset-0 rounded-full" />
  </div>
);

const EllipsisSpinner = ({ className, size = "md" }: Omit<SpinnerProps, "variant">) => (
  <div className={cn("flex items-center gap-1", className)}>
    {[0, 0.2, 0.4].map((delay, i) => (
      <motion.div
        key={i}
        className={cn(
          "bg-primary rounded-full",
          size === "sm" ? "h-1.5 w-1.5" : size === "md" ? "h-2 w-2" : "h-2.5 w-2.5"
        )}
        animate={{ y: [0, -4, 0] }}
        transition={{
          duration: 0.6,
          repeat: Infinity,
          delay,
          ease: "easeInOut",
        }}
      />
    ))}
  </div>
);

const RingSpinner = ({ className, size = "md" }: Omit<SpinnerProps, "variant">) => (
  <div className={cn("relative", sizeClasses[size], className)}>
    <motion.div
      className="border-primary absolute inset-0 rounded-full border-2"
      animate={{ scale: [1, 1.2], opacity: [1, 0] }}
      transition={{ duration: 1, repeat: Infinity, ease: "easeOut" }}
    />
    <motion.div
      className="border-primary absolute inset-0 rounded-full border-2"
      animate={{ scale: [1, 1.2], opacity: [1, 0] }}
      transition={{ duration: 1, repeat: Infinity, ease: "easeOut", delay: 0.5 }}
    />
  </div>
);

const BarsSpinner = ({ className, size = "md" }: Omit<SpinnerProps, "variant">) => (
  <div className={cn("flex items-end gap-0.5", className)}>
    {[0, 0.1, 0.2, 0.3].map((delay, i) => (
      <motion.div
        key={i}
        className={cn(
          "bg-primary rounded-sm",
          size === "sm" ? "w-1" : size === "md" ? "w-1.5" : "w-2"
        )}
        animate={{ height: ["40%", "100%", "40%"] }}
        transition={{
          duration: 0.8,
          repeat: Infinity,
          delay,
          ease: "easeInOut",
        }}
        style={{ height: size === "sm" ? 12 : size === "md" ? 18 : 24 }}
      />
    ))}
  </div>
);

const InfiniteSpinner = ({ className, size = "md" }: Omit<SpinnerProps, "variant">) => {
  const pathLength = size === "sm" ? 40 : size === "md" ? 60 : 80;
  const strokeWidth = size === "sm" ? 2 : size === "md" ? 3 : 4;
  const viewBox = size === "sm" ? "0 0 40 20" : size === "md" ? "0 0 60 30" : "0 0 80 40";
  const d = size === "sm"
    ? "M10,10 C10,5 20,5 20,10 C20,15 30,15 30,10 C30,5 20,5 20,10 C20,15 10,15 10,10"
    : size === "md"
    ? "M15,15 C15,7 30,7 30,15 C30,23 45,23 45,15 C45,7 30,7 30,15 C30,23 15,23 15,15"
    : "M20,20 C20,10 40,10 40,20 C40,30 60,30 60,20 C60,10 40,10 40,20 C40,30 20,30 20,20";

  return (
    <div className={cn(sizeClasses[size], className)}>
      <svg
        viewBox={viewBox}
        className="h-full w-full"
        fill="none"
      >
        <motion.path
          d={d}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          className="text-primary"
          initial={{ pathLength: 0, pathOffset: 0 }}
          animate={{ pathLength: 0.4, pathOffset: [0, 1] }}
          transition={{
            pathOffset: { duration: 2, repeat: Infinity, ease: "linear" },
            pathLength: { duration: 0.5 },
          }}
        />
        <path
          d={d}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          className="text-primary/20"
        />
      </svg>
    </div>
  );
};

export const Spinner = memo(function Spinner({
  variant = "default",
  className,
  size = "md",
}: SpinnerProps) {
  switch (variant) {
    case "throbber":
      return <ThrobberSpinner className={className} size={size} />;
    case "pinwheel":
      return <PinwheelSpinner className={className} size={size} />;
    case "circle-filled":
      return <CircleFilledSpinner className={className} size={size} />;
    case "ellipsis":
      return <EllipsisSpinner className={className} size={size} />;
    case "ring":
      return <RingSpinner className={className} size={size} />;
    case "bars":
      return <BarsSpinner className={className} size={size} />;
    case "infinite":
      return <InfiniteSpinner className={className} size={size} />;
    default:
      return <DefaultSpinner className={className} size={size} />;
  }
});
