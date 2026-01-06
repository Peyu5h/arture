import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "~/lib/api";

export interface Conversation {
  id: string;
  title: string;
  projectId?: string;
  createdAt: number;
  updatedAt: number;
  messageCount: number;
  preview?: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  actions?: unknown;
  context?: unknown;
  timestamp: number;
}

export interface ConversationWithMessages extends Conversation {
  messages: ChatMessage[];
  context?: unknown;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

interface CreateConversationInput {
  title?: string;
  projectId?: string;
  context?: unknown;
}

interface CreateMessageInput {
  conversationId: string;
  role: "USER" | "ASSISTANT" | "SYSTEM";
  content: string;
  actions?: unknown;
  context?: unknown;
}

// fetch all conversations for a project
export const useConversations = (projectId?: string) => {
  return useQuery({
    queryKey: ["conversations", projectId],
    queryFn: async () => {
      const params = projectId ? `?projectId=${projectId}` : "";
      const res = await api.get<Conversation[]>(
        `/api/chat/conversations${params}`,
      );
      return res.data;
    },
    staleTime: 1000 * 60 * 5,
  });
};

// fetch single conversation with messages
export const useConversation = (id: string | null) => {
  return useQuery({
    queryKey: ["conversation", id],
    queryFn: async () => {
      if (!id) return null;
      const res = await api.get<ConversationWithMessages>(
        `/api/chat/conversations/${id}`,
      );
      return res.data;
    },
    enabled: !!id,
    staleTime: 1000 * 60,
  });
};

// create new conversation
export const useCreateConversation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateConversationInput) => {
      const res = await api.post<Conversation>("/api/chat/conversations", data);
      return res.data;
    },
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["conversations", variables.projectId],
      });
    },
  });
};

// update conversation
export const useUpdateConversation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      ...data
    }: {
      id: string;
      title?: string;
      context?: unknown;
    }) => {
      const res = await api.put<Conversation>(
        `/api/chat/conversations/${id}`,
        data,
      );
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      queryClient.invalidateQueries({ queryKey: ["conversation", data.id] });
    },
  });
};

// delete conversation
export const useDeleteConversation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api.delete<{ deleted: boolean }>(
        `/api/chat/conversations/${id}`,
      );
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });
};

// add message to conversation
export const useCreateMessage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateMessageInput) => {
      const res = await api.post<ChatMessage>("/api/chat/messages", data);
      return res.data;
    },
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["conversation", variables.conversationId],
      });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });
};

// generate title from query
export const useGenerateTitle = () => {
  return useMutation({
    mutationFn: async (query: string) => {
      const res = await api.post<{ title: string }>(
        "/api/chat/generate-title",
        {
          query,
        },
      );
      return res.data.title;
    },
  });
};

interface AIResponseInput {
  message: string;
  context?: {
    elements?: Array<Record<string, unknown>>;
    canvasSize?: { width: number; height: number };
    backgroundColor?: string;
    summary?: string;
  };
  conversationHistory?: Array<{
    role: "user" | "assistant";
    content: string;
  }>;
}

interface AIResponseOutput {
  response: string;
  isConfigured: boolean;
  error?: boolean;
}

// generate ai response using gemini
export const useAIResponse = () => {
  return useMutation({
    mutationFn: async (input: AIResponseInput) => {
      const res = await api.post<AIResponseOutput>(
        "/api/chat/ai-response",
        input,
      );
      return res.data;
    },
  });
};
