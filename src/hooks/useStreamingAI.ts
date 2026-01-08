import { useState, useCallback, useRef, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import api from "~/lib/api";

export type StreamEventType =
  | "session_start"
  | "chunk"
  | "action"
  | "tool_call"
  | "tool_result"
  | "message"
  | "error"
  | "complete"
  | "heartbeat";

export interface StreamEvent {
  type: StreamEventType;
  id: string;
  sequence: number;
  timestamp: number;
  data: unknown;
}

export interface StreamAction {
  id: string;
  type: string;
  payload: Record<string, unknown>;
  description?: string;
  status: "pending" | "executing" | "complete" | "error";
}

export interface StreamingState {
  isStreaming: boolean;
  sessionId: string | null;
  message: string;
  actions: StreamAction[];
  events: StreamEvent[];
  error: string | null;
  isComplete: boolean;
  model: string | null;
}

export interface StreamingOptions {
  onAction?: (action: StreamAction) => void;
  onMessage?: (message: string, isPartial: boolean) => void;
  onComplete?: (state: StreamingState) => void;
  onError?: (error: string) => void;
  fallbackToRest?: boolean;
  timeout?: number;
}

interface StartSessionResponse {
  sessionId: string;
  state: string;
  createdAt: string;
}

interface AIResponseOutput {
  response: string;
  isConfigured: boolean;
  error?: boolean;
  actions?: Array<{
    id?: string;
    type: string;
    payload: Record<string, unknown>;
    description?: string;
  }>;
  model?: string;
}

interface StreamRequestInput {
  message: string;
  context?: {
    elements?: Array<Record<string, unknown>>;
    canvasSize?: { width: number; height: number };
    backgroundColor?: string;
    summary?: string;
    selectedElementIds?: string[];
  };
  conversationHistory?: Array<{
    role: "user" | "assistant";
    content: string;
  }>;
  imageAttachments?: Array<{
    id: string;
    name: string;
    cloudinaryUrl?: string;
    thumbnail?: string;
    dataUrl?: string;
  }>;
}

const DEFAULT_TIMEOUT = 120000;

export function useStreamingAI(options: StreamingOptions = {}) {
  const {
    onAction,
    onMessage,
    onComplete,
    onError,
    fallbackToRest = true,
    timeout = DEFAULT_TIMEOUT,
  } = options;

  const queryClient = useQueryClient();
  const abortControllerRef = useRef<AbortController | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [state, setState] = useState<StreamingState>({
    isStreaming: false,
    sessionId: null,
    message: "",
    actions: [],
    events: [],
    error: null,
    isComplete: false,
    model: null,
  });

  // cleanup function
  const cleanup = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  // start a streaming session
  const startSession = useCallback(
    async (conversationId?: string, projectId?: string): Promise<string | null> => {
      try {
        const res = await api.post<StartSessionResponse>(
          "/api/streaming/start-session",
          { conversationId, projectId }
        );
        if (res.success && res.data?.sessionId) {
          return res.data.sessionId;
        }
        return null;
      } catch (error) {
        console.error("Failed to start session:", error);
        return null;
      }
    },
    []
  );

  // fallback to rest api
  const fallbackRest = useCallback(
    async (input: StreamRequestInput): Promise<void> => {
      try {
        const res = await api.post<AIResponseOutput>("/api/chat/ai-response", {
          message: input.message,
          context: input.context,
          conversationHistory: input.conversationHistory,
          imageAttachments: input.imageAttachments,
        });

        if (res.success && res.data) {
          const { response, actions, model } = res.data;

          setState((prev) => ({
            ...prev,
            message: response,
            model: model || null,
            isComplete: true,
            isStreaming: false,
          }));

          onMessage?.(response, false);

          if (actions) {
            const mappedActions: StreamAction[] = actions.map((a, i) => ({
              id: a.id || `action_${i}`,
              type: a.type,
              payload: a.payload,
              description: a.description,
              status: "pending" as const,
            }));

            setState((prev) => ({ ...prev, actions: mappedActions }));

            for (const action of mappedActions) {
              onAction?.(action);
            }
          }

          onComplete?.({
            isStreaming: false,
            sessionId: null,
            message: response,
            actions: actions?.map((a, i) => ({
              id: a.id || `action_${i}`,
              type: a.type,
              payload: a.payload,
              description: a.description,
              status: "pending" as const,
            })) || [],
            events: [],
            error: null,
            isComplete: true,
            model: model || null,
          });
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : "REST fallback failed";
        setState((prev) => ({
          ...prev,
          error: errorMsg,
          isStreaming: false,
          isComplete: true,
        }));
        onError?.(errorMsg);
      }
    },
    [onAction, onMessage, onComplete, onError]
  );

  // stream ai response
  const streamResponse = useCallback(
    async (
      input: StreamRequestInput,
      conversationId?: string,
      projectId?: string
    ): Promise<void> => {
      cleanup();

      setState({
        isStreaming: true,
        sessionId: null,
        message: "",
        actions: [],
        events: [],
        error: null,
        isComplete: false,
        model: null,
      });

      // start session
      const sessionId = await startSession(conversationId, projectId);
      if (!sessionId) {
        if (fallbackToRest) {
          console.log("Session start failed, falling back to REST");
          await fallbackRest(input);
          return;
        }
        const errorMsg = "Failed to start streaming session";
        setState((prev) => ({
          ...prev,
          error: errorMsg,
          isStreaming: false,
        }));
        onError?.(errorMsg);
        return;
      }

      setState((prev) => ({ ...prev, sessionId }));

      // set timeout
      timeoutRef.current = setTimeout(() => {
        if (state.isStreaming) {
          cleanup();
          if (fallbackToRest) {
            console.log("Stream timeout, falling back to REST");
            fallbackRest(input);
          } else {
            const errorMsg = "Streaming timeout";
            setState((prev) => ({
              ...prev,
              error: errorMsg,
              isStreaming: false,
            }));
            onError?.(errorMsg);
          }
        }
      }, timeout);

      // create abort controller
      abortControllerRef.current = new AbortController();

      try {
        // use fetch with streaming for SSE
        const response = await fetch("/api/streaming/stream", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            sessionId,
            message: input.message,
            context: input.context,
            conversationHistory: input.conversationHistory,
            imageAttachments: input.imageAttachments,
          }),
          signal: abortControllerRef.current.signal,
          credentials: "include",
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error("No response body");
        }

        const decoder = new TextDecoder();
        let buffer = "";
        let fullMessage = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const data = line.slice(6).trim();
            if (!data || data === "[DONE]") continue;

            try {
              const event: StreamEvent = JSON.parse(data);

              setState((prev) => ({
                ...prev,
                events: [...prev.events, event],
              }));

              switch (event.type) {
                case "message": {
                  const msgData = event.data as {
                    content: string;
                    isPartial: boolean;
                  };
                  if (msgData.isPartial) {
                    fullMessage += msgData.content;
                  } else {
                    fullMessage = msgData.content;
                  }
                  setState((prev) => ({ ...prev, message: fullMessage }));
                  onMessage?.(msgData.content, msgData.isPartial);
                  break;
                }

                case "action": {
                  const action = event.data as StreamAction;
                  setState((prev) => ({
                    ...prev,
                    actions: [...prev.actions, action],
                  }));
                  onAction?.(action);
                  break;
                }

                case "complete": {
                  const completeData = event.data as {
                    success: boolean;
                    model: string;
                    actionsCount: number;
                  };
                  setState((prev) => ({
                    ...prev,
                    isComplete: true,
                    isStreaming: false,
                    model: completeData.model,
                  }));

                  if (timeoutRef.current) {
                    clearTimeout(timeoutRef.current);
                    timeoutRef.current = null;
                  }

                  onComplete?.({
                    isStreaming: false,
                    sessionId,
                    message: fullMessage,
                    actions: [],
                    events: [],
                    error: null,
                    isComplete: true,
                    model: completeData.model,
                  });
                  break;
                }

                case "error": {
                  const errorData = event.data as { message: string };
                  setState((prev) => ({
                    ...prev,
                    error: errorData.message,
                    isStreaming: false,
                  }));
                  onError?.(errorData.message);
                  break;
                }
              }
            } catch {
              // skip malformed events
            }
          }
        }

        // if we finished but didn't get complete event
        setState((prev) => {
          if (!prev.isComplete) {
            return {
              ...prev,
              isComplete: true,
              isStreaming: false,
            };
          }
          return prev;
        });
      } catch (error) {
        if ((error as Error).name === "AbortError") {
          return;
        }

        console.error("Streaming error:", error);

        if (fallbackToRest) {
          console.log("Stream failed, falling back to REST");
          await fallbackRest(input);
        } else {
          const errorMsg = error instanceof Error ? error.message : "Streaming failed";
          setState((prev) => ({
            ...prev,
            error: errorMsg,
            isStreaming: false,
          }));
          onError?.(errorMsg);
        }
      } finally {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
      }
    },
    [
      cleanup,
      startSession,
      fallbackToRest,
      fallbackRest,
      timeout,
      onAction,
      onMessage,
      onComplete,
      onError,
      state.isStreaming,
    ]
  );

  // cancel streaming
  const cancel = useCallback(() => {
    cleanup();
    setState((prev) => ({
      ...prev,
      isStreaming: false,
      isComplete: true,
    }));
  }, [cleanup]);

  // recover session events after refresh
  const recoverSession = useCallback(
    async (sessionId: string): Promise<StreamingState | null> => {
      try {
        const res = await api.get<{
          sessionId: string;
          state: string;
          events: StreamEvent[];
          actions: Array<{
            id: string;
            type: string;
            payload: Record<string, unknown>;
            description?: string;
            status: string;
          }>;
          currentMessage: string;
        }>(`/api/streaming/sessions/${sessionId}`);

        if (res.success && res.data) {
          const recovered: StreamingState = {
            isStreaming: res.data.state === "STREAMING",
            sessionId: res.data.sessionId,
            message: res.data.currentMessage,
            actions: res.data.actions.map((a) => ({
              ...a,
              status: a.status.toLowerCase() as StreamAction["status"],
            })),
            events: res.data.events,
            error: null,
            isComplete: res.data.state === "COMPLETED",
            model: null,
          };

          setState(recovered);
          return recovered;
        }
        return null;
      } catch (error) {
        console.error("Failed to recover session:", error);
        return null;
      }
    },
    []
  );

  return {
    ...state,
    streamResponse,
    cancel,
    recoverSession,
    startSession,
  };
}

export default useStreamingAI;
