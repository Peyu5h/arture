"use client";

import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import {
  Crop,
  Sparkles,
  Sliders,
  BarChart3,
  Loader2,
  AlertCircle,
  Palette,
  Wand2,
  ImageIcon,
  RotateCcw,
} from "lucide-react";
import { Button } from "~/components/ui/button";
import { FilterPanel } from "./filter-panel";
import { CropTool } from "./crop-tool";
import { useImageProcessor, type FilterName } from "~/hooks/useImageProcessor";
import { Slider } from "~/components/ui/slider";

interface ImageToolsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  imageElement: fabric.Image | null;
  onImageUpdate: (imageData: ImageData, width: number, height: number) => void;
}

type ToolTab = "crop" | "filters" | "adjust" | "histogram" | "ai";

interface AdjustmentValues {
  brightness: number;
  contrast: number;
  saturation: number;
  hue: number;
}

const DEFAULT_ADJUSTMENTS: AdjustmentValues = {
  brightness: 0.5,
  contrast: 0.5,
  saturation: 0.5,
  hue: 0,
};

export function ImageToolsDialog({
  isOpen,
  onClose,
  imageElement,
  onImageUpdate,
}: ImageToolsDialogProps) {
  const { state, applyFilter, adjustHue, getHistogram } = useImageProcessor();
  const [activeTab, setActiveTab] = useState<ToolTab>("crop");
  const [imageData, setImageData] = useState<ImageData | null>(null);
  const [originalImageData, setOriginalImageData] = useState<ImageData | null>(
    null,
  );
  const [previewImageData, setPreviewImageData] = useState<ImageData | null>(
    null,
  );
  const [imageDimensions, setImageDimensions] = useState({
    width: 0,
    height: 0,
  });
  const [adjustments, setAdjustments] =
    useState<AdjustmentValues>(DEFAULT_ADJUSTMENTS);
  const [histogramData, setHistogramData] = useState<{
    red: Uint32Array;
    green: Uint32Array;
    blue: Uint32Array;
    luminance: Uint32Array;
  } | null>(null);

  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const adjustmentDebounceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isOpen && imageElement) {
      extractImageData();
    }
  }, [isOpen, imageElement]);

  // draw preview on canvas
  useEffect(() => {
    const dataToRender = previewImageData || imageData;
    if (!dataToRender || !previewCanvasRef.current) return;

    const canvas = previewCanvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = dataToRender.width;
    canvas.height = dataToRender.height;
    ctx.putImageData(dataToRender, 0, 0);
  }, [previewImageData, imageData]);

  const extractImageData = useCallback(() => {
    if (!imageElement) return;

    const canvas = document.createElement("canvas");
    const imgElement = imageElement.getElement() as HTMLImageElement;

    if (!imgElement) return;

    const width = imgElement.naturalWidth || imgElement.width;
    const height = imgElement.naturalHeight || imgElement.height;

    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(imgElement, 0, 0, width, height);
    const data = ctx.getImageData(0, 0, width, height);

    setImageData(data);
    setOriginalImageData(data);
    setPreviewImageData(null);
    setImageDimensions({ width, height });
    setAdjustments(DEFAULT_ADJUSTMENTS);
  }, [imageElement]);

  const handleFilterApply = useCallback(
    (processedData: ImageData) => {
      setImageData(processedData);
      setOriginalImageData(processedData);
      setPreviewImageData(null);
      onImageUpdate(processedData, processedData.width, processedData.height);
    },
    [onImageUpdate],
  );

  const handleCropApply = useCallback(
    (processedData: ImageData, newWidth: number, newHeight: number) => {
      setImageData(processedData);
      setOriginalImageData(processedData);
      setPreviewImageData(null);
      setImageDimensions({ width: newWidth, height: newHeight });
      onImageUpdate(processedData, newWidth, newHeight);
    },
    [onImageUpdate],
  );

  // apply all adjustments to generate preview
  const applyAllAdjustments = useCallback(
    async (adj: AdjustmentValues) => {
      if (!originalImageData || state.isProcessing) return;

      let result: ImageData | null = originalImageData;

      // apply brightness if changed
      if (adj.brightness !== 0.5 && result) {
        const filtered = await applyFilter(
          result,
          "brightness",
          adj.brightness,
        );
        if (filtered) result = filtered;
      }

      // apply contrast if changed
      if (adj.contrast !== 0.5 && result) {
        const filtered = await applyFilter(result, "contrast", adj.contrast);
        if (filtered) result = filtered;
      }

      // apply saturation if changed
      if (adj.saturation !== 0.5 && result) {
        const filtered = await applyFilter(
          result,
          "saturation",
          adj.saturation,
        );
        if (filtered) result = filtered;
      }

      // apply hue if changed
      if (adj.hue !== 0 && result) {
        const hueResult = await adjustHue(result, adj.hue * 360);
        if (hueResult) result = hueResult;
      }

      if (result) {
        setPreviewImageData(result);
        setImageData(result);
      }
    },
    [originalImageData, state.isProcessing, applyFilter, adjustHue],
  );

  const handleAdjustmentChange = useCallback(
    (type: keyof AdjustmentValues, value: number) => {
      const newAdjustments = { ...adjustments, [type]: value };
      setAdjustments(newAdjustments);

      // debounce the actual processing
      if (adjustmentDebounceRef.current) {
        clearTimeout(adjustmentDebounceRef.current);
      }

      adjustmentDebounceRef.current = setTimeout(() => {
        applyAllAdjustments(newAdjustments);
      }, 50);
    },
    [adjustments, applyAllAdjustments],
  );

  const handleApplyAdjustments = useCallback(() => {
    const dataToApply = previewImageData || imageData;
    if (dataToApply) {
      setOriginalImageData(dataToApply);
      onImageUpdate(dataToApply, imageDimensions.width, imageDimensions.height);
      onClose();
    }
  }, [previewImageData, imageData, imageDimensions, onImageUpdate, onClose]);

  const handleResetAdjustments = useCallback(() => {
    setAdjustments(DEFAULT_ADJUSTMENTS);
    setPreviewImageData(null);
    if (originalImageData) {
      setImageData(originalImageData);
    }
  }, [originalImageData]);

  useEffect(() => {
    async function loadHistogram() {
      const dataForHistogram = previewImageData || imageData;
      if (activeTab === "histogram" && dataForHistogram) {
        const data = await getHistogram(dataForHistogram);
        if (data) {
          setHistogramData(data);
        }
      }
    }
    loadHistogram();
  }, [activeTab, imageData, previewImageData, getHistogram]);

  // calculate preview dimensions
  const previewStyle = useMemo(() => {
    const maxWidth = 280;
    const maxHeight = 200;

    if (!imageDimensions.width || !imageDimensions.height) {
      return { width: maxWidth, height: maxHeight };
    }

    const scaleX = maxWidth / imageDimensions.width;
    const scaleY = maxHeight / imageDimensions.height;
    const scale = Math.min(scaleX, scaleY, 1);

    return {
      width: imageDimensions.width * scale,
      height: imageDimensions.height * scale,
    };
  }, [imageDimensions]);

  const renderHistogram = useMemo(() => {
    if (!histogramData) return null;

    const maxValue = Math.max(
      ...Array.from(histogramData.red),
      ...Array.from(histogramData.green),
      ...Array.from(histogramData.blue),
    );

    const scale = maxValue > 0 ? 100 / maxValue : 1;

    return (
      <div className="space-y-3">
        <div className="space-y-1">
          <span className="text-xs font-medium text-red-500">Red</span>
          <div className="bg-muted flex h-12 items-end gap-px overflow-hidden rounded p-1">
            {Array.from(histogramData.red).map((value, i) => (
              <div
                key={`hist-red-${i}`}
                className="min-w-[1px] flex-1 bg-red-500/70"
                style={{ height: `${Math.max(1, value * scale)}%` }}
              />
            ))}
          </div>
        </div>
        <div className="space-y-1">
          <span className="text-xs font-medium text-green-500">Green</span>
          <div className="bg-muted flex h-12 items-end gap-px overflow-hidden rounded p-1">
            {Array.from(histogramData.green).map((value, i) => (
              <div
                key={`hist-green-${i}`}
                className="min-w-[1px] flex-1 bg-green-500/70"
                style={{ height: `${Math.max(1, value * scale)}%` }}
              />
            ))}
          </div>
        </div>
        <div className="space-y-1">
          <span className="text-xs font-medium text-blue-500">Blue</span>
          <div className="bg-muted flex h-12 items-end gap-px overflow-hidden rounded p-1">
            {Array.from(histogramData.blue).map((value, i) => (
              <div
                key={`hist-blue-${i}`}
                className="min-w-[1px] flex-1 bg-blue-500/70"
                style={{ height: `${Math.max(1, value * scale)}%` }}
              />
            ))}
          </div>
        </div>
        <div className="space-y-1">
          <span className="text-muted-foreground text-xs font-medium">
            Luminance
          </span>
          <div className="bg-muted flex h-12 items-end gap-px overflow-hidden rounded p-1">
            {Array.from(histogramData.luminance).map((value, i) => (
              <div
                key={`hist-lum-${i}`}
                className="bg-foreground/50 min-w-[1px] flex-1"
                style={{ height: `${Math.max(1, value * scale)}%` }}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }, [histogramData]);

  if (!state.isSupported && !state.isLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <div className="flex flex-col items-center justify-center gap-4 py-8">
            <AlertCircle className="text-destructive h-12 w-12" />
            <div className="text-center">
              <h3 className="font-semibold">WebGPU Not Supported</h3>
              <p className="text-muted-foreground mt-2 text-sm">
                Image editing tools require WebGPU for hardware-accelerated
                processing. Please use a browser that supports WebGPU.
              </p>
            </div>
            <Button onClick={onClose}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="flex max-h-[85vh] flex-col overflow-hidden sm:max-w-xl">
        <DialogHeader className="shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="text-primary h-5 w-5" />
            Image Tools
            {state.isProcessing && (
              <Loader2 className="text-muted-foreground h-4 w-4 animate-spin" />
            )}
          </DialogTitle>
        </DialogHeader>

        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as ToolTab)}
          className="flex min-h-0 flex-1 flex-col"
        >
          <TabsList className="grid w-full shrink-0 grid-cols-5">
            <TabsTrigger
              value="crop"
              className="flex items-center gap-1 text-xs"
            >
              <Crop className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Crop</span>
            </TabsTrigger>
            <TabsTrigger
              value="filters"
              className="flex items-center gap-1 text-xs"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Filters</span>
            </TabsTrigger>
            <TabsTrigger
              value="adjust"
              className="flex items-center gap-1 text-xs"
            >
              <Sliders className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Adjust</span>
            </TabsTrigger>
            <TabsTrigger
              value="histogram"
              className="flex items-center gap-1 text-xs"
            >
              <BarChart3 className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Histogram</span>
            </TabsTrigger>
            <TabsTrigger value="ai" className="flex items-center gap-1 text-xs">
              <Wand2 className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">AI</span>
            </TabsTrigger>
          </TabsList>

          <div className="min-h-0 flex-1 overflow-hidden">
            <AnimatePresence mode="wait">
              <TabsContent value="crop" className="mt-0 h-full overflow-y-auto">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="h-full"
                >
                  <CropTool
                    imageData={imageData}
                    imageWidth={imageDimensions.width}
                    imageHeight={imageDimensions.height}
                    onApply={handleCropApply}
                    onClose={onClose}
                  />
                </motion.div>
              </TabsContent>

              <TabsContent
                value="filters"
                className="mt-0 h-full overflow-y-auto"
              >
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="h-full"
                >
                  <FilterPanel
                    imageData={imageData}
                    onApply={handleFilterApply}
                    onClose={onClose}
                  />
                </motion.div>
              </TabsContent>

              <TabsContent
                value="adjust"
                className="mt-0 h-full overflow-y-auto"
              >
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex h-full flex-col p-4"
                >
                  {/* preview */}
                  <div className="mb-4 flex shrink-0 items-center justify-center rounded-lg border bg-neutral-900 p-2">
                    {imageData ? (
                      <canvas
                        ref={previewCanvasRef}
                        className="block rounded"
                        style={{
                          width: previewStyle.width,
                          height: previewStyle.height,
                        }}
                      />
                    ) : (
                      <div className="text-muted-foreground flex h-32 items-center justify-center">
                        No image loaded
                      </div>
                    )}
                  </div>

                  {/* adjustments */}
                  <div className="flex-1 space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Brightness</span>
                        <span className="text-muted-foreground text-xs">
                          {Math.round((adjustments.brightness - 0.5) * 200)}%
                        </span>
                      </div>
                      <Slider
                        value={[adjustments.brightness]}
                        onValueChange={([v]) =>
                          handleAdjustmentChange("brightness", v)
                        }
                        min={0}
                        max={1}
                        step={0.01}
                        disabled={state.isProcessing}
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Contrast</span>
                        <span className="text-muted-foreground text-xs">
                          {Math.round((adjustments.contrast - 0.5) * 200)}%
                        </span>
                      </div>
                      <Slider
                        value={[adjustments.contrast]}
                        onValueChange={([v]) =>
                          handleAdjustmentChange("contrast", v)
                        }
                        min={0}
                        max={1}
                        step={0.01}
                        disabled={state.isProcessing}
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Saturation</span>
                        <span className="text-muted-foreground text-xs">
                          {Math.round((adjustments.saturation - 0.5) * 200)}%
                        </span>
                      </div>
                      <Slider
                        value={[adjustments.saturation]}
                        onValueChange={([v]) =>
                          handleAdjustmentChange("saturation", v)
                        }
                        min={0}
                        max={1}
                        step={0.01}
                        disabled={state.isProcessing}
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Hue</span>
                        <span className="text-muted-foreground text-xs">
                          {Math.round(adjustments.hue * 360)}°
                        </span>
                      </div>
                      <Slider
                        value={[adjustments.hue]}
                        onValueChange={([v]) =>
                          handleAdjustmentChange("hue", v)
                        }
                        min={0}
                        max={1}
                        step={0.01}
                        disabled={state.isProcessing}
                        className="[&_.slider-track]:bg-gradient-to-r [&_.slider-track]:from-red-500 [&_.slider-track]:via-green-500 [&_.slider-track]:to-blue-500"
                      />
                    </div>
                  </div>

                  <div className="mt-4 flex shrink-0 gap-2">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={handleResetAdjustments}
                      disabled={state.isProcessing}
                    >
                      <RotateCcw className="mr-1.5 h-4 w-4" />
                      Reset
                    </Button>
                    <Button
                      className="flex-1"
                      onClick={handleApplyAdjustments}
                      disabled={state.isProcessing}
                    >
                      {state.isProcessing ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        "Apply"
                      )}
                    </Button>
                  </div>
                </motion.div>
              </TabsContent>

              <TabsContent
                value="histogram"
                className="mt-0 h-full overflow-y-auto"
              >
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="p-4"
                >
                  <div className="mb-3 flex items-center gap-2">
                    <BarChart3 className="text-primary h-5 w-5" />
                    <h3 className="font-semibold">Color Histogram</h3>
                  </div>

                  {state.isProcessing ? (
                    <div className="flex h-48 items-center justify-center">
                      <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
                    </div>
                  ) : histogramData ? (
                    renderHistogram
                  ) : (
                    <div className="text-muted-foreground flex h-48 items-center justify-center">
                      No histogram data available
                    </div>
                  )}
                </motion.div>
              </TabsContent>

              <TabsContent value="ai" className="mt-0 h-full overflow-y-auto">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-4 p-4"
                >
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="outline"
                      className="h-auto flex-col gap-1.5 p-3"
                      disabled={state.isProcessing || !imageData}
                    >
                      <Wand2 className="h-5 w-5" />
                      <span className="text-xs font-medium">Auto Enhance</span>
                      <span className="text-muted-foreground text-[10px]">
                        Improve colors
                      </span>
                    </Button>
                    <Button
                      variant="outline"
                      className="h-auto flex-col gap-1.5 p-3"
                      disabled={state.isProcessing || !imageData}
                    >
                      <Sparkles className="h-5 w-5" />
                      <span className="text-xs font-medium">HD Upscale</span>
                      <span className="text-muted-foreground text-[10px]">
                        2x resolution
                      </span>
                    </Button>
                    <Button
                      variant="outline"
                      className="h-auto flex-col gap-1.5 p-3"
                      disabled={state.isProcessing || !imageData}
                    >
                      <ImageIcon className="h-5 w-5" />
                      <span className="text-xs font-medium">Remove BG</span>
                      <span className="text-muted-foreground text-[10px]">
                        AI removal
                      </span>
                    </Button>
                    <Button
                      variant="outline"
                      className="h-auto flex-col gap-1.5 p-3"
                      disabled={state.isProcessing || !imageData}
                    >
                      <Palette className="h-5 w-5" />
                      <span className="text-xs font-medium">Colorize</span>
                      <span className="text-muted-foreground text-[10px]">
                        B&W to color
                      </span>
                    </Button>
                  </div>

                  <div className="rounded-lg border p-3">
                    <div className="mb-1.5 flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-amber-500" />
                      <span className="text-sm font-medium">Coming Soon</span>
                    </div>
                    <p className="text-muted-foreground text-xs">
                      AI-powered enhancement features will be available in a
                      future update.
                    </p>
                  </div>
                </motion.div>
              </TabsContent>
            </AnimatePresence>
          </div>
        </Tabs>

        {state.isLoading && (
          <div className="bg-background/80 absolute inset-0 flex items-center justify-center">
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="text-primary h-8 w-8 animate-spin" />
              <p className="text-muted-foreground text-sm">
                Initializing WebGPU...
              </p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
