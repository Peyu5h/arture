"use client";

import { useMutation } from "@tanstack/react-query";
import Link from "next/link";
import { Button } from "~/components/ui/button";
import { useToast } from "~/components/ui/use-toast";
import api from "~/lib/api";
import { authClient } from "~/lib/auth-client";

export default function Home() {
  const { toast } = useToast();
  const { data: session, isPending, error } = authClient.useSession();
  console.log(session);

  const data = {
    name: "My third project",
    json: "{}",
    height: 500,
    width: 500,
  };

  const createPostMutation = useMutation({
    mutationFn: async () => {
      return api.put("/api/projects/cm89vjdmq0001wunkml4nd9im", data);
    },
    onSuccess: () => {
      toast({
        description: "Project created successfully.",
      });
    },
    onError: (error) => {
      toast({
        description: error.message,
      });
    },
  });

  return (
    <div className="flex h-screen flex-col items-center justify-center bg-gradient-to-r from-purple-500 to-blue-500">
      <h1 className="mb-6 text-xl text-white">
        What will you design today? {session?.user?.name}
      </h1>
      <Link href="/editor/123">
        <Button
          onClick={() =>
            toast({
              description: "Navigating to the editor.",
            })
          }
          className="bg-white text-purple-600 transition duration-300 hover:bg-purple-100"
        >
          Create a Design
        </Button>
      </Link>
      <Button
        onClick={() => createPostMutation.mutate()}
        className="bg-white text-purple-600 transition duration-300 hover:bg-purple-100"
      >
        Create a Project
      </Button>
    </div>
  );
}
