import React, { useState, useEffect, useCallback, useRef } from "react";
import { useDebounce } from "use-debounce";
import {
  ChevronLeft,
  ChevronRight,
  LucideLoader2,
  Search,
  Sparkles,
} from "lucide-react";
import { ScrollArea } from "~/components/ui/scroll-area";
import { Button } from "~/components/ui/button";
import { ny } from "~/lib/utils";
import { ToolSidebarHeader } from "../tool-sidebar/tool-sidebar-header";
import { ToolSidebarClose } from "../tool-sidebar/tool-sidebar-close";
import { SidebarBase } from "../tool-sidebar/sidebarBase";
import { useGetAssets, useSearchAssets, Asset } from "~/hooks/useAssets";
import { Input } from "~/components/ui/input";
import { ActiveTool } from "~/lib/types";
import { ClientOnly } from "~/components/client-only";
import { motion, AnimatePresence } from "framer-motion";
import { useDragContext } from "~/contexts/drag-context";

const elementTags = [
  "Sale",
  "Error",
  "Business",
  "Family",
  "Nature",
  "Technology",
  "Food",
  "Travel",
];

const LoadingSkeleton = () => {
  return (
    <div className="grid grid-cols-2 gap-2 p-2">
      {[...Array(8)].map((_, index) => (
        <div
          key={index}
          className={ny(
            "bg-muted overflow-hidden rounded-xl",
            index % 3 === 0 ? "row-span-2 h-80" : "aspect-square",
            "animate-pulse",
          )}
        />
      ))}
    </div>
  );
};

interface ElementCardProps {
  asset: Asset;
  index: number;
  onClick: () => void;
}

const ElementCard = ({ asset, index, onClick }: ElementCardProps) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const { startDrag } = useDragContext();

  const handleMouseDown = (e: React.MouseEvent) => {
    startDrag(e, {
      type: "image",
      data: {
        url: asset.url,
        thumbnail: asset.thumbnail,
      },
    });
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    startDrag(e, {
      type: "image",
      data: {
        url: asset.url,
        thumbnail: asset.thumbnail,
      },
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.02, duration: 0.15 }}
      onClick={onClick}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      className={ny(
        "group border-border bg-muted/30 hover:border-primary/50 relative cursor-grab overflow-hidden rounded-xl border p-2 transition-all select-none hover:shadow-lg active:cursor-grabbing",
        "aspect-square",
      )}
    >
      {!isLoaded && !hasError && (
        <div className="bg-muted absolute inset-0 flex items-center justify-center">
          <div className="border-primary size-5 animate-spin rounded-full border-2 border-t-transparent" />
        </div>
      )}

      {hasError ? (
        <div className="bg-muted absolute inset-0 flex items-center justify-center">
          <span className="text-muted-foreground text-xs">Failed</span>
        </div>
      ) : (
        <img
          src={asset.thumbnail || asset.url}
          alt={asset.name}
          className={ny(
            "pointer-events-none h-full w-full object-contain transition-transform duration-200 group-hover:scale-105",
            isLoaded ? "opacity-100" : "opacity-0",
          )}
          loading="lazy"
          draggable={false}
          crossOrigin="anonymous"
          onLoad={() => setIsLoaded(true)}
          onError={() => setHasError(true)}
        />
      )}

      {/* name tooltip */}
      <div className="absolute right-0 bottom-0 left-0 truncate bg-black/50 px-1.5 py-0.5 text-[9px] text-white opacity-0 transition-opacity group-hover:opacity-100">
        {asset.name.replace(/_/g, " ").slice(0, 25)}
      </div>
    </motion.div>
  );
};

