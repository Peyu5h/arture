import { Project } from "@prisma/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "~/components/ui/use-toast";
import api from "~/lib/api";
import { CreateProjectInput } from "~/app/api/[[...route]]/schemas/projects.schema";

export function useCreateProject() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: CreateProjectInput) => {
      const response = await api.post<Project>("/api/projects", data);
      return response.data;
    },
    onSuccess: (newProject) => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast({
        description: `Project "${newProject.name}" created successfully.`,
      });
    },
    onError: (error) => {
      toast({
        description: `Failed to create project: ${error.message}`,
        variant: "destructive",
      });
    },
  });
}
