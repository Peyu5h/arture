"use client";

import { useRef, memo } from "react";
import { motion } from "framer-motion";
import { cn } from "~/lib/utils";
import { AgentSuggestionsProps, Suggestion } from "./types";
import { Sparkles, Type, Layout, Palette } from "lucide-react";

const categoryIcons = {
  style: Palette,
  layout: Layout,
  content: Type,
  generate: Sparkles,
};

const defaultSuggestions: Suggestion[] = [
  {
    id: "1",
    label: "Improve Layout",
    prompt: "Improve the layout and alignment of elements",
    category: "layout",
  },
  {
    id: "2",
    label: "Color Scheme",
    prompt: "Suggest a modern color scheme for this design",
    category: "style",
  },
  {
    id: "3",
    label: "Create Poster",
    prompt: "Create a modern poster design",
    category: "generate",
  },
  {
    id: "4",
    label: "Add Headline",
    prompt: "Add an eye-catching headline to the design",
    category: "content",
  },
  {
    id: "5",
    label: "Design Card",
    prompt: "Create a social media card design",
    category: "generate",
  },
];

const getContextualSuggestions = (
  context: AgentSuggestionsProps["context"],
): Suggestion[] => {
  if (!context) return defaultSuggestions;

  const suggestions: Suggestion[] = [];

  if (context.selectedElement) {
    const type = context.selectedElement.type;

    if (type === "textbox" || type === "text" || type === "i-text") {
      suggestions.push(
        {
          id: "ctx-1",
          label: "Style Text",
          prompt: "Improve the styling of the selected text",
          category: "style",
        },
        {
          id: "ctx-2",
          label: "Resize Text",
          prompt: "Make the selected text larger and more prominent",
          category: "style",
        },
      );
    } else if (type === "image") {
      suggestions.push(
        {
          id: "ctx-3",
          label: "Enhance Image",
          prompt: "Enhance the selected image with effects or borders",
          category: "style",
        },
        {
          id: "ctx-4",
          label: "Resize Image",
          prompt: "Resize and position the image better",
          category: "layout",
        },
      );
    } else if (type === "rect" || type === "circle" || type === "triangle") {
      suggestions.push({
        id: "ctx-5",
        label: "Style Shape",
        prompt: "Change the color and style of the selected shape",
        category: "style",
      });
    }
  }

  if (context.elementCount === 0) {
    return defaultSuggestions;
  }

  // add default suggestions to fill
  const remaining = 5 - suggestions.length;
  if (remaining > 0) {
    const filtered = defaultSuggestions.filter(
      (s) => !suggestions.find((existing) => existing.id === s.id),
    );
    suggestions.push(...filtered.slice(0, remaining));
  }

  return suggestions.slice(0, 5);
};

const SuggestionPill = memo(function SuggestionPill({
  suggestion,
  onSelect,
  index,
}: {
  suggestion: Suggestion;
  onSelect: (suggestion: Suggestion) => void;
  index: number;
}) {
  return (
    <motion.button
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: index * 0.05 }}
      onClick={() => onSelect(suggestion)}
      className={cn(
        "group shrink-0 rounded-full px-4 py-2",
        "bg-secondary hover:bg-secondary/80 dark:bg-secondary/60 dark:hover:bg-secondary/80",
        "text-secondary-foreground text-xs font-medium",
        "border-border/30 hover:border-border/50 border",
        "transition-all duration-150",
        "hover:shadow-sm",
        "active:scale-[0.98]",
      )}
    >
      <span>{suggestion.label}</span>
    </motion.button>
  );
});

export const AgentSuggestions = memo(function AgentSuggestions({
  suggestions: customSuggestions,
  onSelect,
  context,
}: AgentSuggestionsProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const suggestions =
    customSuggestions.length > 0
      ? customSuggestions
      : getContextualSuggestions(context);

  return (
    <div className="relative px-4 py-3">
      <div
        ref={scrollRef}
        className="scrollbar-none -mx-1 flex gap-2 overflow-x-auto scroll-smooth px-1 pb-1"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {suggestions.map((suggestion, index) => (
          <SuggestionPill
            key={suggestion.id}
            suggestion={suggestion}
            onSelect={onSelect}
            index={index}
          />
        ))}
      </div>

      {/* fade edges */}
      <div className="from-card pointer-events-none absolute top-0 bottom-0 left-0 w-8 bg-gradient-to-r to-transparent dark:from-zinc-900" />
      <div className="from-card pointer-events-none absolute top-0 right-0 bottom-0 w-8 bg-gradient-to-l to-transparent dark:from-zinc-900" />
    </div>
  );
});
