"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import {
  ChevronRight,
  Loader2,
  Image as ImageIcon,
  Clock,
  MoreHorizontal,
  Trash2,
  Pencil,
  Copy,
} from "lucide-react";
import { Project } from "@prisma/client";

import { cn } from "~/lib/utils";
import { Button } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";

interface RecentDesignsProps {
  designs: Project[];
  isLoading?: boolean;
  title?: string;
  description?: string;
  initialCount?: number;
  incrementCount?: number;
  maxColumns?: number;
}

const ITEMS_PER_ROW = 5;
const INITIAL_ROWS = 1;
const INCREMENT_ROWS = 4;

export const RecentDesigns = ({
  designs,
  isLoading = false,
  title = "Your Recent Designs",
  description = "Continue working on your projects",
  initialCount = ITEMS_PER_ROW * INITIAL_ROWS,
  incrementCount = ITEMS_PER_ROW * INCREMENT_ROWS,
  maxColumns = ITEMS_PER_ROW,
}: RecentDesignsProps) => {
  const router = useRouter();
  const [visibleCount, setVisibleCount] = useState(initialCount);
  const [isExpanded, setIsExpanded] = useState(false);

  // sort by updatedAt descending
  const sortedDesigns = useMemo(() => {
    return [...designs].sort((a, b) => {
      const dateA = new Date(a.updatedAt || a.createdAt).getTime();
      const dateB = new Date(b.updatedAt || b.createdAt).getTime();
      return dateB - dateA;
    });
  }, [designs]);

  const visibleDesigns = sortedDesigns.slice(0, visibleCount);
  const hasMore = visibleCount < sortedDesigns.length;
  const totalCount = sortedDesigns.length;

  const handleViewMore = () => {
    if (!isExpanded) {
      setIsExpanded(true);
      setVisibleCount(incrementCount);
    } else {
      setVisibleCount((prev) => Math.min(prev + incrementCount, totalCount));
    }
  };

  const handleCollapse = () => {
    setIsExpanded(false);
    setVisibleCount(initialCount);
  };

  const formatDate = (date: Date | string | null) => {
    if (!date) return "Recently";
    try {
      return formatDistanceToNow(new Date(date), { addSuffix: true });
    } catch {
      return "Recently";
    }
  };

  if (isLoading) {
    return (
      <section className="border-border/40 bg-background border-b px-6 py-16">
        <div className="mx-auto max-w-[1400px]">
          <div className="mb-8">
            <div className="bg-muted h-8 w-48 animate-pulse rounded" />
            <div className="bg-muted mt-2 h-4 w-64 animate-pulse rounded" />
          </div>
          <div className="flex h-40 items-center justify-center">
            <Loader2 className="text-primary h-6 w-6 animate-spin" />
          </div>
        </div>
      </section>
    );
  }

  if (!designs || designs.length === 0) {
    return null;
  }

  return (
    <section className="border-border/40 bg-background border-b px-6 py-16">
      <div className="mx-auto max-w-[1400px]">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h2 className="text-foreground text-2xl font-semibold">{title}</h2>
            <p className="text-muted-foreground mt-1 text-sm">{description}</p>
          </div>
          <div className="flex items-center gap-2">
            {isExpanded && (
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-foreground"
                onClick={handleCollapse}
              >
                Show less
              </Button>
            )}
            {!isExpanded && totalCount > initialCount && (
              <Button
                variant="ghost"
                size="sm"
                className="text-primary hover:bg-primary/10"
                onClick={handleViewMore}
              >
                View all ({totalCount})
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        <motion.div
          layout
          className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4 lg:gap-6 xl:grid-cols-5"
        >
          <AnimatePresence mode="popLayout">
            {visibleDesigns.map((design, idx) => (
              <DesignCard
                key={design.id}
                design={design}
                index={idx}
                formatDate={formatDate}
              />
            ))}
          </AnimatePresence>
        </motion.div>

        {isExpanded && hasMore && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 flex justify-center"
          >
            <Button
              variant="outline"
              onClick={handleViewMore}
              className="min-w-[200px]"
            >
              Show more ({totalCount - visibleCount} remaining)
            </Button>
          </motion.div>
        )}
      </div>
    </section>
  );
};

interface DesignCardProps {
  design: Project;
  index: number;
  formatDate: (date: Date | string | null) => string;
}

const DesignCard = ({ design, index, formatDate }: DesignCardProps) => {
  const router = useRouter();
  const [isHovered, setIsHovered] = useState(false);
  const [imageError, setImageError] = useState(false);

  const handleEdit = () => {
    router.push(`/editor/${design.id}`);
  };

  const handleDuplicate = () => {
    // todo: implement duplicate
    console.log("Duplicate:", design.id);
  };

  const handleDelete = () => {
    // todo: implement delete
    console.log("Delete:", design.id);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2, delay: index * 0.03 }}
      className="group relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Link href={`/editor/${design.id}`} className="block">
        <div
          className={cn(
            "border-border/50 bg-card relative aspect-[4/3] overflow-hidden rounded-xl border shadow-sm transition-all duration-200",
            "hover:border-primary/30 hover:shadow-md",
          )}
        >
          {design.thumbnailUrl && !imageError ? (
            <Image
              width={400}
              height={300}
              src={design.thumbnailUrl}
              alt={design.name || "Untitled design"}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              onError={() => setImageError(true)}
              priority={index < 5}
            />
          ) : (
            <div className="bg-muted flex h-full w-full items-center justify-center">
              <ImageIcon className="text-muted-foreground/50 h-10 w-10" />
            </div>
          )}

          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100" />

          <div className="absolute right-0 bottom-0 left-0 p-3 text-white">
            <p className="truncate text-sm font-medium opacity-0 transition-opacity duration-200 group-hover:opacity-100">
              {design.name || "Untitled design"}
            </p>
            <div className="mt-1 flex items-center gap-1 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
              <Clock className="h-3 w-3 text-gray-300" />
              <span className="text-xs text-gray-300">
                {formatDate(design.updatedAt || design.createdAt)}
              </span>
            </div>
          </div>
        </div>
      </Link>

      <div
        className={cn(
          "absolute top-2 right-2 transition-opacity duration-200",
          isHovered ? "opacity-100" : "opacity-0",
        )}
      >
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="secondary"
              size="icon"
              className="h-8 w-8 bg-white/90 shadow-sm backdrop-blur-sm hover:bg-white"
              onClick={(e) => e.preventDefault()}
            >
              <MoreHorizontal className="h-4 w-4 text-gray-700" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuItem onClick={handleEdit}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleDuplicate}>
              <Copy className="mr-2 h-4 w-4" />
              Duplicate
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleDelete}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="mt-2 px-1">
        <p className="text-foreground truncate text-sm font-medium">
          {design.name || "Untitled design"}
        </p>
        <p className="text-muted-foreground text-xs">
          {design.width} x {design.height}
        </p>
      </div>
    </motion.div>
  );
};

export default RecentDesigns;
