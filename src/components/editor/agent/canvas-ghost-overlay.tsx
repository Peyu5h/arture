"use client";

import { memo, useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "~/lib/utils";
import {
  Search,
  Loader2,
  MousePointer2,
  Target,
  Scan,
  Image,
  Sparkles,
} from "lucide-react";
import { useAgentFlow } from "~/hooks/useAgentFlow";
import { CanvasTarget } from "~/store/agentFlowStore";
import { fabric } from "fabric";

interface ElementBounds {
  left: number;
  top: number;
  width: number;
  height: number;
  angle?: number;
}

// gets element bounds from fabric object
function getElementBounds(
  canvas: fabric.Canvas,
  elementId: string,
): ElementBounds | null {
  const objects = canvas.getObjects();
  const target = objects.find(
    (obj) => (obj as unknown as { id?: string }).id === elementId,
  );

  if (!target) return null;

  const bounds = target.getBoundingRect();
  return {
    left: bounds.left,
    top: bounds.top,
    width: bounds.width,
    height: bounds.height,
    angle: target.angle || 0,
  };
}

// highlight overlay for a single element
const ElementHighlight = memo(function ElementHighlight({
  bounds,
  label,
  isActive,
}: {
  bounds: ElementBounds;
  label?: string;
  isActive: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className="pointer-events-none absolute"
      style={{
        left: bounds.left - 4,
        top: bounds.top - 4,
        width: bounds.width + 8,
        height: bounds.height + 8,
        transform: bounds.angle ? `rotate(${bounds.angle}deg)` : undefined,
      }}
    >
      {/* highlight border */}
      <div
        className={cn(
          "absolute inset-0 rounded-md border-2",
          isActive
            ? "border-primary shadow-[0_0_12px_rgba(var(--primary),0.4)]"
            : "border-primary/50",
        )}
      />

      {/* pulsing corners for active */}
      {isActive && (
        <>
          <motion.div
            className="border-primary absolute -top-1 -left-1 h-3 w-3 rounded-tl-md border-t-2 border-l-2"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
          <motion.div
            className="border-primary absolute -top-1 -right-1 h-3 w-3 rounded-tr-md border-t-2 border-r-2"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
          />
          <motion.div
            className="border-primary absolute -bottom-1 -left-1 h-3 w-3 rounded-bl-md border-b-2 border-l-2"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: 0.4 }}
          />
          <motion.div
            className="border-primary absolute -right-1 -bottom-1 h-3 w-3 rounded-br-md border-r-2 border-b-2"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: 0.6 }}
          />
        </>
      )}

      {/* label badge */}
      {label && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute -top-6 left-1/2 -translate-x-1/2 whitespace-nowrap"
        >
          <span className="bg-primary text-primary-foreground rounded-full px-2 py-0.5 text-[10px] font-medium shadow-sm">
            {label}
          </span>
        </motion.div>
      )}
    </motion.div>
  );
});

