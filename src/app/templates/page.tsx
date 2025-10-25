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
  ChevronRight,
  Loader2,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";

import { ny } from "~/lib/utils";
import { Navbar } from "~/components/navbar";
import { authClient } from "~/lib/auth-client";
import { useProjects } from "~/hooks/projects.hooks";
import { formatDistanceToNow } from "date-fns";
import { Footer } from "~/components/footer";

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

function TemplatesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
  const [activeCategory, setActiveCategory] = useState(
    searchParams.get("category") || "all",
  );
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const { data: session } = authClient.useSession();
  const { data: recentDesigns = [], isLoading: isProjectsLoading } =
    useProjects();

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

    if (typeof window !== "undefined") {
      const newUrl = `${window.location.pathname}?${params.toString()}`;
      window.history.replaceState(null, "", newUrl);
    }
  }, [searchQuery, searchParams]);

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
    router.push(`/editor/cm8d40lf80001wu38m5oyp8qj`);
  };

  const formatDate = (dateString: any) => {
    if (!dateString) return "";
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch (e) {
      return "recently";
    }
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
    <div className="bg-background flex min-h-screen flex-col">
      <Navbar />

      {/* Hero Section */}
      <section className="border-border/40 from-accent/5 to-background relative overflow-hidden border-b bg-gradient-to-b px-6 pt-32 pb-16">
        {/* Background gradient orbs */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div
            className="bg-gradient-radial from-primary/20 via-primary/5 absolute top-0 -left-60 h-[1000px] w-[1000px] animate-pulse rounded-full to-transparent blur-[100px]"
            style={{ animationDuration: "4s" }}
          />
          <div
            className="bg-gradient-radial from-accent/15 via-accent/5 absolute top-20 -right-40 h-[900px] w-[900px] animate-pulse rounded-full to-transparent blur-[90px]"
            style={{ animationDelay: "1.5s", animationDuration: "5s" }}
          />
        </div>

        <div className="relative z-10 mx-auto max-w-[1400px] text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-6 inline-flex"
          >
            <div className="group border-accent/30 bg-accent/10 hover:bg-accent/20 inline-flex items-center gap-2 rounded-full border px-4 py-2 backdrop-blur-sm transition-all duration-300">
              <Sparkles className="text-accent-foreground h-4 w-4" />
              <span className="text-accent-foreground text-xs font-medium">
                Professional Templates
              </span>
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mb-6 text-5xl font-light tracking-tight md:text-6xl"
          >
            Discover beautiful templates
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-muted-foreground mx-auto mb-8 max-w-2xl text-lg"
          >
            Choose from thousands of professionally designed templates for every
            occasion. Customize and create stunning designs in minutes.
          </motion.p>

          {/* Search Bar */}
          <motion.form
            onSubmit={handleSearch}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mx-auto max-w-2xl"
          >
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                <Search className="text-muted-foreground h-5 w-5" />
              </div>
              <Input
                type="text"
                className="border-border/50 bg-background/80 focus:border-primary focus:ring-primary h-14 w-full rounded-xl pr-12 pl-12 backdrop-blur-sm"
                placeholder="Search templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 flex items-center pr-4"
                  onClick={() => setSearchQuery("")}
                >
                  <X className="text-muted-foreground hover:text-foreground h-5 w-5" />
                </button>
              )}
            </div>
          </motion.form>

          {/* Categories */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mt-8 flex flex-wrap items-center justify-center gap-2"
          >
            {CATEGORIES.map((category) => (
              <button
                key={category.id}
                className={ny(
                  "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium whitespace-nowrap transition-all",
                  activeCategory === category.id
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "border-border/50 bg-card/50 text-muted-foreground hover:bg-accent/10 hover:text-foreground border backdrop-blur-sm",
                )}
                onClick={() => setActiveCategory(category.id)}
              >
                <category.icon className="h-4 w-4" />
                {category.name}
              </button>
            ))}
          </motion.div>
        </div>
      </section>

      {/* User's Recent Designs Section */}
      {session && recentDesigns && recentDesigns.length > 0 && (
        <section className="border-border/40 bg-background border-b px-6 py-16">
          <div className="mx-auto max-w-[1400px]">
            <div className="mb-8 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-semibold">Your Recent Designs</h2>
                <p className="text-muted-foreground mt-1 text-sm">
                  Continue working on your projects
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-primary hover:bg-primary/10"
                onClick={() => router.push("/")}
              >
                View all
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>

            {isProjectsLoading ? (
              <div className="flex h-40 items-center justify-center">
                <Loader2 className="text-primary h-6 w-6 animate-spin" />
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
                {recentDesigns.slice(0, 6).map((design, idx) => (
                  <Link
                    key={design.id || idx}
                    href={`/editor/${design.id}`}
                    className="block"
                  >
                    <div className="group border-border/50 bg-card hover:border-primary/30 relative aspect-[4/3] overflow-hidden rounded-xl border shadow-sm transition-all hover:shadow-md">
                      {design.thumbnailUrl ? (
                        <Image
                          width={320}
                          height={240}
                          src={design.thumbnailUrl}
                          alt={design.name || "Untitled design"}
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      ) : (
                        <div className="bg-muted flex h-full w-full items-center justify-center">
                          <ImageIcon className="text-muted-foreground/50 h-10 w-10" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                      <div className="absolute right-0 bottom-0 left-0 p-4 text-white">
                        <p className="truncate font-medium opacity-0 transition-opacity group-hover:opacity-100">
                          {design.name || "Untitled design"}
                        </p>
                        <p className="text-xs text-gray-300 opacity-0 transition-opacity group-hover:opacity-100">
                          {formatDate(design.updatedAt || design.createdAt)}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Templates Grid */}
      <div ref={scrollContainerRef} className="bg-background flex-1">
        <div className="mx-auto max-w-[1400px] px-6 py-16">
          {filteredTemplates.length > 0 ? (
            <div className="space-y-16">
              {filteredTemplates.map((collection) => (
                <div key={collection.category}>
                  <div className="mb-8 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {categoryMap[collection.category] &&
                        React.createElement(
                          categoryMap[collection.category].icon,
                          {
                            className: "h-6 w-6 text-primary",
                          },
                        )}
                      <h2 className="text-2xl font-semibold">
                        {collection.title}
                      </h2>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-primary hover:bg-primary/10"
                    >
                      See all
                      <ArrowRight className="ml-1 h-4 w-4" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                    {collection.templates.map((template) => (
                      <div
                        key={template.id}
                        className="group border-border/50 bg-card hover:border-primary/30 relative cursor-pointer overflow-hidden rounded-xl border transition-all hover:shadow-md"
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
                            <Badge className="absolute top-2 right-2 bg-amber-500/90 px-2 py-0.5 text-[10px] text-white">
                              PREMIUM
                            </Badge>
                          )}

                          <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/70 via-black/30 to-transparent p-4 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                            <h3 className="w-full truncate text-base font-medium text-white">
                              {template.name}
                            </h3>
                          </div>

                          <div className="absolute top-2 right-2 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                            <button
                              className="text-foreground rounded-full bg-white/80 p-2 backdrop-blur-sm hover:bg-white"
                              onClick={(e) => {
                                e.stopPropagation();
                              }}
                            >
                              <Heart className="h-4 w-4" />
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
              <div className="bg-muted rounded-full p-6">
                <Search className="text-muted-foreground h-8 w-8" />
              </div>
              <h3 className="mt-6 text-xl font-medium">No templates found</h3>
              <p className="text-muted-foreground mt-2 text-center">
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

      <Footer />
    </div>
  );
}

export default function TemplatesPage() {
  return (
    <Suspense
      fallback={
        <div className="bg-background flex h-screen items-center justify-center">
          <Loader2 className="text-primary h-8 w-8 animate-spin" />
        </div>
      }
    >
      <TemplatesContent />
    </Suspense>
  );
}

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
