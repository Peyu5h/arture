"use client";

import {
  useRef,
  useEffect,
  useState,
  KeyboardEvent,
  useMemo,
  memo,
  useCallback,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send,
  Square,
  AtSign,
  Type,
  Image,
  Paperclip,
  MousePointer2,
  X,
} from "lucide-react";
import { cn } from "~/lib/utils";
import { Button } from "~/components/ui/button";
import { ScrollArea } from "~/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "~/components/ui/tooltip";
import { AgentInputProps, MentionSuggestion, Mention } from "./types";
import { Textarea } from "~/components/ui/textarea";

const getMentionIcon = (type: string, thumbnail?: string) => {
  if (thumbnail) {
    return (
      <img
        src={thumbnail}
        alt=""
        className="h-full w-full rounded-md object-cover"
      />
    );
  }

  switch (type) {
    case "text":
      return <Type className="h-3.5 w-3.5" />;
    case "image":
      return <Image className="h-3.5 w-3.5" />;
    case "shape":
    case "element":
      return <Square className="h-3.5 w-3.5" />;
    default:
      return <Square className="h-3.5 w-3.5" />;
  }
};

interface MentionChipProps {
  mention: Mention;
  onRemove: (id: string) => void;
}

const MentionChip = memo(function MentionChip({
  mention,
  onRemove,
}: MentionChipProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium",
        mention.isOnCanvas
          ? "bg-primary/15 text-primary"
          : "bg-muted text-muted-foreground",
      )}
    >
      {mention.elementRef?.thumbnail ? (
        <img
          src={mention.elementRef.thumbnail}
          alt=""
          className="h-4 w-4 rounded object-cover"
        />
      ) : (
        <AtSign className="h-3 w-3" />
      )}
      <span className="max-w-[80px] truncate">{mention.label}</span>
      <button
        onClick={() => onRemove(mention.id)}
        className="hover:bg-primary/20 -mr-0.5 rounded p-0.5 transition-colors"
      >
        <X className="h-3 w-3" />
      </button>
    </span>
  );
});

interface ExtendedAgentInputProps extends AgentInputProps {
  onInspectToggle?: () => void;
  isInspectMode?: boolean;
  onRemoveMention?: (id: string) => void;
}

