"use client";

import { useMutation } from "@tanstack/react-query";
import { LucideLoader2, Plus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import TempCards from "~/components/hompage/tempCards";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { useToast } from "~/components/ui/use-toast";
import { useProjects } from "~/hooks/projects.hooks";
import api from "~/lib/api";
import { authClient } from "~/lib/auth-client";
import { Project } from "@prisma/client";

export default function Home() {
  const { toast } = useToast();
  const router = useRouter();
  const [projectName, setProjectName] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

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


  const createProjectMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post<Project>("/api/projects", {
        name: projectName,
        json: "{}",
        height: 500,
        width: 500,
      });
      return response;
    },
    onSuccess: (response) => {
      toast({
        description: "Project created successfully.",
      });
      setIsDialogOpen(false);
      router.push(`/editor/${response.data.id}`);
    },
    onError: (error) => {
      toast({
        description: error.message,
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


      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <Button className="mb-4 bg-white text-purple-600 transition duration-300 hover:bg-purple-100">
            <Plus className="mr-2 h-4 w-4" />
            Create New Project
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Project</DialogTitle>
            <DialogDescription>
              Give your project a name to get started.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                id="name"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                className="col-span-3"
                placeholder="My Awesome Project"
              />
            </div>
          </div>
          <div className="flex justify-end">
            <Button
              onClick={() => createProjectMutation.mutate()}
              disabled={!projectName || createProjectMutation.isPending}
            >
              {createProjectMutation.isPending ? (
                <LucideLoader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Create Project
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <div className="mt-2 mx-auto items-center justify-center flex flex-wrap gap-2">
        {projects?.map((project) => (
          <TempCards key={project.id} project={project} />
        ))}
      </div>
    </div>
  );
}
