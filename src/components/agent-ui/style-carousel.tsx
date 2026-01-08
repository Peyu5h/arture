"use client";

import { useState, useRef, useCallback } from "react";
import { ChevronLeft, ChevronRight, Check, X, Palette } from "lucide-react";
import { cn } from "~/lib/utils";
import { Button } from "~/components/ui/button";
import { ScrollArea, ScrollBar } from "~/components/ui/scroll-area";
import type { StyleCarouselProps, StyleOption } from "./types";

interface StyleCardProps {
  option: StyleOption;
  isSelected: boolean;
  onSelect: () => void;
}

function StyleCard({ option, isSelected, onSelect }: StyleCardProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "relative w-24 flex-shrink-0 overflow-hidden rounded-lg border transition-all",
        isSelected
          ? "border-primary ring-primary ring-offset-background ring-2 ring-offset-2"
          : "border-border hover:border-primary/50",
      )}
    >
      {/* preview image or color swatches */}
      <div className="relative aspect-[4/3]">
        {option.preview ? (
          <img
            src={option.preview}
            alt={option.name}
            className="h-full w-full object-cover"
          />
        ) : option.colors && option.colors.length > 0 ? (
          <div className="flex h-full w-full">
            {option.colors.slice(0, 4).map((color, idx) => (
              <div
                key={idx}
                className="h-full flex-1"
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        ) : (
          <div className="bg-muted flex h-full w-full items-center justify-center">
            <Palette className="text-muted-foreground h-8 w-8" />
          </div>
        )}

        {/* selected overlay */}
        {isSelected && (
          <div className="bg-primary/20 absolute inset-0 flex items-center justify-center">
            <div className="bg-primary flex h-6 w-6 items-center justify-center rounded-full">
              <Check className="text-primary-foreground h-4 w-4" />
            </div>
          </div>
        )}
      </div>

      {/* label */}
      <div className="bg-background p-2">
        <p className="truncate text-center text-xs font-medium">
          {option.name}
        </p>
        {option.description && (
          <p className="text-muted-foreground mt-0.5 truncate text-center text-[10px]">
            {option.description}
          </p>
        )}
      </div>

      {/* tags */}
      {option.tags && option.tags.length > 0 && (
        <div className="absolute top-1 left-1 flex flex-wrap gap-0.5">
          {option.tags.slice(0, 2).map((tag) => (
            <span
              key={tag}
              className="bg-background/80 rounded px-1 py-0.5 text-[8px] backdrop-blur-sm"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </button>
  );
}

export function AgentStyleCarousel({
  id,
  title,
  description,
  required,
  options,
  defaultValue,
  columns = 3,
  onSubmit,
  onCancel,
}: StyleCarouselProps) {
  // limit options to prevent overflow (max 6 recommended)
  const limitedOptions = options.slice(0, 6);

  const [selectedId, setSelectedId] = useState<string | null>(
    defaultValue || null,
  );
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleSelect = useCallback((optionId: string) => {
    setSelectedId(optionId);
  }, []);

  const handleSubmit = useCallback(() => {
    if (selectedId) {
      const selected = limitedOptions.find((o) => o.id === selectedId);
      if (selected) {
        onSubmit({
          id: selected.id,
          name: selected.name,
          colors: selected.colors,
        });
      }
    }
  }, [selectedId, limitedOptions, onSubmit]);

  const handleCancel = useCallback(() => {
    onCancel?.();
  }, [onCancel]);

  const scrollLeft = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: -150, behavior: "smooth" });
    }
  }, []);

  const scrollRight = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: 150, behavior: "smooth" });
    }
  }, []);

  const selectedOption = options.find((o) => o.id === selectedId);

  return (
    <div className="bg-muted/30 border-border/50 max-w-[280px] w-full min-w-0 overflow-hidden space-y-3 rounded-lg border p-3">
      {(title || description) && (
        <div className="space-y-1">
          {title && (
            <h4 className="flex items-center gap-2 text-sm font-medium">
              <Palette className="text-primary h-4 w-4" />
              {title}
              {required && <span className="text-destructive">*</span>}
            </h4>
          )}
          {description && (
            <p className="text-muted-foreground text-xs">{description}</p>
          )}
        </div>
      )}

      {/* carousel container */}
      <div className="group relative w-full max-w-full min-w-0 overflow-hidden">
        {/* scroll buttons - only show if more than 3 options */}
        {limitedOptions.length > 3 && (
          <>
            <Button
              variant="outline"
              size="icon"
              className="absolute top-1/2 left-0 z-10 h-8 w-8 -translate-y-1/2 rounded-full opacity-0 shadow-md transition-opacity group-hover:opacity-100"
              onClick={scrollLeft}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <Button
              variant="outline"
              size="icon"
              className="absolute top-1/2 right-0 z-10 h-8 w-8 -translate-y-1/2 rounded-full opacity-0 shadow-md transition-opacity group-hover:opacity-100"
              onClick={scrollRight}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </>
        )}

        {/* scrollable area */}
        <div
          ref={scrollRef}
          className="w-full overflow-x-auto pb-2"
          style={{ scrollbarWidth: 'thin' }}
        >
          <div className="flex gap-3 p-1">
            {limitedOptions.map((option) => (
              <StyleCard
                key={option.id}
                option={option}
                isSelected={selectedId === option.id}
                onSelect={() => handleSelect(option.id)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* selected preview - compact to prevent overflow */}
      {selectedOption && (
        <div className="border-primary/30 bg-primary/5 rounded-lg border p-2">
          <div className="flex items-center gap-3">
            {selectedOption.colors && selectedOption.colors.length > 0 && (
              <div className="flex gap-1">
                {selectedOption.colors.slice(0, 5).map((color, idx) => (
                  <div
                    key={idx}
                    className="border-border/50 h-5 w-5 rounded-full border"
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">
                {selectedOption.name}
              </p>
              {selectedOption.description && (
                <p className="text-muted-foreground truncate text-xs">
                  {selectedOption.description}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* action buttons */}
      <div className="border-border/50 flex gap-2 border-t pt-2">
        <Button
          size="sm"
          onClick={handleSubmit}
          disabled={required && !selectedId}
          className="flex-1"
        >
          <Check className="mr-1 h-4 w-4" />
          Apply Style
        </Button>
        {onCancel && (
          <Button size="sm" variant="outline" onClick={handleCancel}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}

export default AgentStyleCarousel;
