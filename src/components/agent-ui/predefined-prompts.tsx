"use client";

import { memo, useState } from "react";
import { motion } from "framer-motion";
import { Flame, Dumbbell, ArrowRight, Sparkles } from "lucide-react";
import { cn } from "~/lib/utils";
import type { PredefinedPrompt } from "~/lib/ai/demos";

const PROMPT_ICONS: Record<string, React.ReactNode> = {
  "flame-kindling": <Flame className="h-5 w-5" />,
  dumbbell: <Dumbbell className="h-5 w-5" />,
};

function getPromptIcon(icon: string) {
  return PROMPT_ICONS[icon] || <Sparkles className="h-5 w-5" />;
}

interface PredefinedPromptsProps {
  prompts: PredefinedPrompt[];
  onSelect: (prompt: PredefinedPrompt) => void;
  className?: string;
}

const PromptCard = memo(function PromptCard({
  prompt,
  onSelect,
  index,
}: {
  prompt: PredefinedPrompt;
  onSelect: (p: PredefinedPrompt) => void;
  index: number;
}) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.1 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onSelect(prompt)}
      className={cn(
        "group relative w-full overflow-hidden rounded-xl border text-left transition-all duration-300",
        "border-border/50 hover:border-border hover:shadow-lg",
        "bg-card/60 backdrop-blur-sm",
      )}
    >
      {/* gradient accent bar */}
      <div
        className="absolute inset-x-0 top-0 h-[2px] opacity-60 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background: `linear-gradient(90deg, ${prompt.gradient[0]}, ${prompt.gradient[1]})`,
        }}
      />

      {/* subtle gradient bg on hover */}
      <motion.div
        className="pointer-events-none absolute inset-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: isHovered ? 0.04 : 0 }}
        transition={{ duration: 0.3 }}
        style={{
          background: `linear-gradient(135deg, ${prompt.gradient[0]}, ${prompt.gradient[1]})`,
        }}
      />

      <div className="relative flex items-start gap-3 px-4 py-3.5">
        {/* icon container */}
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition-transform duration-300 group-hover:scale-105"
          style={{
            background: `linear-gradient(135deg, ${prompt.gradient[0]}18, ${prompt.gradient[1]}22)`,
            border: `1px solid ${prompt.gradient[0]}20`,
          }}
        >
          <span
            style={{
              color: prompt.gradient[0],
            }}
          >
            {getPromptIcon(prompt.icon)}
          </span>
        </div>

        {/* text */}
        <div className="min-w-0 flex-1">
          <p className="text-foreground text-sm font-semibold leading-tight">
            {prompt.label}
          </p>
          <p className="text-muted-foreground mt-0.5 line-clamp-2 text-[11px] leading-relaxed">
            {prompt.description}
          </p>
        </div>

        {/* arrow */}
        <div className="mt-1 shrink-0">
          <motion.div
            animate={{ x: isHovered ? 2 : 0, opacity: isHovered ? 1 : 0.3 }}
            transition={{ duration: 0.2 }}
          >
            <ArrowRight
              className="h-4 w-4 transition-colors"
              style={{
                color: isHovered ? prompt.gradient[0] : "hsl(var(--muted-foreground))",
              }}
            />
          </motion.div>
        </div>
      </div>

      {/* prompt preview text */}
      <div className="border-border/30 border-t px-4 py-2">
        <p className="text-muted-foreground/60 truncate text-[10px] italic">
          &ldquo;{prompt.prompt}&rdquo;
        </p>
      </div>
    </motion.button>
  );
});

export const PredefinedPrompts = memo(function PredefinedPrompts({
  prompts,
  onSelect,
  className,
}: PredefinedPromptsProps) {
  if (prompts.length === 0) return null;

  return (
    <div className={cn("w-full space-y-2.5", className)}>
      {/* section header */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex items-center gap-2 px-1"
      >
        <div className="bg-primary/10 flex h-5 w-5 items-center justify-center rounded-md">
          <Sparkles className="text-primary h-3 w-3" />
        </div>
        <p className="text-muted-foreground text-[11px] font-medium">
          Try a demo
        </p>
        <div className="bg-border/40 h-px flex-1" />
      </motion.div>

      {/* prompt cards */}
      <div className="grid gap-2">
        {prompts.map((prompt, idx) => (
          <PromptCard
            key={prompt.id}
            prompt={prompt}
            onSelect={onSelect}
            index={idx}
          />
        ))}
      </div>
    </div>
  );
});

export default PredefinedPrompts;
