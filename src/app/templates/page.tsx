"use client";

import React, {
  useState,
  useEffect,
  useRef,
  Suspense,
  useCallback,
} from "react";
import {
  Search,
  X,
  FileText,
  Image as ImageIcon,
  Calendar,
  Mail,
  Award,
  Loader2,
  Presentation,
  LayoutGrid,
  Sparkles,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";

import { cn } from "~/lib/utils";
import { Navbar } from "~/components/navbar";
import { useTemplates } from "~/hooks/templates.hooks";
import { TemplateCard } from "~/components/template-card";
import { Input } from "~/components/ui/input";

const CATEGORIES = [
  {
    id: "all",
    name: "All Templates",
    icon: LayoutGrid,
    color: "bg-slate-100 dark:bg-slate-800",
  },
  {
    id: "presentation",
    name: "Presentation",
    icon: Presentation,
    color: "bg-orange-100 dark:bg-orange-900/30",
  },
  {
    id: "poster",
    name: "Poster",
    icon: ImageIcon,
    color: "bg-purple-100 dark:bg-purple-900/30",
  },
  {
    id: "resume",
    name: "Resume",
    icon: FileText,
    color: "bg-blue-100 dark:bg-blue-900/30",
  },
  {
    id: "invitations",
    name: "Invitation",
    icon: Mail,
    color: "bg-yellow-100 dark:bg-yellow-900/30",
  },
  {
    id: "events",
    name: "Events",
    icon: Calendar,
    color: "bg-green-100 dark:bg-green-900/30",
  },
  {
    id: "cards",
    name: "Cards",
    icon: Award,
    color: "bg-pink-100 dark:bg-pink-900/30",
  },
];

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

function TemplatesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
  const [debouncedQuery, setDebouncedQuery] = useState(searchQuery);
  const [activeCategory, setActiveCategory] = useState(
    searchParams.get("category") || "all",
  );
  const [visibleCount, setVisibleCount] = useState(20);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const { data: templates = [], isLoading: isTemplatesLoading } = useTemplates({
    q: debouncedQuery,
    category: activeCategory === "all" ? undefined : activeCategory,
  });

  // debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // update URL params
  useEffect(() => {
    const params = new URLSearchParams();
    if (searchQuery) params.set("q", searchQuery);
    if (activeCategory !== "all") params.set("category", activeCategory);

    const paramString = params.toString();
    if (typeof window !== "undefined") {
      const newUrl = paramString
        ? `${window.location.pathname}?${paramString}`
        : window.location.pathname;
      window.history.replaceState(null, "", newUrl);
    }
  }, [searchQuery, activeCategory]);

  // set category from URL
  useEffect(() => {
    const category = searchParams.get("category");
    if (category) {
      const matchingCategory = CATEGORIES.find(
        (c) => c.id === category.toLowerCase(),
      );
      if (matchingCategory) {
        setActiveCategory(matchingCategory.id);
      }
    }
  }, [searchParams]);

  // infinite scroll
  const handleIntersect = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      if (entries[0].isIntersecting && templates.length > visibleCount) {
        setVisibleCount((prev) => Math.min(prev + 12, templates.length));
      }
    },
    [templates.length, visibleCount],
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

  // reset count on filter change
  useEffect(() => {
    setVisibleCount(20);
  }, [debouncedQuery, activeCategory]);

  const handleCategoryChange = (categoryId: string) => {
    setActiveCategory(categoryId);
    setVisibleCount(20);
  };

  const visibleTemplates = templates.slice(0, visibleCount);
  const activeCategoryData = CATEGORIES.find((c) => c.id === activeCategory);

  return (
    <div className="bg-background min-h-screen">
      <Navbar />

      {/* hero section */}
      <section className="relative overflow-hidden px-6 pt-28 pb-8">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div
            className="bg-gradient-radial from-primary/10 via-primary/5 absolute top-0 left-1/3 h-[500px] w-[500px] animate-pulse rounded-full to-transparent blur-[100px]"
            style={{ animationDuration: "4s" }}
          />
          <div
            className="bg-gradient-radial from-accent/10 via-accent/5 absolute right-1/4 bottom-0 h-[400px] w-[400px] animate-pulse rounded-full to-transparent blur-[80px]"
            style={{ animationDelay: "2s", animationDuration: "5s" }}
          />
        </div>

        <div className="relative z-10 mx-auto max-w-[1400px]">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-6 text-center"
          >
            <div className="border-accent/30 bg-accent/10 mb-4 inline-flex items-center gap-2 rounded-full border px-4 py-2">
              <Sparkles className="text-primary size-4" />
              <span className="text-foreground text-sm font-medium">
                Professional Templates
              </span>
            </div>
            <h1 className="mb-3 text-4xl font-light tracking-tight md:text-5xl">
              Discover Templates
            </h1>
            <p className="text-muted-foreground mx-auto max-w-xl">
              Browse professionally designed templates for every occasion
            </p>
          </motion.div>

          {/* search bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mx-auto mb-8 max-w-xl"
          >
            <div className="relative">
              <Search className="text-muted-foreground absolute top-1/2 left-4 size-5 -translate-y-1/2" />
              <Input
                type="text"
                className="border-border/50 bg-muted/30 focus:border-primary h-12 w-full rounded-xl pr-10 pl-12"
                placeholder="Search templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  type="button"
                  className="absolute top-1/2 right-4 -translate-y-1/2"
                  onClick={() => setSearchQuery("")}
                >
                  <X className="text-muted-foreground hover:text-foreground size-5" />
                </button>
              )}
            </div>
          </motion.div>

          {/* category filters */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex flex-wrap justify-center gap-2"
          >
            {CATEGORIES.map((category) => (
              <button
                key={category.id}
                onClick={() => handleCategoryChange(category.id)}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all",
                  activeCategory === category.id
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "border-border/50 bg-card/50 text-muted-foreground hover:bg-accent/10 hover:text-foreground border backdrop-blur-sm",
                )}
              >
                <category.icon className="size-4" />
                {category.name}
              </button>
            ))}
          </motion.div>
        </div>
      </section>

      {/* templates grid */}
      <section className="px-6 pb-20">
        <div className="mx-auto max-w-[1400px]">
          {/* section header */}
          <div className="mb-6 flex items-center gap-2">
            {activeCategoryData && (
              <>
                <activeCategoryData.icon className="text-primary size-5" />
                <h2 className="text-xl font-semibold">
                  {searchQuery
                    ? `Search results for "${searchQuery}"`
                    : activeCategoryData.name}
                </h2>
                {!isTemplatesLoading && (
                  <span className="text-muted-foreground text-sm">
                    ({templates.length} templates)
                  </span>
                )}
              </>
            )}
          </div>

          {isTemplatesLoading ? (
            <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {Array.from({ length: 15 }).map((_, i) => (
                <TemplateCardSkeleton key={i} />
              ))}
            </div>
          ) : visibleTemplates.length > 0 ? (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
              >
                {visibleTemplates.map((template, index) => (
                  <motion.div
                    key={template.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.3,
                      delay: Math.min(index * 0.03, 0.3),
                    }}
                  >
                    <TemplateCard template={template} />
                  </motion.div>
                ))}
              </motion.div>

              {visibleCount < templates.length && (
                <div
                  ref={loadMoreRef}
                  className="mt-10 flex justify-center py-6"
                >
                  <Loader2 className="text-muted-foreground size-6 animate-spin" />
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="bg-muted rounded-full p-6">
                <Search className="text-muted-foreground size-8" />
              </div>
              <h3 className="mt-6 text-xl font-medium">No templates found</h3>
              <p className="text-muted-foreground mt-2 max-w-sm text-center">
                {searchQuery
                  ? `We couldn't find any templates matching "${searchQuery}". Try a different search term.`
                  : "No templates available for this category yet."}
              </p>
              {(searchQuery || activeCategory !== "all") && (
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setActiveCategory("all");
                  }}
                  className="text-primary mt-4 text-sm font-medium hover:underline"
                >
                  Clear all filters
                </button>
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

export default function TemplatesPage() {
  return (
    <Suspense
      fallback={
        <div className="bg-background flex h-screen items-center justify-center">
          <Loader2 className="text-primary size-8 animate-spin" />
        </div>
      }
    >
      <TemplatesContent />
    </Suspense>
  );
}
