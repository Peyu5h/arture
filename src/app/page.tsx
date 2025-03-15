"use client";

import { useMutation } from "@tanstack/react-query";
import { LucideLoader2 } from "lucide-react";
import Link from "next/link";
import TempCards from "~/components/hompage/tempCards";
import { Button } from "~/components/ui/button";
import { useToast } from "~/components/ui/use-toast";
import { useProjects } from "~/hooks/projects.hooks";

import { useUpdateProject } from "~/hooks/useUpdateProject";
import api from "~/lib/api";
import { authClient } from "~/lib/auth-client";

export default function Home() {
  const { toast } = useToast();
  const {
    data: session,
    isPending: isSessionLoading,
    error,
  } = authClient.useSession();

  const data = {
    name: "My third project",
    json: "{}",
    height: 500,
    width: 500,
  };

  const {
    data: projects,
    isLoading: isProjectsLoading,
    error: projectsError,
  } = useProjects();

  const projectId = "cm89vjdmq0001wunkml4nd9im";
  const { mutate: updateProject } = useUpdateProject();

  // if (isSessionLoading || isProjectsLoading) {
  //   return (
  //     <div className="flex h-screen items-center justify-center">
  //       <LucideLoader2 className="animate-spin" />
  //     </div>
  //   );
  // }

  if (projectsError) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p>Error loading projects: {projectsError.message}</p>
      </div>
    );
  }

  // const createPostMutation = useMutation({
  //   mutationFn: async () => {
  //     return api.put("/api/projects/cm89vjdmq0001wunkml4nd9im", data);
  //   },
  //   onSuccess: () => {
  //     toast({
  //       description: "Project created successfully.",
  //     });
  //   },
  //   onError: (error) => {
  //     toast({
  //       description: error.message,
  //     });
  //   },
  // });

  return (
    <div className="flex h-screen flex-col items-center justify-center bg-gradient-to-r from-purple-500 to-blue-500">
      <h1 className="mb-6 text-xl text-white">
        What will you design today? {session?.user?.name}
      </h1>

      <Button
        onClick={() =>
          updateProject({ id: projectId, data: { json: "Myyy updated" } })
        }
        className="bg-white text-purple-600 transition duration-300 hover:bg-purple-100"
      >
        Update Project
      </Button>

      <div className="mt-2 flex gap-2">
        {projects?.map((project) => (
          <TempCards key={project.id} project={project} />
        ))}
      </div>
    </div>
  );
}
