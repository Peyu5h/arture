"use client";

import { memo, useState } from "react";
import { motion } from "framer-motion";
import { cn } from "~/lib/utils";

type PositionPreset =
  | "top-left"
  | "top-center"
  | "top-right"
  | "middle-left"
  | "center"
  | "middle-right"
  | "bottom-left"
  | "bottom-center"
  | "bottom-right";

interface PositionSelectorProps {
  onSelect: (position: PositionPreset) => void;
  disabled?: boolean;
  className?: string;
}

const POSITIONS: { id: PositionPreset; label: string }[] = [
  { id: "top-left", label: "Top Left" },
  { id: "top-center", label: "Top" },
  { id: "top-right", label: "Top Right" },
  { id: "middle-left", label: "Left" },
  { id: "center", label: "Center" },
  { id: "middle-right", label: "Right" },
  { id: "bottom-left", label: "Bottom Left" },
  { id: "bottom-center", label: "Bottom" },
  { id: "bottom-right", label: "Bottom Right" },
];

export const PositionSelector = memo(function PositionSelector({
  onSelect,
  disabled = false,
  className,
}: PositionSelectorProps) {
  const [hoveredPosition, setHoveredPosition] = useState<PositionPreset | null>(
    null,
  );

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <span className="text-muted-foreground text-xs">Select position:</span>
      <div className="bg-muted/30 dark:bg-zinc-800/50 grid grid-cols-3 gap-1 rounded-lg p-2">
        {POSITIONS.map((pos) => (
          <motion.button
            key={pos.id}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => !disabled && onSelect(pos.id)}
            onMouseEnter={() => setHoveredPosition(pos.id)}
            onMouseLeave={() => setHoveredPosition(null)}
            disabled={disabled}
            className={cn(
              "relative flex h-8 items-center justify-center rounded-md text-xs font-medium transition-all",
              "hover:bg-primary/20 hover:text-primary",
              "focus:ring-primary/50 focus:outline-none focus:ring-2",
              "disabled:cursor-not-allowed disabled:opacity-50",
              pos.id === "center"
                ? "bg-primary/10 text-primary"
                : "bg-muted/50 text-muted-foreground dark:bg-zinc-700/50",
            )}
          >
            {hoveredPosition === pos.id ? (
              <motion.span
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-[10px]"
              >
                {pos.label}
              </motion.span>
            ) : (
              <span
                className={cn(
                  "h-2 w-2 rounded-full",
                  pos.id === "center" ? "bg-primary" : "bg-muted-foreground/40",
                )}
              />
            )}
          </motion.button>
        ))}
      </div>
    </div>
  );
});

interface InlinePositionSelectorProps {
  onSelect: (position: PositionPreset) => void;
  disabled?: boolean;
}

export const InlinePositionSelector = memo(function InlinePositionSelector({
  onSelect,
  disabled = false,
}: InlinePositionSelectorProps) {
  return (
    <div className="mt-2 flex flex-wrap gap-1.5">
      {POSITIONS.map((pos) => (
        <motion.button
          key={pos.id}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => !disabled && onSelect(pos.id)}
          disabled={disabled}
          className={cn(
            "rounded-full px-2.5 py-1 text-xs font-medium transition-all",
            "border border-border/50 dark:border-zinc-700",
            "bg-muted/30 hover:bg-primary/10 hover:border-primary/30 hover:text-primary dark:bg-zinc-800/50",
            "focus:ring-primary/50 focus:outline-none focus:ring-2",
            "disabled:cursor-not-allowed disabled:opacity-50",
          )}
        >
          {pos.label}
        </motion.button>
      ))}
    </div>
  );
});
