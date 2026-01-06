import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ScrollArea } from "~/components/ui/scroll-area";
import { Input } from "~/components/ui/input";
import { SidebarBase } from "../tool-sidebar/sidebarBase";
import { ToolSidebarClose } from "../tool-sidebar/tool-sidebar-close";
import { ActiveTool } from "~/lib/types";
import { useDragContext } from "~/contexts/drag-context";
import { useGetAssets, Asset } from "~/hooks/useAssets";
import { useInfinitePixabaySearch } from "~/hooks/usePixabay";
import { useDebounce } from "use-debounce";
import {
  Search,
  X,
  ChevronLeft,
  Upload,
  Sparkles,
  Smile,
  Frame,
  Smartphone,
  Loader2,
} from "lucide-react";
import { ny } from "~/lib/utils";

// optimized illustration card with visibility-based loading
interface IllustrationCardProps {
  url: string;
  thumbnail: string;
  alt?: string;
}

const IllustrationCard = ({ url, thumbnail, alt }: IllustrationCardProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const cardRef = useRef<HTMLButtonElement>(null);
  const { startDrag } = useDragContext();

  useEffect(() => {
    if (!cardRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "100px", threshold: 0.01 },
    );

    observer.observe(cardRef.current);
    return () => observer.disconnect();
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    startDrag(e, {
      type: "image",
      data: { url, thumbnail },
    });
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    startDrag(e, {
      type: "image",
      data: { url, thumbnail },
    });
  };

  return (
    <motion.button
      ref={cardRef}
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      className={ny(
        "relative aspect-square cursor-grab overflow-hidden rounded-lg border transition-all active:cursor-grabbing",
        "border-border bg-muted/30 hover:border-primary/50 hover:shadow-md",
      )}
    >
      {!isVisible || (!isLoaded && !hasError) ? (
        <div className="bg-muted absolute inset-0 animate-pulse" />
      ) : null}
      {hasError ? (
        <div className="bg-muted/50 flex size-full items-center justify-center">
          <span className="text-muted-foreground text-xs">!</span>
        </div>
      ) : isVisible ? (
        <img
          src={thumbnail}
          alt={alt || "Illustration"}
          loading="lazy"
          decoding="async"
          className={ny(
            "size-full object-contain p-1 transition-all duration-300",
            isLoaded ? "opacity-100" : "opacity-0",
          )}
          onLoad={() => setIsLoaded(true)}
          onError={() => setHasError(true)}
          draggable={false}
        />
      ) : null}
    </motion.button>
  );
};

interface ElementsSidebarProps {
  editor: any;
  activeTool: ActiveTool;
  onChangeActiveTool: (tool: ActiveTool) => void;
  uploadedImages?: Array<{
    id: string;
    url: string;
    thumbnail: string;
    name?: string;
  }>;
}

interface PreviewCardProps {
  url: string;
  thumbnail: string;
  alt?: string;
  onClick?: () => void;
}

const PreviewCard = ({ url, thumbnail, alt, onClick }: PreviewCardProps) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const { startDrag } = useDragContext();

  const handleMouseDown = (e: React.MouseEvent) => {
    startDrag(e, {
      type: "image",
      data: { url, thumbnail },
    });
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    startDrag(e, {
      type: "image",
      data: { url, thumbnail },
    });
  };

  return (
    <motion.button
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      onClick={onClick}
      className={ny(
        "relative aspect-square cursor-grab overflow-hidden rounded-lg border transition-all active:cursor-grabbing",
        "border-border bg-muted/30 hover:border-primary/50 hover:shadow-md",
      )}
    >
      {!isLoaded && !hasError && (
        <div className="bg-muted absolute inset-0 animate-pulse" />
      )}
      {hasError ? (
        <div className="bg-muted/50 flex size-full items-center justify-center">
          <span className="text-muted-foreground text-xs">!</span>
        </div>
      ) : (
        <img
          src={thumbnail}
          alt={alt || "Element"}
          loading="lazy"
          decoding="async"
          className={ny(
            "size-full object-cover transition-all duration-300",
            isLoaded ? "opacity-100" : "opacity-0",
          )}
          onLoad={() => setIsLoaded(true)}
          onError={() => setHasError(true)}
          draggable={false}
        />
      )}
    </motion.button>
  );
};

