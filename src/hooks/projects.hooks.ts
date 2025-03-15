import { Project } from "@prisma/client";
import { useQuery } from "@tanstack/react-query";
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
  return useQuery({
    queryKey: ["projects", id],
    queryFn: async () => {
      if (!id) throw new Error("Project ID is required");
      const response = await api.get<Project>(`/api/projects/${id}`);
      return response.data;
    },
    staleTime: 1000 * 60 * 5,
    enabled: !!id,
  });
}
