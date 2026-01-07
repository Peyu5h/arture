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
import { AgentHistoryPanel } from "./agent-history-panel";
import { AgentInspectTool } from "./agent-inspect-tool";
import { useAgentContext } from "~/hooks/useAgentContext";
import { useImageAttachments } from "~/hooks/useImageAttachments";
import {
  useConversations,
  useConversation,
  useCreateConversation,
  useCreateMessage,
  useDeleteConversation,
  useAIResponse,
} from "~/hooks/useChat";
import type { ChatMessage } from "~/hooks/useChat";
import {
  calculateContext,
  generateContextSummary,
  extractElementContext,
} from "~/lib/context-calculator";
import {
  AgentMessage,
  Suggestion,
  AgentPanelProps,
  Conversation,
  Mention,
  MentionSuggestion,
  ContextStats,
  ElementReference,
  AgentAction as LocalAgentAction,
} from "./types";
import { executeActions, parseUserMessage, AgentAction } from "~/lib/ai";
import { ImageAttachment } from "./agent-input";

const generateId = () => Math.random().toString(36).substring(2, 9);

const createWelcomeMessage = (): AgentMessage => ({
  id: "welcome",
  role: "assistant",
  content:
    "I can help you create and modify designs on your canvas. Describe what you'd like to do.",
  status: "complete",
  timestamp: Date.now(),
});

const PANEL_WIDTH = 380;

