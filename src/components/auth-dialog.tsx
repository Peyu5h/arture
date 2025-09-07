"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Button } from "~/components/ui/button";
import { User } from "lucide-react";
import { authClient } from "~/lib/auth-client";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Loader2, Mail, Lock, AlertCircle, Eye, EyeOff } from "lucide-react";
import { Alert, AlertDescription } from "~/components/ui/alert";
import Link from "next/link";
import { toast } from "sonner";
import { fetchCallback } from "~/lib/utils";
import { useRouter } from "next/navigation";

interface AuthDialogProps {
  isOpen: boolean;
  onClose: () => void;
  defaultView?: "signin" | "signup";
}

export function AuthDialog({
  isOpen,
  onClose,
  defaultView = "signin",
}: AuthDialogProps) {
  const router = useRouter();
  const [view, setView] = useState<"signin" | "signup">(defaultView);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      if (view === "signin") {
        const result = await authClient.signIn.email(
          {
            email,
            password,
          },
          {
            onRequest: () => setIsLoading(true),
            onSuccess: () => {
              toast.success("You've successfully signed in", {
                description: "Welcome back!",
              });
              onClose();
              router.refresh();
            },
            onError: (ctx) => {
              setError(ctx.error.message || "Failed to sign in");
              setIsLoading(false);
              setPassword("");
            },
            onSettled: () => setIsLoading(false),
          },
        );

        if (result?.error) {
          setError(result.error.message || "Failed to sign in");
          setPassword("");
        }
      } else {
        const result = await authClient.signUp.email(
          {
            name,
            email,
            password,
          },
          {
            onRequest: () => setIsLoading(true),
            onSuccess: () => {
              toast.success("Account created successfully", {
                description: "Welcome to Arture!",
              });
              onClose();
              router.refresh();
            },
            onError: (ctx) => {
              setError(ctx.error.message || "Failed to sign up");
              setIsLoading(false);
              setPassword("");
            },
            onSettled: () => setIsLoading(false),
          },
        );

        if (result?.error) {
          setError(result.error.message || "Failed to sign up");
          setPassword("");
        }
        setIsLoading(false);
      }
    } catch (err) {
      console.error(`${view} error:`, err);
      setError(err instanceof Error ? err.message : `Failed to ${view}`);
      setPassword("");
      setIsLoading(false);
    }
  }

  async function handleGoogleSignIn() {
    await authClient.signIn.social(
      {
        provider: "google",
        callbackURL: "/onboading",
      },
      fetchCallback({
        setIsPending: setIsGoogleLoading,
        // onSuccess: () => {
        //   onClose();
        //   router.refresh();
        // },
        // onError: (ctx) => {
        //   toast.error(ctx.error.message || "Google sign-in failed");
        // },
      }),
    );
  }

  const handleViewChange = (newView: "signin" | "signup") => {
    setView(newView);
    setError("");
    setName("");
    setEmail("");
    setPassword("");
    setShowPassword(false);
    setIsLoading(false);
    setIsGoogleLoading(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-bold">
              {view === "signin" ? "Welcome back" : "Create an account"}
            </DialogTitle>
          </div>
          <p className="text-muted-foreground text-sm">
            {view === "signin"
              ? "Enter your credentials to access account"
              : "Enter your information to get started"}
          </p>
        </DialogHeader>

        <div className="py-4">
          {error && (
            <Alert variant="destructive" className="mb-4 text-sm">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {view === "signup" && (
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <div className="relative">
                  <User className="text-muted-foreground absolute top-3 left-3 h-4 w-4" />
                  <Input
                    id="name"
                    placeholder="Enter your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="pl-10"
                    disabled={isLoading}
                    required
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="text-muted-foreground absolute top-3 left-3 h-4 w-4" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="pl-10"
                  disabled={isLoading}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
              </div>
              <div className="relative flex items-center">
                <Lock className="text-muted-foreground absolute top-3 left-3 h-4 w-4" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="pl-10"
                  disabled={isLoading}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-primary absolute top-1/2 right-3 -translate-y-1/2 transform text-xs hover:underline"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={
                isLoading || !email || !password || (view === "signup" && !name)
              }
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {view === "signin" ? "Signing in..." : "Creating account..."}
                </>
              ) : view === "signin" ? (
                "Sign in"
              ) : (
                "Create account"
              )}
            </Button>
          </form>

          <div className="my-4 space-y-4">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background text-muted-foreground px-2">
                  Or continue with
                </span>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={handleGoogleSignIn}
              disabled={isGoogleLoading}
              className="h-10 w-full"
            >
              {isGoogleLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="mr-2 h-4 w-4"
                  viewBox="0 0 24 24"
                >
                  <path
                    fill="currentColor"
                    d="M12.545 10.239v3.821h5.445c-.712 2.315-2.647 3.972-5.445 3.972a6.033 6.033 0 1 1 0-12.064c1.498 0 2.866.549 3.921 1.453l2.814-2.814A9.969 9.969 0 0 0 12.545 2C7.021 2 2.543 6.477 2.543 12s4.478 10 10.002 10c8.396 0 10.249-7.85 9.426-11.748l-9.426-.013z"
                  />
                </svg>
              )}
              Continue with Google
            </Button>
          </div>

          <div className="mt-4 text-center text-sm">
            <p className="text-muted-foreground">
              {view === "signin"
                ? "Don't have an account? "
                : "Already have an account? "}
              <button
                type="button"
                onClick={() =>
                  handleViewChange(view === "signin" ? "signup" : "signin")
                }
                className="text-primary font-medium hover:underline"
              >
                {view === "signin" ? "Create an account" : "Sign in"}
              </button>
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