// region highlight for area selection
const RegionHighlight = memo(function RegionHighlight({
  region,
  label,
}: {
  region: { x: number; y: number; width: number; height: number };
  label?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="pointer-events-none absolute"
      style={{
        left: region.x,
        top: region.y,
        width: region.width,
        height: region.height,
      }}
    >
      {/* scanning effect */}
      <div className="border-primary/50 absolute inset-0 overflow-hidden rounded-lg border-2 border-dashed">
        <motion.div
          className="via-primary absolute inset-x-0 h-1 bg-gradient-to-r from-transparent to-transparent"
          animate={{ top: ["0%", "100%", "0%"] }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        />
      </div>

      {/* background overlay */}
      <div className="bg-primary/5 absolute inset-0 rounded-lg" />

      {/* label */}
      {label && (
        <div className="absolute -top-6 left-1/2 -translate-x-1/2">
          <span className="bg-primary/90 text-primary-foreground flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium">
            <Scan className="h-3 w-3" />
            {label}
          </span>
        </div>
      )}
    </motion.div>
  );
});

// searching indicator overlay
const SearchingOverlay = memo(function SearchingOverlay({
  label,
}: {
  label?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="pointer-events-none absolute inset-0 flex items-center justify-center"
    >
      <div className="border-border/50 bg-background/80 rounded-xl border p-4 shadow-lg backdrop-blur-sm">
        <div className="flex flex-col items-center gap-3">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          >
            <Search className="text-primary h-6 w-6" />
          </motion.div>
          <div className="text-center">
            <p className="text-foreground text-sm font-medium">
              {label || "Searching..."}
            </p>
            <p className="text-muted-foreground mt-1 text-xs">
              Looking for matching content
            </p>
          </div>
          {/* animated dots */}
          <div className="flex items-center gap-1">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="bg-primary h-1.5 w-1.5 rounded-full"
                animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  delay: i * 0.2,
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
});

// canvas-wide scanning overlay
const CanvasScanOverlay = memo(function CanvasScanOverlay({
  label,
}: {
  label?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="pointer-events-none absolute inset-0"
    >
      {/* grid pattern */}
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `
            linear-gradient(to right, hsl(var(--primary)) 1px, transparent 1px),
            linear-gradient(to bottom, hsl(var(--primary)) 1px, transparent 1px)
          `,
          backgroundSize: "40px 40px",
        }}
      />

      {/* horizontal scan line */}
      <motion.div
        className="via-primary absolute inset-x-0 h-px bg-gradient-to-r from-transparent to-transparent"
        animate={{ top: ["0%", "100%"] }}
        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
      />

      {/* vertical scan line */}
      <motion.div
        className="via-primary absolute inset-y-0 w-px bg-gradient-to-b from-transparent to-transparent"
        animate={{ left: ["0%", "100%"] }}
        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
      />

      {/* center indicator */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-primary/90 text-primary-foreground flex items-center gap-2 rounded-full px-3 py-1.5 shadow-lg"
        >
          <Scan className="h-4 w-4" />
          <span className="text-xs font-medium">
            {label || "Analyzing canvas..."}
          </span>
        </motion.div>
      </div>
    </motion.div>
  );
});

// agent cursor indicator
const AgentCursor = memo(function AgentCursor({
  x,
  y,
  label,
}: {
  x: number;
  y: number;
  label?: string;
}) {
  return (
    <motion.div
      className="pointer-events-none absolute"
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 1, scale: 1, x, y }}
      exit={{ opacity: 0, scale: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      {/* cursor icon */}
      <div className="relative">
        <MousePointer2 className="fill-primary text-primary h-5 w-5 drop-shadow-md" />
        {/* ripple effect */}
        <motion.div
          className="border-primary/50 absolute -inset-2 rounded-full border-2"
          animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
      </div>

      {/* label */}
      {label && (
        <div className="absolute top-5 left-5 whitespace-nowrap">
          <span className="bg-primary text-primary-foreground rounded px-1.5 py-0.5 text-[10px] font-medium shadow-sm">
            {label}
          </span>
        </div>
      )}
    </motion.div>
  );
});

// skeleton loader for image search results
const ImageSearchSkeleton = memo(function ImageSearchSkeleton() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2"
    >
      <div className="border-border/50 bg-background/90 flex items-center gap-2 rounded-lg border p-3 shadow-lg backdrop-blur-sm">
        <Loader2 className="text-primary h-4 w-4 animate-spin" />
        <div className="flex gap-2">
          {[0, 1, 2, 3].map((i) => (
            <motion.div
              key={i}
              className="bg-muted h-12 w-12 rounded"
              animate={{ opacity: [0.3, 0.6, 0.3] }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: i * 0.1,
              }}
            >
              <div className="flex h-full items-center justify-center">
                <Image className="text-muted-foreground/50 h-4 w-4" />
              </div>
            </motion.div>
          ))}
        </div>
        <span className="text-muted-foreground text-xs">
          Fetching images...
        </span>
      </div>
    </motion.div>
  );
});

