import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { ny } from "~/lib/utils";

interface StrokeSizeControlProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  color?: string;
}

export const StrokeSizeControl = ({
  value,
  onChange,
  min = 1,
  max = 50,
  color = "#000000",
}: StrokeSizeControlProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);

  const percentage = ((value - min) / (max - min)) * 100;

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setShowPreview(true);
    updateValue(e);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    setShowPreview(true);
    updateValueFromTouch(e);
  };

  const updateValue = (e: MouseEvent | React.MouseEvent) => {
    if (!trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const newPercentage = x / rect.width;
    const newValue = Math.round(min + newPercentage * (max - min));
    onChange(Math.max(min, Math.min(max, newValue)));
  };

  const updateValueFromTouch = (e: TouchEvent | React.TouchEvent) => {
    if (!trackRef.current) return;
    const touch = e.touches[0];
    if (!touch) return;
    const rect = trackRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(touch.clientX - rect.left, rect.width));
    const newPercentage = x / rect.width;
    const newValue = Math.round(min + newPercentage * (max - min));
    onChange(Math.max(min, Math.min(max, newValue)));
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        updateValue(e);
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (isDragging) {
        updateValueFromTouch(e);
      }
    };

    const handleEnd = () => {
      setIsDragging(false);
      setTimeout(() => setShowPreview(false), 150);
    };

    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleEnd);
      window.addEventListener("touchmove", handleTouchMove);
      window.addEventListener("touchend", handleEnd);
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleEnd);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleEnd);
    };
  }, [isDragging, min, max, onChange]);

  // size presets
  const presets = [2, 8, 16, 32];

  return (
    <div className="space-y-4 select-none">
      <div className="flex items-center justify-between">
        <span className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
          Stroke Size
        </span>
        <span className="bg-muted rounded-md px-2 py-0.5 font-mono text-xs tabular-nums">
          {value}px
        </span>
      </div>

      {/* visual preview with better background */}
      <div className="border-border bg-background relative flex h-20 items-center justify-center overflow-hidden rounded-xl border">
        {/* checkerboard pattern background */}
        <div
          className="absolute inset-0 opacity-50"
          style={{
            backgroundImage: `
              linear-gradient(45deg, var(--muted) 25%, transparent 25%),
              linear-gradient(-45deg, var(--muted) 25%, transparent 25%),
              linear-gradient(45deg, transparent 75%, var(--muted) 75%),
              linear-gradient(-45deg, transparent 75%, var(--muted) 75%)
            `,
            backgroundSize: "12px 12px",
            backgroundPosition: "0 0, 0 6px, 6px -6px, -6px 0px",
          }}
        />
        {/* center guides */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="bg-border/30 absolute h-px w-full" />
          <div className="bg-border/30 absolute h-full w-px" />
        </div>
        {/* stroke preview dot */}
        <motion.div
          animate={{
            width: Math.max(4, value),
            height: Math.max(4, value),
          }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
          className="relative rounded-full shadow-sm"
          style={{ backgroundColor: color }}
        />
      </div>

      {/* slider track */}
      <div className="relative pt-2">
        <div
          ref={trackRef}
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
          className="bg-muted relative h-2 cursor-pointer rounded-full"
        >
          {/* filled track */}
          <motion.div
            className="bg-primary absolute top-0 left-0 h-full rounded-full"
            style={{ width: `${percentage}%` }}
            initial={false}
            animate={{ width: `${percentage}%` }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
          />

          {/* thumb */}
          <motion.div
            className={ny(
              "border-primary bg-background absolute top-1/2 -translate-y-1/2 rounded-full border-2 shadow-md transition-shadow",
              isDragging && "ring-primary/20 shadow-lg ring-4",
            )}
            style={{
              left: `${percentage}%`,
              width: 18,
              height: 18,
              marginLeft: -9,
            }}
            initial={false}
            animate={{
              scale: isDragging ? 1.15 : 1,
            }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
          />

          {/* tooltip preview */}
          {showPreview && (
            <motion.div
              className="bg-popover absolute -top-10 rounded-lg border px-2.5 py-1 text-xs font-medium shadow-lg"
              style={{
                left: `${percentage}%`,
                transform: "translateX(-50%)",
              }}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 5 }}
            >
              {value}px
            </motion.div>
          )}
        </div>
      </div>

      {/* preset sizes */}
      <div className="flex items-center gap-2">
        {presets.map((preset) => (
          <button
            key={preset}
            onClick={() => onChange(preset)}
            className={ny(
              "flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition-all",
              value === preset
                ? "bg-primary text-primary-foreground"
                : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <span
              className="rounded-full"
              style={{
                width: Math.max(4, preset / 4),
                height: Math.max(4, preset / 4),
                backgroundColor: value === preset ? "currentColor" : color,
              }}
            />
            {preset}
          </button>
        ))}
      </div>
    </div>
  );
};
