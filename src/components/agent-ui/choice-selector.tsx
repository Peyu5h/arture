"use client";

import { useState, useCallback } from "react";
import { Check, X, List } from "lucide-react";
import { cn } from "~/lib/utils";
import { Button } from "~/components/ui/button";
import type { ChoiceSelectorProps, ChoiceOption } from "./types";

interface OptionCardProps {
  option: ChoiceOption;
  isSelected: boolean;
  onToggle: () => void;
  multiple: boolean;
}

function OptionCard({ option, isSelected, onToggle, multiple }: OptionCardProps) {
  return (
    <button
      type="button"
      disabled={option.disabled}
      onClick={onToggle}
      className={cn(
        "relative w-full p-3 rounded-lg border text-left transition-all",
        isSelected
          ? "border-primary bg-primary/5 ring-1 ring-primary"
          : "border-border hover:border-primary/50 hover:bg-muted/50",
        option.disabled && "opacity-50 cursor-not-allowed"
      )}
    >
      <div className="flex items-start gap-3">
        {/* checkbox/radio indicator */}
        <div
          className={cn(
            "mt-0.5 shrink-0 w-4 h-4 border flex items-center justify-center transition-colors",
            multiple ? "rounded" : "rounded-full",
            isSelected
              ? "bg-primary border-primary"
              : "border-muted-foreground/50"
          )}
        >
          {isSelected && (
            <Check className="h-3 w-3 text-primary-foreground" />
          )}
        </div>

        {/* option content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            {option.icon && (
              <span className="text-base">{option.icon}</span>
            )}
            <span className="text-sm font-medium">{option.label}</span>
          </div>
          {option.description && (
            <p className="text-xs text-muted-foreground mt-0.5">
              {option.description}
            </p>
          )}
        </div>

        {/* option image */}
        {option.image && (
          <img
            src={option.image}
            alt={option.label}
            className="w-10 h-10 rounded-md object-cover shrink-0"
          />
        )}
      </div>
    </button>
  );
}

export function AgentChoiceSelector({
  id,
  title,
  description,
  required,
  options,
  multiple = false,
  defaultValue,
  columns = 1,
  onSubmit,
  onCancel,
}: ChoiceSelectorProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>(() => {
    if (!defaultValue) return [];
    if (Array.isArray(defaultValue)) return defaultValue;
    return [defaultValue];
  });

  const handleToggle = useCallback(
    (optionId: string) => {
      setSelectedIds((prev) => {
        if (multiple) {
          // toggle for multi-select
          if (prev.includes(optionId)) {
            return prev.filter((id) => id !== optionId);
          }
          return [...prev, optionId];
        } else {
          // single select
          return [optionId];
        }
      });
    },
    [multiple]
  );

  const handleSubmit = useCallback(() => {
    if (multiple) {
      onSubmit(selectedIds);
    } else {
      onSubmit(selectedIds[0] || null);
    }
  }, [selectedIds, multiple, onSubmit]);

  const handleCancel = useCallback(() => {
    onCancel?.();
  }, [onCancel]);

  const isValid = !required || selectedIds.length > 0;

  const gridClass =
    columns === 2
      ? "grid-cols-2"
      : columns === 3
        ? "grid-cols-3"
        : columns === 4
          ? "grid-cols-4"
          : "grid-cols-1";

  return (
    <div className="w-full space-y-3 p-3 bg-muted/30 rounded-lg border border-border/50">
      {(title || description) && (
        <div className="space-y-1">
          {title && (
            <h4 className="text-sm font-medium flex items-center gap-2">
              <List className="h-4 w-4 text-primary" />
              {title}
              {required && <span className="text-destructive">*</span>}
            </h4>
          )}
          {description && (
            <p className="text-xs text-muted-foreground">{description}</p>
          )}
        </div>
      )}

      {/* options grid */}
      <div className={cn("grid gap-2", gridClass)}>
        {options.map((option) => (
          <OptionCard
            key={option.id}
            option={option}
            isSelected={selectedIds.includes(option.id)}
            onToggle={() => handleToggle(option.id)}
            multiple={multiple}
          />
        ))}
      </div>

      {/* selected count for multi-select */}
      {multiple && selectedIds.length > 0 && (
        <p className="text-xs text-muted-foreground">
          {selectedIds.length} option{selectedIds.length > 1 ? "s" : ""} selected
        </p>
      )}

      {/* action buttons */}
      <div className="flex gap-2 pt-2 border-t border-border/50">
        <Button
          size="sm"
          onClick={handleSubmit}
          disabled={!isValid}
          className="flex-1"
        >
          <Check className="h-4 w-4 mr-1" />
          Confirm
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

export default AgentChoiceSelector;
