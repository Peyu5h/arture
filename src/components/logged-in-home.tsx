"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Search, X, Loader2, Plus } from "lucide-react";
import Link from "next/link";

import { Navbar } from "~/components/navbar";
import { RecentDesigns } from "~/components/recent-designs";
import { TemplateCard } from "~/components/template-card";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { cn } from "~/lib/utils";
import { useProjects } from "~/hooks/projects.hooks";
import { useTemplates, useTrendingTemplates } from "~/hooks/templates.hooks";
import { authClient } from "~/lib/auth-client";

const DESIGN_PRESETS = [
  {
    id: "poster",
    name: "Poster (Portrait A2)",
    width: 1191,
    height: 1684,
    category: "Print",
  },
  {
    id: "resume",
    name: "Resume (A4 Portrait)",
    width: 2480,
    height: 3508,
    category: "Documents",
  },
  {
    id: "invitation",
    name: "Invitation (Portrait)",
    width: 1080,
    height: 1350,
    category: "Events",
  },
  {
    id: "card",
    name: "Card (Landscape)",
    width: 1050,
    height: 600,
    category: "Cards",
  },
  {
    id: "instagram-post",
    name: "Instagram Post (4:5)",
    width: 1080,
    height: 1350,
    category: "Social",
  },
  {
    id: "youtube",
    name: "YouTube Thumbnail",
    width: 1280,
    height: 720,
    category: "Social",
  },
  {
    id: "facebook",
    name: "Facebook Post",
    width: 1200,
    height: 630,
    category: "Social",
  },
];

// preview card component for preset
function PresetCard({
  preset,
  isCreating,
  onClick,
}: {
  preset: (typeof DESIGN_PRESETS)[0];
  isCreating: boolean;
  onClick: () => void;
}) {
  const aspectRatio = preset.width / preset.height;
  const isPortrait = aspectRatio < 1;
  const isSquare = Math.abs(aspectRatio - 1) < 0.1;

  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      disabled={isCreating}
      className={cn(
        "group flex flex-shrink-0 flex-col items-center gap-3",
        isCreating && "pointer-events-none opacity-60",
      )}
      style={{ width: 140 }}
    >
      <div
        className={cn(
          "relative flex items-center justify-center rounded-xl border transition-all",
          "border-border bg-muted/30 hover:border-primary/50 hover:bg-muted/50",
          "h-[120px] w-full",
        )}
      >
        {/* preview illustration */}
        <div
          className={cn(
            "relative overflow-hidden rounded-lg bg-gradient-to-br from-violet-400/80 via-purple-400/80 to-cyan-400/80",
            isPortrait && "h-[80px] w-[56px]",
            isSquare && "h-[70px] w-[70px]",
            !isPortrait && !isSquare && "h-[56px] w-[80px]",
          )}
        >
          {/* decorative lines */}
          <div className="absolute top-2 right-2 left-2 space-y-1">
            <div className="h-1 w-3/4 rounded-full bg-white/40" />
            <div className="h-1 w-1/2 rounded-full bg-white/30" />
          </div>

          {/* decorative shapes */}
          {preset.id === "poster" && (
            <>
              <div className="absolute bottom-3 left-2 h-6 w-6 rounded-full bg-cyan-300/60" />
              <div className="absolute bottom-2 left-5 h-8 w-8 rounded-sm bg-violet-300/50" />
            </>
          )}

          {preset.id === "resume" && (
            <>
              <div className="absolute top-8 right-2 left-2 space-y-1">
                <div className="h-0.5 w-full rounded-full bg-white/30" />
                <div className="h-0.5 w-full rounded-full bg-white/30" />
                <div className="h-0.5 w-3/4 rounded-full bg-white/30" />
              </div>
            </>
          )}

          {preset.id === "invitation" && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="rounded-full border-2 border-white/40 p-2">
                <div className="h-4 w-4 rounded-full bg-white/30" />
              </div>
            </div>
          )}

          {preset.id === "custom" && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Plus className="size-6 text-white/60" />
            </div>
          )}
        </div>

        {isCreating && (
          <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/20">
            <Loader2 className="size-5 animate-spin text-white" />
          </div>
        )}
      </div>

      <div className="text-center">
        <p className="text-foreground text-xs font-medium">{preset.name}</p>
        {preset.id !== "custom" && (
          <p className="text-muted-foreground text-[10px]">
            {preset.width} x {preset.height} px
          </p>
        )}
      </div>
    </motion.button>
  );
}

// skeleton for templates
function TemplateCardSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="bg-muted/50 aspect-[4/3] rounded-xl" />
      <div className="mt-2 px-1">
        <div className="bg-muted h-4 w-3/4 rounded" />
        <div className="bg-muted mt-1 h-3 w-1/2 rounded" />
      </div>
    </div>
  );
}

