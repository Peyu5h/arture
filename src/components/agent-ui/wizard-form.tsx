"use client";

import { useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  Check,
  X,
  Circle,
  CheckCircle2,
  ClipboardList,
} from "lucide-react";
import { cn } from "~/lib/utils";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Textarea } from "~/components/ui/textarea";
import type { WizardFormProps, WizardStep, WizardField } from "./types";

interface FieldRendererProps {
  field: WizardField;
  value: unknown;
  onChange: (value: unknown) => void;
  error?: string;
}

function FieldRenderer({ field, value, onChange, error }: FieldRendererProps) {
  const renderField = () => {
    switch (field.type) {
      case "text":
        return (
          <Input
            id={field.id}
            value={(value as string) || ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder}
            className={cn(error && "border-destructive")}
          />
        );

      case "number":
        return (
          <Input
            id={field.id}
            type="number"
            value={(value as number) ?? ""}
            onChange={(e) => onChange(Number(e.target.value))}
            placeholder={field.placeholder}
            min={field.validation?.min}
            max={field.validation?.max}
            className={cn(error && "border-destructive")}
          />
        );

      case "textarea":
        return (
          <Textarea
            id={field.id}
            value={(value as string) || ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder}
            rows={3}
            className={cn(error && "border-destructive")}
          />
        );

      case "select":
        return (
          <Select
            value={(value as string) || ""}
            onValueChange={(v) => onChange(v)}
          >
            <SelectTrigger className={cn(error && "border-destructive")}>
              <SelectValue placeholder={field.placeholder || "Select..."} />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case "date":
        return (
          <Input
            id={field.id}
            type="date"
            value={(value as string) || ""}
            onChange={(e) => onChange(e.target.value)}
            className={cn(error && "border-destructive")}
          />
        );

      case "color":
        return (
          <div className="flex items-center gap-2">
            <Input
              id={field.id}
              type="color"
              value={(value as string) || "#000000"}
              onChange={(e) => onChange(e.target.value)}
              className="h-10 w-12 cursor-pointer p-1"
            />
            <Input
              value={(value as string) || "#000000"}
              onChange={(e) => onChange(e.target.value)}
              placeholder="#000000"
              className="flex-1"
            />
          </div>
        );

      case "toggle":
        return (
          <button
            type="button"
            onClick={() => onChange(!value)}
            className={cn(
              "relative h-6 w-12 rounded-full transition-colors",
              value ? "bg-primary" : "bg-muted",
            )}
          >
            <span
              className={cn(
                "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform",
                value ? "translate-x-6" : "translate-x-0.5",
              )}
            />
          </button>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-2">
      <Label htmlFor={field.id} className="flex items-center gap-1">
        {field.label}
        {field.required && <span className="text-destructive">*</span>}
      </Label>
      {renderField()}
      {error && <p className="text-destructive text-xs">{error}</p>}
    </div>
  );
}

interface StepIndicatorProps {
  steps: WizardStep[];
  currentIndex: number;
  onStepClick?: (index: number) => void;
}

function StepIndicator({
  steps,
  currentIndex,
  onStepClick,
}: StepIndicatorProps) {
  return (
    <div className="flex items-center justify-center gap-1">
      {steps.map((step, idx) => (
        <button
          key={step.id}
          type="button"
          onClick={() => onStepClick?.(idx)}
          disabled={idx > currentIndex}
          className={cn(
            "flex items-center gap-1 transition-colors",
            idx <= currentIndex
              ? "text-primary cursor-pointer"
              : "text-muted-foreground cursor-not-allowed",
          )}
        >
          {idx < currentIndex ? (
            <CheckCircle2 className="h-4 w-4" />
          ) : idx === currentIndex ? (
            <Circle className="fill-primary h-4 w-4" />
          ) : (
            <Circle className="h-4 w-4" />
          )}
          {idx < steps.length - 1 && (
            <div
              className={cn(
                "h-0.5 w-8 rounded",
                idx < currentIndex ? "bg-primary" : "bg-muted",
              )}
            />
          )}
        </button>
      ))}
    </div>
  );
}

export function AgentWizardForm({
  id,
  title,
  description,
  required,
  steps,
  defaultValues = {},
  onSubmit,
  onCancel,
}: WizardFormProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [values, setValues] = useState<Record<string, unknown>>(defaultValues);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [direction, setDirection] = useState<1 | -1>(1);

  const currentStep = steps[currentStepIndex];
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === steps.length - 1;

  const handleFieldChange = useCallback((fieldId: string, value: unknown) => {
    setValues((prev) => ({ ...prev, [fieldId]: value }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[fieldId];
      return next;
    });
  }, []);

  const validateCurrentStep = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};

    for (const field of currentStep.fields) {
      const value = values[field.id];

      // check required
      if (field.required) {
        if (value === undefined || value === null || value === "") {
          newErrors[field.id] = `${field.label} is required`;
          continue;
        }
      }

      // check validation rules
      if (field.validation && value !== undefined && value !== "") {
        if (
          field.validation.min !== undefined &&
          typeof value === "number" &&
          value < field.validation.min
        ) {
          newErrors[field.id] =
            field.validation.message ||
            `Minimum value is ${field.validation.min}`;
        }
        if (
          field.validation.max !== undefined &&
          typeof value === "number" &&
          value > field.validation.max
        ) {
          newErrors[field.id] =
            field.validation.message ||
            `Maximum value is ${field.validation.max}`;
        }
        if (field.validation.pattern && typeof value === "string") {
          const regex = new RegExp(field.validation.pattern);
          if (!regex.test(value)) {
            newErrors[field.id] = field.validation.message || `Invalid format`;
          }
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [currentStep, values]);

  const handleNext = useCallback(() => {
    if (validateCurrentStep()) {
      if (isLastStep) {
        onSubmit(values);
      } else {
        setDirection(1);
        setCurrentStepIndex((prev) => prev + 1);
      }
    }
  }, [validateCurrentStep, isLastStep, values, onSubmit]);

  const handlePrev = useCallback(() => {
    if (!isFirstStep) {
      setDirection(-1);
      setCurrentStepIndex((prev) => prev - 1);
    }
  }, [isFirstStep]);

  const handleStepClick = useCallback(
    (index: number) => {
      if (index < currentStepIndex) {
        setCurrentStepIndex(index);
      }
    },
    [currentStepIndex],
  );

  const handleCancel = useCallback(() => {
    onCancel?.();
  }, [onCancel]);

  const progress = useMemo(() => {
    return Math.round(((currentStepIndex + 1) / steps.length) * 100);
  }, [currentStepIndex, steps.length]);

  const slideVariants = {
    enter: (dir: number) => ({ x: dir > 0 ? 20 : -20, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir > 0 ? -20 : 20, opacity: 0 }),
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="border-border/40 from-muted/40 to-muted/20 w-full space-y-3 rounded-xl border bg-gradient-to-b p-4 shadow-sm"
    >
      {/* header */}
      {(title || description) && (
        <div className="space-y-1 pb-2">
          {title && (
            <h4 className="text-foreground flex items-center gap-2 text-sm font-semibold">
              <div className="bg-primary/10 flex h-6 w-6 items-center justify-center rounded-md">
                <ClipboardList className="text-primary h-3.5 w-3.5" />
              </div>
              {title}
              {required && <span className="text-destructive">*</span>}
            </h4>
          )}
          {description && (
            <p className="text-muted-foreground pl-8 text-xs">{description}</p>
          )}
        </div>
      )}

      {/* progress bar */}
      <div className="space-y-2">
        <div className="bg-muted h-1 overflow-hidden rounded-full">
          <motion.div
            className="from-primary to-primary/80 h-full rounded-full bg-gradient-to-r"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          />
        </div>
        <StepIndicator
          steps={steps}
          currentIndex={currentStepIndex}
          onStepClick={handleStepClick}
        />
      </div>

      {/* current step with animation */}
      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={currentStepIndex}
          custom={direction}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.2, ease: "easeInOut" }}
          className="space-y-3"
        >
          <div className="border-border/30 border-b pb-2">
            <h5 className="text-foreground text-sm font-medium">
              {currentStep.title}
            </h5>
            {currentStep.description && (
              <p className="text-muted-foreground mt-0.5 text-xs">
                {currentStep.description}
              </p>
            )}
          </div>

          {/* fields */}
          <div className="space-y-3">
            {currentStep.fields.map((field, idx) => (
              <motion.div
                key={field.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <FieldRenderer
                  field={field}
                  value={values[field.id]}
                  onChange={(value) => handleFieldChange(field.id, value)}
                  error={errors[field.id]}
                />
              </motion.div>
            ))}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* navigation */}
      <div className="border-border/30 flex gap-2 border-t pt-3">
        {!isFirstStep && (
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrev}
            className="bg-background/50"
          >
            <ChevronLeft className="mr-1 h-4 w-4" />
            Back
          </Button>
        )}

        <Button
          size="sm"
          onClick={handleNext}
          className="bg-primary hover:bg-primary/90 flex-1"
        >
          {isLastStep ? (
            <>
              <Check className="mr-1 h-4 w-4" />
              Complete
            </>
          ) : (
            <>
              Next
              <ChevronRight className="ml-1 h-4 w-4" />
            </>
          )}
        </Button>

        {onCancel && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCancel}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* step counter */}
      <p className="text-muted-foreground/70 text-center text-[10px]">
        Step {currentStepIndex + 1} of {steps.length}
      </p>
    </motion.div>
  );
}

export default AgentWizardForm;
