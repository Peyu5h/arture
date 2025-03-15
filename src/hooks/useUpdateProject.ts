// useUpdateProject.ts
import { Project } from "@prisma/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "~/components/ui/use-toast";
import api from "~/lib/api";

export function useUpdateProject() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Partial<Project>;
    }) => {
      return api.put(`/api/projects/${id}`, data);
    },
    onSuccess: (_, variables) => {
      // Only invalidate the specific project query
      // This is safer than trying to update the cache directly
      queryClient.invalidateQueries({ queryKey: ["projects", variables.id] });

      // Don't try to update the projects list cache directly
      // as it might not be an array or might not be loaded yet
    },
    onError: (error) => {
      toast({
        description: `Failed to save changes: ${error.message}`,
        variant: "destructive",
      });
    },
  });
}