interface CategorySectionProps {
  title: string;
  items: Array<{ id: string; url: string; thumbnail: string; alt?: string }>;
  onShowAll: () => void;
  isLoading?: boolean;
  icon?: React.ReactNode;
  maxPreview?: number;
  showEmptyState?: boolean;
  emptyMessage?: string;
}

const CategorySection = ({
  title,
  items,
  onShowAll,
  isLoading,
  icon,
  maxPreview = 4,
  showEmptyState = false,
  emptyMessage = "No items available",
}: CategorySectionProps) => {
  const displayItems = items.slice(0, maxPreview);
  const hasMore = items.length > maxPreview;

  if (isLoading) {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {icon}
            <span className="text-sm font-medium">{title}</span>
          </div>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="bg-muted aspect-square animate-pulse rounded-lg"
            />
          ))}
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    if (showEmptyState) {
      return (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            {icon}
            <span className="text-sm font-medium">{title}</span>
          </div>
          <div className="bg-muted/30 text-muted-foreground rounded-lg p-4 text-center text-xs">
            {emptyMessage}
          </div>
        </div>
      );
    }
    return null;
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {icon}
          <span className="text-sm font-medium">{title}</span>
        </div>
        {hasMore && (
          <button
            onClick={onShowAll}
            className="text-primary hover:text-primary/80 text-xs font-medium transition-colors"
          >
            Show all
          </button>
        )}
      </div>

      <div className="grid grid-cols-4 gap-2">
        <AnimatePresence mode="popLayout">
          {displayItems.map((item) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              layout
            >
              <PreviewCard
                url={item.url}
                thumbnail={item.thumbnail}
                alt={item.alt}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

// expanded category view
interface ExpandedCategoryViewProps {
  title: string;
  searchQuery: string;
  imageType: "vector" | "illustration" | "photo" | "all";
  onBack: () => void;
  onSearchChange: (query: string) => void;
  uploads?: Array<{
    id: string;
    url: string;
    thumbnail: string;
    alt?: string;
  }>;
  illustrations?: Array<{
    id: string;
    url: string;
    thumbnail: string;
    alt?: string;
  }>;
}

const ExpandedCategoryView = ({
  title,
  searchQuery,
  imageType,
  onBack,
  onSearchChange,
  uploads,
  illustrations,
}: ExpandedCategoryViewProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const [localSearch, setLocalSearch] = useState(searchQuery);
  const [debouncedLocalSearch] = useDebounce(localSearch, 300);
  const [localPage, setLocalPage] = useState(1);
  const ITEMS_PER_PAGE = 20;

  // reset page when search changes
  useEffect(() => {
    setLocalPage(1);
  }, [debouncedLocalSearch]);

  // only use pixabay for stickers/frames/mockups (not for uploads/illustrations)
  const shouldUsePixabay = !uploads && !illustrations;
  const {
    data: pixabayData,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfinitePixabaySearch(debouncedLocalSearch || searchQuery, imageType, {
    enabled: shouldUsePixabay,
  });

  const pixabayItems = useMemo(
    () =>
      pixabayData?.pages.flatMap((page) =>
        page.images.map((img: any, index: number) => ({
          id: `pixabay-${img.id}-${index}`,
          url: img.url,
          thumbnail: img.thumbnail || img.preview,
          alt: img.tags?.join(", "),
        })),
      ) || [],
    [pixabayData],
  );

  // for uploads, filter locally
  const filteredUploads = useMemo(() => {
    if (!uploads) return [];
    if (!debouncedLocalSearch) return uploads;
    const query = debouncedLocalSearch.toLowerCase();
    return uploads.filter(
      (u) =>
        u.alt?.toLowerCase().includes(query) ||
        u.id.toLowerCase().includes(query),
    );
  }, [uploads, debouncedLocalSearch]);

  // for illustrations, filter locally
  const filteredIllustrations = useMemo(() => {
    if (!illustrations) return [];
    if (!debouncedLocalSearch) return illustrations;
    const query = debouncedLocalSearch.toLowerCase();
    return illustrations.filter(
      (i) =>
        i.alt?.toLowerCase().includes(query) ||
        i.id.toLowerCase().includes(query),
    );
  }, [illustrations, debouncedLocalSearch]);

  // paginate local items
  const paginatedLocalItems = useMemo(() => {
    const sourceItems = uploads ? filteredUploads : filteredIllustrations;
    return sourceItems.slice(0, localPage * ITEMS_PER_PAGE);
  }, [uploads, filteredUploads, filteredIllustrations, localPage]);

  const hasMoreLocal = useMemo(() => {
    const sourceItems = uploads ? filteredUploads : filteredIllustrations;
    return paginatedLocalItems.length < sourceItems.length;
  }, [uploads, filteredUploads, filteredIllustrations, paginatedLocalItems]);

  // combine results
  const allItems = useMemo(() => {
    if (uploads || illustrations) return paginatedLocalItems;
    return pixabayItems;
  }, [uploads, illustrations, paginatedLocalItems, pixabayItems]);

  const loadMoreLocal = useCallback(() => {
    setLocalPage((prev) => prev + 1);
  }, []);

  // infinite scroll observer
  useEffect(() => {
    if (!loadMoreRef.current) return;

    const hasMore = uploads || illustrations ? hasMoreLocal : hasNextPage;
    if (!hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          if (uploads || illustrations) {
            loadMoreLocal();
          } else if (!isFetchingNextPage) {
            fetchNextPage();
          }
        }
      },
      { threshold: 0.1 },
    );

    observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [
    hasNextPage,
    hasMoreLocal,
    fetchNextPage,
    isFetchingNextPage,
    uploads,
    illustrations,
    loadMoreLocal,
  ]);

  const handleSearchChange = (value: string) => {
    setLocalSearch(value);
    onSearchChange(value);
  };

  return (
    <div className="flex h-full flex-col">
      <div className="border-border flex items-center gap-2 border-b px-4 py-2">
        <button
          onClick={onBack}
          className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-sm"
        >
          <ChevronLeft className="size-4" />
          Elements
        </button>
        <span className="text-muted-foreground">/</span>
        <span className="text-sm font-medium">{title}</span>
      </div>

      <div className="border-border border-b p-4">
        <div className="relative">
          <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
          <Input
            placeholder={`Search ${title.toLowerCase()}...`}
            value={localSearch}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="bg-muted/50 border-0 pl-9"
          />
          {localSearch && (
            <button
              onClick={() => handleSearchChange("")}
              className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2"
            >
              <X className="size-3" />
            </button>
          )}
        </div>
      </div>

      <ScrollArea className="flex-1" ref={scrollRef}>
        <div className="p-4">
          {isLoading && allItems.length === 0 ? (
            <div className="grid grid-cols-3 gap-2">
              {Array.from({ length: 9 }).map((_, i) => (
                <div
                  key={i}
                  className="bg-muted aspect-square animate-pulse rounded-lg"
                />
              ))}
            </div>
          ) : allItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-muted-foreground text-sm">
                {localSearch
                  ? `No ${title.toLowerCase()} found for "${localSearch}"`
                  : "No items found"}
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-2">
                {allItems.map((item) =>
                  illustrations ? (
                    <IllustrationCard
                      key={item.id}
                      url={item.url}
                      thumbnail={item.thumbnail}
                      alt={item.alt}
                    />
                  ) : (
                    <PreviewCard
                      key={item.id}
                      url={item.url}
                      thumbnail={item.thumbnail}
                      alt={item.alt}
                    />
                  ),
                )}
              </div>

              {((hasNextPage && !uploads && !illustrations) ||
                hasMoreLocal) && (
                <div
                  ref={loadMoreRef}
                  className="flex items-center justify-center py-4"
                >
                  {isFetchingNextPage ? (
                    <Loader2 className="text-muted-foreground size-5 animate-spin" />
                  ) : (
                    <button
                      onClick={() =>
                        uploads || illustrations
                          ? loadMoreLocal()
                          : fetchNextPage()
                      }
                      className="text-primary hover:text-primary/80 text-sm"
                    >
                      Load more
                    </button>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

// unified global search view
interface GlobalSearchViewProps {
  searchQuery: string;
  onBack: () => void;
  uploads: Array<{
    id: string;
    url: string;
    thumbnail: string;
    alt?: string;
  }>;
  illustrations: Array<{
    id: string;
    url: string;
    thumbnail: string;
    alt?: string;
  }>;
}

const GlobalSearchView = ({
  searchQuery,
  onBack,
  uploads,
  illustrations,
}: GlobalSearchViewProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // require at least 2 characters for search
  const shouldSearch = searchQuery.length >= 2;

  // search vectors, illustrations, and photos from pixabay
  const {
    data: vectorData,
    isLoading: isLoadingVector,
    fetchNextPage: fetchMoreVector,
    hasNextPage: hasMoreVector,
    isFetchingNextPage: isFetchingMoreVector,
  } = useInfinitePixabaySearch(searchQuery, "vector", {
    enabled: shouldSearch,
  });

  const {
    data: illustrationData,
    isLoading: isLoadingIllustration,
    fetchNextPage: fetchMoreIllustration,
    hasNextPage: hasMoreIllustration,
    isFetchingNextPage: isFetchingMoreIllustration,
  } = useInfinitePixabaySearch(searchQuery, "illustration", {
    enabled: shouldSearch,
  });

  const {
    data: photoData,
    isLoading: isLoadingPhoto,
    fetchNextPage: fetchMorePhoto,
    hasNextPage: hasMorePhoto,
    isFetchingNextPage: isFetchingMorePhoto,
  } = useInfinitePixabaySearch(searchQuery, "photo", { enabled: shouldSearch });

  // combine all results
  const allResults = useMemo(() => {
    if (!shouldSearch) return [];

    const results: Array<{
      id: string;
      url: string;
      thumbnail: string;
      alt?: string;
      source: string;
    }> = [];

    // filter uploads
    const query = searchQuery.toLowerCase();
    const filteredUploads = uploads.filter(
      (u) =>
        u.alt?.toLowerCase().includes(query) ||
        u.id.toLowerCase().includes(query),
    );
    results.push(...filteredUploads.map((u) => ({ ...u, source: "uploads" })));

    // filter local illustrations
    const filteredIllustrations = illustrations.filter(
      (i) =>
        i.alt?.toLowerCase().includes(query) ||
        i.id.toLowerCase().includes(query),
    );
    results.push(
      ...filteredIllustrations.map((i) => ({ ...i, source: "assets" })),
    );

    // add pixabay vectors
    if (vectorData) {
      const vectors = vectorData.pages.flatMap((page) =>
        page.images.map((img: any, index: number) => ({
          id: `vector-${img.id}-${index}`,
          url: img.url,
          thumbnail: img.thumbnail || img.preview,
          alt: img.tags?.join(", "),
          source: "vector",
        })),
      );
      results.push(...vectors);
    }

    // add pixabay illustrations
    if (illustrationData) {
      const illustrations = illustrationData.pages.flatMap((page) =>
        page.images.map((img: any, index: number) => ({
          id: `illustration-${img.id}-${index}`,
          url: img.url,
          thumbnail: img.thumbnail || img.preview,
          alt: img.tags?.join(", "),
          source: "illustration",
        })),
      );
      results.push(...illustrations);
    }

    // add pixabay photos
    if (photoData) {
      const photos = photoData.pages.flatMap((page) =>
        page.images.map((img: any, index: number) => ({
          id: `photo-${img.id}-${index}`,
          url: img.url,
          thumbnail: img.thumbnail || img.preview,
          alt: img.tags?.join(", "),
          source: "photo",
        })),
      );
      results.push(...photos);
    }

    return results;
  }, [
    shouldSearch,
    searchQuery,
    uploads,
    illustrations,
    vectorData,
    illustrationData,
    photoData,
  ]);

  const isLoading = isLoadingVector || isLoadingIllustration || isLoadingPhoto;
  const hasMore = hasMoreVector || hasMoreIllustration || hasMorePhoto;
  const isFetchingMore =
    isFetchingMoreVector || isFetchingMoreIllustration || isFetchingMorePhoto;

  const handleLoadMore = useCallback(() => {
    if (hasMoreVector) fetchMoreVector();
    if (hasMoreIllustration) fetchMoreIllustration();
    if (hasMorePhoto) fetchMorePhoto();
  }, [
    hasMoreVector,
    hasMoreIllustration,
    hasMorePhoto,
    fetchMoreVector,
    fetchMoreIllustration,
    fetchMorePhoto,
  ]);

  // infinite scroll observer
  useEffect(() => {
    if (!loadMoreRef.current || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isFetchingMore) {
          handleLoadMore();
        }
      },
      { threshold: 0.1 },
    );

    observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [hasMore, handleLoadMore, isFetchingMore]);

  if (!shouldSearch) {
    return (
      <div className="flex h-full flex-col">
        <div className="border-border flex items-center gap-2 border-b px-4 py-2">
          <button
            onClick={onBack}
            className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-sm"
          >
            <ChevronLeft className="size-4" />
            Back
          </button>
        </div>
        <div className="flex flex-1 flex-col items-center justify-center p-4 text-center">
          <p className="text-muted-foreground text-sm">
            Type at least 2 characters to search
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="border-border flex items-center gap-2 border-b px-4 py-2">
        <button
          onClick={onBack}
          className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-sm"
        >
          <ChevronLeft className="size-4" />
          Back
        </button>
        <span className="text-muted-foreground">/</span>
        <span className="text-sm font-medium">Search: "{searchQuery}"</span>
        {allResults.length > 0 && (
          <span className="text-muted-foreground ml-auto text-xs">
            {allResults.length} results
          </span>
        )}
      </div>

      <ScrollArea className="flex-1" ref={scrollRef}>
        <div className="p-4">
          {isLoading && allResults.length === 0 ? (
            <div className="grid grid-cols-3 gap-2">
              {Array.from({ length: 9 }).map((_, i) => (
                <div
                  key={i}
                  className="bg-muted aspect-square animate-pulse rounded-lg"
                />
              ))}
            </div>
          ) : allResults.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-muted-foreground text-sm">
                No results found for "{searchQuery}"
              </p>
              <p className="text-muted-foreground/70 text-xs">
                Try a different search term
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-2">
                {allResults.map((item) => (
                  <PreviewCard
                    key={item.id}
                    url={item.url}
                    thumbnail={item.thumbnail}
                    alt={item.alt}
                  />
                ))}
              </div>

              {hasMore && (
                <div
                  ref={loadMoreRef}
                  className="flex items-center justify-center py-4"
                >
                  {isFetchingMore ? (
                    <Loader2 className="text-muted-foreground size-5 animate-spin" />
                  ) : (
                    <button
                      onClick={handleLoadMore}
                      className="text-primary hover:text-primary/80 text-sm"
                    >
                      Load more
                    </button>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

type ExpandedCategory =
  | "stickers"
  | "illustrations"
  | "uploads"
  | "frames"
  | "mockups"
  | null;

export const ElementsSidebar = ({
  editor,
  activeTool,
  onChangeActiveTool,
  uploadedImages = [],
}: ElementsSidebarProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch] = useDebounce(searchQuery, 300);
  const [expandedCategory, setExpandedCategory] =
    useState<ExpandedCategory>(null);
  const [categorySearch, setCategorySearch] = useState("");

  // only fetch when sidebar is active
  const isActive = activeTool === "elements";

  // stickers data - vectors with transparent backgrounds
  const { data: stickersData, isLoading: isLoadingStickers } =
    useInfinitePixabaySearch("sticker emoji icon", "vector", {
      enabled: isActive,
    });

  const stickersRateLimited = stickersData?.pages[0]?.rateLimited || false;
  const stickersNoApiKey = stickersData?.pages[0]?.noApiKey || false;

  const stickerItems = useMemo(
    () =>
      stickersData?.pages
        .flatMap((page) => page.images)
        .slice(0, 20)
        .map((img: any, index: number) => ({
          id: `sticker-${img.id}-${index}`,
          url: img.url,
          thumbnail: img.thumbnail || img.preview,
          alt: img.tags?.join(", "),
        })) || [],
    [stickersData],
  );

  // frames data - borders and decorative frames
  const { data: framesData, isLoading: isLoadingFrames } =
    useInfinitePixabaySearch("frame border decoration", "vector", {
      enabled: isActive,
    });

  const framesRateLimited = framesData?.pages[0]?.rateLimited || false;
  const framesNoApiKey = framesData?.pages[0]?.noApiKey || false;

  const frameItems = useMemo(
    () =>
      framesData?.pages
        .flatMap((page) => page.images)
        .slice(0, 20)
        .map((img: any, index: number) => ({
          id: `frame-${img.id}-${index}`,
          url: img.url,
          thumbnail: img.thumbnail || img.preview,
          alt: img.tags?.join(", "),
        })) || [],
    [framesData],
  );

  // mockups data - device mockups
  const { data: mockupsData, isLoading: isLoadingMockups } =
    useInfinitePixabaySearch("device mockup template", "photo", {
      enabled: isActive,
    });

  const mockupsRateLimited = mockupsData?.pages[0]?.rateLimited || false;
  const mockupsNoApiKey = mockupsData?.pages[0]?.noApiKey || false;

  const mockupItems = useMemo(
    () =>
      mockupsData?.pages
        .flatMap((page) => page.images)
        .slice(0, 20)
        .map((img: any, index: number) => ({
          id: `mockup-${img.id}-${index}`,
          url: img.url,
          thumbnail: img.thumbnail || img.preview,
          alt: img.tags?.join(", "),
        })) || [],
    [mockupsData],
  );

  // determine empty state messages
  const getEmptyMessage = (rateLimited: boolean, noApiKey: boolean) => {
    if (noApiKey) return "Pixabay API not configured";
    if (rateLimited) return "Rate limit exceeded. Try again later.";
    return "No items available";
  };

  // local illustrations
  const { data: assetsData, isLoading: isLoadingAssets } = useGetAssets({
    type: "DECORATION",
    limit: 20,
    enabled: isActive,
  });

  const illustrationItems = useMemo(
    () =>
      assetsData?.map((asset: Asset, index: number) => ({
        id: `asset-${asset.id}-${index}`,
        url: asset.url,
        thumbnail: asset.thumbnail || asset.url,
        alt: asset.name,
      })) || [],
    [assetsData],
  );

  // uploads
  const uploadItems = useMemo(
    () =>
      uploadedImages.map((img, index) => ({
        id: `upload-${img.id}-${index}`,
        url: img.url,
        thumbnail: img.thumbnail,
        alt: img.name,
      })),
    [uploadedImages],
  );

  const onClose = () => {
    onChangeActiveTool("select");
  };

  // handle expanded category view
  if (expandedCategory) {
    const categoryConfig = {
      stickers: {
        title: "Stickers",
        imageType: "vector" as const,
        searchQuery: categorySearch || "sticker emoji icon",
      },
      frames: {
        title: "Frames",
        imageType: "vector" as const,
        searchQuery: categorySearch || "frame border decoration",
      },
      mockups: {
        title: "Mockups",
        imageType: "photo" as const,
        searchQuery: categorySearch || "device mockup template",
      },
      illustrations: {
        title: "Illustrations",
        imageType: "illustration" as const,
        searchQuery: categorySearch,
      },
      uploads: {
        title: "Uploads",
        imageType: "all" as const,
        searchQuery: categorySearch,
      },
    };

    const config = categoryConfig[expandedCategory];

    return (
      <SidebarBase isVisible={activeTool === "elements"} onClose={onClose}>
        <div className="border-border flex items-center justify-between border-b px-4 py-3">
          <h2 className="text-base font-semibold">Elements</h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg p-1.5 transition-colors"
          >
            <X className="size-4" />
          </button>
        </div>

        <ExpandedCategoryView
          title={config.title}
          searchQuery={config.searchQuery}
          imageType={config.imageType}
          onBack={() => {
            setExpandedCategory(null);
            setCategorySearch("");
          }}
          onSearchChange={setCategorySearch}
          uploads={expandedCategory === "uploads" ? uploadItems : undefined}
          illustrations={
            expandedCategory === "illustrations" ? illustrationItems : undefined
          }
        />

        <ToolSidebarClose onClick={onClose} />
      </SidebarBase>
    );
  }

  // handle global search view
  if (debouncedSearch) {
    return (
      <SidebarBase isVisible={activeTool === "elements"} onClose={onClose}>
        <div className="border-border flex items-center justify-between border-b px-4 py-3">
          <h2 className="text-base font-semibold">Elements</h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg p-1.5 transition-colors"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="border-border border-b p-4">
          <div className="relative">
            <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
            <Input
              placeholder="Search vectors, graphics, stickers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-muted/50 border-0 pl-9"
              autoFocus
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2"
              >
                <X className="size-3" />
              </button>
            )}
          </div>
        </div>

        <GlobalSearchView
          searchQuery={debouncedSearch}
          onBack={() => setSearchQuery("")}
          uploads={uploadItems}
          illustrations={illustrationItems}
        />

        <ToolSidebarClose onClick={onClose} />
      </SidebarBase>
    );
  }

  // default category view
  return (
    <SidebarBase isVisible={activeTool === "elements"} onClose={onClose}>
      <div className="border-border flex items-center justify-between border-b px-4 py-3">
        <h2 className="text-base font-semibold">Elements</h2>
        <button
          onClick={onClose}
          className="text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg p-1.5 transition-colors"
        >
          <X className="size-4" />
        </button>
      </div>

      <div className="border-border border-b p-4">
        <div className="relative">
          <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
          <Input
            placeholder="Search vectors, graphics, stickers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-muted/50 border-0 pl-9"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2"
            >
              <X className="size-3" />
            </button>
          )}
        </div>
      </div>

      <ScrollArea className="flex-1">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="space-y-6 p-4"
        >
          {uploadItems.length > 0 && (
            <CategorySection
              title="Uploads"
              items={uploadItems}
              onShowAll={() => setExpandedCategory("uploads")}
              icon={<Upload className="text-muted-foreground size-4" />}
            />
          )}

          {illustrationItems.length > 0 && (
            <CategorySection
              title="Illustrations"
              items={illustrationItems}
              onShowAll={() => setExpandedCategory("illustrations")}
              isLoading={isLoadingAssets}
              icon={<Sparkles className="text-muted-foreground size-4" />}
            />
          )}

          <CategorySection
            title="Stickers"
            items={stickerItems}
            onShowAll={() => setExpandedCategory("stickers")}
            isLoading={isLoadingStickers}
            icon={<Smile className="text-muted-foreground size-4" />}
            showEmptyState={stickersRateLimited || stickersNoApiKey}
            emptyMessage={getEmptyMessage(
              stickersRateLimited,
              stickersNoApiKey,
            )}
          />

          <CategorySection
            title="Frames"
            items={frameItems}
            onShowAll={() => setExpandedCategory("frames")}
            isLoading={isLoadingFrames}
            icon={<Frame className="text-muted-foreground size-4" />}
            showEmptyState={framesRateLimited || framesNoApiKey}
            emptyMessage={getEmptyMessage(framesRateLimited, framesNoApiKey)}
          />

          <CategorySection
            title="Mockups"
            items={mockupItems}
            onShowAll={() => setExpandedCategory("mockups")}
            isLoading={isLoadingMockups}
            icon={<Smartphone className="text-muted-foreground size-4" />}
            showEmptyState={mockupsRateLimited || mockupsNoApiKey}
            emptyMessage={getEmptyMessage(mockupsRateLimited, mockupsNoApiKey)}
          />
        </motion.div>
      </ScrollArea>

      <ToolSidebarClose onClick={onClose} />
    </SidebarBase>
  );
};
