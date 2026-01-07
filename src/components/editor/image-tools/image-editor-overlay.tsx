"use client";

import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Sparkles,
  Sliders,
  RotateCcw,
  RotateCw,
  FlipHorizontal,
  FlipVertical,
  Check,
  Loader2,
  Sun,
  Contrast,
  Droplets,
  Palette,
  Crop,
  RefreshCw,
} from "lucide-react";
import { Button } from "~/components/ui/button";
import { Slider } from "~/components/ui/slider";
import { ScrollArea } from "~/components/ui/scroll-area";
import { cn } from "~/lib/utils";
import { useImageProcessor } from "~/hooks/useImageProcessor";
import { CropTool } from "./crop-tool";

interface ImageEditorOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  imageElement: fabric.Image | null;
  canvas: fabric.Canvas | null;
  onImageUpdate: (imageData: ImageData, width: number, height: number) => void;
}

type EditorTab = "adjust" | "filters" | "crop";

interface AdjustmentValues {
  brightness: number;
  contrast: number;
  saturation: number;
  hue: number;
}

const DEFAULT_ADJUSTMENTS: AdjustmentValues = {
  brightness: 0,
  contrast: 0,
  saturation: 0,
  hue: 0,
};

type FilterOption =
  | "none"
  | "grayscale"
  | "sepia"
  | "vintage"
  | "warm"
  | "cool"
  | "contrast";

const FILTERS: { name: FilterOption; label: string }[] = [
  { name: "none", label: "Original" },
  { name: "grayscale", label: "B&W" },
  { name: "sepia", label: "Sepia" },
  { name: "vintage", label: "Vintage" },
  { name: "warm", label: "Warm" },
  { name: "cool", label: "Cool" },
  { name: "contrast", label: "Dramatic" },
];

// css filter string for preview
function getCSSFilter(adj: AdjustmentValues, filter: FilterOption): string {
  const parts: string[] = [];

  // brightness: 0 = 100%, -100 = 0%, +100 = 200%
  const brightness = 1 + adj.brightness / 100;
  if (brightness !== 1) parts.push(`brightness(${brightness})`);

  // contrast: 0 = 100%, -100 = 0%, +100 = 200%
  const contrast = 1 + adj.contrast / 100;
  if (contrast !== 1) parts.push(`contrast(${contrast})`);

  // saturation: 0 = 100%, -100 = 0%, +100 = 200%
  const saturation = 1 + adj.saturation / 100;
  if (saturation !== 1) parts.push(`saturate(${saturation})`);

  // hue: -180 to 180 degrees
  if (adj.hue !== 0) parts.push(`hue-rotate(${adj.hue}deg)`);

  // filter presets
  switch (filter) {
    case "grayscale":
      parts.push("grayscale(1)");
      break;
    case "sepia":
      parts.push("sepia(0.8)");
      break;
    case "vintage":
      parts.push("sepia(0.3) contrast(1.1) brightness(0.9)");
      break;
    case "warm":
      parts.push("sepia(0.2) saturate(1.2)");
      break;
    case "cool":
      parts.push("saturate(0.9) hue-rotate(10deg)");
      break;
    case "contrast":
      parts.push("contrast(1.3) saturate(1.1)");
      break;
  }

  return parts.join(" ") || "none";
}

const SIDEBAR_WIDTH = 320;

