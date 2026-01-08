"use client";

import { memo, useCallback, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { cn } from "~/lib/utils";
import {
  type UIComponentRequest,
  type UIComponentResponse,
  type UIComponentType,
  getComponent,
  isValidComponentType,
} from "~/components/agent-ui";

export interface AgentUIComponentProps {
  request: UIComponentRequest;
  onSubmit: (response: UIComponentResponse) => void;
  onCancel?: () => void;
  isResolved?: boolean;
  resolvedValue?: unknown;
}

type ComponentState = "pending" | "submitting" | "resolved" | "cancelled";

export const AgentUIComponent = memo(function AgentUIComponent({
  request,
  onSubmit,
  onCancel,
  isResolved = false,
  resolvedValue,
}: AgentUIComponentProps) {
  const [state, setState] = useState<ComponentState>(
    isResolved ? "resolved" : "pending",
  );
  const [submittedValue, setSubmittedValue] = useState<unknown>(resolvedValue);

  const handleSubmit = useCallback(
    (value: unknown) => {
      setState("submitting");
      setSubmittedValue(value);

      const response: UIComponentResponse = {
        requestId: request.id,
        componentType: request.componentType,
        value,
        timestamp: Date.now(),
      };

      // simulate brief delay for visual feedback
      setTimeout(() => {
        onSubmit(response);
        setState("resolved");
      }, 300);
    },
    [request.id, request.componentType, onSubmit],
  );

  const handleCancel = useCallback(() => {
    setState("cancelled");
    onCancel?.();
  }, [onCancel]);

  // validate component type
  if (!isValidComponentType(request.componentType)) {
    return (
      <div className="border-destructive/50 bg-destructive/5 rounded-lg border p-3">
        <p className="text-destructive text-sm">
          Unknown component type: {request.componentType}
        </p>
      </div>
    );
  }

  const registryEntry = getComponent(request.componentType);
  if (!registryEntry) {
    return null;
  }

  const Component = registryEntry.component;

  // build props
  const componentProps = {
    id: request.id,
    componentType: request.componentType,
    ...request.props,
    onSubmit: handleSubmit,
    onCancel: onCancel ? handleCancel : undefined,
  };

  // resolved state display
  if (state === "resolved" || state === "cancelled") {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className={cn(
          "rounded-lg border p-2.5",
          state === "resolved"
            ? "border-primary/20 bg-primary/5"
            : "border-muted bg-muted/20",
        )}
      >
        <div className="flex items-center gap-2">
          {state === "resolved" ? (
            <CheckCircle2 className="text-primary h-3.5 w-3.5 shrink-0" />
          ) : (
            <XCircle className="text-muted-foreground h-3.5 w-3.5 shrink-0" />
          )}
          <span className="text-muted-foreground text-xs">
            {state === "resolved" ? "Response submitted" : "Cancelled"}
          </span>
        </div>
      </motion.div>
    );
  }

  // submitting state
  if (state === "submitting") {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="border-border/50 bg-muted/30 flex items-center justify-center gap-2 rounded-lg border p-4"
      >
        <Loader2 className="text-primary h-4 w-4 animate-spin" />
        <span className="text-muted-foreground text-sm">Submitting...</span>
      </motion.div>
    );
  }

  // pending state - render the component
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={request.id}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.2 }}
      >
        {request.context && (
          <p className="text-muted-foreground mb-2 text-xs italic">
            {request.context}
          </p>
        )}
        <Component {...(componentProps as any)} />
      </motion.div>
    </AnimatePresence>
  );
});

// formats value for display
function formatValue(value: unknown): string {
  if (value === null || value === undefined) {
    return "No value";
  }

  if (typeof value === "string") {
    return value.length > 50 ? value.slice(0, 50) + "..." : value;
  }

  if (typeof value === "number") {
    return String(value);
  }

  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }

  if (Array.isArray(value)) {
    return `${value.length} item${value.length !== 1 ? "s" : ""} selected`;
  }

  if (typeof value === "object") {
    // handle common value shapes
    const obj = value as Record<string, unknown>;
    if (obj.name && typeof obj.name === "string") {
      return obj.name;
    }
    if (obj.label && typeof obj.label === "string") {
      return obj.label;
    }
    return JSON.stringify(value).slice(0, 50) + "...";
  }

  return String(value);
}

export default AgentUIComponent;
