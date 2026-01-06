"use client";

import { motion, AnimatePresence } from "framer-motion";
import { cn } from "~/lib/utils";
import { AgentContextDisplayProps } from "./types";
import {
  Layers,
  Type,
  Image,
  Shapes,
  Loader2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useState } from "react";

export const AgentContextDisplay = ({
  context,
  isAnalyzing,
}: AgentContextDisplayProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!context && !isAnalyzing) {
    return null;
  }

  return (
    <div className="border-border bg-muted/30 dark:bg-muted/20 border-b">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          "flex w-full items-center justify-between px-3 py-2",
          "text-muted-foreground hover:bg-muted text-xs transition-colors",
        )}
      >
        <div className="flex items-center gap-2">
          {isAnalyzing ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <Layers className="h-3 w-3" />
          )}
          <span className="font-medium">Canvas Context</span>
        </div>
        {isExpanded ? (
          <ChevronUp className="h-3 w-3" />
        ) : (
          <ChevronDown className="h-3 w-3" />
        )}
      </button>

      <AnimatePresence>
        {isExpanded && context && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="grid grid-cols-2 gap-2 px-3 pb-3">
              <ContextItem
                icon={Layers}
                label="Elements"
                value={context.elementCount.toString()}
              />
              <ContextItem
                icon={Shapes}
                label="Size"
                value={`${context.canvasSize.width}x${context.canvasSize.height}`}
              />

              <div className="col-span-2 flex flex-wrap gap-1.5">
                {context.hasText && <ContextTag icon={Type} label="Text" />}
                {context.hasImages && (
                  <ContextTag icon={Image} label="Images" />
                )}
                {context.hasShapes && (
                  <ContextTag icon={Shapes} label="Shapes" />
                )}
              </div>

              {context.selectedElement && (
                <div className="border-primary/30 bg-primary/10 dark:bg-primary/15 col-span-2 mt-1 rounded-md border p-2">
                  <div className="mb-1 flex items-center gap-1.5">
                    <div className="bg-primary h-1.5 w-1.5 rounded-full" />
                    <span className="text-primary text-[10px] font-medium">
                      Selected: {context.selectedElement.type}
                    </span>
                  </div>
                  <div className="text-muted-foreground flex flex-wrap gap-1 text-[10px]">
                    {context.selectedElement.properties.width != null && (
                      <span>
                        W:{" "}
                        {Math.round(
                          Number(context.selectedElement.properties.width),
                        )}
                      </span>
                    )}
                    {context.selectedElement.properties.height != null && (
                      <span>
                        H:{" "}
                        {Math.round(
                          Number(context.selectedElement.properties.height),
                        )}
                      </span>
                    )}
                    {context.selectedElement.properties.text != null && (
                      <span className="max-w-[120px] truncate">
                        "{String(context.selectedElement.properties.text)}"
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const ContextItem = ({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) => (
  <div className="bg-background/80 dark:bg-background/50 flex items-center gap-2 rounded-md px-2 py-1.5">
    <Icon className="text-muted-foreground h-3 w-3" />
    <div className="flex flex-col">
      <span className="text-muted-foreground text-[10px]">{label}</span>
      <span className="text-foreground text-xs font-medium">{value}</span>
    </div>
  </div>
);

const ContextTag = ({
  icon: Icon,
  label,
}: {
  icon: React.ElementType;
  label: string;
}) => (
  <div className="bg-background/80 dark:bg-background/50 flex items-center gap-1 rounded px-1.5 py-0.5">
    <Icon className="text-muted-foreground h-2.5 w-2.5" />
    <span className="text-muted-foreground text-[10px]">{label}</span>
  </div>
);
