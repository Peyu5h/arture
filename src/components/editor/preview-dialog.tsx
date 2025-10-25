"use client";

import { Dialog, DialogContent } from "~/components/ui/dialog";
import { Button } from "~/components/ui/button";
import { X } from "lucide-react";
import { useEffect, useState, useRef } from "react";

interface PreviewDialogProps {
  open: boolean;
  onClose: () => void;
  canvas: any;
}

export const PreviewDialog = ({
  open,
  onClose,
  canvas,
}: PreviewDialogProps) => {
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open && canvas) {
      // Generate preview image
      const workspace = canvas
        .getObjects()
        .find((obj: any) => obj.name === "clip");

      if (workspace) {
        const { width, height, left, top } = workspace;

        canvas.setViewportTransform([1, 0, 0, 1, 0, 0]);
        const dataUrl = canvas.toDataURL({
          format: "png",
          quality: 1,
          width,
          height,
          left,
          top,
        });

        setPreviewUrl(dataUrl);

        // Enter fullscreen mode
        if (containerRef.current) {
          containerRef.current.requestFullscreen().catch((err) => {
            console.error("Error entering fullscreen:", err);
          });
        }
      }
    }
  }, [open, canvas]);

  useEffect(() => {
    // Handle fullscreen change events
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        // Exited fullscreen, close the dialog
        onClose();
      }
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, [onClose]);

  const handleClose = async () => {
    // Exit fullscreen if in fullscreen mode
    if (document.fullscreenElement) {
      await document.exitFullscreen();
    }
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-h-[100vh] max-w-[100vw] overflow-hidden border-0 p-0">
        <div
          ref={containerRef}
          className="relative flex h-screen w-screen items-center justify-center bg-black"
        >
          <Button
            onClick={handleClose}
            className="absolute top-4 right-4 z-50 rounded-full border-white/20 bg-white/10 text-white hover:bg-white/20"
            size="icon"
            variant="outline"
          >
            <X className="h-6 w-6" />
          </Button>

          {previewUrl && (
            <img
              src={previewUrl}
              alt="Canvas preview"
              className="max-h-full max-w-full object-contain"
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