export function LoggedInHome() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [creatingPreset, setCreatingPreset] = useState<string | null>(null);
  const [visibleTemplatesCount, setVisibleTemplatesCount] = useState(15);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const { data: session } = authClient.useSession();
  const { data: recentDesigns = [], isLoading: isProjectsLoading } =
    useProjects();
  const { data: templates = [], isLoading: isTemplatesLoading } = useTemplates({
    q: debouncedQuery,
  });
  const { data: trendingData = [], isLoading: isLoadingTrending } =
    useTrendingTemplates();

  // debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // infinite scroll for templates
  const handleIntersect = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      if (
        entries[0].isIntersecting &&
        templates.length > visibleTemplatesCount
      ) {
        setVisibleTemplatesCount((prev) =>
          Math.min(prev + 10, templates.length),
        );
      }
    },
    [templates.length, visibleTemplatesCount],
  );

  useEffect(() => {
    const observer = new IntersectionObserver(handleIntersect, {
      threshold: 0.1,
    });

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => observer.disconnect();
  }, [handleIntersect]);

  // reset visible count when search changes
  useEffect(() => {
    setVisibleTemplatesCount(15);
  }, [debouncedQuery]);

  const handleCreateFromPreset = async (preset: (typeof DESIGN_PRESETS)[0]) => {
    setCreatingPreset(preset.id);
    try {
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: `Untitled ${preset.name}`,
          json: { version: "5.3.0", objects: [] },
          width: preset.width,
          height: preset.height,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        router.push(`/editor/${result.data.id}`);
      }
    } catch (error) {
      console.error("Error creating project:", error);
    } finally {
      setCreatingPreset(null);
    }
  };

  const visibleTemplates = templates.slice(0, visibleTemplatesCount);
  // use actual trending templates if available, otherwise fallback to recent templates
  const trendingTemplates =
    trendingData.length > 0 ? trendingData.slice(0, 8) : templates.slice(0, 8);

  return (
    <div className="bg-background min-h-screen">
      <Navbar hideNavLinks />

      {/* hero section with presets */}
      <section className="relative px-6 pt-28 pb-8">
        <div className="mx-auto max-w-[1400px]">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8 text-center text-4xl font-light tracking-tight md:text-5xl"
          >
            What will you design today?
          </motion.h1>

          {/* preset cards centered */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="flex justify-center"
          >
            <div className="flex flex-wrap justify-center gap-4 py-2">
              {DESIGN_PRESETS.map((preset) => (
                <PresetCard
                  key={preset.id}
                  preset={preset}
                  isCreating={creatingPreset === preset.id}
                  onClick={() => handleCreateFromPreset(preset)}
                />
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* recent designs */}
      <RecentDesigns
        designs={recentDesigns}
        isLoading={isProjectsLoading}
        title="Your Recent Designs"
        description="Continue working on your projects"
        initialCount={5}
        incrementCount={20}
        maxColumns={5}
      />

      {/* trending section */}
      {(trendingTemplates.length > 0 || isLoadingTrending) && (
        <section className="border-border/40 border-t px-6 py-12">
          <div className="mx-auto max-w-[1400px]">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-semibold">Trending near you</h2>
              <Link href="/templates">
                <Button variant="ghost" size="sm" className="text-primary">
                  See all
                </Button>
              </Link>
            </div>

            {isLoadingTrending ? (
              <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <TemplateCardSkeleton key={i} />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {trendingTemplates.slice(0, 5).map((template) => (
                  <TemplateCard key={template.id} template={template} />
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* search and all templates */}
      <section className="px-6 py-8">
        <div className="mx-auto max-w-[1400px]">
          {/* search bar */}
          <div className="mb-8 flex items-center justify-between gap-4">
            <div className="relative max-w-md flex-1">
              <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
              <Input
                type="text"
                className="border-border/50 bg-muted/30 h-11 w-full rounded-lg pr-10 pl-10"
                placeholder="Search templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  type="button"
                  className="absolute top-1/2 right-3 -translate-y-1/2"
                  onClick={() => setSearchQuery("")}
                >
                  <X className="text-muted-foreground hover:text-foreground size-4" />
                </button>
              )}
            </div>
            <Link href="/templates">
              <Button variant="outline" size="sm">
                Browse all
              </Button>
            </Link>
          </div>

          {/* templates header */}
          <div className="mb-6">
            <h2 className="text-xl font-semibold">
              {searchQuery
                ? `Results for "${searchQuery}"`
                : "Explore Templates"}
            </h2>
          </div>

          {/* templates grid */}
          {isTemplatesLoading ? (
            <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {Array.from({ length: 10 }).map((_, i) => (
                <TemplateCardSkeleton key={i} />
              ))}
            </div>
          ) : visibleTemplates.length > 0 ? (
            <>
              <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {visibleTemplates.map((template) => (
                  <TemplateCard key={template.id} template={template} />
                ))}
              </div>

              {/* load more trigger */}
              {visibleTemplatesCount < templates.length && (
                <div
                  ref={loadMoreRef}
                  className="mt-8 flex justify-center py-4"
                >
                  <Loader2 className="text-muted-foreground size-6 animate-spin" />
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="bg-muted rounded-full p-5">
                <Search className="text-muted-foreground size-6" />
              </div>
              <h3 className="mt-4 text-lg font-medium">No templates found</h3>
              <p className="text-muted-foreground mt-1 text-sm">
                {searchQuery
                  ? "Try a different search term"
                  : "Templates will appear here when available"}
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
