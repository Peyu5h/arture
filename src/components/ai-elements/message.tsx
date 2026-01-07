"use client";

import React, { createContext, useContext, useState, memo } from "react";
import { motion } from "framer-motion";
import { cn } from "~/lib/utils";
import { Markdown } from "./markdown";
import {
  File,
  Image as ImageIcon,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "~/components/ui/tooltip";
import { Button } from "~/components/ui/button";

type MessageRole = "user" | "assistant";

interface MessageContextValue {
  from: MessageRole;
}

const MessageContext = createContext<MessageContextValue | null>(null);

function useMessageContext() {
  const context = useContext(MessageContext);
  if (!context) {
    throw new Error("Message components must be used within a Message");
  }
  return context;
}

interface MessageProps {
  from: MessageRole;
  children: React.ReactNode;
  className?: string;
}

export const Message = memo(function Message({
  from,
  children,
  className,
}: MessageProps) {
  return (
    <MessageContext.Provider value={{ from }}>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className={cn(
          "group flex w-full gap-3",
          from === "user" ? "justify-end" : "justify-start",
          className,
        )}
      >
        {from === "assistant" && (
          <div className="bg-primary/10 dark:bg-primary/20 mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg">
            <div className="bg-primary h-2 w-2 rounded-full" />
          </div>
        )}

        <div
          className={cn(
            "flex max-w-[85%] flex-col",
            from === "user" ? "items-end" : "items-start",
          )}
        >
          {children}
        </div>
      </motion.div>
    </MessageContext.Provider>
  );
});

interface MessageContentProps {
  children: React.ReactNode;
  className?: string;
}

export const MessageContent = memo(function MessageContent({
  children,
  className,
}: MessageContentProps) {
  const { from } = useMessageContext();

  return (
    <div
      className={cn(
        "relative",
        from === "user"
          ? "bg-primary text-primary-foreground rounded-2xl rounded-br-md px-4 py-2.5 shadow-sm"
          : "text-foreground",
        className,
      )}
    >
      {children}
    </div>
  );
});

interface MessageResponseProps {
  children: React.ReactNode;
  className?: string;
}

export const MessageResponse = memo(function MessageResponse({
  children,
  className,
}: MessageResponseProps) {
  if (typeof children === "string") {
    return (
      <div className={cn("prose-sm dark:prose-invert", className)}>
        <Markdown>{children}</Markdown>
      </div>
    );
  }
  return <div className={className}>{children}</div>;
});

interface AttachmentData {
  type: "file";
  url: string;
  mediaType?: string;
  filename?: string;
}

interface MessageAttachmentProps {
  data: AttachmentData;
  onRemove?: () => void;
  className?: string;
}

export const MessageAttachment = memo(function MessageAttachment({
  data,
  onRemove,
  className,
}: MessageAttachmentProps) {
  const isImage = data.mediaType?.startsWith("image/");

  if (isImage && data.url) {
    return (
      <div
        className={cn(
          "group border-border/50 relative h-16 w-16 overflow-hidden rounded-lg border",
          className,
        )}
      >
        <img
          src={data.url}
          alt={data.filename || "attachment"}
          className="h-full w-full object-cover"
        />
        {onRemove && (
          <button
            onClick={onRemove}
            className="absolute top-1 right-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity group-hover:opacity-100"
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "bg-muted border-border/50 flex items-center gap-2 rounded-lg border px-3 py-2",
        className,
      )}
    >
      <File className="text-muted-foreground h-4 w-4" />
      <span className="text-foreground max-w-[120px] truncate text-xs font-medium">
        {data.filename || "File"}
      </span>
      {onRemove && (
        <button
          onClick={onRemove}
          className="text-muted-foreground hover:text-foreground ml-auto"
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </div>
  );
});

interface MessageAttachmentsProps {
  children: React.ReactNode;
  className?: string;
}

export const MessageAttachments = memo(function MessageAttachments({
  children,
  className,
}: MessageAttachmentsProps) {
  const { from } = useMessageContext();

  return (
    <div
      className={cn(
        "flex flex-wrap gap-2",
        from === "user" ? "justify-end" : "justify-start",
        className,
      )}
    >
      {children}
    </div>
  );
});

interface MessageToolbarProps {
  children: React.ReactNode;
  className?: string;
}

export const MessageToolbar = memo(function MessageToolbar({
  children,
  className,
}: MessageToolbarProps) {
  return (
    <div
      className={cn(
        "mt-2 flex items-center gap-2 opacity-0 transition-opacity group-hover:opacity-100",
        className,
      )}
    >
      {children}
    </div>
  );
});

interface MessageActionsProps {
  children: React.ReactNode;
  className?: string;
}

export const MessageActions = memo(function MessageActions({
  children,
  className,
}: MessageActionsProps) {
  return (
    <div className={cn("flex items-center gap-0.5", className)}>{children}</div>
  );
});

interface MessageActionProps {
  label: string;
  tooltip?: string;
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
}

export const MessageAction = memo(function MessageAction({
  label,
  tooltip,
  onClick,
  children,
  className,
}: MessageActionProps) {
  const button = (
    <Button
      variant="ghost"
      size="icon"
      className={cn(
        "text-muted-foreground hover:text-foreground h-7 w-7",
        className,
      )}
      onClick={onClick}
      aria-label={label}
    >
      {children}
    </Button>
  );

  if (tooltip) {
    return (
      <TooltipProvider delayDuration={300}>
        <Tooltip>
          <TooltipTrigger asChild>{button}</TooltipTrigger>
          <TooltipContent side="top" variant="outline">
            {tooltip}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return button;
});

interface BranchContextValue {
  currentBranch: number;
  totalBranches: number;
  setCurrentBranch: (index: number) => void;
}

const BranchContext = createContext<BranchContextValue | null>(null);

function useBranchContext() {
  const context = useContext(BranchContext);
  if (!context) {
    throw new Error("Branch components must be used within MessageBranch");
  }
  return context;
}

interface MessageBranchProps {
  defaultBranch?: number;
  children: React.ReactNode;
  className?: string;
}

export const MessageBranch = memo(function MessageBranch({
  defaultBranch = 0,
  children,
  className,
}: MessageBranchProps) {
  const [currentBranch, setCurrentBranch] = useState(defaultBranch);

  let totalBranches = 0;
  React.Children.forEach(children, (child) => {
    if (React.isValidElement(child) && child.type === MessageBranchContent) {
      const props = child.props as { children?: React.ReactNode };
      totalBranches = React.Children.count(props.children);
    }
  });

  return (
    <BranchContext.Provider
      value={{ currentBranch, totalBranches, setCurrentBranch }}
    >
      <div className={cn("flex flex-col", className)}>{children}</div>
    </BranchContext.Provider>
  );
});

interface MessageBranchContentProps {
  children: React.ReactNode;
  className?: string;
}

export const MessageBranchContent = memo(function MessageBranchContent({
  children,
  className,
}: MessageBranchContentProps) {
  const { currentBranch } = useBranchContext();
  const childArray = React.Children.toArray(children);

  return <div className={className}>{childArray[currentBranch]}</div>;
});

interface MessageBranchSelectorProps {
  from?: MessageRole;
  children: React.ReactNode;
  className?: string;
}

export const MessageBranchSelector = memo(function MessageBranchSelector({
  from,
  children,
  className,
}: MessageBranchSelectorProps) {
  const { totalBranches } = useBranchContext();

  if (totalBranches <= 1) return null;

  return (
    <div className={cn("flex items-center gap-1", className)}>{children}</div>
  );
});

export const MessageBranchPrevious = memo(function MessageBranchPrevious({
  className,
}: {
  className?: string;
}) {
  const { currentBranch, setCurrentBranch, totalBranches } = useBranchContext();

  return (
    <Button
      variant="ghost"
      size="icon"
      className={cn("h-6 w-6", className)}
      onClick={() =>
        setCurrentBranch(
          currentBranch > 0 ? currentBranch - 1 : totalBranches - 1,
        )
      }
      aria-label="Previous version"
    >
      <ChevronLeft className="h-3 w-3" />
    </Button>
  );
});

export const MessageBranchNext = memo(function MessageBranchNext({
  className,
}: {
  className?: string;
}) {
  const { currentBranch, setCurrentBranch, totalBranches } = useBranchContext();

  return (
    <Button
      variant="ghost"
      size="icon"
      className={cn("h-6 w-6", className)}
      onClick={() =>
        setCurrentBranch(
          currentBranch < totalBranches - 1 ? currentBranch + 1 : 0,
        )
      }
      aria-label="Next version"
    >
      <ChevronRight className="h-3 w-3" />
    </Button>
  );
});

export const MessageBranchPage = memo(function MessageBranchPage({
  className,
}: {
  className?: string;
}) {
  const { currentBranch, totalBranches } = useBranchContext();

  return (
    <span className={cn("text-muted-foreground text-xs", className)}>
      {currentBranch + 1}/{totalBranches}
    </span>
  );
});
