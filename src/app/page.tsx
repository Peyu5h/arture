"use client";

import { useState } from "react";
import { motion } from "framer-motion";

import {
  ChevronRight,
  Image as ImageIcon,
  Plus,
  LucideLoader2,
} from "lucide-react";
import Link from "next/link";

import { cn } from "~/lib/utils";
import { Button } from "~/components/ui/button";
import { useRouter } from "next/navigation";

import { formatDistanceToNow } from "date-fns";
import { useProjects } from "~/hooks/projects.hooks";
import { authClient } from "~/lib/auth-client";

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "~/components/ui/carousel";
import Image from "next/image";

export default function Home() {
  const [showAllRecent, setShowAllRecent] = useState(false);
  const showAllTrending = false;
  const router = useRouter();

  const { isPending: isSessionLoading } = authClient.useSession();

  const {
    data: recentDesigns = [],
    isLoading: isProjectsLoading,
    error: projectsError,
  } = useProjects();

  if (isSessionLoading || isProjectsLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <LucideLoader2 className="animate-spin" />
      </div>
    );
  }

  if (projectsError) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p>Error loading projects: {projectsError.message}</p>
      </div>
    );
  }

  const CANVAS_RATIOS = [
    {
      name: "Square",
      ratio: "1:1",
      width: 1080,
      height: 1080,
      icon: (
        <div className="border-primary-300 h-12 w-12 rounded-md border-2" />
      ),
      description: "Perfect for Instagram posts",
    },
    {
      name: "Portrait",
      ratio: "4:5",
      width: 1080,
      height: 1350,
      icon: (
        <div className="border-primary-300 h-14 w-12 rounded-md border-2" />
      ),
      description: "Best for Pinterest and Instagram",
    },
    {
      name: "Landscape",
      ratio: "16:9",
      width: 1920,
      height: 1080,
      icon: (
        <div className="border-primary-300 h-10 w-16 rounded-md border-2" />
      ),
      description: "Great for presentations and banners",
    },
    {
      name: "Story",
      ratio: "9:16",
      width: 1080,
      height: 1920,
      icon: (
        <div className="border-primary-300 h-16 w-10 rounded-md border-2" />
      ),
      description: "Ideal for social media stories",
    },
    {
      name: "Custom",
      ratio: "Custom",
      width: 0,
      height: 0,
      icon: <Plus className="text-primary-500 h-6 w-6" />,
      description: "Create your own dimensions",
    },
  ];

  const TRENDING_DESIGNS = [
    {
      id: "trending-1",
      name: "Ganesh Chaturthi",
      image: "/templates/instagram-post.jpg",
      description: "Create divine tributes for this auspicious festival",
    },
    {
      id: "trending-2",
      name: "Diwali Celebration",
      image: "/templates/digital-painting.jpg",
      description: "Light up your designs with festive creativity",
    },
    {
      id: "trending-3",
      name: "Holi Festival",
      image: "/templates/vector-art.jpg",
      description: "Vibrant designs for the festival of colors",
    },
    {
      id: "trending-4",
      name: "Gudi Padwa",
      image: "/templates/business-card.jpg",
      description: "Welcome the new year with traditional designs",
    },
    {
      id: "trending-5",
      name: "Shivaji Maharaj Tribute",
      image: "/templates/presentation.jpg",
      description: "Honor the legendary warrior with powerful visuals",
    },
  ];

  const handleExploreMore = () => {
    router.push("/templates");
  };

  const handleCanvasRatioClick = (ratio: any) => {
    router.push(
      `/editor/new?width=${ratio.width}&height=${ratio.height}&name=${encodeURIComponent(ratio.name)}`,
    );
  };

  const handleTrendingDesignClick = (design: any) => {
    router.push(`/editor/template/${design.id}`);
  };

  const formatDate = (dateString: any) => {
    if (!dateString) return "";
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch (e) {
      return "recently";
    }
  };

  return (
    <main className="">
      <div className="mx-auto max-w-[1440px] px-4 pb-8 sm:px-6 lg:px-8">
        <div className="container">
          <div className="my-20">
            <motion.h2
              className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              Start a new design
            </motion.h2>

            <motion.div
              className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              {CANVAS_RATIOS.map((ratio) => (
                <div
                  key={ratio.name}
                  className={cn(
                    "hover:border-primary-300 group flex cursor-pointer flex-col items-center justify-center rounded-xl border p-6 transition-all hover:border-secondary-foreground/20",
                    ratio.name === "Custom"
                      ? "border-primary-200 bg-primary-50 border-dashed"
                      : "border-border bg-card",
                  )}
                  onClick={() => handleCanvasRatioClick(ratio)}
                >
                  <div className="mb-4 flex h-16 items-center justify-center">
                    {ratio.icon}
                  </div>
                  <h3 className="font-medium text-foreground">{ratio.name}</h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {ratio.ratio}
                  </p>
                  <p className="mt-2 text-center text-[10px] text-muted-foreground/70">
                    {ratio.description}
                  </p>
                </div>
              ))}
            </motion.div>
          </div>

          {/* ========= RECENT DESIGNS ========= */}
          <div className="mb-20">
            <div className="mb-8 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-bold tracking-tight text-foreground">
                  Recent designs
                </h2>
              </div>
              {recentDesigns?.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-primary hover:bg-primary/10 hover:text-primary/90"
                  onClick={() => setShowAllRecent(!showAllRecent)}
                >
                  {showAllRecent ? "Show less" : "View all"}
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              )}
            </div>

            {isProjectsLoading ? (
              <div className="flex h-40 items-center justify-center rounded-xl border bg-card/50">
                <LucideLoader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : projectsError ? (
              <div className="flex h-40 items-center justify-center rounded-xl border bg-destructive/10 text-destructive">
                <p>Error loading recent designs</p>
              </div>
            ) : recentDesigns?.length === 0 ? (
              <div className="flex h-40 flex-col items-center justify-center rounded-xl border bg-card/50">
                <p className="text-muted-foreground">No recent designs</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4"
                  onClick={() => handleCanvasRatioClick(CANVAS_RATIOS[0])}
                >
                  Create your first design
                </Button>
              </div>
            ) : !showAllRecent ? (
              <Carousel
                opts={{
                  align: "start",
                  loop: false,
                }}
                className="w-full"
              >
                <CarouselContent className="-ml-4">
                  {recentDesigns?.map((design, idx) => (
                    <CarouselItem
                      key={design.id || idx}
                      className="pl-4 md:basis-1/3 lg:basis-1/4"
                    >
                      <Link
                        href={`/editor/${design.id}`}
                        className="block h-full"
                      >
                        <div className="group relative aspect-[4/3] overflow-hidden rounded-xl border bg-card shadow-sm transition-all hover:shadow-md">
                          {design.thumbnailUrl ? (
                            <Image
                              width={640}
                              height={480}
                              src={design.thumbnailUrl}
                              alt={design.name || "Untitled design"}
                              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center bg-muted">
                              <ImageIcon className="h-10 w-10 text-muted-foreground/50" />
                            </div>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                          <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                            <p className="font-medium opacity-0 transition-opacity group-hover:opacity-100">
                              {design.name || "Untitled design"}
                            </p>
                            <p className="text-xs text-gray-300 opacity-0 transition-opacity group-hover:opacity-100">
                              {formatDate(design.updatedAt || design.createdAt)}
                            </p>
                          </div>
                        </div>
                      </Link>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                {recentDesigns.length > 3 && (
                  <>
                    <CarouselPrevious className="bg-background" />
                    <CarouselNext className="bg-background" />
                  </>
                )}
              </Carousel>
            ) : (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {recentDesigns.map((design, idx) => (
                  <Link
                    key={design.id || idx}
                    href={`/editor/${design.id}`}
                    className="block"
                  >
                    <div className="group relative aspect-[4/3] overflow-hidden rounded-xl border bg-card shadow-sm transition-all hover:shadow-md">
                      {design.thumbnailUrl ? (
                        <Image
                          src={design.thumbnailUrl}
                          alt={design.name || "Untitled design"}
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-muted">
                          <ImageIcon className="h-10 w-10 text-muted-foreground/50" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                      <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                        <p className="font-medium opacity-0 transition-opacity group-hover:opacity-100">
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
        </div>

        {/* ========== TREANDING ========= */}
        <div className="mb-10">
          <div className="mb-8 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-bold tracking-tight text-foreground">
                What&apos;s trending
              </h2>
            </div>
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                className="border-primary/20 text-primary hover:bg-primary/10"
                onClick={handleExploreMore}
              >
                Explore more
              </Button>
            </div>
          </div>

          {!showAllTrending ? (
            <Carousel
              opts={{
                align: "start",
                loop: false,
              }}
              className="w-full"
            >
              <CarouselContent className="-ml-4">
                {TRENDING_DESIGNS.map((design, idx) => (
                  <CarouselItem
                    key={design.id || idx}
                    className="pl-4 md:basis-1/2 lg:basis-1/3"
                  >
                    <div
                      className="group relative aspect-video cursor-pointer overflow-hidden rounded-xl border bg-card shadow-sm transition-all hover:shadow-md"
                      onClick={() => handleExploreMore()}
                    >
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80 hover:from-black/60" />
                      <Image
                        width={640}
                        height={360}
                        src={design.image}
                        alt={design.name}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 flex flex-col justify-end p-6 text-white">
                        <p className="text-lg font-bold">{design.name}</p>
                        <p className="mt-1 text-sm text-gray-200">
                          {design.description}
                        </p>
                      </div>
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              {TRENDING_DESIGNS.length > 2 && (
                <>
                  <CarouselPrevious className="bg-background" />
                  <CarouselNext className="bg-background" />
                </>
              )}
            </Carousel>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {TRENDING_DESIGNS.map((design, idx) => (
                <div
                  key={design.id || idx}
                  className="group relative aspect-video cursor-pointer overflow-hidden rounded-xl border bg-card shadow-sm transition-all hover:shadow-md"
                  onClick={() => handleTrendingDesignClick(design)}
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80" />
                  <Image
                    width={640}
                    height={360}
                    src={design.image}
                    alt={design.name}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 flex flex-col justify-end p-6 text-white">
                    <p className="text-lg font-bold">{design.name}</p>
                    <p className="mt-1 text-sm text-gray-200">
                      {design.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
