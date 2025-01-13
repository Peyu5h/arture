import React, { useState, useEffect, useCallback, useRef } from "react";
import { useDebounce } from "use-debounce";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { ScrollArea } from "~/components/ui/scroll-area";
import { Button } from "~/components/ui/button";
import { ny } from "~/lib/utils";
import { Editor, ActiveTool } from "../../types";
import { ToolSidebarHeader } from "../tool-sidebar/tool-sidebar-header";
import { ToolSidebarClose } from "../tool-sidebar/tool-sidebar-close";
import { SidebarBase } from "../tool-sidebar/sidebarBase";
import { useGetPhotosByQuery, useGetRandomPhotos } from "~/hooks/useUnsplash";
import { Input } from "~/components/input";
import Image from "next/image";

const imageTags = [
  "Background",
  "Nature",
  "Business",
  "Minimal",
  "Technology",
  "Food",
  "Travel",
  "Abstract",
];

const LoadingSkeleton = () => {
  return (
    <div className="grid grid-cols-2 gap-2 p-2">
      {[...Array(8)].map((_, index) => (
        <div
          key={index}
          className={ny(
            "overflow-hidden rounded-lg bg-gray-200",
            index % 3 === 0 ? "row-span-2 h-80" : "aspect-square",
            "animate-pulse",
          )}
        />
      ))}
    </div>
  );
};

export const ImageSidebar = ({
  activeTool,
  onChangeActiveTool,
  editor,
}: {
  activeTool: ActiveTool;
  onChangeActiveTool: (tool: ActiveTool) => void;
  editor: Editor | undefined;
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState("");
  const [debouncedSearch] = useDebounce(searchQuery, 1000);
  const tagsRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

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

  const { data: randomPhotos, isLoading: isLoadingRandom } = useGetRandomPhotos(
    { count: 20 },
  );

  const { data: searchedPhotos, isLoading: isLoadingSearch } =
    useGetPhotosByQuery({
      query: debouncedSearch || selectedTag,
    });

  const onClose = () => {
    onChangeActiveTool("select");
  };

  const handleTagClick = (tag: string) => {
    setSelectedTag(tag === selectedTag ? "" : tag);
    setSearchQuery("");
  };

  const displayPhotos =
    searchQuery || selectedTag ? searchedPhotos : randomPhotos;

  return (
    <SidebarBase isVisible={activeTool === "images"} onClose={onClose}>
      <ToolSidebarHeader
        title="Images"
        description="Add images to your canvas"
      />

      <div className="flex flex-col gap-4 p-4">
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Search for images"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setSelectedTag("");
            }}
            className="pl-8"
          />
        </div>

        <div className="relative flex items-center">
          {canScrollLeft && (
            <div className="absolute left-0 z-10 h-full w-12 bg-gradient-to-r from-white via-white to-transparent" />
          )}

          {canScrollLeft && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() =>
                tagsRef.current?.scrollBy({ left: -200, behavior: "smooth" })
              }
              className="absolute left-0 z-20 h-8 w-8 hover:bg-transparent"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          )}

          <div
            ref={tagsRef}
            className="scrollbar-hide flex gap-2 overflow-x-auto scroll-smooth"
            style={{
              paddingLeft: canScrollLeft ? "2rem" : "0",
              paddingRight: canScrollRight ? "2rem" : "0",
            }}
          >
            {imageTags.map((tag) => (
              <Button
                key={tag}
                variant={selectedTag === tag ? "default" : "secondary"}
                size="sm"
                onClick={() => handleTagClick(tag)}
                className="flex-shrink-0 whitespace-nowrap rounded-md"
              >
                {tag}
              </Button>
            ))}
          </div>

          {canScrollRight && (
            <div className="absolute right-0 z-10 h-full w-12 bg-gradient-to-l from-white via-white to-transparent" />
          )}

          {canScrollRight && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() =>
                tagsRef.current?.scrollBy({ left: 200, behavior: "smooth" })
              }
              className="absolute right-0 z-20 h-8 w-8 hover:bg-transparent"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          )}
        </div>

        <ScrollArea className="pb-4 pr-2" style={{ maxHeight: "70vh" }}>
          {isLoadingSearch || isLoadingRandom ? (
            <LoadingSkeleton />
          ) : (
            <div className="grid grid-cols-2 gap-2 p-2">
              {displayPhotos?.map((photo, index) => (
                <div
                  onClick={() => editor?.addImage(photo.urls.small)}
                  key={photo.id}
                  className={ny(
                    "group relative cursor-pointer overflow-hidden rounded-lg",
                    index % 3 === 0 ? "row-span-2" : "aspect-square",
                  )}
                >
                  <Image
                    src={photo.urls.small}
                    width={800}
                    height={800}
                    alt={photo.alt_description || " photo"}
                    className="h-full w-full object-cover transition-transform group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 transition-opacity group-hover:bg-opacity-20" />
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </div>

      <ToolSidebarClose onClick={onClose} />
    </SidebarBase>
  );
};
