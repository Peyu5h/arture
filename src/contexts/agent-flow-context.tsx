"use client";

import React, {
  createContext,
  useContext,
  useCallback,
  useMemo,
  ReactNode,
} from "react";
import { useAgentFlow, UseAgentFlowReturn } from "~/hooks/useAgentFlow";

interface AgentFlowContextValue extends UseAgentFlowReturn {
  executeWithFlow: <T>(
    operation: () => Promise<T>,
    options?: {
      toolName?: string;
      onStart?: () => void;
      onComplete?: (result: T) => void;
      onError?: (error: Error) => void;
    },
  ) => Promise<T>;
}

const AgentFlowContext = createContext<AgentFlowContextValue | null>(null);

interface AgentFlowProviderProps {
  children: ReactNode;
}

export function AgentFlowProvider({ children }: AgentFlowProviderProps) {
  const flow = useAgentFlow();

  const executeWithFlow = useCallback(
    async <T,>(
      operation: () => Promise<T>,
      options?: {
        toolName?: string;
        onStart?: () => void;
        onComplete?: (result: T) => void;
        onError?: (error: Error) => void;
      },
    ): Promise<T> => {
      const toolName = options?.toolName || "operation";
      const toolId = flow.startTool(toolName);

      options?.onStart?.();
      flow.log(`Starting: ${toolName}`, "action");

      try {
        const result = await operation();
        flow.completeTool(toolId, result);
        flow.log(`Completed: ${toolName}`, "success");
        options?.onComplete?.(result);
        return result;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        flow.completeTool(toolId, undefined, errorMessage);
        flow.log(`Failed: ${toolName} - ${errorMessage}`, "error");
        options?.onError?.(
          error instanceof Error ? error : new Error(errorMessage),
        );
        throw error;
      }
    },
    [flow],
  );

  const value = useMemo<AgentFlowContextValue>(
    () => ({
      ...flow,
      executeWithFlow,
    }),
    [flow, executeWithFlow],
  );

  return (
    <AgentFlowContext.Provider value={value}>
      {children}
    </AgentFlowContext.Provider>
  );
}

export function useAgentFlowContext(): AgentFlowContextValue {
  const context = useContext(AgentFlowContext);
  if (!context) {
    throw new Error(
      "useAgentFlowContext must be used within an AgentFlowProvider",
    );
  }
  return context;
}

export function useAgentFlowOptional(): AgentFlowContextValue | null {
  return useContext(AgentFlowContext);
}
