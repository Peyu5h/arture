"use client";

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
    label: "Create a poster",
    prompt: "Create a modern poster design",
    category: "generate",
  },
  {
    id: "2",
    label: "Add headline",
    prompt: "Add a bold headline text to the canvas",
    category: "content",
  },
  {
    id: "3",
    label: "Design invitation",
    prompt: "Create an elegant invitation card",
    category: "generate",
  },
  {
    id: "4",
    label: "Social post",
    prompt: "Create an Instagram post template",
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
          label: "Change font",
          prompt: "Change the font style of the selected text",
          category: "style",
        },
        {
          id: "ctx-2",
          label: "Make larger",
          prompt: "Increase the size of the selected text",
          category: "style",
        },
        {
          id: "ctx-3",
          label: "Center text",
          prompt: "Center the selected text on the canvas",
          category: "layout",
        },
      );
    } else if (type === "image") {
      suggestions.push(
        {
          id: "ctx-4",
          label: "Resize",
          prompt: "Resize the selected image to fit better",
          category: "layout",
        },
        {
          id: "ctx-5",
          label: "Add border",
          prompt: "Add a border to the selected image",
          category: "style",
        },
      );
    } else if (type === "rect" || type === "circle" || type === "triangle") {
      suggestions.push(
        {
          id: "ctx-6",
          label: "Change color",
          prompt: "Change the color of the selected shape",
          category: "style",
        },
        {
          id: "ctx-7",
          label: "Duplicate",
          prompt: "Create a copy of this shape",
          category: "layout",
        },
      );
    }
  }

  if (context.elementCount === 0) {
    return defaultSuggestions;
  }

  if (context.elementCount > 0 && suggestions.length < 4) {
    suggestions.push({
      id: "ctx-8",
      label: "Improve layout",
      prompt: "Improve the layout and alignment",
      category: "layout",
    });
  }

  if (context.hasText && suggestions.length < 4) {
    suggestions.push({
      id: "ctx-9",
      label: "Color scheme",
      prompt: "Suggest a better color scheme",
      category: "style",
    });
  }

  const remaining = 4 - suggestions.length;
  if (remaining > 0) {
    const filtered = defaultSuggestions.filter(
      (s) => !suggestions.find((existing) => existing.id === s.id),
    );
    suggestions.push(...filtered.slice(0, remaining));
  }

  return suggestions.slice(0, 4);
};

const SuggestionChip = ({
  suggestion,
  onSelect,
  index,
}: {
  suggestion: Suggestion;
  onSelect: (suggestion: Suggestion) => void;
  index: number;
}) => {
  const Icon = categoryIcons[suggestion.category];

  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.15, delay: index * 0.03 }}
      onClick={() => onSelect(suggestion)}
      className={cn(
        "border-border/60 bg-background flex items-center gap-1.5 rounded-full border px-3 py-1.5",
        "text-muted-foreground text-xs transition-all duration-150",
        "hover:border-primary/40 hover:bg-primary/5 hover:text-foreground",
        "active:scale-95",
      )}
    >
      <Icon className="h-3 w-3" />
      <span>{suggestion.label}</span>
    </motion.button>
  );
};

export const AgentSuggestions = ({
  suggestions: customSuggestions,
  onSelect,
  context,
}: AgentSuggestionsProps) => {
  const suggestions =
    customSuggestions.length > 0
      ? customSuggestions
      : getContextualSuggestions(context);

  return (
    <div className="border-border/60 flex flex-wrap gap-1.5 border-t px-3 py-2.5">
      {suggestions.map((suggestion, index) => (
        <SuggestionChip
          key={suggestion.id}
          suggestion={suggestion}
          onSelect={onSelect}
          index={index}
        />
      ))}
    </div>
  );
};
