"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "~/lib/utils";
import { Sparkles } from "lucide-react";
import { Button } from "~/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "~/components/ui/tooltip";
import { AgentHeader } from "./agent-header";
import { AgentChat } from "./agent-chat";
import { AgentInput } from "./agent-input";
import { AgentSuggestions } from "./agent-suggestions";
import { useAgentContext } from "~/hooks/useAgentContext";
import { AgentMessage, Suggestion, AgentPanelProps } from "./types";

const generateId = () => Math.random().toString(36).substring(2, 9);

const welcomeMessage: AgentMessage = {
  id: "welcome",
  role: "assistant",
  content:
    "I can help you create and modify designs on your canvas. Describe what you'd like to do.",
  status: "complete",
  timestamp: Date.now(),
};

const PANEL_WIDTH = 360;

export const AgentPanel = ({ editor, isOpen, onToggle }: AgentPanelProps) => {
  const [messages, setMessages] = useState<AgentMessage[]>([welcomeMessage]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const { context, isAnalyzing } = useAgentContext(editor);

  // only show suggestions when no user messages yet
  const showSuggestions = useMemo(() => {
    const userMessages = messages.filter((m) => m.role === "user");
    return userMessages.length === 0;
  }, [messages]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "i") {
        e.preventDefault();
        onToggle();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onToggle]);

  const handleSuggestionSelect = useCallback((suggestion: Suggestion) => {
    setInputValue(suggestion.prompt);
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: AgentMessage = {
      id: generateId(),
      role: "user",
      content: inputValue.trim(),
      status: "complete",
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    setTimeout(() => {
      const assistantMessage: AgentMessage = {
        id: generateId(),
        role: "assistant",
        content:
          "I understand you want to make changes to your design. This feature is currently being integrated with Gemini 2.5 Flash. Once connected, I'll be able to analyze your canvas, suggest improvements, and make real-time modifications based on your requests.",
        status: "complete",
        timestamp: Date.now(),
        actions: [
          {
            id: generateId(),
            type: "analyze_canvas",
            description: "Analyzing canvas structure",
            status: "complete",
            timestamp: Date.now(),
          },
        ],
      };

      setMessages((prev) => [...prev, assistantMessage]);
      setIsLoading(false);
    }, 1500);
  }, [inputValue, isLoading]);

  const handleClearHistory = useCallback(() => {
    setMessages([welcomeMessage]);
  }, []);

  return (
    <>
      <AnimatePresence mode="wait">
        {!isOpen && (
          <motion.div
            key="toggle-button"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.15 }}
            className="absolute top-4 right-4 z-50"
          >
            <TooltipProvider delayDuration={300}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={onToggle}
                    size="icon"
                    variant="outline"
                    className={cn(
                      "h-10 w-10 rounded-xl",
                      "border-border bg-card/95 shadow-lg backdrop-blur-sm",
                      "hover:border-primary/40 hover:bg-card",
                    )}
                  >
                    <Sparkles className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="left" variant="outline">
                  <span>AI Agent</span>
                  <kbd className="bg-muted text-muted-foreground ml-2 rounded px-1.5 py-0.5 text-[10px]">
                    Ctrl+I
                  </kbd>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {isOpen && (
          <motion.aside
            key="panel"
            initial={{ width: 0 }}
            animate={{ width: PANEL_WIDTH }}
            exit={{ width: 0 }}
            transition={{
              duration: 0.2,
              ease: [0.4, 0, 0.2, 1],
            }}
            className="relative h-full shrink-0 overflow-hidden"
          >
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{
                duration: 0.2,
                delay: 0.05,
              }}
              className={cn(
                "absolute inset-0 flex flex-col",
                "border-border bg-card border-l",
              )}
              style={{ width: PANEL_WIDTH }}
            >
              <AgentHeader
                onClose={onToggle}
                onClearHistory={handleClearHistory}
                messageCount={messages.filter((m) => m.role === "user").length}
              />

              <div className="flex min-h-0 flex-1 flex-col">
                <AgentChat messages={messages} isLoading={isLoading} />

                {showSuggestions && (
                  <AgentSuggestions
                    suggestions={[]}
                    onSelect={handleSuggestionSelect}
                    context={context}
                  />
                )}

                <AgentInput
                  value={inputValue}
                  onChange={setInputValue}
                  onSubmit={handleSubmit}
                  isLoading={isLoading}
                  disabled={!editor}
                />
              </div>
            </motion.div>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
};
