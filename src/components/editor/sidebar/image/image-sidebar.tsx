import React, { useState, useEffect, useCallback, useRef } from "react";
import { useDebounce } from "use-debounce";
import {
  ChevronLeft,
  ChevronRight,
  LucideLoader2,
  Search,
  Upload,
  ImagePlus,
} from "lucide-react";
import { ScrollArea } from "~/components/ui/scroll-area";
import { Button } from "~/components/ui/button";
import { ny } from "~/lib/utils";
import { ToolSidebarHeader } from "../tool-sidebar/tool-sidebar-header";
import { ToolSidebarClose } from "../tool-sidebar/tool-sidebar-close";
import { SidebarBase } from "../tool-sidebar/sidebarBase";
import { useGetPhotosByQuery, useGetRandomPhotos } from "~/hooks/useUnsplash";
import { Input } from "~/components/ui/input";
import { ActiveTool } from "~/lib/types";
import { ClientOnly } from "~/components/client-only";
import { motion, AnimatePresence } from "framer-motion";
import { useDragContext } from "~/contexts/drag-context";

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
            "bg-muted overflow-hidden rounded-xl",
            index % 3 === 0 ? "row-span-2 h-80" : "aspect-square",
            "animate-pulse",
          )}
        />
      ))}
    </div>
  );
};

interface ImageCardProps {
  photo: any;
  index: number;
  onClick: () => void;
}

const ImageCard = ({ photo, index, onClick }: ImageCardProps) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const { startDrag } = useDragContext();

  if (!photo?.urls?.small || !photo?.urls?.regular) {
    return null;
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    startDrag(e, {
      type: "image",
      data: {
        url: photo.urls.regular,
        thumbnail: photo.urls.small,
      },
    });
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    startDrag(e, {
      type: "image",
      data: {
        url: photo.urls.regular,
        thumbnail: photo.urls.small,
      },
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.03, duration: 0.2 }}
      onClick={onClick}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      className={ny(
        "group border-border bg-muted hover:border-primary/50 relative cursor-grab overflow-hidden rounded-xl border transition-all select-none hover:shadow-lg active:cursor-grabbing",
        index % 3 === 0 ? "row-span-2" : "aspect-square",
      )}
    >
      {!isLoaded && !hasError && (
        <div className="bg-muted absolute inset-0 flex items-center justify-center">
          <div className="border-primary size-6 animate-spin rounded-full border-2 border-t-transparent" />
        </div>
      )}

      {hasError ? (
        <div className="bg-muted absolute inset-0 flex items-center justify-center">
          <span className="text-muted-foreground text-xs">Failed to load</span>
        </div>
      ) : (
        <img
          src={photo.urls.small}
          alt={photo.alt_description || "Unsplash photo"}
          className={ny(
            "pointer-events-none h-full w-full object-cover transition-transform duration-300 group-hover:scale-105",
            isLoaded ? "opacity-100" : "opacity-0",
          )}
          loading="lazy"
          crossOrigin="anonymous"
          draggable={false}
          onLoad={() => setIsLoaded(true)}
          onError={(e) => {
            const target = e.currentTarget;
            if (!target.dataset.fallback) {
              target.dataset.fallback = "true";
              target.src = photo.urls.regular;
            } else {
              setHasError(true);
            }
          }}
        />
      )}

      {/* overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />

      {/* photographer credit */}
      {photo.user?.name && (
        <div className="absolute right-0 bottom-0 left-0 p-2 opacity-0 transition-opacity group-hover:opacity-100">
          <p className="truncate text-[10px] text-white/90">
            by {photo.user.name}
          </p>
        </div>
      )}
    </motion.div>
  );
};

// track uploaded images and their cloudinary public ids
interface UploadedImage {
  url: string;
  publicId: string;
}

// delete image from cloudinary
async function deleteFromCloudinary(publicId: string): Promise<void> {
  try {
    await fetch("/api/assets/cloudinary/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ publicId }),
    });
  } catch (error) {
    console.error("Failed to delete from Cloudinary:", error);
  }
}