export const AgentPanel = ({
  editor,
  isOpen,
  onToggle,
  projectId,
}: AgentPanelProps) => {
  const [activeConversationId, setActiveConversationId] = useState<
    string | null
  >(null);
  const [messages, setMessages] = useState<AgentMessage[]>([
    createWelcomeMessage(),
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isActiveSession, setIsActiveSession] = useState(false);
  const [pendingMessageIds, setPendingMessageIds] = useState<Set<string>>(
    new Set(),
  );
  const [activeMentions, setActiveMentions] = useState<Mention[]>([]);
  const [mentionSuggestions, setMentionSuggestions] = useState<
    MentionSuggestion[]
  >([]);
  const [showHistory, setShowHistory] = useState(false);
  const [isInspectMode, setIsInspectMode] = useState(false);
  const [contextStats, setContextStats] = useState<ContextStats | null>(null);

  // image attachments with cloudinary upload
  const {
    attachments: attachedImages,
    isUploading: isUploadingImages,
    addAttachment: addImageAttachment,
    addAttachmentFromDataUrl: addImageFromDataUrl,
    removeAttachment: removeImageAttachment,
    uploadAllPending: uploadAllImages,
    clearAll: clearAllImages,
  } = useImageAttachments();

  const { context, isAnalyzing, canvasIndex } = useAgentContext(editor);

  const { data: conversations = [], refetch: refetchConversations } =
    useConversations(projectId);
  const { data: activeConversationData } =
    useConversation(activeConversationId);
  const createConversation = useCreateConversation();
  const createMessage = useCreateMessage();
  const deleteConversation = useDeleteConversation();
  const aiResponse = useAIResponse();

  // load messages when conversation changes - only on initial load, not during active session
  useEffect(() => {
    if (activeConversationData?.messages && !isActiveSession) {
      const msgs = activeConversationData.messages.map((msg: ChatMessage) => {
        const msgContext = msg.context as AgentMessage["context"];
        // extract imageAttachments from context for display
        const imageAttachments = msgContext?.imageAttachments || [];

        return {
          id: msg.id,
          role: msg.role as "user" | "assistant" | "system",
          content: msg.content,
          status: "complete" as const,
          timestamp: msg.timestamp,
          actions: msg.actions as AgentMessage["actions"],
          context: msgContext,
          imageAttachments:
            imageAttachments.length > 0 ? imageAttachments : undefined,
        };
      });
      if (msgs.length > 0) {
        setMessages([createWelcomeMessage(), ...msgs]);
      }
    }
  }, [activeConversationData, isActiveSession]);

  // calculate context stats
  useEffect(() => {
    if (!editor?.canvas) return;

    const elements = editor.canvas
      .getObjects()
      .map((obj: fabric.Object) =>
        extractElementContext(obj as unknown as Record<string, unknown>),
      );

    // serialize mentions data to avoid object issues
    const serializedMentions = activeMentions.map((m) => ({
      type: m.type,
      label: m.label,
      data: m.data ? JSON.stringify(m.data) : undefined,
    }));

    const stats = calculateContext({
      elements,
      messages: messages.map((m) => ({ content: m.content, role: m.role })),
      mentions: serializedMentions.map((m) => ({
        type: m.type,
        label: m.label,
        data: m.data,
      })),
      canvasBackground: context?.backgroundColor,
      canvasSize: context?.canvasSize,
    });

    setContextStats(stats);
  }, [editor, messages, activeMentions, context]);

  const activeConversation = useMemo(() => {
    return conversations.find(
      (c: Conversation) => c.id === activeConversationId,
    );
  }, [conversations, activeConversationId]);

  // only show suggestions when no user messages yet
  const showSuggestions = useMemo(() => {
    const userMessages = messages.filter((m) => m.role === "user");
    return userMessages.length === 0;
  }, [messages]);

  // keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "i" && !e.shiftKey) {
        e.preventDefault();
        onToggle();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "h" && !e.shiftKey) {
        e.preventDefault();
        if (isOpen) {
          setShowHistory((prev) => !prev);
        }
      }
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === "I") {
        e.preventDefault();
        if (isOpen) {
          setIsInspectMode((prev) => !prev);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onToggle, isOpen]);

  const handleNewChat = useCallback(async () => {
    try {
      const result = await createConversation.mutateAsync({
        projectId,
      });
      setActiveConversationId(result.id);
      setMessages([createWelcomeMessage()]);
      setActiveMentions([]);
      setShowHistory(false);
      setIsActiveSession(false);
      setPendingMessageIds(new Set());
      refetchConversations();
    } catch (error) {
      console.error("Failed to create conversation:", error);
      // fallback to local state
      setActiveConversationId(null);
      setMessages([createWelcomeMessage()]);
      setActiveMentions([]);
      setShowHistory(false);
      setIsActiveSession(false);
      setPendingMessageIds(new Set());
    }
  }, [projectId, createConversation, refetchConversations]);

  const handleSelectConversation = useCallback((id: string) => {
    setActiveConversationId(id);
    setShowHistory(false);
    setIsActiveSession(false);
    setPendingMessageIds(new Set());
  }, []);

  const handleDeleteConversation = useCallback(
    async (id: string) => {
      try {
        await deleteConversation.mutateAsync(id);
        if (activeConversationId === id) {
          setActiveConversationId(null);
          setMessages([createWelcomeMessage()]);
        }
        refetchConversations();
      } catch (error) {
        console.error("Failed to delete conversation:", error);
      }
    },
    [activeConversationId, deleteConversation, refetchConversations],
  );

  const handleShowHistory = useCallback(() => {
    setShowHistory((prev) => !prev);
  }, []);

  const handleSuggestionSelect = useCallback((suggestion: Suggestion) => {
    setInputValue(suggestion.prompt);
  }, []);

  const handleMentionSelect = useCallback((mention: MentionSuggestion) => {
    const newMention: Mention = {
      id: mention.id,
      type: mention.type,
      label: mention.label,
      data: mention.data,
      elementRef: mention.elementRef,
      isOnCanvas: mention.elementRef?.isOnCanvas ?? false,
    };
    setActiveMentions((prev) => {
      if (prev.find((m) => m.id === mention.id)) return prev;
      return [...prev, newMention];
    });
  }, []);

  const handleInspectElementSelect = useCallback(
    (element: ElementReference) => {
      const mention: Mention = {
        id: element.id,
        type:
          element.type === "textbox" ||
          element.type === "text" ||
          element.type === "i-text"
            ? "text"
            : element.type === "image"
              ? "image"
              : "shape",
        label: element.name,
        elementRef: element,
        isOnCanvas: true,
      };
      setActiveMentions((prev) => {
        if (prev.find((m) => m.id === element.id)) return prev;
        return [...prev, mention];
      });
      setIsInspectMode(false);
    },
    [],
  );

  // builds element-specific mention suggestions from canvas
  const handleMentionSearch = useCallback(
    (query: string) => {
      if (!editor?.canvas) {
        setMentionSuggestions([]);
        return;
      }

      const suggestions: MentionSuggestion[] = [];
      const objects = editor.canvas.getObjects();
      const lowerQuery = query.toLowerCase();

      objects.forEach((obj: fabric.Object) => {
        const type = obj.type || "unknown";
        let name = "";
        let description = "";
        let thumbnail: string | undefined;
        let text: string | undefined;
        let imageSrc: string | undefined;
        let mentionType: MentionSuggestion["type"] = "element";

        // extract info based on type
        if (type === "textbox" || type === "text" || type === "i-text") {
          const textObj = obj as fabric.Textbox;
          text = textObj.text || "";
          name = text.slice(0, 30) + (text.length > 30 ? "..." : "");
          description = `Text element`;
          mentionType = "text";
        } else if (type === "image") {
          const imgObj = obj as fabric.Image;
          const src = imgObj.getSrc?.() || (obj as any)._element?.src || "";
          imageSrc = src;

          // extract name from url
          const match = src.match(/\/([^/]+)\.(jpg|jpeg|png|gif|webp)/i);
          if (match) {
            name = decodeURIComponent(match[1]).replace(/[-_]/g, " ");
          } else if ((obj as any).name) {
            name = (obj as any).name;
          } else {
            name = "Image";
          }
          description = "Image element";
          mentionType = "image";

          // generate thumbnail
          try {
            thumbnail = obj.toDataURL?.({
              format: "png",
              quality: 0.3,
              multiplier: 0.15,
            });
          } catch {
            // ignore thumbnail errors
          }
        } else if (type === "rect") {
          name = "Rectangle";
          const fillStr =
            typeof obj.fill === "string"
              ? obj.fill
              : obj.fill
                ? "gradient"
                : "filled";
          description = `Shape - ${fillStr}`;
          mentionType = "shape";
        } else if (type === "circle") {
          name = "Circle";
          const fillStr =
            typeof obj.fill === "string"
              ? obj.fill
              : obj.fill
                ? "gradient"
                : "filled";
          description = `Shape - ${fillStr}`;
          mentionType = "shape";
        } else if (type === "triangle") {
          name = "Triangle";
          const fillStr =
            typeof obj.fill === "string"
              ? obj.fill
              : obj.fill
                ? "gradient"
                : "filled";
          description = `Shape - ${fillStr}`;
          mentionType = "shape";
        } else {
          name = (obj as any).name || type;
          description = `${type} element`;
          mentionType = "shape";
        }

        // filter by query
        if (!query || name.toLowerCase().includes(lowerQuery)) {
          const elementRef: ElementReference = {
            id: (obj as any).id || generateId(),
            type,
            name,
            text,
            imageSrc,
            thumbnail,
            fill:
              typeof obj.fill === "string"
                ? obj.fill
                : obj.fill
                  ? "gradient"
                  : undefined,
            isOnCanvas: true,
          };

          suggestions.push({
            id: elementRef.id,
            type: mentionType,
            label: name,
            description,
            thumbnail,
            elementRef,
          });
        }
      });

      // add canvas background option
      if (
        !query ||
        "canvas".includes(lowerQuery) ||
        "background".includes(lowerQuery)
      ) {
        const bgDescription =
          typeof context?.backgroundColor === "string"
            ? context.backgroundColor
            : "Background color";
        suggestions.push({
          id: "canvas-bg",
          type: "canvas",
          label: "Canvas Background",
          description: bgDescription,
          icon: "palette",
        });
      }

      setMentionSuggestions(suggestions);
    },
    [editor, context],
  );

  const handleSubmit = useCallback(async () => {
    if (!inputValue.trim() || isLoading || isUploadingImages) return;

    // upload any pending images to cloudinary first
    let uploadedImages: typeof attachedImages = [];
    if (attachedImages.length > 0) {
      try {
        uploadedImages = await uploadAllImages();
      } catch (error) {
        console.error("Failed to upload images:", error);
      }
    }

    // generate context summary if no specific mentions
    let contextSummary: string | undefined;
    if (activeMentions.length === 0 && editor?.canvas && context) {
      const elements = editor.canvas
        .getObjects()
        .map((obj: fabric.Object) =>
          extractElementContext(obj as unknown as Record<string, unknown>),
        );
      contextSummary = generateContextSummary(
        elements,
        context.canvasSize,
        context.backgroundColor,
      );
    }

    // build image attachment refs for display in message
    const messageImageAttachments = uploadedImages
      .filter((img) => img.cloudinaryUrl || img.dataUrl)
      .map((img) => ({
        id: img.id,
        name: img.name,
        url: img.cloudinaryUrl,
        thumbnail: img.thumbnail,
        dataUrl: img.dataUrl,
      }));

    const userMessageId = generateId();
    const userMessage: AgentMessage = {
      id: userMessageId,
      role: "user",
      content: inputValue.trim(),
      status: "complete",
      timestamp: Date.now(),
      mentions: activeMentions.length > 0 ? [...activeMentions] : undefined,
      imageAttachments:
        messageImageAttachments.length > 0
          ? messageImageAttachments
          : undefined,
      context:
        activeMentions.length > 0
          ? {
              elements: activeMentions
                .filter((m) => m.elementRef)
                .map((m) => ({
                  id: m.id,
                  type: m.type,
                  name: m.label,
                  text: m.elementRef?.text,
                  imageSrc: m.elementRef?.imageSrc,
                })),
              imageAttachments:
                messageImageAttachments.length > 0
                  ? messageImageAttachments
                  : undefined,
            }
          : contextSummary
            ? {
                summary: contextSummary,
                imageAttachments:
                  messageImageAttachments.length > 0
                    ? messageImageAttachments
                    : undefined,
              }
            : messageImageAttachments.length > 0
              ? { imageAttachments: messageImageAttachments }
              : undefined,
    };

    // mark session as active to prevent DB reload overwriting
    setIsActiveSession(true);
    setPendingMessageIds((prev) => new Set(prev).add(userMessageId));
    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setActiveMentions([]);
    clearAllImages();
    setIsLoading(true);

    // ensure we have an active conversation
    let convId = activeConversationId;
    if (!convId) {
      try {
        const result = await createConversation.mutateAsync({
          title:
            inputValue.slice(0, 50) + (inputValue.length > 50 ? "..." : ""),
          projectId,
        });
        convId = result.id;
        setActiveConversationId(convId);
        refetchConversations();
      } catch (error) {
        console.error("Failed to create conversation:", error);
      }
    }

    // save user message to db with image attachments in context
    if (convId) {
      try {
        // ensure imageAttachments are included in context for persistence
        const messageContext = {
          ...userMessage.context,
          imageAttachments:
            messageImageAttachments.length > 0
              ? messageImageAttachments
              : undefined,
        };

        await createMessage.mutateAsync({
          conversationId: convId,
          role: "USER",
          content: userMessage.content,
          context: messageContext,
        });
      } catch (error) {
        console.error("Failed to save message:", error);
      }
    }

    // get ai response from gemini
    try {
      // build context for AI
      const aiContext: {
        elements?: Array<Record<string, unknown>>;
        canvasSize?: { width: number; height: number };
        backgroundColor?: string;
        summary?: string;
        selectedElementIds?: string[];
      } = {};

      if (context?.canvasSize) {
        aiContext.canvasSize = context.canvasSize;
      }
      if (context?.backgroundColor) {
        aiContext.backgroundColor =
          typeof context.backgroundColor === "string"
            ? context.backgroundColor
            : "gradient";
      }
      if (contextSummary) {
        aiContext.summary = contextSummary;
      }
      if (editor?.canvas) {
        const canvasElements = editor.canvas
          .getObjects()
          .map((obj: fabric.Object) =>
            extractElementContext(obj as unknown as Record<string, unknown>),
          );
        aiContext.elements = canvasElements;

        // capture selected element IDs for context
        const activeObjects = editor.canvas.getActiveObjects();
        if (activeObjects && activeObjects.length > 0) {
          aiContext.selectedElementIds = activeObjects
            .map((obj: fabric.Object) => (obj as unknown as { id?: string }).id)
            .filter(Boolean) as string[];
        }
      }

      // build conversation history
      const conversationHistory = messages
        .filter((m) => m.role !== "system" && m.id !== "welcome")
        .slice(-6)
        .map((m) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        }));

      // parse user message for direct actions (but don't execute clarification requests)
      const userActions = parseUserMessage(userMessage.content);
      const hasAskClarification = userActions.some(
        (a) => a.type === "ask_clarification",
      );

      // prepare image attachments for AI
      const imageAttachments = uploadedImages
        .filter((img) => img.cloudinaryUrl || img.dataUrl)
        .map((img) => ({
          id: img.id,
          name: img.name,
          cloudinaryUrl: img.cloudinaryUrl,
          thumbnail: img.thumbnail,
          dataUrl: img.dataUrl,
        }));

      // get AI response first (it provides feedback)
      const response = await aiResponse.mutateAsync({
        message: userMessage.content,
        context: aiContext,
        conversationHistory,
        canvasIndex: canvasIndex as unknown as Record<string, unknown>,
        imageAttachments,
      });

      console.log("============================:", response); // Added log

      const aiActions = (response as { actions?: AgentAction[] }).actions || [];
      console.log("AI Actions received:", aiActions);

      if (editor?.canvas && !hasAskClarification && aiActions.length > 0) {
        const executableActions = aiActions.filter(
          (a) => a.type !== "ask_clarification",
        );
        if (executableActions.length > 0) {
          try {
            console.log("Executing actions:", executableActions);
            const results = await executeActions(
              editor.canvas,
              executableActions,
            );
            console.log("Action results:", results);
          } catch (actionError) {
            console.error("Action execution failed:", actionError);
          } finally {
            // ensure canvas remains interactive after action execution
            if (editor.canvas) {
              editor.canvas.selection = true;
              editor.canvas.interactive = true;
              editor.canvas.getObjects().forEach((obj: fabric.Object) => {
                const objWithName = obj as fabric.Object & { name?: string };
                if (objWithName.name !== "clip") {
                  obj.selectable = true;
                  obj.evented = true;
                }
              });
              editor.canvas.requestRenderAll();
            }
          }
        }
      }

      const assistantMessageId = generateId();
      const assistantMessage: AgentMessage = {
        id: assistantMessageId,
        role: "assistant",
        content: response.response,
        status: "complete",
        timestamp: Date.now(),
        actions:
          aiActions.length > 0
            ? (aiActions as unknown as LocalAgentAction[])
            : undefined,
      };

      setPendingMessageIds((prev) => new Set(prev).add(assistantMessageId));
      setMessages((prev) => [...prev, assistantMessage]);

      // stop loading immediately after message is displayed
      setIsLoading(false);

      // save assistant message to db (non-blocking)
      if (convId) {
        createMessage
          .mutateAsync({
            conversationId: convId,
            role: "ASSISTANT",
            content: assistantMessage.content,
          })
          .catch((error) => {
            console.error("Failed to save assistant message:", error);
          });
      }
    } catch (error) {
      console.error("AI response error:", error);
      const errorMessage: AgentMessage = {
        id: generateId(),
        role: "assistant",
        content:
          "Sorry, I encountered an issue processing your request. Please try again.",
        status: "error",
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [
    inputValue,
    isLoading,
    isUploadingImages,
    activeMentions,
    activeConversationId,
    projectId,
    createConversation,
    createMessage,
    refetchConversations,
    editor,
    context,
    canvasIndex,
    messages,
    aiResponse,
    attachedImages,
    uploadAllImages,
    clearAllImages,
  ]);

  const handleRemoveMention = useCallback((id: string) => {
    setActiveMentions((prev) => prev.filter((m) => m.id !== id));
  }, []);

  // handle image attachment from agent input
  const handleImagesChange = useCallback(
    (images: ImageAttachment[]) => {
      // convert old format to new format via add
      images.forEach((img) => {
        if (img.dataUrl && !attachedImages.find((a) => a.id === img.id)) {
          addImageFromDataUrl(img.dataUrl, img.name);
        }
      });
    },
    [attachedImages, addImageFromDataUrl],
  );

  // handles position selection from inline position selector
  const handlePositionSelect = useCallback(
    (position: string) => {
      if (!editor?.canvas) return;

      // import and use moveElement directly
      import("~/lib/ai").then(({ moveElement }) => {
        const success = moveElement(editor.canvas, "selected", position as any);
        if (success) {
          const confirmMessage: AgentMessage = {
            id: generateId(),
            role: "assistant",
            content: `Done! I've moved the element to the ${position.replace("-", " ")}.`,
            status: "complete",
            timestamp: Date.now(),
          };
          setMessages((prev) => [...prev, confirmMessage]);
        }
      });
    },
    [editor],
  );

  const handleClearHistory = useCallback(() => {
    setMessages([createWelcomeMessage()]);
    setActiveMentions([]);
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
                "border-border border-l",
                "bg-card dark:bg-zinc-900",
              )}
              style={{ width: PANEL_WIDTH }}
            >
              <AgentHeader
                onClose={onToggle}
                onNewChat={handleNewChat}
                onShowHistory={handleShowHistory}
                conversationTitle={activeConversation?.title}
                contextStats={contextStats || undefined}
                isHistoryOpen={showHistory}
              />

              <div className="relative flex min-h-0 flex-1 flex-col">
                <AgentChat
                  messages={messages}
                  isLoading={isLoading}
                  onPositionSelect={handlePositionSelect}
                />

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
                  onMentionSelect={handleMentionSelect}
                  isLoading={isLoading}
                  disabled={!editor}
                  mentions={activeMentions}
                  mentionSuggestions={mentionSuggestions}
                  onMentionSearch={handleMentionSearch}
                  contextStats={contextStats || undefined}
                  onInspectToggle={() => setIsInspectMode(!isInspectMode)}
                  isInspectMode={isInspectMode}
                  onRemoveMention={handleRemoveMention}
                  images={attachedImages.map((img) => ({
                    id: img.id,
                    dataUrl: img.dataUrl || img.cloudinaryUrl || "",
                    name: img.name,
                    size: img.size || 0,
                  }))}
                  onImagesChange={handleImagesChange}
                />

                {/* inspect tool overlay - only active when inspect mode is on */}
                <AgentInspectTool
                  editor={editor}
                  isActive={isInspectMode}
                  onToggle={() => setIsInspectMode(!isInspectMode)}
                  onElementSelect={handleInspectElementSelect}
                />

                {/* history panel overlay */}
                <AgentHistoryPanel
                  isOpen={showHistory}
                  onClose={() => setShowHistory(false)}
                  conversations={conversations}
                  activeId={activeConversationId || undefined}
                  onSelect={handleSelectConversation}
                  onDelete={handleDeleteConversation}
                />
              </div>
            </motion.div>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
};
