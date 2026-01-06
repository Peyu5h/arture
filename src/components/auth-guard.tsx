"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

interface AuthGuardProps {
  children: React.ReactNode;
  redirectTo?: string;
}

export function AuthGuard({
  children,
  redirectTo = "/onboarding",
}: AuthGuardProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const shareToken = searchParams.get("share");

  useEffect(() => {
    // skip auth check if share token is present
    if (shareToken) {
      return;
    }

    const checkAuth = async () => {
      try {
        // Use the session API endpoint directly
        const response = await fetch("/api/auth/get-session", {
          credentials: "include",
        });

        if (!response.ok) {
          const currentPath =
            typeof window !== "undefined" ? window.location.pathname : "/";
          const redirectUrl = `${redirectTo}?callbackUrl=${encodeURIComponent(currentPath)}`;
          router.push(redirectUrl);
        }
      } catch (error) {
        console.error("Auth check error:", error);
        // On error, redirect to onboarding
        router.push(redirectTo);
      }
    };

    checkAuth();
  }, [router, redirectTo, shareToken]);

  return <>{children}</>;
}
