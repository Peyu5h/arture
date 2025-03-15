"use client";

import { useMutation } from "@tanstack/react-query";
import { LucideLoader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import TempCards from "~/components/hompage/tempCards";
import { Button } from "~/components/ui/button";
import { useToast } from "~/components/ui/use-toast";
import { useProjects } from "~/hooks/projects.hooks";

import { useUpdateProject } from "~/hooks/useUpdateProject";
import api from "~/lib/api";
import { authClient } from "~/lib/auth-client";

// Home page component update
export default function Home() {
  const { toast } = useToast();
  const router = useRouter();

  const {
    data: session,
    isPending: isSessionLoading,
    error,
  } = authClient.useSession();

  const {
    data: projects,
    isLoading: isProjectsLoading,
    error: projectsError,
  } = useProjects();

  // Create project mutation
  const createProjectMutation = useMutation({
    mutationFn: async () => {
      return api.post("/api/projects", {
        name: "Untitled Design",
        json: "{}",
        height: 1200,
        width: 900,
      });
    },
    onSuccess: (response) => {
      // Check response structure and handle accordingly
      const projectId = response.data?.data?.id || response.data?.id;

      if (projectId) {
        toast({
          description: "New project created successfully.",
        });
        router.push(`/editor/${projectId}`);
      } else {
        toast({
          description: "Project created but could not navigate to editor.",
          variant: "destructive",
        });
        console.error("Invalid project response:", response);
      }
    },
    onError: (error) => {
      console.error("Create project error:", error);
      toast({
        description: `Failed to create project: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  if (isSessionLoading || isProjectsLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <LucideLoader2 className="animate-spin" />
      </div>
    );
  }

  if (projectsError) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p>Error loading projects: {projectsError.message}</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col items-center justify-center bg-gradient-to-r from-purple-500 to-blue-500">
      <h1 className="mb-6 text-xl text-white">
        What will you design today? {session?.user?.name}
      </h1>

      <div className="mb-8 flex gap-4">
        <Button
          onClick={() => createProjectMutation.mutate()}
          className="bg-white text-purple-600 transition duration-300 hover:bg-purple-100"
          disabled={createProjectMutation.isPending}
        >
          {createProjectMutation.isPending ? (
            <LucideLoader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : null}
          Create New Project
        </Button>
      </div>

      <div className="mt-2 flex max-w-4xl flex-wrap justify-center gap-4">
        {projects?.map((project) => (
          <TempCards key={project.id} project={project} />
        ))}
      </div>
    </div>
  );
}
