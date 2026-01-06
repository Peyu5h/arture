"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Button } from "~/components/ui/button";
import { Lock, LogIn, UserPlus } from "lucide-react";

interface AuthPromptDialogProps {
  isOpen: boolean;
  onClose: () => void;
  projectId?: string;
  shareToken?: string;
}

export const AuthPromptDialog = ({
  isOpen,
  onClose,
  projectId,
  shareToken,
}: AuthPromptDialogProps) => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = () => {
    setIsLoading(true);
    const callbackUrl = projectId
      ? `/editor/${projectId}${shareToken ? `?share=${shareToken}` : ""}`
      : "/";
    router.push(`/onboarding?callbackUrl=${encodeURIComponent(callbackUrl)}`);
  };

  const handleSignUp = () => {
    setIsLoading(true);
    const callbackUrl = projectId
      ? `/editor/${projectId}${shareToken ? `?share=${shareToken}` : ""}`
      : "/";
    router.push(
      `/onboarding?mode=signup&callbackUrl=${encodeURIComponent(callbackUrl)}`,
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
            <Lock className="size-6 text-amber-600 dark:text-amber-400" />
          </div>
          <DialogTitle className="text-center">Sign in to edit</DialogTitle>
          <DialogDescription className="text-center">
            This project has been shared with edit permissions. Sign in or
            create an account to start editing.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 flex flex-col gap-3">
          <Button
            onClick={handleLogin}
            disabled={isLoading}
            className="w-full"
          >
            <LogIn className="mr-2 size-4" />
            Sign in
          </Button>

          <Button
            onClick={handleSignUp}
            disabled={isLoading}
            variant="outline"
            className="w-full"
          >
            <UserPlus className="mr-2 size-4" />
            Create account
          </Button>

          <Button
            onClick={onClose}
            disabled={isLoading}
            variant="ghost"
            className="w-full"
          >
            Continue viewing
          </Button>
        </div>

        <p className="text-muted-foreground mt-4 text-center text-xs">
          You can continue viewing without signing in, but you won&apos;t be
          able to save changes.
        </p>
      </DialogContent>
    </Dialog>
  );
};
