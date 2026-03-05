"use client";

import { useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Check,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  ScrollText,
  Calendar,
  MapPin,
  Palette,
  Dumbbell,
  BadgePercent,
  Clock,
  House,
  Building2,
  Landmark,
  Warehouse,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import { cn } from "~/lib/utils";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import type { DemoCollectConfig, DemoCollectField } from "~/lib/ai/demos/types";

const GROUP_ICONS: Record<string, React.ReactNode> = {
  "scroll-text": <ScrollText className="h-4 w-4" />,
  calendar: <Calendar className="h-4 w-4" />,
  "map-pin": <MapPin className="h-4 w-4" />,
  palette: <Palette className="h-4 w-4" />,
  dumbbell: <Dumbbell className="h-4 w-4" />,
  "badge-percent": <BadgePercent className="h-4 w-4" />,
  clock: <Clock className="h-4 w-4" />,
  house: <House className="h-4 w-4" />,
  "building-2": <Building2 className="h-4 w-4" />,
  landmark: <Landmark className="h-4 w-4" />,
  warehouse: <Warehouse className="h-4 w-4" />,
};

function getGroupIcon(icon?: string) {
  if (!icon) return <Sparkles className="h-4 w-4" />;
  return GROUP_ICONS[icon] || <Sparkles className="h-4 w-4" />;
}

interface DemoCollectFormProps {
  config: DemoCollectConfig;
  onSubmit: (data: Record<string, unknown>) => void;
  onCancel?: () => void;
  accentColor?: string;
}

function FieldRenderer({
  field,
  value,
  onChange,
}: {
  field: DemoCollectField;
  value: unknown;
  onChange: (val: unknown) => void;
}) {
  switch (field.type) {
    case "text":
      return (
        <div className="space-y-1.5">
          <Label className="text-muted-foreground text-xs font-medium">
            {field.label}
            {field.required && <span className="text-destructive ml-0.5">*</span>}
          </Label>
          <Input
            type="text"
            placeholder={field.placeholder}
            value={(value as string) || ""}
            onChange={(e) => onChange(e.target.value)}
            className="bg-background/60 border-border/60 h-9 text-sm backdrop-blur-sm transition-all focus:border-primary/50 focus:ring-primary/20"
          />
        </div>
      );

    case "date":
      return (
        <div className="space-y-1.5">
          <Label className="text-muted-foreground text-xs font-medium">
            {field.label}
            {field.required && <span className="text-destructive ml-0.5">*</span>}
          </Label>
          <Input
            type="date"
            value={(value as string) || ""}
            onChange={(e) => onChange(e.target.value)}
            className="bg-background/60 border-border/60 h-9 text-sm backdrop-blur-sm transition-all focus:border-primary/50"
          />
        </div>
      );

    case "time":
      return (
        <div className="space-y-1.5">
          <Label className="text-muted-foreground text-xs font-medium">
            {field.label}
          </Label>
          <Input
            type="time"
            value={(value as string) || (field.defaultValue as string) || ""}
            onChange={(e) => onChange(e.target.value)}
            className="bg-background/60 border-border/60 h-9 text-sm backdrop-blur-sm transition-all focus:border-primary/50"
          />
        </div>
      );

    case "select":
      return (
        <div className="space-y-1.5">
          <Label className="text-muted-foreground text-xs font-medium">
            {field.label}
            {field.required && <span className="text-destructive ml-0.5">*</span>}
          </Label>
          <div className="grid grid-cols-2 gap-1.5">
            {field.options?.map((opt) => {
              const isSelected = value === opt.value || (!value && field.defaultValue === opt.value);
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => onChange(opt.value)}
                  className={cn(
                    "flex items-center gap-2 rounded-md border px-2.5 py-2 text-xs font-medium transition-all",
                    isSelected
                      ? "border-primary bg-primary/10 text-primary ring-1 ring-primary/30"
                      : "border-border/60 bg-background/40 text-muted-foreground hover:border-primary/40 hover:bg-primary/5",
                  )}
                >
                  {opt.icon && GROUP_ICONS[opt.icon] && (
                    <span className="shrink-0 opacity-70">
                      {GROUP_ICONS[opt.icon]}
                    </span>
                  )}
                  <span className="truncate">{opt.label}</span>
                  {isSelected && <Check className="ml-auto h-3 w-3 shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      );

    case "toggle":
      const isOn = value !== undefined ? !!value : !!field.defaultValue;
      return (
        <button
          type="button"
          onClick={() => onChange(!isOn)}
          className={cn(
            "flex w-full items-center justify-between rounded-md border px-3 py-2.5 text-xs font-medium transition-all",
            isOn
              ? "border-primary/40 bg-primary/5 text-foreground"
              : "border-border/60 bg-background/40 text-muted-foreground",
          )}
        >
          <span>{field.label}</span>
          {isOn ? (
            <ToggleRight className="h-5 w-5 text-primary" />
          ) : (
            <ToggleLeft className="h-5 w-5 text-muted-foreground/50" />
          )}
        </button>
      );

    default:
      return null;
  }
}

export function DemoCollectForm({
  config,
  onSubmit,
  onCancel,
  accentColor,
}: DemoCollectFormProps) {
  const groups = config.groups || [{ id: "default", label: "Details" }];
  const [activeGroupIndex, setActiveGroupIndex] = useState(0);
  const [formData, setFormData] = useState<Record<string, unknown>>(() => {
    const defaults: Record<string, unknown> = {};
    config.fields.forEach((f) => {
      if (f.defaultValue !== undefined) defaults[f.id] = f.defaultValue;
    });
    return defaults;
  });

  const activeGroup = groups[activeGroupIndex];

  const fieldsByGroup = useMemo(() => {
    const map: Record<string, DemoCollectField[]> = {};
    groups.forEach((g) => {
      map[g.id] = config.fields.filter(
        (f) => (f.group || "default") === g.id,
      );
    });
    return map;
  }, [config.fields, groups]);

  const activeFields = fieldsByGroup[activeGroup.id] || [];
  const isFirst = activeGroupIndex === 0;
  const isLast = activeGroupIndex === groups.length - 1;

  const progress = ((activeGroupIndex + 1) / groups.length) * 100;

  const updateField = useCallback((fieldId: string, value: unknown) => {
    setFormData((prev) => ({ ...prev, [fieldId]: value }));
  }, []);

  const handleNext = useCallback(() => {
    if (isLast) {
      onSubmit(formData);
    } else {
      setActiveGroupIndex((i) => Math.min(i + 1, groups.length - 1));
    }
  }, [isLast, formData, onSubmit, groups.length]);

  const handlePrev = useCallback(() => {
    setActiveGroupIndex((i) => Math.max(i - 1, 0));
  }, []);

  const requiredMet = activeFields
    .filter((f) => f.required)
    .every((f) => {
      const val = formData[f.id];
      return val !== undefined && val !== null && val !== "";
    });

  return (
    <div className="bg-card/80 border-border/50 w-full overflow-hidden rounded-xl border shadow-lg backdrop-blur-md">
      {/* header */}
      <div className="border-border/30 border-b px-4 pb-3 pt-4">
        <div className="mb-3 flex items-center gap-2">
          <div
            className="flex h-7 w-7 items-center justify-center rounded-lg"
            style={{
              background: accentColor
                ? `linear-gradient(135deg, ${accentColor}22, ${accentColor}44)`
                : undefined,
            }}
          >
            <Sparkles
              className="h-3.5 w-3.5"
              style={{ color: accentColor || "hsl(var(--primary))" }}
            />
          </div>
          <div>
            <h3 className="text-foreground text-sm font-semibold">
              {config.title}
            </h3>
            <p className="text-muted-foreground text-[10px]">
              {config.description}
            </p>
          </div>
        </div>

        {/* group tabs */}
        <div className="flex gap-1">
          {groups.map((g, idx) => {
            const isActive = idx === activeGroupIndex;
            const isDone = idx < activeGroupIndex;
            return (
              <button
                key={g.id}
                type="button"
                onClick={() => setActiveGroupIndex(idx)}
                className={cn(
                  "flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[11px] font-medium transition-all",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : isDone
                      ? "text-muted-foreground/70 hover:bg-muted/50"
                      : "text-muted-foreground/40",
                )}
              >
                {isDone ? (
                  <Check className="h-3 w-3 text-emerald-500" />
                ) : (
                  <span className="opacity-60">{getGroupIcon(g.icon)}</span>
                )}
                <span className="hidden sm:inline">{g.label}</span>
              </button>
            );
          })}
        </div>

        {/* progress bar */}
        <div className="bg-muted/50 mt-2 h-0.5 overflow-hidden rounded-full">
          <motion.div
            className="h-full rounded-full"
            style={{
              background: accentColor || "hsl(var(--primary))",
            }}
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          />
        </div>
      </div>

      {/* form body */}
      <div className="relative min-h-[200px] px-4 py-3">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeGroup.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="space-y-3"
          >
            {activeFields.map((field) => (
              <FieldRenderer
                key={field.id}
                field={field}
                value={formData[field.id]}
                onChange={(val) => updateField(field.id, val)}
              />
            ))}

            {activeFields.length === 0 && (
              <p className="text-muted-foreground py-8 text-center text-xs">
                No fields in this section
              </p>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* footer */}
      <div className="border-border/30 flex items-center justify-between border-t px-4 py-3">
        <div className="text-muted-foreground/50 text-[10px]">
          {activeGroupIndex + 1} / {groups.length}
        </div>

        <div className="flex gap-2">
          {onCancel && isFirst && (
            <Button
              size="sm"
              variant="ghost"
              onClick={onCancel}
              className="h-8 text-xs"
            >
              Cancel
            </Button>
          )}

          {!isFirst && (
            <Button
              size="sm"
              variant="ghost"
              onClick={handlePrev}
              className="h-8 text-xs"
            >
              <ChevronLeft className="mr-1 h-3 w-3" />
              Back
            </Button>
          )}

          <Button
            size="sm"
            onClick={handleNext}
            disabled={!requiredMet}
            className="h-8 text-xs"
            style={
              accentColor
                ? {
                    background: accentColor,
                    color: "#fff",
                  }
                : undefined
            }
          >
            {isLast ? (
              <>
                <Sparkles className="mr-1 h-3 w-3" />
                Create Design
              </>
            ) : (
              <>
                Next
                <ChevronRight className="ml-1 h-3 w-3" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default DemoCollectForm;