export const AgentInput = memo(function AgentInput({
  value,
  onChange,
  onSubmit,
  onMentionSelect,
  isLoading,
  disabled,
  mentions = [],
  mentionSuggestions = [],
  onMentionSearch,
  contextStats,
  onInspectToggle,
  isInspectMode,
  onRemoveMention,
}: ExtendedAgentInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const [showMentionPopup, setShowMentionPopup] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [cursorPosition, setCursorPosition] = useState(0);
  const [isFocused, setIsFocused] = useState(false);

  // auto resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "24px";
      const scrollHeight = textarea.scrollHeight;
      textarea.style.height = `${Math.min(scrollHeight, 120)}px`;
    }
  }, [value]);

  // focus on mount
  useEffect(() => {
    if (textareaRef.current && !disabled) {
      textareaRef.current.focus();
    }
  }, [disabled]);

  // detect @ symbol
  useEffect(() => {
    const lastAtIndex = value.lastIndexOf("@", cursorPosition);
    if (lastAtIndex !== -1 && lastAtIndex < cursorPosition) {
      const textAfterAt = value.slice(lastAtIndex + 1, cursorPosition);
      const hasSpace = textAfterAt.includes(" ");
      if (!hasSpace && textAfterAt.length <= 30) {
        setMentionQuery(textAfterAt);
        setShowMentionPopup(true);
        onMentionSearch?.(textAfterAt);
        return;
      }
    }
    setShowMentionPopup(false);
    setMentionQuery("");
  }, [value, cursorPosition, onMentionSearch]);

  // filter suggestions
  const filteredSuggestions = useMemo(() => {
    if (!mentionQuery && mentionSuggestions.length > 0) {
      return mentionSuggestions.slice(0, 6);
    }

    return mentionSuggestions
      .filter(
        (s) =>
          s.label.toLowerCase().includes(mentionQuery.toLowerCase()) ||
          s.description?.toLowerCase().includes(mentionQuery.toLowerCase()),
      )
      .slice(0, 6);
  }, [mentionQuery, mentionSuggestions]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [filteredSuggestions]);

  const handleMentionSelect = useCallback(
    (suggestion: MentionSuggestion) => {
      const lastAtIndex = value.lastIndexOf("@");
      if (lastAtIndex !== -1) {
        const newValue =
          value.slice(0, lastAtIndex) + value.slice(cursorPosition);
        onChange(newValue);
        onMentionSelect?.(suggestion);
      }
      setShowMentionPopup(false);
      setMentionQuery("");
      textareaRef.current?.focus();
    },
    [value, cursorPosition, onChange, onMentionSelect],
  );

  const handleRemoveMention = useCallback(
    (id: string) => {
      onRemoveMention?.(id);
    },
    [onRemoveMention],
  );

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (showMentionPopup && filteredSuggestions.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < filteredSuggestions.length - 1 ? prev + 1 : 0,
        );
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev > 0 ? prev - 1 : filteredSuggestions.length - 1,
        );
        return;
      }
      if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        handleMentionSelect(filteredSuggestions[selectedIndex]);
        return;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        setShowMentionPopup(false);
        return;
      }
    }

    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (value.trim() && !isLoading && !disabled) {
        onSubmit();
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
    setCursorPosition(e.target.selectionStart);
  };

  const handleSelect = (e: React.SyntheticEvent<HTMLTextAreaElement>) => {
    setCursorPosition((e.target as HTMLTextAreaElement).selectionStart);
  };

  const canSubmit = value.trim().length > 0 && !isLoading && !disabled;

  return (
    <div className="border-border/40 bg-background/95 relative border-t backdrop-blur-sm">
      {/* mention popup */}
      <AnimatePresence>
        {showMentionPopup && filteredSuggestions.length > 0 && (
          <motion.div
            ref={popupRef}
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="border-border/50 bg-popover/95 absolute right-3 bottom-full left-3 z-50 mb-2 max-h-[240px] overflow-hidden rounded-xl border shadow-xl backdrop-blur-sm"
          >
            <ScrollArea className="max-h-[240px]">
              <div className="p-1.5">
                {filteredSuggestions.map((suggestion, index) => (
                  <button
                    key={suggestion.id}
                    onClick={() => handleMentionSelect(suggestion)}
                    onMouseEnter={() => setSelectedIndex(index)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors",
                      index === selectedIndex
                        ? "bg-secondary text-secondary-foreground"
                        : "hover:bg-muted/50",
                    )}
                  >
                    <div
                      className={cn(
                        "flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-lg",
                        suggestion.thumbnail
                          ? ""
                          : suggestion.elementRef?.isOnCanvas
                            ? "bg-primary/10 text-primary"
                            : "bg-muted text-muted-foreground",
                      )}
                    >
                      {getMentionIcon(suggestion.type, suggestion.thumbnail)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-sm font-medium">
                          {suggestion.label}
                        </span>
                        {suggestion.elementRef?.isOnCanvas && (
                          <span className="bg-primary/10 text-primary shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-medium">
                            canvas
                          </span>
                        )}
                      </div>
                      {suggestion.description && (
                        <p className="text-muted-foreground truncate text-xs">
                          {suggestion.description}
                        </p>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </ScrollArea>
          </motion.div>
        )}
      </AnimatePresence>

      {/* input container */}
      <div className="p-3">
        <div
          className={cn(
            "bg-secondary/50 flex flex-col rounded-2xl",
            "ring-1 ring-transparent transition-all duration-200",
            isFocused && "bg-secondary/50 ring-border/60",
          )}
        >
          {/* inline mentions display */}
          {mentions.length > 0 && (
            <div className="flex flex-wrap gap-1.5 px-3 pt-3">
              {mentions.map((mention) => (
                <MentionChip
                  key={mention.id}
                  mention={mention}
                  onRemove={handleRemoveMention}
                />
              ))}
            </div>
          )}

          <div className="px-3 py-3">
            <Textarea
              ref={textareaRef}
              value={value}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              onSelect={handleSelect}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder="Send message..."
              disabled={disabled || isLoading}
              rows={1}
              className={cn(
                "w-full resize-none border-none text-sm leading-relaxed shadow-none",
                "placeholder:text-muted-foreground/50",
                "",
                "disabled:cursor-not-allowed disabled:opacity-50",
              )}
              style={{ minHeight: "24px", maxHeight: "120px" }}
            />
          </div>

          {/* toolbar at bottom */}
          <div className="border-border/30 flex items-center justify-between border-t px-2 py-2">
            <div className="flex items-center gap-1">
              <TooltipProvider delayDuration={300}>
                {/* attach/asset button */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="text-muted-foreground hover:text-foreground h-8 w-8 rounded-lg"
                      disabled={disabled || isLoading}
                    >
                      <Paperclip className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top" variant="outline">
                    Attach asset
                  </TooltipContent>
                </Tooltip>

                {/* mention button */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="text-muted-foreground hover:text-foreground h-8 w-8 rounded-lg"
                      onClick={() => {
                        onChange(value + "@");
                        setCursorPosition(value.length + 1);
                        textareaRef.current?.focus();
                      }}
                      disabled={disabled || isLoading}
                    >
                      <AtSign className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top" variant="outline">
                    Mention element
                  </TooltipContent>
                </Tooltip>

                {/* inspect tool */}
                {onInspectToggle && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        type="button"
                        size="icon"
                        variant={isInspectMode ? "default" : "ghost"}
                        className={cn(
                          "h-8 w-8 rounded-lg",
                          isInspectMode
                            ? "bg-primary text-primary-foreground"
                            : "text-muted-foreground hover:text-foreground",
                        )}
                        onClick={onInspectToggle}
                        disabled={disabled || isLoading}
                      >
                        <MousePointer2 className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="top" variant="outline">
                      <span>Select element to add context</span>
                      <kbd className="bg-muted text-muted-foreground ml-2 rounded px-1 py-0.5 text-[10px]">
                        Ctrl+Shift+I
                      </kbd>
                    </TooltipContent>
                  </Tooltip>
                )}
              </TooltipProvider>
            </div>

            <div className="flex items-center gap-2">
              {/* context stats */}
              {contextStats && (
                <span className="text-muted-foreground/50 text-[10px]">
                  ~{contextStats.formattedTokens}
                </span>
              )}

              {/* send button */}
              {isLoading ? (
                <Button
                  size="icon"
                  variant="secondary"
                  className="h-8 w-8 rounded-full"
                >
                  <Square className="h-3.5 w-3.5" fill="currentColor" />
                </Button>
              ) : (
                <motion.div
                  initial={false}
                  animate={{ scale: canSubmit ? 1 : 0.95 }}
                  transition={{ duration: 0.1 }}
                >
                  <Button
                    size="icon"
                    className={cn(
                      "h-8 w-8 rounded-full transition-all",
                      canSubmit
                        ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
                        : "bg-muted text-muted-foreground",
                    )}
                    onClick={onSubmit}
                    disabled={!canSubmit}
                  >
                    <Send className="h-3.5 w-3.5" />
                  </Button>
                </motion.div>
              )}
            </div>
          </div>
        </div>

        {/* footer hints */}
        <div className="text-muted-foreground/40 mt-1.5 flex items-center justify-center gap-3 text-[10px]">
          <span>
            <kbd className="text-muted-foreground/60">↵</kbd> send
          </span>
          <span>
            <kbd className="text-muted-foreground/60">⇧↵</kbd> new line
          </span>
        </div>
      </div>
    </div>
  );
});
