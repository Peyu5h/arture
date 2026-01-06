import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ScrollArea } from "~/components/ui/scroll-area";
import { Input } from "~/components/ui/input";
import { SidebarBase } from "../tool-sidebar/sidebarBase";
import { ToolSidebarClose } from "../tool-sidebar/tool-sidebar-close";
import { ActiveTool } from "~/lib/types";
import { useDragContext } from "~/contexts/drag-context";
import { Search, X, Upload, Plus, Trash2, Loader2 } from "lucide-react";
import { ny } from "~/lib/utils";

interface UploadsSidebarProps {
  editor: any;
  activeTool: ActiveTool;
  onChangeActiveTool: (tool: ActiveTool) => void;
  projectId?: string;
  onUploadsChange?: (uploads: UploadedImage[]) => void;
}

export interface UploadedImage {
  id: string;
  url: string;
  thumbnail: string;
  publicId?: string;
  name?: string;
  createdAt?: number;
}

interface UploadCardProps {
  image: UploadedImage;
  onDelete: () => void;
}

const UPLOADS_STORAGE_KEY = "arture-uploads";

// get uploads from localStorage
const getStoredUploads = (projectId?: string): UploadedImage[] => {
  if (typeof window === "undefined") return [];
  try {
    const key = projectId
      ? `${UPLOADS_STORAGE_KEY}-${projectId}`
      : UPLOADS_STORAGE_KEY;
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

// save uploads to localStorage
const saveUploads = (uploads: UploadedImage[], projectId?: string) => {
  if (typeof window === "undefined") return;
  try {
    const key = projectId
      ? `${UPLOADS_STORAGE_KEY}-${projectId}`
      : UPLOADS_STORAGE_KEY;
    localStorage.setItem(key, JSON.stringify(uploads));
  } catch (e) {
    console.error("Failed to save uploads:", e);
  }
};

const UploadCard = ({ image, onDelete }: UploadCardProps) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const { startDrag } = useDragContext();

  const handleMouseDown = (e: React.MouseEvent) => {
    startDrag(e, {
      type: "image",
      data: {
        url: image.url,
        thumbnail: image.thumbnail,
      },
    });
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    startDrag(e, {
      type: "image",
      data: {
        url: image.url,
        thumbnail: image.thumbnail,
      },
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="group relative aspect-square"
    >
      <button
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        className={ny(
          "relative size-full cursor-grab overflow-hidden rounded-lg border transition-all active:cursor-grabbing",
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
            src={image.thumbnail || image.url}
            alt={image.name || "Uploaded image"}
            className={ny(
              "size-full object-cover transition-all duration-300",
              isLoaded ? "opacity-100" : "opacity-0",
            )}
            onLoad={() => setIsLoaded(true)}
            onError={() => setHasError(true)}
            draggable={false}
          />
        )}
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        className="absolute -top-1.5 -right-1.5 z-10 flex size-6 items-center justify-center rounded-full bg-red-500 text-white opacity-0 shadow-md transition-opacity group-hover:opacity-100 hover:bg-red-600"
      >
        <Trash2 className="size-3" />
      </button>
      {image.name && (
        <div className="absolute right-0 bottom-0 left-0 bg-gradient-to-t from-black/60 to-transparent p-1.5 opacity-0 transition-opacity group-hover:opacity-100">
          <p className="truncate text-[10px] text-white">{image.name}</p>
        </div>
      )}
    </motion.div>
  );
};

export const UploadsSidebar = ({
  editor,
  activeTool,
  onChangeActiveTool,
  projectId,
  onUploadsChange,
}: UploadsSidebarProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [uploading, setUploading] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // load uploads from localStorage on mount
  useEffect(() => {
    const stored = getStoredUploads(projectId);
    setUploadedImages(stored);
    setInitialized(true);
  }, [projectId]);

  // save to localStorage and notify parent when uploads change
  useEffect(() => {
    if (!initialized) return;
    saveUploads(uploadedImages, projectId);
    onUploadsChange?.(uploadedImages);
  }, [uploadedImages, projectId, initialized, onUploadsChange]);

  const onClose = () => {
    onChangeActiveTool("select");
  };

  const uploadImg = async (file: File) => {
    try {
      const formData = new FormData();
      formData.append("file", file);

      // use hardcoded cloudinary credentials
      const uploadPreset = "arture-upload-present";
      const cloudName = "dewj8he1y";

      formData.append("upload_preset", uploadPreset);

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        {
          method: "POST",
          body: formData,
        },
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("Cloudinary error:", errorData);
        throw new Error(
          errorData.error?.message ||
            `Upload failed: ${response.status} - ${JSON.stringify(errorData)}`,
        );
      }

      const data = await response.json();

      if (!data.secure_url) {
        throw new Error(
          data.error?.message || "Upload failed: no URL returned",
        );
      }

      const url: string = data.secure_url;
      const publicId: string = data.public_id || "";

      // generate thumbnail url from cloudinary
      const thumbnail = url.includes("/upload/")
        ? url.replace("/upload/", "/upload/w_200,h_200,c_fill/")
        : url;

      return { url, publicId, thumbnail };
    } catch (error) {
      console.error("Cloudinary upload error:", error);
      throw error;
    }
  };

  const handleFileInputChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);

    try {
      for (const file of Array.from(files)) {
        const allowedExtensions = ["jpg", "jpeg", "png", "gif", "webp", "svg"];
        const fileExtension = file.name.split(".").pop()?.toLowerCase();

        if (!fileExtension || !allowedExtensions.includes(fileExtension)) {
          continue;
        }

        const { url, publicId, thumbnail } = await uploadImg(file);

        const newUpload: UploadedImage = {
          id:
            publicId ||
            `upload-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          url,
          thumbnail,
          publicId,
          name: file.name,
          createdAt: Date.now(),
        };

        setUploadedImages((prev) => [newUpload, ...prev]);
      }
    } catch (error) {
      console.error("Upload failed:", error);
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleDelete = (imageId: string) => {
    setUploadedImages((prev) => prev.filter((img) => img.id !== imageId));
  };

  const filteredImages = uploadedImages.filter((img) =>
    img.name?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <SidebarBase isVisible={activeTool === "uploads"} onClose={onClose}>
      <div className="border-border flex items-center justify-between border-b px-4 py-3">
        <h2 className="text-base font-semibold">Uploads</h2>
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
            placeholder="Search uploads..."
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

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleFileInputChange}
        />

        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="border-primary/30 text-primary hover:bg-primary/5 flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed p-4 transition-all"
        >
          {uploading ? (
            <>
              <Loader2 className="size-5 animate-spin" />
              <span className="font-medium">Uploading...</span>
            </>
          ) : (
            <>
              <Plus className="size-5" />
              <span className="font-medium">Add File</span>
            </>
          )}
        </motion.button>
      </div>

      <ScrollArea className="flex-1">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="p-4"
        >
          {filteredImages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="bg-muted/50 mb-3 flex size-14 items-center justify-center rounded-xl">
                <Upload className="text-muted-foreground size-7" />
              </div>
              <p className="text-muted-foreground text-sm">
                {searchQuery ? "No uploads found" : "No uploads yet"}
              </p>
              <p className="text-muted-foreground/70 text-xs">
                {searchQuery
                  ? "Try a different search term"
                  : "Click above to add images"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              <AnimatePresence mode="popLayout">
                {filteredImages.map((image) => (
                  <UploadCard
                    key={image.id}
                    image={image}
                    onDelete={() => handleDelete(image.id)}
                  />
                ))}
              </AnimatePresence>
            </div>
          )}
        </motion.div>
      </ScrollArea>

      <ToolSidebarClose onClick={onClose} />
    </SidebarBase>
  );
};
