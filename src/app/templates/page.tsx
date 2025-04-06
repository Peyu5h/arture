"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import {
  Search,
  Sparkles,
  X,
  ArrowRight,
  Heart,
  FileText,
  Image as ImageIcon,
  Calendar,
  Mail,
  Award,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";

import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Badge } from "~/components/ui/badge";
import { cn } from "~/lib/utils";

const CATEGORIES = [
  { id: "all", name: "All", icon: ImageIcon },
  { id: "resume", name: "Resume", icon: FileText },
  { id: "poster", name: "Poster", icon: ImageIcon },
  { id: "events", name: "Events", icon: Calendar },
  { id: "cards", name: "Cards", icon: Mail },
  { id: "invitations", name: "Invitations", icon: Award },
];

const TEMPLATE_COLLECTIONS = [
  {
    category: "resume",
    title: "Resume Templates",
    templates: [
      {
        id: "resume-1",
        name: "Professional Resume",
        image:
          "https://res.cloudinary.com/dkysrpdi6/image/upload/v1710317497/ijkte1lttxyzroiop3dq.jpg",
        premium: false,
      },
      {
        id: "resume-2",
        name: "Creative CV",
        image:
          "https://res.cloudinary.com/dkysrpdi6/image/upload/v1710317497/ijkte1lttxyzroiop3dq.jpg",
        premium: false,
      },
      {
        id: "resume-3",
        name: "Modern Resume",
        image:
          "https://res.cloudinary.com/dkysrpdi6/image/upload/v1710317497/ijkte1lttxyzroiop3dq.jpg",
        premium: true,
      },
      {
        id: "resume-4",
        name: "Simple CV",
        image:
          "https://res.cloudinary.com/dkysrpdi6/image/upload/v1710317497/ijkte1lttxyzroiop3dq.jpg",
        premium: false,
      },
      {
        id: "resume-5",
        name: "Academic CV",
        image:
          "https://res.cloudinary.com/dkysrpdi6/image/upload/v1710317497/ijkte1lttxyzroiop3dq.jpg",
        premium: true,
      },
      {
        id: "resume-6",
        name: "Student Resume",
        image:
          "https://res.cloudinary.com/dkysrpdi6/image/upload/v1710317497/ijkte1lttxyzroiop3dq.jpg",
        premium: false,
      },
    ],
  },
  {
    category: "poster",
    title: "Poster Templates",
    templates: [
      {
        id: "poster-1",
        name: "Event Poster",
        image:
          "https://res.cloudinary.com/dkysrpdi6/image/upload/v1710317497/ijkte1lttxyzroiop3dq.jpg",
        premium: false,
      },
      {
        id: "poster-2",
        name: "Movie Poster",
        image:
          "https://res.cloudinary.com/dkysrpdi6/image/upload/v1710317497/ijkte1lttxyzroiop3dq.jpg",
        premium: true,
      },
      {
        id: "poster-3",
        name: "Concert Poster",
        image:
          "https://res.cloudinary.com/dkysrpdi6/image/upload/v1710317497/ijkte1lttxyzroiop3dq.jpg",
        premium: false,
      },
      {
        id: "poster-4",
        name: "Promotional Poster",
        image:
          "https://res.cloudinary.com/dkysrpdi6/image/upload/v1710317497/ijkte1lttxyzroiop3dq.jpg",
        premium: false,
      },
    ],
  },
  {
    category: "events",
    title: "Event Templates",
    templates: [
      {
        id: "event-1",
        name: "Wedding Invitation",
        image:
          "https://res.cloudinary.com/dkysrpdi6/image/upload/v1710317497/ijkte1lttxyzroiop3dq.jpg",
        premium: true,
      },
      {
        id: "event-2",
        name: "Birthday Party",
        image:
          "https://res.cloudinary.com/dkysrpdi6/image/upload/v1710317497/ijkte1lttxyzroiop3dq.jpg",
        premium: false,
      },
      {
        id: "event-3",
        name: "Conference Agenda",
        image:
          "https://res.cloudinary.com/dkysrpdi6/image/upload/v1710317497/ijkte1lttxyzroiop3dq.jpg",
        premium: false,
      },
      {
        id: "event-4",
        name: "Festival Schedule",
        image:
          "https://res.cloudinary.com/dkysrpdi6/image/upload/v1710317497/ijkte1lttxyzroiop3dq.jpg",
        premium: true,
      },
    ],
  },
  {
    category: "cards",
    title: "Card Templates",
    templates: [
      {
        id: "card-1",
        name: "Business Card",
        image:
          "https://res.cloudinary.com/dkysrpdi6/image/upload/v1710317497/ijkte1lttxyzroiop3dq.jpg",
        premium: false,
      },
      {
        id: "card-2",
        name: "Greeting Card",
        image:
          "https://res.cloudinary.com/dkysrpdi6/image/upload/v1710317497/ijkte1lttxyzroiop3dq.jpg",
        premium: true,
      },
      {
        id: "card-3",
        name: "Thank You Card",
        image:
          "https://res.cloudinary.com/dkysrpdi6/image/upload/v1710317497/ijkte1lttxyzroiop3dq.jpg",
        premium: false,
      },
      {
        id: "card-4",
        name: "Holiday Card",
        image:
          "https://res.cloudinary.com/dkysrpdi6/image/upload/v1710317497/ijkte1lttxyzroiop3dq.jpg",
        premium: false,
      },
    ],
  },
  {
    category: "invitations",
    title: "Invitation Templates",
    templates: [
      {
        id: "invitation-1",
        name: "Wedding Invitation",
        image:
          "https://res.cloudinary.com/dkysrpdi6/image/upload/v1710317497/ijkte1lttxyzroiop3dq.jpg",
        premium: false,
      },
      {
        id: "invitation-2",
        name: "Birthday Invitation",
        image:
          "https://res.cloudinary.com/dkysrpdi6/image/upload/v1710317497/ijkte1lttxyzroiop3dq.jpg",
        premium: true,
      },
      {
        id: "invitation-3",
        name: "Baby Shower",
        image:
          "https://res.cloudinary.com/dkysrpdi6/image/upload/v1710317497/ijkte1lttxyzroiop3dq.jpg",
        premium: false,
      },
      {
        id: "invitation-4",
        name: "Housewarming",
        image:
          "https://res.cloudinary.com/dkysrpdi6/image/upload/v1710317497/ijkte1lttxyzroiop3dq.jpg",
        premium: false,
      },
    ],
  },
];

