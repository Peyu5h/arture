import { Template } from "@prisma/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "~/lib/api";
import { toast } from "sonner";

interface TemplatesParams {
  q?: string;
  category?: string;
  trending?: boolean;
}

export function useTemplates(params?: TemplatesParams) {
  const queryParams = new URLSearchParams();
  if (params?.q) queryParams.set("q", params.q);
  if (params?.category && params.category !== "all") {
    queryParams.set("category", params.category);
  }

  const queryString = queryParams.toString();
  const url = queryString ? `/api/templates?${queryString}` : "/api/templates";

  return useQuery({
    queryKey: ["templates", params],
    queryFn: async () => {
      const response = await api.get<Template[]>(url);
      return response.data;
    },
    staleTime: 1000 * 60 * 5,
  });
}

export function useTemplate(id: string | undefined) {
  return useQuery({
    queryKey: ["templates", id],
    queryFn: async () => {
      if (!id) throw new Error("Template ID is required");
      const response = await api.get<Template>(`/api/templates/${id}`);
      return response.data;
    },
    staleTime: 1000 * 60 * 5,
    enabled: !!id,
  });
}

interface CreateTemplateInput {
  name: string;
  category: string;
  tags: string[];
  json: any;
  thumbnailUrl?: string;
  height: number;
  width: number;
}

export function useCreateTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateTemplateInput) => {
      const response = await api.post<Template>("/api/templates", data);
      return response.data;
    },
    onSuccess: () => {
      toast.success("Template saved successfully!");
      queryClient.invalidateQueries({ queryKey: ["templates"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to save template");
    },
  });
}

export function useDeleteTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.delete<{ deleted: boolean }>(
        `/api/templates/${id}`,
      );
      return response.data;
    },
    onSuccess: () => {
      toast.success("Template deleted successfully!");
      queryClient.invalidateQueries({ queryKey: ["templates"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete template");
    },
  });
}

export function useTrendingTemplates() {
  return useQuery({
    queryKey: ["templates", "trending"],
    queryFn: async () => {
      const response = await api.get<Template[]>(
        "/api/templates?trending=true",
      );
      return response.data;
    },
    staleTime: 1000 * 60 * 5,
  });
}

export function useUpdateTemplateTrending() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      isTrending,
      displayOrder,
    }: {
      id: string;
      isTrending: boolean;
      displayOrder?: number;
    }) => {
      const response = await api.patch<Template>(`/api/templates/${id}`, {
        isTrending,
        displayOrder,
      });
      return response.data;
    },
    onSuccess: () => {
      toast.success("Template updated!");
      queryClient.invalidateQueries({ queryKey: ["templates"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update template");
    },
  });
}
