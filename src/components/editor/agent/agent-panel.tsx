"use client";

import { useState, useCallback, useEffect, useMemo, useRef } from "react";
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
import { useAgentFlow } from "~/hooks/useAgentFlow";
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
  AgentPanelProps,
  Conversation,
  Mention,
  MentionSuggestion,
  ContextStats,
  ElementReference,
  Suggestion,
  AgentAction as LocalAgentAction,
} from "./types";
import { executeActions, AgentAction } from "~/lib/ai";
import type { UIComponentRequest, UIComponentResponse } from "~/lib/ai/types";
import type {
  TemplateGalleryValue,
  DesignRequirements,
} from "~/components/agent-ui/types";
import { ImageAttachment } from "./agent-input";
import api from "~/lib/api";

// constants
const PANEL_WIDTH = 380;
const generateId = () => Math.random().toString(36).substring(2, 9);
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// detect design type from user message
function detectDesignType(
  message: string,
  category?: string,
): "wedding" | "birthday" | "event" | "poster" | "card" | "gym" | "restaurant" | "music" | "tech" | "sports" | "generic" {
  const lowerMsg = message.toLowerCase();

  // gym/fitness keywords
  if (
    lowerMsg.includes("gym") ||
    lowerMsg.includes("fitness") ||
    lowerMsg.includes("workout") ||
    lowerMsg.includes("exercise") ||
    lowerMsg.includes("bodybuilding")
  ) {
    return "gym";
  }
  // restaurant/food keywords
  if (
    lowerMsg.includes("restaurant") ||
    lowerMsg.includes("cafe") ||
    lowerMsg.includes("food") ||
    lowerMsg.includes("menu") ||
    lowerMsg.includes("dining")
  ) {
    return "restaurant";
  }
  // music keywords
  if (
    lowerMsg.includes("music") ||
    lowerMsg.includes("concert") ||
    lowerMsg.includes("band") ||
    lowerMsg.includes("dj") ||
    lowerMsg.includes("album")
  ) {
    return "music";
  }
  // tech/startup keywords
  if (
    lowerMsg.includes("tech") ||
    lowerMsg.includes("startup") ||
    lowerMsg.includes("software") ||
    lowerMsg.includes("app") ||
    lowerMsg.includes("coding")
  ) {
    return "tech";
  }
  // sports keywords
  if (
    lowerMsg.includes("sports") ||
    lowerMsg.includes("basketball") ||
    lowerMsg.includes("football") ||
    lowerMsg.includes("soccer") ||
    lowerMsg.includes("tennis")
  ) {
    return "sports";
  }
  // wedding keywords
  if (
    lowerMsg.includes("wedding") ||
    lowerMsg.includes("marriage") ||
    lowerMsg.includes("bride") ||
    lowerMsg.includes("groom")
  ) {
    return "wedding";
  }
  if (
    lowerMsg.includes("birthday") ||
    lowerMsg.includes("bday") ||
    lowerMsg.includes("birth day")
  ) {
    return "birthday";
  }
  if (
    lowerMsg.includes("poster") ||
    lowerMsg.includes("flyer") ||
    lowerMsg.includes("banner")
  ) {
    return "poster";
  }
  if (
    lowerMsg.includes("greeting card") ||
    lowerMsg.includes("thank you card") ||
    lowerMsg.includes("card")
  ) {
    return "card";
  }
  if (
    lowerMsg.includes("event") ||
    lowerMsg.includes("party") ||
    lowerMsg.includes("celebration") ||
    lowerMsg.includes("gala")
  ) {
    return "event";
  }

  // fallback to category
  if (category === "invitations") {
    return "wedding";
  }

  return "generic";
}

// get default decorative keywords for design type
function getDefaultDecorativeKeywords(designType: string): string {
  switch (designType) {
    case "wedding":
      return "rings, flower, heart, rose, dove";
    case "birthday":
      return "balloon, cake, confetti, gift, party";
    case "event":
      return "star, celebration, ribbon, decoration";
    case "gym":
      return "dumbbell, barbell, fitness, muscle, workout";
    case "restaurant":
      return "fork, plate, chef, food, kitchen";
    case "music":
      return "guitar, music note, headphones, speaker";
    case "tech":
      return "laptop, rocket, lightbulb, code";
    case "sports":
      return "trophy, ball, medal, stadium";
    case "poster":
      return "geometric, abstract, circle, pattern";
    case "card":
      return "elegant borders, floral elements";
    default:
      return "decorative elements, abstract shapes";
  }
}