// processing indicator
const ProcessingIndicator = memo(function ProcessingIndicator({
  label,
}: {
  label?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="pointer-events-none absolute right-4 bottom-4"
    >
      <div className="border-border/50 bg-background/90 flex items-center gap-2 rounded-lg border px-3 py-2 shadow-lg backdrop-blur-sm">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
          <Sparkles className="text-primary h-4 w-4" />
        </motion.div>
        <span className="text-foreground text-xs font-medium">
          {label || "Processing..."}
        </span>
      </div>
    </motion.div>
  );
});

interface CanvasGhostOverlayProps {
  canvas: fabric.Canvas | null;
  containerRef?: React.RefObject<HTMLDivElement | null>;
  className?: string;
}

// main ghost overlay component
export const CanvasGhostOverlay = memo(function CanvasGhostOverlay({
  canvas,
  containerRef,
  className,
}: CanvasGhostOverlayProps) {
  const { canvasTargets, phase, isActive, currentTool } = useAgentFlow();
  const [elementBounds, setElementBounds] = useState<
    Map<string, ElementBounds>
  >(new Map());

  // update element bounds when targets change
  useEffect(() => {
    if (!canvas) return;

    const boundsMap = new Map<string, ElementBounds>();

    canvasTargets.forEach((target) => {
      if (target.elementId) {
        const bounds = getElementBounds(canvas, target.elementId);
        if (bounds) {
          boundsMap.set(target.elementId, bounds);
        }
      }
      if (target.elementIds) {
        target.elementIds.forEach((id) => {
          const bounds = getElementBounds(canvas, id);
          if (bounds) {
            boundsMap.set(id, bounds);
          }
        });
      }
    });

    setElementBounds(boundsMap);
  }, [canvas, canvasTargets]);

  // don't render if not active
  if (!isActive && canvasTargets.length === 0) {
    return null;
  }

  // check for specific overlay types
  const hasSearchingTarget = canvasTargets.some((t) => t.type === "searching");
  const hasCanvasTarget = canvasTargets.some((t) => t.type === "canvas");
  const isSearchingImages = currentTool?.toolName === "search_images";
  const isProcessing =
    currentTool?.status === "active" &&
    currentTool?.toolName !== "search_images";

  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-0 z-50 overflow-hidden",
        className,
      )}
    >
      <AnimatePresence mode="sync">
        {/* canvas scan overlay when analyzing */}
        {phase === "analyzing" && hasCanvasTarget && (
          <CanvasScanOverlay
            key="canvas-scan"
            label={canvasTargets.find((t) => t.type === "canvas")?.label}
          />
        )}

        {/* searching overlay */}
        {hasSearchingTarget && (
          <SearchingOverlay
            key="searching"
            label={canvasTargets.find((t) => t.type === "searching")?.label}
          />
        )}

        {/* image search skeleton */}
        {isSearchingImages && <ImageSearchSkeleton key="image-skeleton" />}

        {/* element highlights */}
        {canvasTargets
          .filter((t) => t.type === "element" && t.elementId)
          .map((target) => {
            const bounds = elementBounds.get(target.elementId!);
            if (!bounds) return null;
            return (
              <ElementHighlight
                key={target.elementId}
                bounds={bounds}
                label={target.label}
                isActive={true}
              />
            );
          })}

        {/* multiple element highlights */}
        {canvasTargets
          .filter((t) => t.type === "element" && t.elementIds)
          .flatMap((target) =>
            target.elementIds!.map((id) => {
              const bounds = elementBounds.get(id);
              if (!bounds) return null;
              return (
                <ElementHighlight
                  key={id}
                  bounds={bounds}
                  label={target.label}
                  isActive={false}
                />
              );
            }),
          )}

        {/* region highlights */}
        {canvasTargets
          .filter((t) => t.type === "region" && t.region)
          .map((target, idx) => (
            <RegionHighlight
              key={`region-${idx}`}
              region={target.region!}
              label={target.label}
            />
          ))}

        {/* processing indicator */}
        {isProcessing && (
          <ProcessingIndicator
            key="processing"
            label={currentTool?.displayName}
          />
        )}
      </AnimatePresence>
    </div>
  );
});
