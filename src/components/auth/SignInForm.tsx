"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Loader2, Mail, Lock, AlertCircle, Eye, EyeOff } from "lucide-react";
import { authClient } from "~/lib/auth-client";
import { toast } from "sonner";
import { SocialSignIn } from "./SocialSignIn";
import { Alert, AlertDescription } from "~/components/ui/alert";

const GUEST_CREDENTIALS = {
  email: "123@gmail.com",
  password: "12345678",
};

export function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isGuestLoading, setIsGuestLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const result = await authClient.signIn.email(
        {
          email,
          password,
        },
        {
          onRequest: () => {
            setIsLoading(true);
          },
          onSuccess: () => {
            toast.success("You've successfully signed in", {
              description: "Welcome back!",
            });
            router.push(callbackUrl);
            router.refresh();
          },
          onError: (ctx) => {
            setError(ctx.error.message || "Failed to sign in");
            setIsLoading(false);
            setPassword("");
          },
        },
      );

      if (result && result.error) {
        setError(result.error.message || "Failed to sign in");
        setPassword("");
        return;
      }
    } catch (err) {
      console.error("Sign-in error:", err);
      setError(err instanceof Error ? err.message : "Failed to sign in");
      setPassword("");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleGuestSignIn() {
    setIsGuestLoading(true);
    setError("");

    try {
      const result = await authClient.signIn.email(
        {
          email: GUEST_CREDENTIALS.email,
          password: GUEST_CREDENTIALS.password,
        },
        {
          onRequest: () => {
            setIsGuestLoading(true);
          },
          onSuccess: () => {
            toast.success("Welcome!", {
              description: "Signed in as guest.",
            });
            router.push(callbackUrl);
            router.refresh();
          },
          onError: (ctx) => {
            setError(ctx.error.message || "Failed to sign in as guest");
            setIsGuestLoading(false);
          },
        },
      );

      if (result && result.error) {
        setError(result.error.message || "Failed to sign in as guest");
        return;
      }
    } catch (err) {
      console.error("Guest sign-in error:", err);
      setError(err instanceof Error ? err.message : "Failed to sign in as guest");
    } finally {
      setIsGuestLoading(false);
    }
  }

  return (
    <div className="bg-card w-full max-w-md space-y-6 rounded-lg border p-8 shadow-sm">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold">Welcome back</h1>
        <p className="text-muted-foreground text-sm">
          Enter your credentials to access account
        </p>
      </div>

      {error && (
        <Alert variant="destructive" className="text-sm">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* email/password form */}
      <form onSubmit={handleSignIn} className="space-y-4">
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
          disabled={isLoading || isGuestLoading || !email || !password}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Signing in...
            </>
          ) : (
            "Sign in"
          )}
        </Button>
      </form>

      <SocialSignIn />

      {/* guest signin section */}
      <div className="space-y-4">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card text-muted-foreground px-2">
              Or continue as
            </span>
          </div>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={handleGuestSignIn}
          disabled={isGuestLoading || isLoading}
          className="w-full"
        >
          {isGuestLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Signing in...
            </>
          ) : (
            "Continue with Guest Account"
          )}
        </Button>
      </div>

      <div className="text-center text-sm">
        <p className="text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Link
            href="/sign-up"
            className="text-primary font-medium hover:underline"
          >
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