export function ImageEditorOverlay({
  isOpen,
  onClose,
  imageElement,
  canvas,
  onImageUpdate,
}: ImageEditorOverlayProps) {
  const { state, applyFilter, adjustHue, crop } = useImageProcessor();
  const [activeTab, setActiveTab] = useState<EditorTab>("adjust");
  const [adjustments, setAdjustments] =
    useState<AdjustmentValues>(DEFAULT_ADJUSTMENTS);
  const [selectedFilter, setSelectedFilter] = useState<FilterOption>("none");
  const [imageData, setImageData] = useState<ImageData | null>(null);
  const [originalImageData, setOriginalImageData] = useState<ImageData | null>(
    null,
  );
  const [previewSrc, setPreviewSrc] = useState<string>("");
  const [isApplying, setIsApplying] = useState(false);
  const applyTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // extract image data on open
  useEffect(() => {
    if (isOpen && imageElement && canvas) {
      extractImageData();
    }
    return () => {
      if (applyTimeoutRef.current) {
        clearTimeout(applyTimeoutRef.current);
      }
    };
  }, [isOpen, imageElement, canvas]);

  // reset state when closing
  useEffect(() => {
    if (!isOpen) {
      setAdjustments(DEFAULT_ADJUSTMENTS);
      setSelectedFilter("none");
      setImageData(null);
      setOriginalImageData(null);
      setPreviewSrc("");
      setActiveTab("adjust");
    }
  }, [isOpen]);

  const extractImageData = useCallback(() => {
    if (!imageElement || !canvas) return;

    try {
      const imgElement = (imageElement as any)._element as HTMLImageElement;
      if (!imgElement) return;

      // create canvas to extract image data
      const tempCanvas = document.createElement("canvas");
      const width = imgElement.naturalWidth || imgElement.width;
      const height = imgElement.naturalHeight || imgElement.height;

      tempCanvas.width = width;
      tempCanvas.height = height;

      const ctx = tempCanvas.getContext("2d");
      if (!ctx) return;

      ctx.drawImage(imgElement, 0, 0);
      const data = ctx.getImageData(0, 0, width, height);

      setImageData(data);
      setOriginalImageData(data);
      setPreviewSrc(tempCanvas.toDataURL("image/png"));
    } catch (error) {
      console.error("Failed to extract image data:", error);
    }
  }, [imageElement, canvas]);

  const handleAdjustmentChange = useCallback(
    (type: keyof AdjustmentValues, value: number) => {
      setAdjustments((prev) => ({ ...prev, [type]: value }));
    },
    [],
  );

  const handleFilterSelect = useCallback((filter: FilterOption) => {
    setSelectedFilter(filter);
  }, []);

  const handleReset = useCallback(() => {
    setAdjustments(DEFAULT_ADJUSTMENTS);
    setSelectedFilter("none");
    if (originalImageData) {
      setImageData(originalImageData);
    }
  }, [originalImageData]);

  const handleRotate = useCallback(
    (degrees: number) => {
      if (!imageData) return;

      const sourceCanvas = document.createElement("canvas");
      sourceCanvas.width = imageData.width;
      sourceCanvas.height = imageData.height;
      const sourceCtx = sourceCanvas.getContext("2d");
      if (!sourceCtx) return;
      sourceCtx.putImageData(imageData, 0, 0);

      const isRightAngle =
        Math.abs(degrees) === 90 || Math.abs(degrees) === 270;
      const rotatedCanvas = document.createElement("canvas");
      rotatedCanvas.width = isRightAngle ? imageData.height : imageData.width;
      rotatedCanvas.height = isRightAngle ? imageData.width : imageData.height;

      const rotatedCtx = rotatedCanvas.getContext("2d");
      if (!rotatedCtx) return;

      rotatedCtx.translate(rotatedCanvas.width / 2, rotatedCanvas.height / 2);
      rotatedCtx.rotate((degrees * Math.PI) / 180);
      rotatedCtx.drawImage(
        sourceCanvas,
        -imageData.width / 2,
        -imageData.height / 2,
      );

      const newData = rotatedCtx.getImageData(
        0,
        0,
        rotatedCanvas.width,
        rotatedCanvas.height,
      );
      setImageData(newData);
      setOriginalImageData(newData);
      setPreviewSrc(rotatedCanvas.toDataURL("image/png"));
      // reset adjustments after rotation
      setAdjustments(DEFAULT_ADJUSTMENTS);
      setSelectedFilter("none");
    },
    [imageData],
  );

  const handleFlip = useCallback(
    (horizontal: boolean) => {
      if (!imageData) return;

      const sourceCanvas = document.createElement("canvas");
      sourceCanvas.width = imageData.width;
      sourceCanvas.height = imageData.height;
      const sourceCtx = sourceCanvas.getContext("2d");
      if (!sourceCtx) return;
      sourceCtx.putImageData(imageData, 0, 0);

      const flippedCanvas = document.createElement("canvas");
      flippedCanvas.width = imageData.width;
      flippedCanvas.height = imageData.height;
      const flippedCtx = flippedCanvas.getContext("2d");
      if (!flippedCtx) return;

      if (horizontal) {
        flippedCtx.translate(imageData.width, 0);
        flippedCtx.scale(-1, 1);
      } else {
        flippedCtx.translate(0, imageData.height);
        flippedCtx.scale(1, -1);
      }

      flippedCtx.drawImage(sourceCanvas, 0, 0);

      const newData = flippedCtx.getImageData(
        0,
        0,
        flippedCanvas.width,
        flippedCanvas.height,
      );
      setImageData(newData);
      setOriginalImageData(newData);
      setPreviewSrc(flippedCanvas.toDataURL("image/png"));
      // reset adjustments after flip
      setAdjustments(DEFAULT_ADJUSTMENTS);
      setSelectedFilter("none");
    },
    [imageData],
  );

  const handleApply = useCallback(async () => {
    if (!imageData || !originalImageData) return;

    setIsApplying(true);

    try {
      // apply adjustments using canvas for final output
      const tempCanvas = document.createElement("canvas");
      tempCanvas.width = imageData.width;
      tempCanvas.height = imageData.height;
      const ctx = tempCanvas.getContext("2d");
      if (!ctx) return;

      // draw image data
      ctx.putImageData(imageData, 0, 0);

      // create an image from the canvas
      const img = new Image();
      img.crossOrigin = "anonymous";

      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = reject;
        img.src = tempCanvas.toDataURL("image/png");
      });

      // apply css filters to a new canvas
      const outputCanvas = document.createElement("canvas");
      outputCanvas.width = imageData.width;
      outputCanvas.height = imageData.height;
      const outputCtx = outputCanvas.getContext("2d");
      if (!outputCtx) return;

      outputCtx.filter = getCSSFilter(adjustments, selectedFilter);
      outputCtx.drawImage(img, 0, 0);

      const finalImageData = outputCtx.getImageData(
        0,
        0,
        outputCanvas.width,
        outputCanvas.height,
      );

      onImageUpdate(
        finalImageData,
        finalImageData.width,
        finalImageData.height,
      );
      onClose();
    } catch (error) {
      console.error("Failed to apply image edits:", error);
    } finally {
      setIsApplying(false);
    }
  }, [
    imageData,
    originalImageData,
    adjustments,
    selectedFilter,
    onImageUpdate,
    onClose,
  ]);

  const handleCropApply = useCallback(
    (croppedData: ImageData, newWidth: number, newHeight: number) => {
      setImageData(croppedData);
      onImageUpdate(croppedData, newWidth, newHeight);
      onClose();
    },
    [onImageUpdate, onClose],
  );

  const hasChanges = useMemo(() => {
    return (
      adjustments.brightness !== 0 ||
      adjustments.contrast !== 0 ||
      adjustments.saturation !== 0 ||
      adjustments.hue !== 0 ||
      selectedFilter !== "none"
    );
  }, [adjustments, selectedFilter]);

  const cssFilter = useMemo(
    () => getCSSFilter(adjustments, selectedFilter),
    [adjustments, selectedFilter],
  );

  if (!isOpen || !imageElement) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.aside
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="border-border bg-card fixed top-0 right-0 z-50 flex h-full flex-col border-l shadow-xl"
          style={{ width: SIDEBAR_WIDTH }}
        >
          {/* header */}
          <div className="border-border flex items-center justify-between border-b px-4 py-3">
            <div className="flex items-center gap-2">
              <div>
                <h3 className="text-sm font-semibold">Edit Image</h3>
                <p className="text-muted-foreground text-xs">
                  adjust and enhance
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* preview - hide when in crop mode */}
          {activeTab !== "crop" && (
            <div className="border-border relative flex-shrink-0 border-b bg-black/5 p-4">
              <div className="relative mx-auto flex aspect-video max-h-36 items-center justify-center overflow-hidden rounded-lg bg-black/10">
                {previewSrc && (
                  <img
                    src={previewSrc}
                    alt="Preview"
                    className="max-h-full max-w-full object-contain"
                    style={{ filter: cssFilter }}
                  />
                )}
                {(state.isProcessing || isApplying) && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                    <Loader2 className="h-5 w-5 animate-spin text-white" />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* quick actions */}
          <div className="border-border flex items-center justify-center gap-1 border-b px-3 py-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9"
              onClick={() => handleRotate(-90)}
              title="Rotate Left"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9"
              onClick={() => handleRotate(90)}
              title="Rotate Right"
            >
              <RotateCw className="h-4 w-4" />
            </Button>
            <div className="bg-border mx-1 h-5 w-px" />
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9"
              onClick={() => handleFlip(true)}
              title="Flip Horizontal"
            >
              <FlipHorizontal className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9"
              onClick={() => handleFlip(false)}
              title="Flip Vertical"
            >
              <FlipVertical className="h-4 w-4" />
            </Button>
          </div>

          {/* tabs */}
          <div className="border-border flex border-b">
            <button
              onClick={() => setActiveTab("adjust")}
              className={cn(
                "flex flex-1 items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-medium transition-colors",
                activeTab === "adjust"
                  ? "border-primary text-primary border-b-2"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Sliders className="h-3.5 w-3.5" />
              Adjust
            </button>
            <button
              onClick={() => setActiveTab("filters")}
              className={cn(
                "flex flex-1 items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-medium transition-colors",
                activeTab === "filters"
                  ? "border-primary text-primary border-b-2"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Sparkles className="h-3.5 w-3.5" />
              Filters
            </button>
            <button
              onClick={() => setActiveTab("crop")}
              className={cn(
                "flex flex-1 items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-medium transition-colors",
                activeTab === "crop"
                  ? "border-primary text-primary border-b-2"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Crop className="h-3.5 w-3.5" />
              Crop
            </button>
          </div>

          {/* content */}
          <ScrollArea className="flex-1">
            <div className="p-4">
              {activeTab === "adjust" && (
                <div className="space-y-5">
                  {/* brightness */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Sun className="text-muted-foreground h-4 w-4" />
                        <span className="text-sm font-medium">Brightness</span>
                      </div>
                      <span className="text-muted-foreground text-xs tabular-nums">
                        {adjustments.brightness > 0 ? "+" : ""}
                        {adjustments.brightness}%
                      </span>
                    </div>
                    <Slider
                      value={[adjustments.brightness]}
                      min={-100}
                      max={100}
                      step={1}
                      onValueChange={([v]) =>
                        handleAdjustmentChange("brightness", v)
                      }
                      className="w-full"
                    />
                  </div>

                  {/* contrast */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Contrast className="text-muted-foreground h-4 w-4" />
                        <span className="text-sm font-medium">Contrast</span>
                      </div>
                      <span className="text-muted-foreground text-xs tabular-nums">
                        {adjustments.contrast > 0 ? "+" : ""}
                        {adjustments.contrast}%
                      </span>
                    </div>
                    <Slider
                      value={[adjustments.contrast]}
                      min={-100}
                      max={100}
                      step={1}
                      onValueChange={([v]) =>
                        handleAdjustmentChange("contrast", v)
                      }
                      className="w-full"
                    />
                  </div>

                  {/* saturation */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Droplets className="text-muted-foreground h-4 w-4" />
                        <span className="text-sm font-medium">Saturation</span>
                      </div>
                      <span className="text-muted-foreground text-xs tabular-nums">
                        {adjustments.saturation > 0 ? "+" : ""}
                        {adjustments.saturation}%
                      </span>
                    </div>
                    <Slider
                      value={[adjustments.saturation]}
                      min={-100}
                      max={100}
                      step={1}
                      onValueChange={([v]) =>
                        handleAdjustmentChange("saturation", v)
                      }
                      className="w-full"
                    />
                  </div>

                  {/* hue */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Palette className="text-muted-foreground h-4 w-4" />
                        <span className="text-sm font-medium">Hue</span>
                      </div>
                      <span className="text-muted-foreground text-xs tabular-nums">
                        {adjustments.hue > 0 ? "+" : ""}
                        {adjustments.hue}°
                      </span>
                    </div>
                    <Slider
                      value={[adjustments.hue]}
                      min={-180}
                      max={180}
                      step={1}
                      onValueChange={([v]) => handleAdjustmentChange("hue", v)}
                      className="w-full"
                    />
                  </div>
                </div>
              )}

              {activeTab === "filters" && (
                <div className="grid grid-cols-3 gap-2">
                  {FILTERS.map((filter) => (
                    <button
                      key={filter.name}
                      onClick={() => handleFilterSelect(filter.name)}
                      className={cn(
                        "group relative flex flex-col items-center gap-1.5 rounded-lg border p-2 transition-all",
                        selectedFilter === filter.name
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-border/80 hover:bg-muted/30",
                      )}
                    >
                      <div className="relative h-12 w-full overflow-hidden rounded bg-black/10">
                        {previewSrc && (
                          <img
                            src={previewSrc}
                            alt={filter.label}
                            className="h-full w-full object-cover"
                            style={{
                              filter: getCSSFilter(
                                DEFAULT_ADJUSTMENTS,
                                filter.name,
                              ),
                            }}
                          />
                        )}
                        {selectedFilter === filter.name && (
                          <div className="bg-primary absolute right-1 bottom-1 flex h-4 w-4 items-center justify-center rounded-full">
                            <Check className="h-2.5 w-2.5 text-white" />
                          </div>
                        )}
                      </div>
                      <span
                        className={cn(
                          "text-xs font-medium",
                          selectedFilter === filter.name
                            ? "text-primary"
                            : "text-muted-foreground",
                        )}
                      >
                        {filter.label}
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {activeTab === "crop" && imageData && (
                <CropTool
                  imageData={imageData}
                  imageWidth={imageData.width}
                  imageHeight={imageData.height}
                  onApply={handleCropApply}
                  onClose={() => {
                    if (originalImageData) {
                      setImageData(originalImageData);
                      setAdjustments(DEFAULT_ADJUSTMENTS);
                      setSelectedFilter("none");
                    }
                    setActiveTab("adjust");
                  }}
                />
              )}
            </div>
          </ScrollArea>

          {/* footer */}
          <div className="border-border flex items-center justify-between gap-2 border-t p-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReset}
              disabled={!hasChanges || isApplying}
              className="gap-1.5"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Reset
            </Button>
            <Button
              size="sm"
              onClick={handleApply}
              disabled={isApplying}
              className="gap-1.5 px-4"
            >
              {isApplying ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Applying...
                </>
              ) : (
                <>
                  <Check className="h-3.5 w-3.5" />
                  Done
                </>
              )}
            </Button>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