export const ElementsSidebar = ({
  activeTool,
  onChangeActiveTool,
  editor,
}: {
  activeTool: ActiveTool;
  onChangeActiveTool: (tool: ActiveTool) => void;
  editor: any;
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState("");
  const [debouncedSearch] = useDebounce(searchQuery, 500);
  const tagsRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const handleScroll = useCallback(() => {
    if (tagsRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = tagsRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(Math.ceil(scrollLeft + clientWidth) < scrollWidth);
    }
  }, []);

  useEffect(() => {
    const tagsElement = tagsRef.current;
    if (tagsElement) {
      handleScroll();
      tagsElement.addEventListener("scroll", handleScroll);
      return () => tagsElement.removeEventListener("scroll", handleScroll);
    }
  }, [handleScroll]);

  const effectiveSearch = debouncedSearch || selectedTag;

  const { data: assets, isLoading } = useGetAssets({
    search: effectiveSearch,
    type: "DECORATION",
    limit: 50,
  });

  const onClose = () => {
    onChangeActiveTool("select");
  };

  const handleTagClick = (tag: string) => {
    setSelectedTag(tag === selectedTag ? "" : tag);
    setSearchQuery("");
  };

  return (
    <SidebarBase isVisible={activeTool === "elements"} onClose={onClose}>
      <ToolSidebarHeader
        title="Elements"
        description="illustrations & graphics"
        icon={Sparkles}
      />

      <div className="flex flex-1 flex-col overflow-hidden">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="space-y-3 p-4"
        >
          {/* search input */}
          <div className="relative">
            <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
            <Input
              placeholder="Search elements..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setSelectedTag("");
              }}
              className="border-border bg-muted/30 focus:bg-background h-10 rounded-xl pl-10 text-sm transition-colors"
            />
          </div>

          {/* tags */}
          <div className="relative flex items-center">
            <AnimatePresence>
              {canScrollLeft && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="from-card absolute left-0 z-10 h-full w-8 bg-gradient-to-r to-transparent"
                />
              )}
            </AnimatePresence>

            {canScrollLeft && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() =>
                  tagsRef.current?.scrollBy({ left: -200, behavior: "smooth" })
                }
                className="absolute left-0 z-20 size-7"
              >
                <ChevronLeft className="size-4" />
              </Button>
            )}

            <div
              ref={tagsRef}
              className="scrollbar-hide flex gap-2 overflow-x-auto scroll-smooth"
              style={{
                paddingLeft: canScrollLeft ? "1.5rem" : "0",
                paddingRight: canScrollRight ? "1.5rem" : "0",
              }}
            >
              {elementTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => handleTagClick(tag)}
                  className={ny(
                    "shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition-all",
                    selectedTag === tag
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  {tag}
                </button>
              ))}
            </div>

            <AnimatePresence>
              {canScrollRight && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="from-card absolute right-0 z-10 h-full w-8 bg-gradient-to-l to-transparent"
                />
              )}
            </AnimatePresence>

            {canScrollRight && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() =>
                  tagsRef.current?.scrollBy({ left: 200, behavior: "smooth" })
                }
                className="absolute right-0 z-20 size-7"
              >
                <ChevronRight className="size-4" />
              </Button>
            )}
          </div>
        </motion.div>

        {/* element grid */}
        <ScrollArea className="flex-1 px-4">
          {isLoading ? (
            <LoadingSkeleton />
          ) : assets && assets.length > 0 ? (
            <ClientOnly>
              <div className="grid grid-cols-2 gap-2 pb-24">
                {assets.map((asset, index) => (
                  <ElementCard
                    key={asset.id}
                    asset={asset}
                    index={index}
                    onClick={() => editor?.addImage(asset.url)}
                  />
                ))}
              </div>
            </ClientOnly>
          ) : (
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <div className="bg-muted/50 mb-3 flex size-12 items-center justify-center rounded-xl">
                <Sparkles className="text-muted-foreground size-6" />
              </div>
              <p className="text-sm font-medium">No elements found</p>
              <p className="text-muted-foreground text-xs">
                try a different search term
              </p>
            </div>
          )}
        </ScrollArea>
      </div>

      <ToolSidebarClose onClick={onClose} />
    </SidebarBase>
  );
};
