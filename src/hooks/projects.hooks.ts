import { Project } from "@prisma/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import api from "~/lib/api";

export function useProjects() {
  return useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const response = await api.get<Project[]>(`/api/projects`);
      return response.data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useProject(id: string | undefined) {
  const searchParams = useSearchParams();
  const shareToken = searchParams.get("share");

  return useQuery({
    queryKey: ["projects", id, shareToken],
    queryFn: async () => {
      if (!id) throw new Error("Project ID is required");
      const url = shareToken
        ? `/api/projects/${id}?share=${shareToken}`
        : `/api/projects/${id}`;
      const response = await api.get<
        Project & { permission?: string; isShared?: boolean }
      >(url);
      return response.data;
    },
    staleTime: 1000 * 60 * 5,
    enabled: !!id,
  });
}

export function useDeleteProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.delete<{ deleted: boolean }>(
        `/api/projects/${id}`,
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });
}
