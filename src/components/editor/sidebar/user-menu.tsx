"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  LogOut,
  Moon,
  Sun,
  Clock,
  ChevronUp,
  ExternalLink,
  Loader2,
} from "lucide-react";
import { flushSync } from "react-dom";
import { authClient } from "~/lib/auth-client";
import { useProjects } from "~/hooks/projects.hooks";
import { ny } from "~/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";

export function UserMenu() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const { data: session } = authClient.useSession();
  const { data: recentDesigns = [], isLoading: isLoadingDesigns } =
    useProjects();

  const recentProjects = recentDesigns.slice(0, 3);

  useEffect(() => {
    const updateTheme = () => {
      setIsDark(document.documentElement.classList.contains("dark"));
    };
    updateTheme();

    const observer = new MutationObserver(updateTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  const toggleTheme = useCallback(async () => {
    if (!buttonRef.current) return;

    await document.startViewTransition(() => {
      flushSync(() => {
        const newTheme = !isDark;
        setIsDark(newTheme);
        document.documentElement.classList.toggle("dark");
        localStorage.setItem("theme", newTheme ? "dark" : "light");
      });
    }).ready;

    const { top, left, width, height } =
      buttonRef.current.getBoundingClientRect();
    const x = left + width / 2;
    const y = top + height / 2;
    const maxRadius = Math.hypot(
      Math.max(left, window.innerWidth - left),
      Math.max(top, window.innerHeight - top),
    );

    document.documentElement.animate(
      {
        clipPath: [
          `circle(0px at ${x}px ${y}px)`,
          `circle(${maxRadius}px at ${x}px ${y}px)`,
        ],
      },
      {
        duration: 400,
        easing: "ease-in-out",
        pseudoElement: "::view-transition-new(root)",
      },
    );
  }, [isDark]);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await authClient.signOut();
      router.push("/");
      router.refresh();
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleOpenProject = (projectId: string) => {
    setIsOpen(false);
    router.push(`/editor/${projectId}`);
  };

  const userInitial =
    session?.user?.name?.charAt(0).toUpperCase() ||
    session?.user?.email?.charAt(0).toUpperCase() ||
    "U";

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <button
          className={ny(
            "group relative flex h-14 w-full flex-col items-center justify-center gap-1 rounded-xl px-1 py-2 transition-all duration-200",
            isOpen
              ? "bg-muted text-foreground"
              : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
          )}
        >
          <div className="bg-muted border-border flex size-8 items-center justify-center rounded-lg border transition-all">
            {session?.user?.image ? (
              <img
                src={session.user.image}
                alt={session.user.name || "User"}
                className="size-8 rounded-lg object-cover"
              />
            ) : (
              <span className="text-foreground text-xs font-medium">
                {userInitial}
              </span>
            )}
          </div>
        </button>
      </PopoverTrigger>

      <PopoverContent
        side="right"
        align="end"
        sideOffset={8}
        className="w-72 p-0"
      >
        <div className="border-border border-b p-4">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 flex size-10 items-center justify-center rounded-full">
              {session?.user?.image ? (
                <img
                  src={session.user.image}
                  alt={session.user.name || "User"}
                  className="size-10 rounded-full object-cover"
                />
              ) : (
                <User className="text-primary size-5" />
              )}
            </div>
            <div className="flex-1 truncate">
              <p className="truncate text-sm font-medium">
                {session?.user?.name || "User"}
              </p>
              <p className="text-muted-foreground truncate text-xs">
                {session?.user?.email}
              </p>
            </div>
          </div>
        </div>

        <div className="p-2">
          <div className="mb-2 px-2">
            <p className="text-muted-foreground flex items-center gap-1.5 text-xs font-medium">
              <Clock className="size-3" />
              Recent Designs
            </p>
          </div>

          {isLoadingDesigns ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="text-muted-foreground size-4 animate-spin" />
            </div>
          ) : recentProjects.length > 0 ? (
            <div className="space-y-1">
              {recentProjects.map((project: any) => (
                <button
                  key={project.id}
                  onClick={() => handleOpenProject(project.id)}
                  className="hover:bg-muted group flex w-full items-center gap-3 rounded-lg p-2 text-left transition-colors"
                >
                  <div className="bg-muted size-10 overflow-hidden rounded-md">
                    {project.thumbnailUrl ? (
                      <img
                        src={project.thumbnailUrl}
                        alt={project.name}
                        className="size-full object-contain"
                      />
                    ) : (
                      <div className="from-primary/20 to-primary/5 size-full bg-gradient-to-br" />
                    )}
                  </div>
                  <div className="flex-1 truncate">
                    <p className="truncate text-sm font-medium">
                      {project.name || "Untitled"}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      {project.width} × {project.height}
                    </p>
                  </div>
                  <ExternalLink className="text-muted-foreground size-3 opacity-0 transition-opacity group-hover:opacity-100" />
                </button>
              ))}
            </div>
          ) : (
            <div className="text-muted-foreground py-4 text-center text-xs">
              No recent designs
            </div>
          )}
        </div>

        <div className="border-border border-t p-2">
          <button
            ref={buttonRef}
            onClick={toggleTheme}
            className="hover:bg-muted flex w-full items-center gap-3 rounded-lg p-2 text-left transition-colors"
          >
            <div className="bg-muted flex size-8 items-center justify-center rounded-lg">
              {isDark ? (
                <Sun className="size-4 text-amber-500" />
              ) : (
                <Moon className="size-4 text-indigo-500" />
              )}
            </div>
            <span className="text-sm font-medium">
              {isDark ? "Light Mode" : "Dark Mode"}
            </span>
          </button>

          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="hover:bg-destructive/10 text-destructive flex w-full items-center gap-3 rounded-lg p-2 text-left transition-colors disabled:opacity-50"
          >
            <div className="bg-destructive/10 flex size-8 items-center justify-center rounded-lg">
              {isLoggingOut ? (
                <Loader2 className="text-destructive size-4 animate-spin" />
              ) : (
                <LogOut className="text-destructive size-4" />
              )}
            </div>
            <span className="text-sm font-medium">
              {isLoggingOut ? "Signing out..." : "Sign Out"}
            </span>
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
