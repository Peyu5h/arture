import React, { useState, useEffect, useCallback, useRef } from "react";
import { useDebounce } from "use-debounce";
import {
  ChevronLeft,
  ChevronRight,
  Search,
  Sparkles,
  Wand2,
  Loader2,
} from "lucide-react";
import { ScrollArea } from "~/components/ui/scroll-area";
import { Button } from "~/components/ui/button";
import { ny } from "~/lib/utils";
import { ToolSidebarHeader } from "../tool-sidebar/tool-sidebar-header";
import { ToolSidebarClose } from "../tool-sidebar/tool-sidebar-close";
import { SidebarBase } from "../tool-sidebar/sidebarBase";
import { useGetAssets, useEnhancedSearch, Asset } from "~/hooks/useAssets";
import { Input } from "~/components/ui/input";
import { ActiveTool } from "~/lib/types";
import { ClientOnly } from "~/components/client-only";
import { AnimatePresence, motion } from "framer-motion";
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

const ITEMS_PER_PAGE = 30;

const LoadingSkeleton = () => {
  return (
    <div className="grid grid-cols-2 gap-2 p-2">
      {[...Array(8)].map((_, index) => (
        <div
          key={index}
          className={ny(
            "bg-muted overflow-hidden rounded-xl",
            "aspect-square",
            "animate-pulse",
          )}
        />
      ))}
    </div>
  );
};

interface ElementCardProps {
  asset: Asset;
  onClick: () => void;
}

const ElementCard = React.memo(({ asset, onClick }: ElementCardProps) => {
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
    <div
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
          onLoad={() => setIsLoaded(true)}
          onError={() => setHasError(true)}
        />
      )}

      {/* name tooltip */}
      <div className="absolute right-0 bottom-0 left-0 truncate bg-black/50 px-1.5 py-0.5 text-[9px] text-white opacity-0 transition-opacity group-hover:opacity-100">
        {asset.name.replace(/_/g, " ").slice(0, 25)}
      </div>
    </div>
  );
});
ElementCard.displayName = "ElementCard";

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
  const [debouncedSearch] = useDebounce(searchQuery, 300);
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const tagsRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
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

  // use enhanced search for fuzzy + ai suggestions
  const {
    assets: enhancedAssets,
    isLoading: isEnhancedLoading,
    isAiLoading,
  } = useEnhancedSearch(effectiveSearch, "DECORATION");

  // fallback to regular fetch when no search
  const { data: defaultAssets, isLoading: isDefaultLoading } = useGetAssets({
    type: "DECORATION",
    limit: 200,
  });

  // use enhanced search results when searching, otherwise default
  const allAssets = effectiveSearch ? enhancedAssets : defaultAssets;
  const isLoading = effectiveSearch ? isEnhancedLoading : isDefaultLoading;

  // paginated assets
  const assets = allAssets?.slice(0, visibleCount) || [];
  const hasMore = (allAssets?.length || 0) > visibleCount;

  // reset visible count when search changes
  useEffect(() => {
    setVisibleCount(ITEMS_PER_PAGE);
  }, [effectiveSearch]);

  // infinite scroll handler
  const handleLoadMore = useCallback(() => {
    if (isLoadingMore || !hasMore) return;
    setIsLoadingMore(true);
    // simulate slight delay for smoothness
    setTimeout(() => {
      setVisibleCount((prev) => prev + ITEMS_PER_PAGE);
      setIsLoadingMore(false);
    }, 100);
  }, [hasMore, isLoadingMore]);

  // scroll detection for infinite scroll
  const handleScrollArea = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const scrollBottom = target.scrollHeight - target.scrollTop - target.clientHeight;
    // trigger load more when 200px from bottom
    if (scrollBottom < 200 && hasMore && !isLoading && !isLoadingMore) {
      handleLoadMore();
    }
  }, [hasMore, isLoading, isLoadingMore, handleLoadMore]);

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
        <div className="space-y-3 p-4">
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
            {/* ai loading indicator */}
            <AnimatePresence>
              {isAiLoading && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="absolute top-1/2 right-3 flex -translate-y-1/2 items-center gap-1"
                >
                  <Wand2 className="text-primary size-3.5 animate-pulse" />
                  <span className="text-muted-foreground text-[10px]">AI</span>
                </motion.div>
              )}
            </AnimatePresence>
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
        </div>

        {/* element grid with infinite scroll */}
        <div
          ref={scrollAreaRef}
          className="flex-1 overflow-y-auto px-4"
          onScroll={handleScrollArea}
        >
          {isLoading ? (
            <LoadingSkeleton />
          ) : assets && assets.length > 0 ? (
            <ClientOnly>
              <div className="grid grid-cols-2 gap-2 pb-4">
                {assets.map((asset) => (
                  <ElementCard
                    key={asset.id}
                    asset={asset}
                    onClick={() => editor?.addImage(asset.url)}
                  />
                ))}
              </div>
              {/* loading more indicator */}
              {(isLoadingMore || hasMore) && (
                <div className="flex justify-center py-4">
                  <Loader2 className="text-muted-foreground size-5 animate-spin" />
                </div>
              )}
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
        </div>
      </div>

      <ToolSidebarClose onClick={onClose} />
    </SidebarBase>
  );
};
