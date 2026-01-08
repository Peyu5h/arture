"use client";

import { memo, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Sparkles, LayoutTemplate, Plus, Search, Loader2 } from "lucide-react";
import { cn } from "~/lib/utils";
import { Button } from "~/components/ui/button";
import type { BaseUIComponentProps } from "./types";

export interface TemplateOption {
  id: string;
  name: string;
  thumbnail?: string;
  category?: string;
  tags?: string[];
}

export interface TemplateGalleryProps extends Omit<
  BaseUIComponentProps,
  "componentType"
> {
  componentType: "template_gallery";
  templates: TemplateOption[];
  query?: string;
  category?: string;
  allowScratch?: boolean;
  isLoading?: boolean;
  noResultsMessage?: string;
}

interface TemplateGalleryValue {
  action: "select_template" | "start_scratch";
  templateId?: string;
  templateName?: string;
}

export const AgentTemplateGallery = memo(function AgentTemplateGallery({
  id,
  title = "Choose a Template",
  description,
  templates = [],
  query,
  category,
  allowScratch = true,
  isLoading = false,
  noResultsMessage = "No templates found for this search.",
  onSubmit,
  onCancel,
}: TemplateGalleryProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const handleSelect = useCallback(
    (template: TemplateOption) => {
      setSelectedId(template.id);
      const value: TemplateGalleryValue = {
        action: "select_template",
        templateId: template.id,
        templateName: template.name,
      };
      onSubmit(value);
    },
    [onSubmit],
  );

  const handleStartScratch = useCallback(() => {
    const value: TemplateGalleryValue = {
      action: "start_scratch",
    };
    onSubmit(value);
  }, [onSubmit]);

  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="border-border/40 from-muted/40 to-muted/20 w-full rounded-xl border bg-gradient-to-b p-4"
      >
        <div className="flex flex-col items-center justify-center gap-3 py-8">
          <Loader2 className="text-primary h-8 w-8 animate-spin" />
          <p className="text-muted-foreground text-sm">
            Searching templates{query ? ` for "${query}"` : ""}...
          </p>
        </div>
      </motion.div>
    );
  }

  // no results state
  if (templates.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="border-border/40 from-muted/40 to-muted/20 w-full space-y-4 rounded-xl border bg-gradient-to-b p-4"
      >
        <div className="flex flex-col items-center gap-3 py-6">
          <div className="bg-muted/50 flex h-12 w-12 items-center justify-center rounded-full">
            <Search className="text-muted-foreground h-6 w-6" />
          </div>
          <div className="text-center">
            <p className="text-foreground text-sm font-medium">
              {noResultsMessage}
            </p>
            {query && (
              <p className="text-muted-foreground mt-1 text-xs">
                Searched for: "{query}"
              </p>
            )}
          </div>
        </div>

        {allowScratch && (
          <Button
            onClick={handleStartScratch}
            className="bg-primary hover:bg-primary/90 w-full"
          >
            <Sparkles className="mr-2 h-4 w-4" />
            Create from Scratch
          </Button>
        )}

        {onCancel && (
          <Button variant="ghost" onClick={onCancel} className="w-full">
            Cancel
          </Button>
        )}
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="border-border/40 from-muted/40 to-muted/20 w-full space-y-3 rounded-xl border bg-gradient-to-b p-4"
    >
      {/* header */}
      <div className="space-y-1">
        <h4 className="text-foreground flex items-center gap-2 text-sm font-semibold">
          <div className="bg-primary/10 flex h-6 w-6 shrink-0 items-center justify-center rounded-md">
            <LayoutTemplate className="text-primary h-3.5 w-3.5" />
          </div>
          <span className="truncate">{title}</span>
        </h4>
        {description && (
          <p className="text-muted-foreground truncate pl-8 text-xs">
            {description}
          </p>
        )}
        {category && (
          <p className="text-muted-foreground truncate pl-8 text-xs">
            Category: <span className="capitalize">{category}</span>
            {query && ` • Search: "${query}"`}
          </p>
        )}
      </div>

      {/* template grid */}
      <div className="grid grid-cols-2 gap-2">
        {templates.slice(0, 4).map((template, idx) => (
          <motion.button
            key={template.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: idx * 0.05 }}
            onClick={() => handleSelect(template)}
            onMouseEnter={() => setHoveredId(template.id)}
            onMouseLeave={() => setHoveredId(null)}
            className={cn(
              "group relative overflow-hidden rounded-lg border transition-all",
              "hover:border-primary/50 hover:shadow-md",
              selectedId === template.id
                ? "border-primary ring-primary/20 ring-2"
                : "border-border/50",
            )}
          >
            {/* thumbnail or placeholder */}
            <div className="bg-muted/30 aspect-[4/3] w-full">
              {template.thumbnail ? (
                <img
                  src={template.thumbnail}
                  alt={template.name}
                  className="h-full w-full object-cover transition-transform group-hover:scale-105"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <LayoutTemplate className="text-muted-foreground/50 h-8 w-8" />
                </div>
              )}
            </div>

            {/* overlay with name */}
            <div
              className={cn(
                "absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-2 transition-opacity",
                hoveredId === template.id ? "opacity-100" : "opacity-80",
              )}
            >
              <p className="truncate text-xs font-medium text-white">
                {template.name}
              </p>
              {template.category && (
                <p className="truncate text-[10px] text-white/70">
                  {template.category}
                </p>
              )}
            </div>

            {/* selection indicator */}
            {selectedId === template.id && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="bg-primary absolute top-1 right-1 flex h-5 w-5 items-center justify-center rounded-full text-white"
              >
                <svg
                  className="h-3 w-3"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={3}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </motion.div>
            )}
          </motion.button>
        ))}
      </div>

      {/* show more if > 4 templates */}
      {templates.length > 4 && (
        <p className="text-muted-foreground text-center text-xs">
          +{templates.length - 4} more templates available
        </p>
      )}

      {/* scratch option */}
      {allowScratch && (
        <div className="border-border/30 border-t pt-3">
          <Button
            variant="outline"
            onClick={handleStartScratch}
            className="bg-background/50 w-full"
          >
            <Plus className="mr-2 h-4 w-4" />
            Start from Scratch
          </Button>
        </div>
      )}

      {/* cancel */}
      {onCancel && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onCancel}
          className="text-muted-foreground hover:text-foreground w-full"
        >
          Cancel
        </Button>
      )}
    </motion.div>
  );
});

export default AgentTemplateGallery;