const TRENDING_DESIGNS = [
  {
    id: "trending-1",
    name: "Modern Resume Collection",
    description: "Professional templates for job seekers",
    image:
      "https://res.cloudinary.com/dkysrpdi6/image/upload/v1710317497/ijkte1lttxyzroiop3dq.jpg",
    category: "resume",
  },
  {
    id: "trending-2",
    name: "Event Promotion Posters",
    description: "Eye-catching designs for your next event",
    image:
      "https://res.cloudinary.com/dkysrpdi6/image/upload/v1710317497/ijkte1lttxyzroiop3dq.jpg",
    category: "poster",
  },
  {
    id: "trending-3",
    name: "Wedding Stationery Suite",
    description: "Complete collection for your special day",
    image:
      "https://res.cloudinary.com/dkysrpdi6/image/upload/v1710317497/ijkte1lttxyzroiop3dq.jpg",
    category: "invitations",
  },
  {
    id: "trending-4",
    name: "Business Branding Package",
    description: "Professional templates for your business",
    image:
      "https://res.cloudinary.com/dkysrpdi6/image/upload/v1710317497/ijkte1lttxyzroiop3dq.jpg",
    category: "cards",
  },
];

function TemplatesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
  const [activeCategory, setActiveCategory] = useState(
    searchParams.get("category") || "all",
  );
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const handleTrendingDesignClick = (design: (typeof TRENDING_DESIGNS)[0]) => {
    setActiveCategory(design.category);
    router.push(`/templates?category=${design.category}`);
  };

  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }
  }, [activeCategory]);

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());

    if (searchQuery) {
      params.set("q", searchQuery);
    } else {
      params.delete("q");
    }

    const newUrl = `${window.location.pathname}?${params.toString()}`;
    window.history.replaceState(null, "", newUrl);
  }, [searchQuery, searchParams]);

  // Set initial active category from URL
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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();

    const params = new URLSearchParams(searchParams.toString());

    if (searchQuery) {
      params.set("q", searchQuery);
    } else {
      params.delete("q");
    }

    router.push(`/templates?${params.toString()}`);
  };

  const getFilteredTemplates = () => {
    let filteredCollections = [...TEMPLATE_COLLECTIONS];

    if (activeCategory !== "all") {
      filteredCollections = filteredCollections.filter(
        (collection) => collection.category === activeCategory,
      );
    }

    if (searchQuery) {
      filteredCollections = filteredCollections
        .map((collection) => {
          return {
            ...collection,
            templates: collection.templates.filter((template) =>
              template.name.toLowerCase().includes(searchQuery.toLowerCase()),
            ),
          };
        })
        .filter((collection) => collection.templates.length > 0);
    }

    return filteredCollections;
  };

  const handleTemplateClick = (templateId: string) => {
    router.push(`/editor/${templateId}`);
  };

  const filteredTemplates = getFilteredTemplates();
  const categoryMap = CATEGORIES.reduce(
    (acc, cat) => {
      acc[cat.id] = cat;
      return acc;
    },
    {} as Record<string, (typeof CATEGORIES)[0]>,
  );

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex w-full items-center gap-4">
            <form onSubmit={handleSearch} className="relative w-full max-w-md">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <Search className="h-4 w-4 text-muted-foreground" />
              </div>
              <Input
                type="text"
                className="block w-full rounded-full border-border pl-10 pr-10 focus:border-primary focus:ring-primary"
                placeholder="Search templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 flex items-center pr-3"
                  onClick={() => setSearchQuery("")}
                >
                  <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                </button>
              )}
            </form>
          </div>
        </div>

        <div className="border-t border-border bg-background/80 px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="no-scrollbar flex items-center space-x-1 overflow-x-auto py-2">
              {CATEGORIES.map((category) => (
                <button
                  key={category.id}
                  className={cn(
                    "flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
                    activeCategory === category.id
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                  onClick={() => setActiveCategory(category.id)}
                >
                  <category.icon className="h-4 w-4" />
                  {category.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          {!searchQuery && activeCategory === "all" && (
            <div className="mb-10 overflow-hidden rounded-xl bg-gradient-to-r from-primary/10 via-primary/5 to-background">
              <div className="flex flex-col items-start justify-between gap-6 p-6 md:flex-row md:items-center">
                <div>
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    <h2 className="text-lg font-semibold text-foreground">
                      Trending Templates
                    </h2>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Discover our most popular seasonal and festival templates
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {TRENDING_DESIGNS.map((design) => (
                    <Button
                      key={design.id}
                      variant="outline"
                      size="sm"
                      className="rounded-full border-border bg-background/80 backdrop-blur-sm"
                      onClick={() => handleTrendingDesignClick(design)}
                    >
                      {design.name}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {filteredTemplates.length > 0 ? (
            <div className="space-y-12">
              {filteredTemplates.map((collection) => (
                <div key={collection.category}>
                  <div className="mb-6 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {categoryMap[collection.category] &&
                        React.createElement(
                          categoryMap[collection.category].icon,
                          {
                            className: "h-5 w-5 text-primary",
                          },
                        )}
                      <h2 className="text-xl font-semibold text-foreground">
                        {collection.title}
                      </h2>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-primary hover:bg-primary/10"
                    >
                      See all
                      <ArrowRight className="ml-1 h-3.5 w-3.5" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                    {collection.templates.map((template) => (
                      <div
                        key={template.id}
                        className="group relative cursor-pointer overflow-hidden rounded-lg border border-border bg-card transition-all hover:border-primary/30 hover:shadow-md"
                        onClick={() => handleTemplateClick(template.id)}
                      >
                        <div className="relative aspect-[3/4] w-full overflow-hidden">
                          <Image
                            src={template.image}
                            alt={template.name}
                            width={300}
                            height={400}
                            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                          />

                          {template.premium && (
                            <Badge className="absolute right-2 top-2 bg-amber-500/90 px-1.5 text-[10px] text-white">
                              PREMIUM
                            </Badge>
                          )}

                          <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/70 via-black/30 to-transparent p-4 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                            <h3 className="w-full truncate text-base font-medium text-white">
                              {template.name}
                            </h3>
                          </div>

                          <div className="absolute right-2 top-2 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                            <button
                              className="rounded-full bg-white/80 p-1.5 text-foreground backdrop-blur-sm hover:bg-white"
                              onClick={(e) => {
                                e.stopPropagation();
                              }}
                            >
                              <Heart className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="rounded-full bg-muted p-4">
                <Search className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="mt-4 text-lg font-medium text-foreground">
                No templates found
              </h3>
              <p className="mt-2 text-center text-muted-foreground">
                We couldn&apos;t find any templates matching your criteria.
              </p>
              <Button
                variant="outline"
                className="mt-6"
                onClick={() => {
                  setActiveCategory("all");
                  setSearchQuery("");
                }}
              >
                View all templates
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function TemplatesPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center">
          Loading...
        </div>
      }
    >
      <TemplatesContent />
    </Suspense>
  );
}
