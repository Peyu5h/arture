"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion } from "framer-motion";
import { Template } from "@prisma/client";
import { Image as ImageIcon, Loader2 } from "lucide-react";
import { cn } from "~/lib/utils";
import { DEFAULT_CANVAS_WIDTH, DEFAULT_CANVAS_HEIGHT } from "~/lib/constants";

interface TemplateCardProps {
  template: Template;
}

export function TemplateCard({ template }: TemplateCardProps) {
  const router = useRouter();
  const [isCreating, setIsCreating] = useState(false);
  const [imageError, setImageError] = useState(false);

  const handleClick = async () => {
    setIsCreating(true);
    try {
      // create new project from template
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: template.name,
          json: template.json,
          width: template.width || DEFAULT_CANVAS_WIDTH,
          height: template.height || DEFAULT_CANVAS_HEIGHT,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        router.push(`/editor/${result.data.id}`);
      }
    } catch (error) {
      console.error("Error creating project from template:", error);
    } finally {
      setIsCreating(false);
    }
  };

  // calculate aspect ratio for thumbnail display
  const aspectRatio = template.width / template.height;
  const isLandscape = aspectRatio > 1;
  const isPortrait = aspectRatio < 1;

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        "group relative cursor-pointer overflow-hidden rounded-xl transition-all",
        "border-border/50 hover:border-primary/30 border",
        isCreating && "pointer-events-none opacity-70",
      )}
      onClick={handleClick}
    >
      {/* thumbnail container with muted bg */}
      <div className="bg-muted/50 relative aspect-[4/3] w-full overflow-hidden backdrop-blur-sm">
        {/* centered thumbnail */}
        <div className="absolute inset-0 flex items-center justify-center p-3">
          {template.thumbnailUrl && !imageError ? (
            <div
              className={cn(
                "relative overflow-hidden rounded-md shadow-sm",
                isLandscape && "h-auto w-full max-w-[90%]",
                isPortrait && "h-full w-auto max-h-[90%]",
                !isLandscape && !isPortrait && "h-auto w-full max-w-[85%]",
              )}
              style={{
                aspectRatio: `${template.width} / ${template.height}`,
              }}
            >
              <Image
                src={template.thumbnailUrl}
                alt={template.name}
                fill
                className="object-contain"
                onError={() => setImageError(true)}
              />
            </div>
          ) : (
            <div className="bg-background/50 flex h-full w-full items-center justify-center rounded-md">
              <ImageIcon className="text-muted-foreground/50 h-8 w-8" />
            </div>
          )}
        </div>

        {/* loading overlay */}
        {isCreating && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40">
            <Loader2 className="h-6 w-6 animate-spin text-white" />
          </div>
        )}

        {/* hover overlay */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100" />

        {/* title on hover */}
        <div className="absolute right-0 bottom-0 left-0 p-3">
          <p className="truncate text-sm font-medium text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100">
            {template.name}
          </p>
        </div>
      </div>

      {/* info below */}
      <div className="bg-card p-2.5">
        <p className="text-foreground truncate text-sm font-medium">
          {template.name}
        </p>
        <p className="text-muted-foreground text-xs">
          {template.width} × {template.height}
        </p>
      </div>
    </motion.div>
  );
}
