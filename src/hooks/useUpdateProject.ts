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
      queryClient.setQueryData(
        ["project", variables.id],
        (oldData: Project | undefined) => {
          if (oldData) {
            return {
              ...oldData,
              ...variables.data,
              updatedAt: new Date().toISOString(),
            };
          }
          return oldData;
        },
      );
    },
    onError: (error) => {
      toast({
        description: `Failed to update project: ${error.message}`,
        variant: "destructive",
      });
    },
  });
}
