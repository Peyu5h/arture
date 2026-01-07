"use client";

import {
  useRef,
  useEffect,
  useState,
  KeyboardEvent,
  useMemo,
  memo,
  useCallback,
  ClipboardEvent,
  DragEvent,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send,
  Square,
  AtSign,
  Type,
  Image as ImageIcon,
  Paperclip,
  MousePointer2,
  X,
  ImagePlus,
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

// image attachment type
export interface ImageAttachment {
  id: string;
  dataUrl: string;
  name: string;
  size: number;
}

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
      return <ImageIcon className="h-3.5 w-3.5" />;
    case "shape":
    case "element":
      return <Square className="h-3.5 w-3.5" />;
    default:
      return <Square className="h-3.5 w-3.5" />;
  }
};

// generates unique id
const generateId = () => Math.random().toString(36).substring(2, 9);

// compresses image to reduce size
async function compressImage(
  dataUrl: string,
  maxWidth = 800,
  quality = 0.7,
): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      let width = img.width;
      let height = img.height;

      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      ctx?.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL("image/jpeg", quality));
    };
    img.src = dataUrl;
  });
}

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
  images?: ImageAttachment[];
  onImagesChange?: (images: ImageAttachment[]) => void;
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
  images = [],
  onImagesChange,
}: ExtendedAgentInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showMentionPopup, setShowMentionPopup] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [cursorPosition, setCursorPosition] = useState(0);
  const [isFocused, setIsFocused] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

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

  // handle image file processing
  const processImageFile = useCallback(
    async (file: File) => {
      if (!file.type.startsWith("image/")) return;
      if (file.size > 10 * 1024 * 1024) {
        console.warn("Image too large, max 10MB");
        return;
      }

      const reader = new FileReader();
      reader.onload = async (e) => {
        const dataUrl = e.target?.result as string;
        const compressed = await compressImage(dataUrl);
        const newImage: ImageAttachment = {
          id: generateId(),
          dataUrl: compressed,
          name: file.name,
          size: file.size,
        };
        onImagesChange?.([...images, newImage]);
      };
      reader.readAsDataURL(file);
    },
    [images, onImagesChange],
  );

  // handle file input change
  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files) {
        Array.from(files).forEach(processImageFile);
      }
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
    [processImageFile],
  );

  // handle paste
  const handlePaste = useCallback(
    (e: ClipboardEvent<HTMLTextAreaElement>) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (const item of Array.from(items)) {
        if (item.type.startsWith("image/")) {
          e.preventDefault();
          const file = item.getAsFile();
          if (file) {
            processImageFile(file);
          }
          break;
        }
      }
    },
    [processImageFile],
  );

  // handle drag and drop
  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);
      const files = e.dataTransfer?.files;
      if (files) {
        Array.from(files).forEach(processImageFile);
      }
    },
    [processImageFile],
  );

  // remove image
  const handleRemoveImage = useCallback(
    (id: string) => {
      onImagesChange?.(images.filter((img) => img.id !== id));
    },
    [images, onImagesChange],
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
    <div
      className={cn(
        "border-border/40 bg-background relative border-t backdrop-blur-sm dark:bg-zinc-900",
        isDragging && "ring-primary ring-2 ring-inset",
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleFileChange}
      />
      <AnimatePresence>
        {showMentionPopup && filteredSuggestions.length > 0 && (
          <motion.div
            ref={popupRef}
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="border-border bg-popover absolute right-3 bottom-full left-3 z-50 mb-2 max-h-[240px] overflow-hidden rounded-xl border shadow-xl"
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
                        ? "bg-accent text-accent-foreground"
                        : "hover:bg-muted",
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
            "bg-muted/40 flex flex-col rounded-2xl dark:bg-zinc-800/60",
            "ring-1 ring-transparent transition-all duration-200",
            isFocused &&
              "bg-muted/60 ring-border/50 dark:bg-zinc-800/80 dark:ring-zinc-700",
          )}
        >
          {/* image attachments display */}
          {images.length > 0 && (
            <div className="flex flex-wrap gap-2 px-3 pt-3">
              {images.map((img) => (
                <div
                  key={img.id}
                  className="group relative h-16 w-16 overflow-hidden rounded-lg"
                >
                  <img
                    src={img.dataUrl}
                    alt={img.name}
                    className="h-full w-full object-cover"
                  />
                  <button
                    onClick={() => handleRemoveImage(img.id)}
                    className="absolute top-1 right-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity group-hover:opacity-100"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

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
              onPaste={handlePaste}
              placeholder={
                isDragging ? "Drop image here..." : "Send message..."
              }
              disabled={disabled || isLoading}
              rows={1}
              className={cn(
                "w-full resize-none border-none bg-transparent text-sm leading-relaxed shadow-none focus-visible:ring-0",
                "placeholder:text-muted-foreground/60",
                "disabled:cursor-not-allowed disabled:opacity-50",
              )}
              style={{ minHeight: "24px", maxHeight: "120px" }}
            />
          </div>

          {/* toolbar at bottom */}
          <div className="border-border/30 flex items-center justify-between px-2 pt-1 pb-2 dark:border-zinc-700/50">
            <div className="flex items-center gap-1">
              <TooltipProvider delayDuration={300}>
                {/* attach image button */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="text-muted-foreground hover:text-foreground h-8 w-8 rounded-lg"
                      disabled={disabled || isLoading}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <ImagePlus className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top" variant="outline">
                    Add image
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
                      <span>Select element</span>
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
                <span className="text-muted-foreground text-[10px]">
                  ~{contextStats.formattedTokens} tokens
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
        <div className="text-muted-foreground/60 mt-1.5 flex items-center justify-center gap-3 text-[10px]">
          <span>
            <kbd className="text-muted-foreground">↵</kbd> send
          </span>
          <span>
            <kbd className="text-muted-foreground">⇧↵</kbd> new line
          </span>
        </div>
      </div>
    </div>
  );
});
