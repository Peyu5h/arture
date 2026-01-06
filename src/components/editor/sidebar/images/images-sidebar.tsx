import { useState, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { ScrollArea } from "~/components/ui/scroll-area";
import { Input } from "~/components/ui/input";
import { SidebarBase } from "../tool-sidebar/sidebarBase";
import { ToolSidebarClose } from "../tool-sidebar/tool-sidebar-close";
import { ActiveTool } from "~/lib/types";
import { useDragContext } from "~/contexts/drag-context";
import {
  useInfiniteRandomPhotos,
  useInfinitePhotosByQuery,
} from "~/hooks/useUnsplash";
import { useInfinitePixabaySearch } from "~/hooks/usePixabay";
import { useDebounce } from "use-debounce";
import { Search, X, ChevronLeft, ChevronRight } from "lucide-react";
import { ny } from "~/lib/utils";

interface ImagesSidebarProps {
  editor: any;
  activeTool: ActiveTool;
  onChangeActiveTool: (tool: ActiveTool) => void;
}

const imageTags = [
  "Nature",
  "Business",
  "Technology",
  "Abstract",
  "People",
  "Architecture",
  "Food",
  "Travel",
  "Animals",
  "Art",
];

const LoadingSkeleton = () => (
  <div className="grid grid-cols-2 gap-2">
    {Array.from({ length: 8 }).map((_, i) => (
      <div key={i} className="bg-muted aspect-[4/3] animate-pulse rounded-lg" />
    ))}
  </div>
);

interface ImageCardProps {
  url: string;
  thumbnail: string;
  alt?: string;
}

const ImageCard = ({ url, thumbnail, alt }: ImageCardProps) => {
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
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      className={ny(
        "relative aspect-[4/3] cursor-grab overflow-hidden rounded-lg border transition-all active:cursor-grabbing",
        "border-border bg-muted/30 hover:border-primary/50 hover:shadow-md",
      )}
    >
      {!isLoaded && !hasError && (
        <div className="bg-muted absolute inset-0 animate-pulse" />
      )}
      {hasError ? (
        <div className="bg-muted/50 flex size-full items-center justify-center">
          <span className="text-muted-foreground text-xs">Error</span>
        </div>
      ) : (
        <img
          src={thumbnail}
          alt={alt || "Image"}
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

export const ImagesSidebar = ({
  editor,
  activeTool,
  onChangeActiveTool,
}: ImagesSidebarProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [debouncedSearch] = useDebounce(searchQuery, 300);
  const tagsRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const handleScroll = useCallback(() => {
    if (!tagsRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = tagsRef.current;
    setCanScrollLeft(scrollLeft > 0);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 5);
  }, []);

  const effectiveQuery = debouncedSearch || selectedTag || "";

  // unsplash data
  const {
    data: randomData,
    isLoading: isLoadingRandom,
    fetchNextPage: fetchNextRandom,
    hasNextPage: hasNextRandom,
    isFetchingNextPage: isFetchingNextRandom,
  } = useInfiniteRandomPhotos({ count: 20 });

  const {
    data: searchData,
    isLoading: isLoadingSearch,
    fetchNextPage: fetchNextSearch,
    hasNextPage: hasNextSearch,
    isFetchingNextPage: isFetchingNextSearch,
  } = useInfinitePhotosByQuery({ query: effectiveQuery });

  // pixabay data
  const {
    data: pixabayData,
    isLoading: isLoadingPixabay,
    fetchNextPage: fetchNextPixabay,
    hasNextPage: hasNextPixabay,
    isFetchingNextPage: isFetchingNextPixabay,
  } = useInfinitePixabaySearch(effectiveQuery, "photo");

  // combine results
  const unsplashPhotos = effectiveQuery
    ? searchData?.pages.flatMap((page) => page.results || page) || []
    : randomData?.pages.flat() || [];

  const pixabayPhotos = pixabayData?.pages.flatMap((page) => page.images) || [];

  // merge all photos with unique IDs
  const allPhotos = [
    ...unsplashPhotos.map((photo: any, index: number) => ({
      id: `unsplash-${photo.id}-${index}`,
      url: photo.urls?.full || photo.urls?.regular,
      thumbnail: photo.urls?.small || photo.urls?.thumb,
      alt: photo.alt_description,
    })),
    ...pixabayPhotos.map((photo: any, index: number) => ({
      id: `pixabay-${photo.id}-${index}`,
      url: photo.url,
      thumbnail: photo.thumbnail || photo.preview,
      alt: photo.tags?.join(", "),
    })),
  ];

  const isLoading = effectiveQuery
    ? isLoadingSearch || isLoadingPixabay
    : isLoadingRandom;

  const isFetchingNext = effectiveQuery
    ? isFetchingNextSearch || isFetchingNextPixabay
    : isFetchingNextRandom;

  const hasNextPage = effectiveQuery
    ? hasNextSearch || hasNextPixabay
    : hasNextRandom;

  const fetchNextPage = () => {
    if (effectiveQuery) {
      if (hasNextSearch) fetchNextSearch();
      if (hasNextPixabay) fetchNextPixabay();
    } else {
      fetchNextRandom();
    }
  };

  const handleScrollArea = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const scrollBottom =
      target.scrollHeight - target.scrollTop - target.clientHeight;
    if (scrollBottom < 200 && hasNextPage && !isFetchingNext) {
      fetchNextPage();
    }
  };

  const onClose = () => {
    onChangeActiveTool("select");
  };

  const handleTagClick = (tag: string) => {
    setSelectedTag(selectedTag === tag ? null : tag);
    setSearchQuery("");
  };

  return (
    <SidebarBase isVisible={activeTool === "images"} onClose={onClose}>
      <div className="border-border flex items-center justify-between border-b px-4 py-3">
        <h2 className="text-base font-semibold">Images</h2>
        <button
          onClick={onClose}
          className="text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg p-1.5 transition-colors"
        >
          <X className="size-4" />
        </button>
      </div>

      <div className="border-border space-y-3 border-b p-4">
        <div className="relative">
          <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
          <Input
            placeholder="Search ..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setSelectedTag(null);
            }}
            className="bg-muted/50 border-0 pl-9"
          />
        </div>

        <div className="relative">
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: canScrollLeft ? 1 : 0 }}
            transition={{ duration: 0.15 }}
            onClick={() =>
              tagsRef.current?.scrollBy({ left: -100, behavior: "smooth" })
            }
            className="bg-card/90 absolute top-1/2 left-0 z-10 flex size-6 -translate-y-1/2 items-center justify-center rounded-full shadow-md"
            style={{ paddingLeft: 1, paddingRight: 1 }}
          >
            <ChevronLeft className="size-3" />
          </motion.button>

          <div
            ref={tagsRef}
            onScroll={handleScroll}
            className="flex gap-1.5 overflow-x-auto py-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {imageTags.map((tag) => (
              <motion.button
                key={tag}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleTagClick(tag)}
                className={ny(
                  "flex-shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-all",
                  selectedTag === tag
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80",
                )}
              >
                {tag}
              </motion.button>
            ))}
          </div>

          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: canScrollRight ? 1 : 0 }}
            transition={{ duration: 0.15 }}
            onClick={() =>
              tagsRef.current?.scrollBy({ left: 100, behavior: "smooth" })
            }
            className="bg-card/90 absolute top-1/2 right-0 z-10 flex size-6 -translate-y-1/2 items-center justify-center rounded-full shadow-md"
          >
            <ChevronRight className="size-3" />
          </motion.button>
        </div>
      </div>

      <ScrollArea className="flex-1" onScrollCapture={handleScrollArea}>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="p-4"
        >
          {isLoading ? (
            <LoadingSkeleton />
          ) : allPhotos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-muted-foreground text-sm">No images found</p>
              <p className="text-muted-foreground/70 text-xs">
                Try a different search term
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-2">
                {allPhotos.map((photo) => (
                  <ImageCard
                    key={photo.id}
                    url={photo.url}
                    thumbnail={photo.thumbnail}
                    alt={photo.alt}
                  />
                ))}
              </div>

              {isFetchingNext && (
                <div className="flex justify-center py-4">
                  <div className="bg-muted h-2 w-2 animate-pulse rounded-full" />
                  <div className="bg-muted mx-1 h-2 w-2 animate-pulse rounded-full delay-100" />
                  <div className="bg-muted h-2 w-2 animate-pulse rounded-full delay-200" />
                </div>
              )}
            </>
          )}
        </motion.div>
      </ScrollArea>

      <ToolSidebarClose onClick={onClose} />
    </SidebarBase>
  );
};