const createWelcomeMessage = (): AgentMessage => ({
  id: "welcome",
  role: "assistant",
  content:
    "I can help you create and modify designs on your canvas. Describe what you'd like to do.",
  status: "complete",
  timestamp: Date.now(),
});

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

  const [pendingUIComponent, setPendingUIComponent] = useState<{
    messageId: string;
    request: UIComponentRequest;
  } | null>(null);
  const currentRequestIdRef = useRef<string | null>(null);
  const isSubmittingRef = useRef(false);

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

  // agent flow state management
  const {
    startFlow,
    endFlow,
    resetFlow,
    setPhase,
    startTool,
    completeTool,
    setCanvasTarget,
    clearCanvasTargets,
    log,
    setProgress,
  } = useAgentFlow();

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

        // restore mentions from saved context
        const restoredMentions: Mention[] | undefined = msgContext?.mentions
          ? msgContext.mentions.map((m) => ({
              id: m.id,
              type: m.type as Mention["type"],
              label: m.label,
              elementRef: m.elementId
                ? {
                    id: m.elementId,
                    type: m.elementType || "unknown",
                    name: m.label,
                    text: m.text,
                    isOnCanvas: true,
                  }
                : undefined,
              isOnCanvas: !!m.elementId,
            }))
          : undefined;

        return {
          id: msg.id,
          role: msg.role as "user" | "assistant" | "system",
          content: msg.content,
          status: "complete" as const,
          timestamp: msg.timestamp,
          actions: msg.actions as AgentMessage["actions"],
          context: msgContext,
          mentions: restoredMentions,
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
    // reset agent flow state
    resetFlow();

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
  }, [projectId, createConversation, refetchConversations, resetFlow]);

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
    if (
      !inputValue.trim() ||
      isLoading ||
      isUploadingImages ||
      isSubmittingRef.current
    ) {
      return;
    }

    isSubmittingRef.current = true;
    let messageContent = inputValue.trim();

    // build enriched message with @ mention context for the AI
    const mentionContext: string[] = [];
    if (activeMentions.length > 0) {
      for (const mention of activeMentions) {
        if (mention.elementRef) {
          const ref = mention.elementRef;
          let desc = `@${mention.label} (ID: "${ref.id}", Type: ${ref.type}`;
          if (ref.text) desc += `, Text: "${ref.text.slice(0, 30)}"`;
          if (ref.fill) desc += `, Fill: ${ref.fill}`;
          desc += ")";
          mentionContext.push(desc);
        } else if (mention.type === "canvas") {
          mentionContext.push(`@Canvas Background`);
        }
      }
      // append mention info to message so AI knows exactly what elements are referenced
      if (mentionContext.length > 0) {
        messageContent = `${messageContent}\n\n[Referenced elements: ${mentionContext.join(", ")}]`;
      }
    }

    // immediately add user message to chat
    const userMessageId = generateId();
    const userMessage: AgentMessage = {
      id: userMessageId,
      role: "user",
      content: messageContent,
      status: "complete",
      timestamp: Date.now(),
      mentions: activeMentions.length > 0 ? [...activeMentions] : undefined,
    };

    // update UI immediately
    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);
    setIsActiveSession(true);
    setPendingMessageIds((prev) => new Set(prev).add(userMessageId));

    // start flow for visual feedback
    const flowId = `req_${Date.now()}`;
    currentRequestIdRef.current = flowId;
    resetFlow();
    startFlow(flowId);
    setPhase("analyzing", "Analyzing request");
    setProgress(10, "Preparing");

    // upload images if any
    let uploadedImages: typeof attachedImages = [];
    if (attachedImages.length > 0) {
      try {
        setProgress(20, "Uploading images");
        uploadedImages = await uploadAllImages();
      } catch (error) {
        console.error("Failed to upload images:", error);
      }
    }
    clearAllImages();
    // store mentions before clearing for context
    const currentMentions = [...activeMentions];
    setActiveMentions([]);

    // generate context
    let contextSummary: string | undefined;
    if (currentMentions.length === 0 && editor?.canvas && context) {
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

    setProgress(30, "Context ready");

    // ensure conversation exists
    let convId = activeConversationId;
    if (!convId) {
      try {
        const result = await createConversation.mutateAsync({
          title:
            messageContent.slice(0, 50) +
            (messageContent.length > 50 ? "..." : ""),
          projectId,
        });
        convId = result.id;
        setActiveConversationId(convId);
        refetchConversations();
      } catch (error) {
        console.error("Failed to create conversation:", error);
      }
    }

    // save user message to db with mentions
    if (convId) {
      createMessage
        .mutateAsync({
          conversationId: convId,
          role: "USER",
          content: messageContent,
          context: {
            summary: contextSummary,
            mentions: currentMentions.map((m) => ({
              id: m.id,
              type: m.type,
              label: m.label,
              elementId: m.elementRef?.id,
              elementType: m.elementRef?.type,
              text: m.elementRef?.text,
            })),
          },
        })
        .catch(console.error);
    }

    try {
      // phase 2: get AI response
      setPhase("planning", "AI is thinking...");
      setProgress(40, "Waiting for AI");
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

        const activeObjects = editor.canvas.getActiveObjects();
        if (activeObjects && activeObjects.length > 0) {
          aiContext.selectedElementIds = activeObjects
            .map((obj: fabric.Object) => (obj as unknown as { id?: string }).id)
            .filter(Boolean) as string[];
        }

        // include referenced element IDs from @ mentions
        if (currentMentions.length > 0) {
          const mentionedIds = currentMentions
            .filter((m) => m.elementRef?.id)
            .map((m) => m.elementRef!.id);
          if (mentionedIds.length > 0) {
            aiContext.selectedElementIds = [
              ...(aiContext.selectedElementIds || []),
              ...mentionedIds,
            ].filter((id, i, arr) => arr.indexOf(id) === i);
          }
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

      // prepare image attachments
      const imageAttachments = uploadedImages
        .filter((img) => img.cloudinaryUrl || img.dataUrl)
        .map((img) => ({
          id: img.id,
          name: img.name,
          cloudinaryUrl: img.cloudinaryUrl,
          thumbnail: img.thumbnail,
          dataUrl: img.dataUrl,
        }));

      // get AI response
      const response = await aiResponse.mutateAsync({
        message: messageContent,
        context: aiContext,
        conversationHistory,
        canvasIndex: canvasIndex as unknown as Record<string, unknown>,
        imageAttachments,
      });

      setProgress(60, "Processing response");

      const aiActions = (response as { actions?: AgentAction[] }).actions || [];
      const assistantMessageId = generateId();

      // prepare actions with initial pending status for progressive display
      const actionsWithIds = aiActions.map((action) => ({
        ...action,
        id: action.id || generateId(),
        status: "pending" as "pending" | "running" | "complete" | "error",
      }));

      // create assistant message early with pending actions for progressive UI
      const assistantMessage: AgentMessage = {
        id: assistantMessageId,
        role: "assistant",
        content: response.response,
        status: "complete",
        timestamp: Date.now(),
        actions:
          actionsWithIds.length > 0
            ? (actionsWithIds as unknown as LocalAgentAction[])
            : undefined,
        uiComponentRequest: undefined,
      };

      // show message immediately with pending actions
      setPendingMessageIds((prev) => new Set(prev).add(assistantMessageId));
      setMessages((prev) => [...prev, assistantMessage]);

      // execute actions if any - with progressive status updates
      if (editor?.canvas && aiActions.length > 0) {
        setPhase("executing", "Executing actions");
        setProgress(70, `Executing ${aiActions.length} actions`);

        // check for search_templates action - handle specially
        const searchTemplatesAction = aiActions.find(
          (a) => a.type === "search_templates",
        );

        if (searchTemplatesAction) {
          // fetch templates from database
          const payload = searchTemplatesAction.payload as {
            category?: string;
            query?: string;
          };
          setProgress(75, "Searching templates");

          // mark search action as running
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMessageId && msg.actions
                ? {
                    ...msg,
                    actions: msg.actions.map((a) =>
                      a.type === "search_templates"
                        ? { ...a, status: "running" }
                        : a,
                    ),
                  }
                : msg,
            ),
          );

          try {
            const queryParams = new URLSearchParams();
            if (payload.category) queryParams.set("category", payload.category);
            if (payload.query) queryParams.set("q", payload.query);

            const templatesRes = await api.get<
              Array<{
                id: string;
                name: string;
                thumbnailUrl?: string;
                category?: string;
                tags?: string[];
              }>
            >(`/api/templates?${queryParams.toString()}`);

            const templates = templatesRes.data || [];
            console.log("[TEMPLATE_SEARCH]", {
              category: payload.category,
              query: payload.query,
              found: templates.length,
            });

            // show template gallery UI component
            const templateGalleryRequest: UIComponentRequest = {
              id: generateId(),
              componentType:
                "template_gallery" as UIComponentRequest["componentType"],
              props: {
                title: "Choose a Template",
                templates: templates.slice(0, 6).map((t) => ({
                  id: t.id,
                  name: t.name,
                  thumbnail: t.thumbnailUrl,
                  category: t.category,
                  tags: t.tags,
                })),
                category: payload.category,
                query: payload.query,
                allowScratch: true,
                noResultsMessage: `No templates found for "${payload.query || payload.category || "this search"}". You can start from scratch!`,
              },
              followUpPrompt:
                templates.length > 0
                  ? "User selected: {action}"
                  : "User wants to start from scratch",
            };

            // mark search action as complete and update message with template gallery
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === assistantMessageId
                  ? {
                      ...msg,
                      uiComponentRequest: templateGalleryRequest,
                      actions: msg.actions?.map((a) =>
                        a.type === "search_templates"
                          ? { ...a, status: "complete" }
                          : a,
                      ),
                    }
                  : msg,
              ),
            );

            setPendingUIComponent({
              messageId: assistantMessageId,
              request: templateGalleryRequest,
            });

            setProgress(100, "Templates loaded");
            setPhase("completed", "Done");
            endFlow(true);

            // skip normal action execution for template search
            setIsLoading(false);
            isSubmittingRef.current = false;
            return;
          } catch (templateError) {
            console.error("Template search failed:", templateError);
            // fall through to show design wizard
          }
        }

        const executableActions = aiActions.filter(
          (a) =>
            a.type !== "ask_clarification" && a.type !== "search_templates",
        );

        if (executableActions.length > 0) {
          // progressively update action statuses
          for (let i = 0; i < executableActions.length; i++) {
            const action = executableActions[i];
            const actionId = actionsWithIds[i]?.id;
            const actionDescription =
              (action as { description?: string }).description ||
              action.type.replace(/_/g, " ");

            const toolId = startTool(
              action.type,
              action.payload as Record<string, unknown>,
            );

            // update action to running status
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === assistantMessageId && msg.actions
                  ? {
                      ...msg,
                      actions: msg.actions.map((a) =>
                        a.id === actionId ? { ...a, status: "running" } : a,
                      ),
                    }
                  : msg,
              ),
            );

            const progress =
              70 + Math.floor(((i + 1) / executableActions.length) * 20);
            setProgress(progress, actionDescription);

            // delay for visual feedback between actions
            await delay(300);

            // update action to complete status
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === assistantMessageId && msg.actions
                  ? {
                      ...msg,
                      actions: msg.actions.map((a) =>
                        a.id === actionId ? { ...a, status: "complete" } : a,
                      ),
                    }
                  : msg,
              ),
            );

            completeTool(toolId, { success: true });
          }

          // execute all actions on canvas
          try {
            await executeActions(editor.canvas, executableActions);
          } catch (actionError) {
            console.error("Action execution failed:", actionError);
          }

          // ensure canvas remains interactive
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

      // complete flow
      setPhase("completed", "Done");
      setProgress(100, "Complete");

      // check for ui component request and update message
      const uiComponentRequest = (
        response as { uiComponentRequest?: UIComponentRequest }
      ).uiComponentRequest;

      if (uiComponentRequest) {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMessageId
              ? {
                  ...msg,
                  uiComponentRequest: {
                    id: uiComponentRequest.id || generateId(),
                    componentType:
                      uiComponentRequest.componentType as UIComponentRequest["componentType"],
                    props: uiComponentRequest.props || {},
                    context: uiComponentRequest.context,
                    followUpPrompt: uiComponentRequest.followUpPrompt,
                  },
                }
              : msg,
          ),
        );

        // set pending ui component
        setPendingUIComponent({
          messageId: assistantMessageId,
          request: {
            id: uiComponentRequest.id || generateId(),
            componentType:
              uiComponentRequest.componentType as UIComponentRequest["componentType"],
            props: uiComponentRequest.props || {},
            context: uiComponentRequest.context,
            followUpPrompt: uiComponentRequest.followUpPrompt,
          },
        });
      }

      endFlow(true);

      // save assistant message to db
      if (convId) {
        createMessage
          .mutateAsync({
            conversationId: convId,
            role: "ASSISTANT",
            content: assistantMessage.content,
          })
          .catch(console.error);
      }
    } catch (error) {
      console.error("AI response error:", error);
      endFlow(false, String(error));

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
      clearCanvasTargets();
      isSubmittingRef.current = false;
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
    startFlow,
    endFlow,
    resetFlow,
    setPhase,
    startTool,
    completeTool,
    setCanvasTarget,
    clearCanvasTargets,
    log,
    setProgress,
  ]);

  const handleRemoveMention = useCallback((id: string) => {
    setActiveMentions((prev) => prev.filter((m) => m.id !== id));
  }, []);

  // handle image attachment from agent input
  const handleImagesChange = useCallback(
    (images: ImageAttachment[]) => {
      // check if an image was removed
      const currentIds = new Set(images.map((img) => img.id));
      const attachedIds = attachedImages.map((a) => a.id);

      // remove images that are no longer in the list
      attachedIds.forEach((id) => {
        if (!currentIds.has(id)) {
          removeImageAttachment(id);
        }
      });

      // add new images
      images.forEach((img) => {
        if (img.dataUrl && !attachedImages.find((a) => a.id === img.id)) {
          addImageFromDataUrl(img.dataUrl, img.name);
        }
      });
    },
    [attachedImages, addImageFromDataUrl, removeImageAttachment],
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
    resetFlow();
    setMessages([createWelcomeMessage()]);
    setActiveMentions([]);
  }, [resetFlow]);

  // formats ui component response for display
  const formatUIResponseForDisplay = useCallback(
    (value: unknown, componentType: string): string => {
      if (value === null || value === undefined) return "No selection";

      if (typeof value === "string") return value;
      if (typeof value === "number") return String(value);
      if (typeof value === "boolean") return value ? "Yes" : "No";

      if (typeof value === "object" && !Array.isArray(value)) {
        const obj = value as Record<string, unknown>;
        // extract meaningful display text based on component type
        if (componentType === "wizard_form") {
          // for wizard forms, show key details
          const parts: string[] = [];
          if (obj.title) parts.push(String(obj.title));
          if (obj.name) parts.push(String(obj.name));
          if (obj.date) parts.push(String(obj.date));
          if (obj.venue) parts.push(`at ${obj.venue}`);
          return parts.length > 0 ? parts.join(" - ") : "Form submitted";
        }
        if (obj.label) return String(obj.label);
        if (obj.name) return String(obj.name);
        if (obj.title) return String(obj.title);
        if (obj.value) return String(obj.value);
        // fallback: show first meaningful field
        const keys = Object.keys(obj).filter((k) => obj[k] !== undefined);
        if (keys.length > 0 && keys.length <= 3) {
          return keys.map((k) => `${k}: ${obj[k]}`).join(", ");
        }
        return "Selection confirmed";
      }

      if (Array.isArray(value)) {
        if (value.length === 0) return "None selected";
        if (value.length === 1)
          return formatUIResponseForDisplay(value[0], componentType);
        return `${value.length} items selected`;
      }

      return "Selection confirmed";
    },
    [],
  );

  // replaces template placeholders with actual values
  const replaceTemplatePlaceholders = useCallback(
    (template: string, value: unknown): string => {
      if (!template) return "";

      let result = template;

      // replace {value} with string representation
      result = result.replace(
        /\{value\}/g,
        formatUIResponseForDisplay(value, ""),
      );

      // if value is object, replace field-specific placeholders
      if (
        typeof value === "object" &&
        value !== null &&
        !Array.isArray(value)
      ) {
        const obj = value as Record<string, unknown>;
        for (const [key, val] of Object.entries(obj)) {
          const placeholder = new RegExp(`\\{${key}\\}`, "g");
          result = result.replace(
            placeholder,
            val !== undefined ? String(val) : "",
          );
        }
      }

      // remove any remaining unresolved placeholders
      result = result.replace(/\{[^}]+\}/g, "").trim();

      return result;
    },
    [formatUIResponseForDisplay],
  );

  // handle ui component submission
  const handleUIComponentSubmit = useCallback(
    (response: UIComponentResponse) => {
      if (!pendingUIComponent) return;

      // update message with resolved state
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === pendingUIComponent.messageId
            ? {
                ...msg,
                uiComponentResponse: response,
                isUIComponentResolved: true,
              }
            : msg,
        ),
      );

      // capture pending component info before clearing
      const pendingRequest = pendingUIComponent.request;
      const pendingCategory = (pendingRequest.props as { category?: string })
        ?.category;
      const pendingQuery = (pendingRequest.props as { query?: string })?.query;

      // clear pending state
      setPendingUIComponent(null);

      // handle template gallery response
      if ((response.componentType as string) === "template_gallery") {
        const galleryValue = response.value as TemplateGalleryValue;
        console.log("[TEMPLATE_GALLERY_RESPONSE]", galleryValue);

        if (
          galleryValue.action === "select_template" &&
          galleryValue.templateId
        ) {
          // user selected a template - load it
          setInputValue(
            `Load template "${galleryValue.templateName || galleryValue.templateId}"`,
          );
          setTimeout(() => {
            const submitBtn = document.querySelector(
              "[data-agent-submit]",
            ) as HTMLButtonElement;
            submitBtn?.click();
          }, 100);
        } else if (galleryValue.action === "start_scratch") {
          // user wants to start from scratch - show design wizard
          const wizardMessageId = generateId();

          // detect design type from original query and category
          const originalUserMessage =
            messages.find((m) => m.role === "user")?.content || "";
          const designType = detectDesignType(
            pendingQuery || originalUserMessage,
            pendingCategory,
          );

          const designTypeLabel = {
            wedding: "Wedding Invitation",
            birthday: "Birthday Invitation",
            event: "Event Invitation",
            poster: "Poster",
            card: "Card",
            gym: "Gym/Fitness Poster",
            restaurant: "Restaurant/Food Poster",
            music: "Music/Concert Poster",
            tech: "Tech/Startup Poster",
            sports: "Sports Poster",
            generic: "Design"
          }[designType] || "Design";

          const wizardRequest: UIComponentRequest = {
            id: generateId(),
            componentType:
              "design_wizard" as UIComponentRequest["componentType"],
            props: {
              designType,
              title: `Create ${designTypeLabel}`,
              description: "Fill in the details for your design",
            },
            followUpPrompt: "Create design with these requirements",
          };

          const wizardMessage: AgentMessage = {
            id: wizardMessageId,
            role: "assistant",
            content:
              "Let's create your design from scratch! Please fill in the details below.",
            status: "complete",
            timestamp: Date.now(),
            uiComponentRequest: wizardRequest,
          };

          setMessages((prev) => [...prev, wizardMessage]);
          setPendingUIComponent({
            messageId: wizardMessageId,
            request: wizardRequest,
          });
        }
        return;
      }

      // handle design wizard response
      if ((response.componentType as string) === "design_wizard") {
        const requirements = response.value as DesignRequirements;
        console.log("[DESIGN_WIZARD_RESPONSE]", requirements);

        // detect design type from pending request props OR re-detect from original user message
        const wizardProps = pendingRequest.props as { designType?: string };
        const originalUserMessage = messages.find((m) => m.role === "user")?.content || "";
        let designType = wizardProps?.designType || "generic";
        
        // if generic, try to re-detect from original message to catch gym, restaurant, etc.
        if (designType === "generic" && originalUserMessage) {
          designType = detectDesignType(originalUserMessage);
        }
        
        console.log("[DESIGN_TYPE_DETECTED]", { wizardType: wizardProps?.designType, detected: designType });

        // build a detailed prompt for the AI to create the design
        let designPrompt = `Create a ${designType} design with these specifications:\n`;

        if (requirements.primaryText)
          designPrompt += `- Main text: "${requirements.primaryText}"\n`;
        if (requirements.secondaryText)
          designPrompt += `- Subtitle: "${requirements.secondaryText}"\n`;
        if (requirements.date) designPrompt += `- Date: ${requirements.date}\n`;
        if (requirements.time) designPrompt += `- Time: ${requirements.time}\n`;
        if (requirements.venue)
          designPrompt += `- Venue: ${requirements.venue}\n`;
        if (requirements.additionalInfo)
          designPrompt += `- Additional: ${requirements.additionalInfo}\n`;

        // color palette
        if (requirements.colorPalette) {
          if (requirements.colorPalette.id === "auto") {
            designPrompt += `- Colors: Let AI choose best color palette for ${designType}\n`;
          } else {
            designPrompt += `- Color palette: ${requirements.colorPalette.name} (${requirements.colorPalette.colors.join(", ")})\n`;
          }
        }

        // font pairing
        if (requirements.fontPairing) {
          if (requirements.fontPairing.id === "auto") {
            designPrompt += `- Fonts: Let AI choose best font pairing for ${designType}\n`;
          } else {
            designPrompt += `- Fonts: ${requirements.fontPairing.heading} for headings, ${requirements.fontPairing.body} for body\n`;
          }
        }

        // design style
        if (requirements.designStyle) {
          if (typeof requirements.designStyle === "string") {
            designPrompt += `- Style: ${requirements.designStyle}\n`;
          } else {
            const style = requirements.designStyle as any;
            if (style.id === "auto") {
              designPrompt += `- Style: Let AI choose best style for ${designType}\n`;
            } else {
              designPrompt += `- Style: ${style.name}\n`;
            }
          }
        }

        if (requirements.backgroundStyle)
          designPrompt += `- Background: ${requirements.backgroundStyle}\n`;

        // decorative elements with PNG/stickers from Pixabay
        if (requirements.includeDecorations) {
          const decorativeKeywords = requirements.imageKeywords?.length
            ? requirements.imageKeywords.join(", ")
            : getDefaultDecorativeKeywords(designType);
          designPrompt += `- DECORATIONS (REQUIRED): Search Pixabay for EXACTLY these terms with image_type=vector: ${decorativeKeywords}\n`;
          designPrompt += `- DO NOT use generic terms like "abstract shapes" or "ornamental graphics" - use ONLY the keywords listed above\n`;
        }

        // images
        if (requirements.includeImages) {
          designPrompt += `- Include relevant images from Pixabay that match the ${designType} theme\n`;
        }

        designPrompt +=
          `\n\nCRITICAL: For decorative elements, you MUST use search_images with the EXACT keywords specified above (e.g., "${getDefaultDecorativeKeywords(designType).split(", ")[0]}", "${getDefaultDecorativeKeywords(designType).split(", ")[1] || ""}"). DO NOT search for generic terms like "abstract shapes", "decorative elements", or "ornamental graphics". Place decorations strategically around the text. Create a complete, professional ${designType} design.`;

        setInputValue(designPrompt);
        setTimeout(() => {
          const submitBtn = document.querySelector(
            "[data-agent-submit]",
          ) as HTMLButtonElement;
          submitBtn?.click();
        }, 100);
        return;
      }

      // format user-friendly display text
      const displayText = formatUIResponseForDisplay(
        response.value,
        response.componentType,
      );

      // build the follow-up prompt with proper substitution
      const followUpPrompt = replaceTemplatePlaceholders(
        pendingRequest.followUpPrompt || "",
        response.value,
      );

      // auto-submit the follow-up if we have a prompt
      if (followUpPrompt) {
        setInputValue(followUpPrompt);
        // trigger submit after short delay for UI feedback
        setTimeout(() => {
          const submitBtn = document.querySelector(
            "[data-agent-submit]",
          ) as HTMLButtonElement;
          submitBtn?.click();
        }, 100);
      }
    },
    [
      pendingUIComponent,
      formatUIResponseForDisplay,
      replaceTemplatePlaceholders,
      messages,
    ],
  );

  const handleUIComponentCancel = useCallback(() => {
    if (!pendingUIComponent) return;

    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === pendingUIComponent.messageId
          ? { ...msg, isUIComponentResolved: true }
          : msg,
      ),
    );
    setPendingUIComponent(null);
  }, [pendingUIComponent]);

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
                  onUIComponentSubmit={handleUIComponentSubmit}
                  onUIComponentCancel={handleUIComponentCancel}
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
