"use client";

import { memo, useState, useMemo, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "~/lib/utils";
import {
  ChevronDown,
  ChevronRight,
  Terminal,
  Search,
  Scan,
  Wand2,
  Image,
  Type,
  Square,
  Circle,
  Move,
  Trash2,
  Palette,
  Layers,
  Scissors,
  CheckCircle2,
  AlertCircle,
  Info,
  AlertTriangle,
  Clock,
  Filter,
  X,
} from "lucide-react";

// truncates text to max length
const truncateText = (text: string, maxLength: number = 24): string => {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + "...";
};
import { useAgentFlow } from "~/hooks/useAgentFlow";
import { FlowLogEntry, ToolExecution } from "~/store/agentFlowStore";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { ScrollArea } from "~/components/ui/scroll-area";

// formats timestamp
function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

// formats duration
function formatDuration(startTime: number, endTime?: number): string {
  const end = endTime || Date.now();
  const ms = end - startTime;
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

// maps tool name to icon
const getToolIcon = (toolName: string) => {
  const iconMap: Record<string, typeof Wand2> = {
    spawn_shape: Square,
    add_text: Type,
    add_circle: Circle,
    move_element: Move,
    delete_element: Trash2,
    modify_element: Palette,
    resize_element: Square,
    change_layer_order: Layers,
    search_images: Search,
    add_image_to_canvas: Image,
    remove_background: Scissors,
    change_canvas_background: Palette,
  };
  return iconMap[toolName] || Wand2;
};

// log level icon
const LogLevelIcon = memo(function LogLevelIcon({
  level,
}: {
  level: FlowLogEntry["level"];
}) {
  switch (level) {
    case "info":
      return <Info className="h-3 w-3 text-blue-500" />;
    case "action":
      return <Wand2 className="text-primary h-3 w-3" />;
    case "success":
      return <CheckCircle2 className="h-3 w-3 text-emerald-500" />;
    case "error":
      return <AlertCircle className="text-destructive h-3 w-3" />;
    case "warning":
      return <AlertTriangle className="h-3 w-3 text-amber-500" />;
    default:
      return <Circle className="text-muted-foreground h-3 w-3" />;
  }
});

// single log entry
const LogEntryItem = memo(function LogEntryItem({
  entry,
}: {
  entry: FlowLogEntry;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const hasDetails = !!entry.details;

  return (
    <div className="group">
      <button
        onClick={() => hasDetails && setIsExpanded(!isExpanded)}
        disabled={!hasDetails}
        className={cn(
          "flex w-full items-start gap-2 rounded px-2 py-1 text-left transition-colors",
          hasDetails && "hover:bg-muted/50 cursor-pointer",
          !hasDetails && "cursor-default",
        )}
      >
        <span className="mt-0.5 shrink-0">
          <LogLevelIcon level={entry.level} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="text-foreground truncate text-xs">
            {truncateText(entry.message, 32)}
          </span>
        </span>
        <span className="text-muted-foreground/60 shrink-0 text-[10px]">
          {formatTimestamp(entry.timestamp)}
        </span>
        {hasDetails && (
          <span className="text-muted-foreground/50 shrink-0">
            {isExpanded ? (
              <ChevronDown className="h-3 w-3" />
            ) : (
              <ChevronRight className="h-3 w-3" />
            )}
          </span>
        )}
      </button>
      <AnimatePresence>
        {isExpanded && hasDetails && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="overflow-hidden"
          >
            <div className="border-muted ml-5 border-l-2 py-1 pl-3">
              <pre className="text-muted-foreground font-mono text-[10px] whitespace-pre-wrap">
                {entry.details}
              </pre>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

// tool execution item
const ToolExecutionItem = memo(function ToolExecutionItem({
  tool,
}: {
  tool: ToolExecution;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const Icon = getToolIcon(tool.toolName);
  const hasDetails = tool.input || tool.output || tool.error;

  return (
    <div className="group">
      <button
        onClick={() => hasDetails && setIsExpanded(!isExpanded)}
        disabled={!hasDetails}
        className={cn(
          "flex w-full items-center gap-2 rounded px-2 py-1.5 text-left transition-colors",
          hasDetails && "hover:bg-muted/50 cursor-pointer",
          !hasDetails && "cursor-default",
        )}
      >
        <span
          className={cn(
            "shrink-0",
            tool.status === "active" && "text-primary",
            tool.status === "complete" && "text-emerald-500",
            tool.status === "error" && "text-destructive",
            tool.status === "pending" && "text-muted-foreground",
          )}
        >
          <Icon className="h-3.5 w-3.5" />
        </span>
        <span className="min-w-0 flex-1 truncate">
          <span
            className={cn(
              "truncate text-xs",
              tool.status === "active" && "text-foreground font-medium",
              tool.status === "complete" && "text-foreground",
              tool.status === "error" && "text-destructive",
              tool.status === "pending" && "text-muted-foreground",
            )}
          >
            {truncateText(tool.displayName, 20)}
          </span>
        </span>
        {tool.endTime && (
          <span className="text-muted-foreground/60 shrink-0 text-[10px]">
            {formatDuration(tool.startTime, tool.endTime)}
          </span>
        )}
        {tool.status === "active" && (
          <span className="shrink-0">
            <motion.div
              className="bg-primary h-2 w-2 rounded-full"
              animate={{ scale: [1, 1.2, 1], opacity: [1, 0.7, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
            />
          </span>
        )}
        {hasDetails && (
          <span className="text-muted-foreground/50 shrink-0">
            {isExpanded ? (
              <ChevronDown className="h-3 w-3" />
            ) : (
              <ChevronRight className="h-3 w-3" />
            )}
          </span>
        )}
      </button>
      <AnimatePresence>
        {isExpanded && hasDetails && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="overflow-hidden"
          >
            <div className="border-muted ml-5 space-y-2 border-l-2 py-2 pl-3">
              {tool.input && (
                <div>
                  <p className="text-muted-foreground/70 mb-1 text-[10px] tracking-wider uppercase">
                    Input
                  </p>
                  <pre className="text-muted-foreground bg-muted/30 rounded p-1.5 font-mono text-[10px] whitespace-pre-wrap">
                    {JSON.stringify(tool.input, null, 2)}
                  </pre>
                </div>
              )}
              {tool.output !== undefined && tool.output !== null && (
                <div>
                  <p className="text-muted-foreground/70 mb-1 text-[10px] tracking-wider uppercase">
                    Output
                  </p>
                  <pre className="rounded bg-emerald-500/10 p-1.5 font-mono text-[10px] whitespace-pre-wrap text-emerald-600 dark:text-emerald-400">
                    {typeof tool.output === "string"
                      ? tool.output
                      : JSON.stringify(tool.output, null, 2)}
                  </pre>
                </div>
              )}
              {tool.error && (
                <div>
                  <p className="text-muted-foreground/70 mb-1 text-[10px] tracking-wider uppercase">
                    Error
                  </p>
                  <pre className="text-destructive bg-destructive/10 rounded p-1.5 font-mono text-[10px] whitespace-pre-wrap">
                    {tool.error}
                  </pre>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

interface AgentStepViewerProps {
  className?: string;
  defaultExpanded?: boolean;
  maxHeight?: number;
  showDelay?: number;
}

// main step viewer component
export const AgentStepViewer = memo(function AgentStepViewer({
  className,
  defaultExpanded = false,
  maxHeight = 300,
  showDelay = 50,
}: AgentStepViewerProps) {
  const { logs, toolExecutions, isActive, duration, phase } = useAgentFlow();
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<"all" | "tools" | "logs">(
    "all",
  );
  const [shouldRender, setShouldRender] = useState(false);
  const renderTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // render immediately when active, hide when idle
  useEffect(() => {
    const hasContent = logs.length > 0 || toolExecutions.length > 0;

    // render immediately when flow is active
    if (isActive && !shouldRender) {
      setShouldRender(true);
      return;
    }

    // reset when flow becomes idle
    if (phase === "idle" && !isActive && !hasContent) {
      setShouldRender(false);
      if (renderTimeoutRef.current) {
        clearTimeout(renderTimeoutRef.current);
        renderTimeoutRef.current = null;
      }
      return;
    }

    // show when content arrives
    if (hasContent && !shouldRender) {
      renderTimeoutRef.current = setTimeout(() => {
        setShouldRender(true);
      }, showDelay);
    }

    return () => {
      if (renderTimeoutRef.current) {
        clearTimeout(renderTimeoutRef.current);
      }
    };
  }, [
    logs.length,
    toolExecutions.length,
    isActive,
    showDelay,
    shouldRender,
    phase,
  ]);

  // filter logs based on search
  const filteredLogs = useMemo(() => {
    if (!searchQuery) return logs;
    const query = searchQuery.toLowerCase();
    return logs.filter(
      (log) =>
        log.message.toLowerCase().includes(query) ||
        log.details?.toLowerCase().includes(query),
    );
  }, [logs, searchQuery]);

  // filter tools based on search
  const filteredTools = useMemo(() => {
    if (!searchQuery) return toolExecutions;
    const query = searchQuery.toLowerCase();
    return toolExecutions.filter(
      (tool) =>
        tool.displayName.toLowerCase().includes(query) ||
        tool.toolName.toLowerCase().includes(query),
    );
  }, [toolExecutions, searchQuery]);

  const hasContent = logs.length > 0 || toolExecutions.length > 0;

  const completedToolsCount = toolExecutions.filter(
    (t) => t.status === "complete",
  ).length;
  const totalToolsCount = toolExecutions.length;

  if (!shouldRender || (!hasContent && !isActive)) {
    return null;
  }

  return (
    <div
      className={cn(
        "border-border/50 bg-muted/10 overflow-hidden rounded-lg border dark:bg-zinc-900/30",
        className,
      )}
    >
      {/* header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="hover:bg-muted/30 flex w-full items-center gap-2 overflow-hidden px-3 py-2 text-left transition-colors"
      >
        <Terminal className="text-muted-foreground h-4 w-4 shrink-0" />
        <span className="text-foreground flex-1 truncate text-xs font-medium">
          Steps
        </span>
        {totalToolsCount > 0 && (
          <span className="text-muted-foreground bg-muted shrink-0 rounded-full px-2 py-0.5 text-[10px]">
            {completedToolsCount}/{totalToolsCount}
          </span>
        )}
        {duration !== null && duration > 0 && (
          <span className="text-muted-foreground flex shrink-0 items-center gap-1 text-[10px]">
            <Clock className="h-3 w-3" />
            {duration}s
          </span>
        )}
        <span className="text-muted-foreground shrink-0">
          {isExpanded ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </span>
      </button>

      {/* content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="border-border/30 border-t">
              {/* search and filter bar */}
              <div className="border-border/30 bg-muted/20 flex items-center gap-2 border-b px-3 py-2">
                <div className="relative flex-1">
                  <Search className="text-muted-foreground absolute top-1/2 left-2 h-3 w-3 -translate-y-1/2" />
                  <Input
                    type="text"
                    placeholder="Search steps..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-background/50 h-7 pr-7 pl-7 text-xs"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="text-muted-foreground hover:text-foreground absolute top-1/2 right-2 -translate-y-1/2"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant={activeFilter === "all" ? "secondary" : "ghost"}
                    size="sm"
                    className="h-7 px-2 text-[10px]"
                    onClick={() => setActiveFilter("all")}
                  >
                    All
                  </Button>
                  <Button
                    variant={activeFilter === "tools" ? "secondary" : "ghost"}
                    size="sm"
                    className="h-7 px-2 text-[10px]"
                    onClick={() => setActiveFilter("tools")}
                  >
                    Tools
                  </Button>
                  <Button
                    variant={activeFilter === "logs" ? "secondary" : "ghost"}
                    size="sm"
                    className="h-7 px-2 text-[10px]"
                    onClick={() => setActiveFilter("logs")}
                  >
                    Logs
                  </Button>
                </div>
              </div>

              {/* scrollable content */}
              <ScrollArea style={{ maxHeight }}>
                <div className="space-y-1 p-2">
                  {/* tool executions */}
                  {(activeFilter === "all" || activeFilter === "tools") &&
                    filteredTools.length > 0 && (
                      <div className="mb-2">
                        {activeFilter === "all" && (
                          <p className="text-muted-foreground/70 px-2 py-1 text-[10px] tracking-wider uppercase">
                            Tool Executions
                          </p>
                        )}
                        {filteredTools.map((tool) => (
                          <ToolExecutionItem key={tool.id} tool={tool} />
                        ))}
                      </div>
                    )}

                  {/* log entries */}
                  {(activeFilter === "all" || activeFilter === "logs") &&
                    filteredLogs.length > 0 && (
                      <div>
                        {activeFilter === "all" && filteredTools.length > 0 && (
                          <p className="text-muted-foreground/70 px-2 py-1 text-[10px] tracking-wider uppercase">
                            Logs
                          </p>
                        )}
                        {filteredLogs.map((entry) => (
                          <LogEntryItem key={entry.id} entry={entry} />
                        ))}
                      </div>
                    )}

                  {/* empty state */}
                  {filteredLogs.length === 0 && filteredTools.length === 0 && (
                    <div className="py-8 text-center">
                      <p className="text-muted-foreground text-xs">
                        {searchQuery
                          ? "No matching steps found"
                          : isActive
                            ? "Waiting for actions..."
                            : "No steps recorded"}
                      </p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

// inline compact version for messages
export const InlineStepViewer = memo(function InlineStepViewer({
  tools,
  className,
}: {
  tools: ToolExecution[];
  className?: string;
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (tools.length === 0) return null;

  const completedCount = tools.filter((t) => t.status === "complete").length;
  const hasErrors = tools.some((t) => t.status === "error");

  return (
    <div className={cn("mt-2", className)}>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          "flex items-center gap-2 rounded-md px-2 py-1 text-xs transition-colors",
          "hover:bg-muted/50",
          hasErrors ? "text-destructive" : "text-muted-foreground",
        )}
      >
        <Terminal className="h-3 w-3" />
        <span>
          {completedCount}/{tools.length} actions
        </span>
        {isExpanded ? (
          <ChevronDown className="h-3 w-3" />
        ) : (
          <ChevronRight className="h-3 w-3" />
        )}
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="overflow-hidden"
          >
            <div className="border-muted mt-1 ml-1 space-y-0.5 border-l-2 pl-2">
              {tools.map((tool) => {
                const Icon = getToolIcon(tool.toolName);
                return (
                  <div
                    key={tool.id}
                    className="flex items-center gap-1.5 text-[11px]"
                  >
                    <Icon
                      className={cn(
                        "h-3 w-3",
                        tool.status === "complete" && "text-emerald-500",
                        tool.status === "error" && "text-destructive",
                        tool.status === "active" && "text-primary",
                        tool.status === "pending" && "text-muted-foreground",
                      )}
                    />
                    <span className="text-muted-foreground">
                      {tool.displayName}
                    </span>
                    {tool.endTime && (
                      <span className="text-muted-foreground/50 text-[10px]">
                        ({formatDuration(tool.startTime, tool.endTime)})
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});