export const ImageSidebar = ({
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
  const [debouncedSearch] = useDebounce(searchQuery, 1000);
  const tagsRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [uploading, setUploading] = useState(false);

  // track uploaded images with their cloudinary public ids
  const uploadedImagesRef = useRef<Map<string, UploadedImage>>(new Map());

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

  // listen for object removal to delete from cloudinary
  useEffect(() => {
    const canvas = editor?.canvas;
    if (!canvas) return;

    const handleObjectRemoved = (e: any) => {
      const removedObj = e.target;
      if (!removedObj) return;

      // check if it's an image with a tracked url
      const src = removedObj.getSrc?.() || removedObj._element?.src;
      if (src && uploadedImagesRef.current.has(src)) {
        const uploadedImage = uploadedImagesRef.current.get(src);
        if (uploadedImage?.publicId) {
          // delete from cloudinary in background
          deleteFromCloudinary(uploadedImage.publicId);
          uploadedImagesRef.current.delete(src);
        }
      }
    };

    canvas.on("object:removed", handleObjectRemoved);

    return () => {
      canvas.off("object:removed", handleObjectRemoved);
    };
  }, [editor]);

  const {
    data: randomPhotos,
    isLoading: isLoadingRandom,
    error: randomError,
  } = useGetRandomPhotos({ count: 20 });

  const {
    data: searchedPhotos,
    isLoading: isLoadingSearch,
    error: searchError,
  } = useGetPhotosByQuery({
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

  const uploadImg = async (file: any): Promise<{ url: string; publicId: string | null }> => {
    setUploading(true);
    try {
      const formData = new FormData();
      if (file) {
        const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_SECRET;
        if (!uploadPreset) {
          throw new Error("Missing Cloudinary upload preset");
        }
        formData.append("upload_preset", uploadPreset);
        formData.append("file", file);
      }

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_ID}/image/upload`,
        {
          method: "POST",
          body: formData,
        },
      );

      const data = await response.json();
      const url = data.secure_url;
      const publicId = data.public_id || null;

      // track the uploaded image
      if (url && publicId) {
        uploadedImagesRef.current.set(url, { url, publicId });
      }

      setUploading(false);
      return { url, publicId };
    } catch (error) {
      setUploading(false);
      console.error("Error uploading image:", error);
      throw error;
    }
  };

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileInputChange = async (e: any) => {
    const file = e.target.files[0];
    if (file.size > 1024 * 1024 * 5) {
      alert("File size should be less than 5MB");
      return;
    }
    const allowedExtensions = ["jpg", "jpeg", "png", "webp"];
    const fileExtension = file.name.split(".").pop().toLowerCase();
    if (allowedExtensions.includes(fileExtension)) {
      const { url } = await uploadImg(file);
      editor?.addImage(url);
    } else {
      alert("Invalid file type. Please select a jpg, jpeg, png, or webp file.");
    }
  };

  const handleImageClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <SidebarBase isVisible={activeTool === "images"} onClose={onClose}>
      <ToolSidebarHeader
        title="Images"
        description="add images to canvas"
        icon={ImagePlus}
      />

      <div className="flex flex-1 flex-col overflow-hidden">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="space-y-4 p-4"
        >
          {/* upload button */}
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            onChange={handleFileInputChange}
            accept="image/png, image/jpeg, image/jpg, image/webp"
          />

          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={handleImageClick}
            disabled={uploading}
            className="group border-border bg-muted/30 hover:border-primary/50 hover:bg-muted/50 relative w-full overflow-hidden rounded-xl border-2 border-dashed p-6 text-center transition-all"
          >
            <div className="flex flex-col items-center gap-3">
              {uploading ? (
                <>
                  <div className="bg-primary/10 flex size-12 items-center justify-center rounded-xl">
                    <LucideLoader2 className="text-primary size-6 animate-spin" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Uploading...</p>
                    <p className="text-muted-foreground text-xs">please wait</p>
                  </div>
                </>
              ) : (
                <>
                  <div className="bg-muted/50 group-hover:bg-primary/10 flex size-12 items-center justify-center rounded-xl transition-colors">
                    <Upload className="text-muted-foreground group-hover:text-primary size-6 transition-colors" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Upload Image</p>
                    <p className="text-muted-foreground text-xs">
                      jpg, png, webp up to 5mb
                    </p>
                  </div>
                </>
              )}
            </div>
          </motion.button>

          {/* search input */}
          <div className="relative">
            <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
            <Input
              placeholder="Search images..."
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
              {imageTags.map((tag) => (
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

        {/* image grid */}
        <ScrollArea className="flex-1 px-4">
          {isLoadingSearch || isLoadingRandom ? (
            <LoadingSkeleton />
          ) : displayPhotos && displayPhotos.length > 0 ? (
            <ClientOnly>
              <div className="grid grid-cols-2 gap-2 pb-24">
                {displayPhotos.map((photo, index) => (
                  <ImageCard
                    key={photo.id}
                    photo={photo}
                    index={index}
                    onClick={() => editor?.addImage(photo.urls.regular)}
                  />
                ))}
              </div>
            </ClientOnly>
          ) : (
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <div className="bg-muted/50 mb-3 flex size-12 items-center justify-center rounded-xl">
                <ImagePlus className="text-muted-foreground size-6" />
              </div>
              <p className="text-sm font-medium">No images found</p>
              <p className="text-muted-foreground text-xs">
                {searchError || randomError
                  ? "failed to load images"
                  : "try a different search term"}
              </p>
            </div>
          )}
        </ScrollArea>
      </div>

      <ToolSidebarClose onClick={onClose} />
    </SidebarBase>
  );
};
