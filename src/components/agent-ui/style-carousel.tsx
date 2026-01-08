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
        "relative flex-shrink-0 w-32 rounded-lg border overflow-hidden transition-all",
        isSelected
          ? "border-primary ring-2 ring-primary ring-offset-2 ring-offset-background"
          : "border-border hover:border-primary/50"
      )}
    >
      {/* preview image or color swatches */}
      <div className="aspect-[4/3] relative">
        {option.preview ? (
          <img
            src={option.preview}
            alt={option.name}
            className="w-full h-full object-cover"
          />
        ) : option.colors && option.colors.length > 0 ? (
          <div className="w-full h-full flex">
            {option.colors.slice(0, 4).map((color, idx) => (
              <div
                key={idx}
                className="flex-1 h-full"
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        ) : (
          <div className="w-full h-full bg-muted flex items-center justify-center">
            <Palette className="h-8 w-8 text-muted-foreground" />
          </div>
        )}

        {/* selected overlay */}
        {isSelected && (
          <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
            <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
              <Check className="h-4 w-4 text-primary-foreground" />
            </div>
          </div>
        )}
      </div>

      {/* label */}
      <div className="p-2 bg-background">
        <p className="text-xs font-medium truncate text-center">
          {option.name}
        </p>
        {option.description && (
          <p className="text-[10px] text-muted-foreground truncate text-center mt-0.5">
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
              className="text-[8px] px-1 py-0.5 rounded bg-background/80 backdrop-blur-sm"
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
  const [selectedId, setSelectedId] = useState<string | null>(
    defaultValue || null
  );
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleSelect = useCallback((optionId: string) => {
    setSelectedId(optionId);
  }, []);

  const handleSubmit = useCallback(() => {
    if (selectedId) {
      const selected = options.find((o) => o.id === selectedId);
      if (selected) {
        onSubmit({
          id: selected.id,
          name: selected.name,
          colors: selected.colors,
        });
      }
    }
  }, [selectedId, options, onSubmit]);

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
    <div className="w-full space-y-3 p-3 bg-muted/30 rounded-lg border border-border/50">
      {(title || description) && (
        <div className="space-y-1">
          {title && (
            <h4 className="text-sm font-medium flex items-center gap-2">
              <Palette className="h-4 w-4 text-primary" />
              {title}
              {required && <span className="text-destructive">*</span>}
            </h4>
          )}
          {description && (
            <p className="text-xs text-muted-foreground">{description}</p>
          )}
        </div>
      )}

      {/* carousel container */}
      <div className="relative group">
        {/* scroll buttons */}
        <Button
          variant="outline"
          size="icon"
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 h-8 w-8 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={scrollLeft}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <Button
          variant="outline"
          size="icon"
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 h-8 w-8 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={scrollRight}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>

        {/* scrollable area */}
        <ScrollArea className="w-full" ref={scrollRef}>
          <div className="flex gap-3 p-1">
            {options.map((option) => (
              <StyleCard
                key={option.id}
                option={option}
                isSelected={selectedId === option.id}
                onSelect={() => handleSelect(option.id)}
              />
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>

      {/* selected preview */}
      {selectedOption && (
        <div className="p-3 rounded-lg border border-primary/30 bg-primary/5">
          <div className="flex items-center gap-3">
            {selectedOption.colors && selectedOption.colors.length > 0 && (
              <div className="flex gap-1">
                {selectedOption.colors.slice(0, 5).map((color, idx) => (
                  <div
                    key={idx}
                    className="w-5 h-5 rounded-full border border-border/50"
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {selectedOption.name}
              </p>
              {selectedOption.description && (
                <p className="text-xs text-muted-foreground truncate">
                  {selectedOption.description}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* action buttons */}
      <div className="flex gap-2 pt-2 border-t border-border/50">
        <Button
          size="sm"
          onClick={handleSubmit}
          disabled={required && !selectedId}
          className="flex-1"
        >
          <Check className="h-4 w-4 mr-1" />
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
