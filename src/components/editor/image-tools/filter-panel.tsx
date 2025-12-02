"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Sun,
  Contrast,
  Palette,
  Wand2,
  Loader2,
  AlertCircle,
  X,
  RotateCcw,
} from "lucide-react";
import { Button } from "~/components/ui/button";
import { Slider } from "~/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "~/components/ui/tooltip";
import { useImageProcessor, type FilterName } from "~/hooks/useImageProcessor";
import { ny } from "~/lib/utils";

interface FilterPanelProps {
  imageData: ImageData | null;
  onApply: (processedData: ImageData) => void;
  onClose: () => void;
}

interface FilterPreset {
  name: string;
  displayName: string;
  icon: React.ReactNode;
  defaultIntensity: number;
}

const FILTER_PRESETS: Record<string, FilterPreset[]> = {
  color: [
    {
      name: "grayscale",
      displayName: "Grayscale",
      icon: <Palette className="h-4 w-4" />,
      defaultIntensity: 1.0,
    },
    {
      name: "sepia",
      displayName: "Sepia",
      icon: <Palette className="h-4 w-4" />,
      defaultIntensity: 1.0,
    },
    {
      name: "invert",
      displayName: "Invert",
      icon: <Contrast className="h-4 w-4" />,
      defaultIntensity: 1.0,
    },
    {
      name: "warm",
      displayName: "Warm",
      icon: <Sun className="h-4 w-4" />,
      defaultIntensity: 0.5,
    },
    {
      name: "cool",
      displayName: "Cool",
      icon: <Palette className="h-4 w-4" />,
      defaultIntensity: 0.5,
    },
  ],
  adjust: [
    {
      name: "brightness",
      displayName: "Bright",
      icon: <Sun className="h-4 w-4" />,
      defaultIntensity: 0.6,
    },
    {
      name: "contrast",
      displayName: "Contrast",
      icon: <Contrast className="h-4 w-4" />,
      defaultIntensity: 0.6,
    },
    {
      name: "saturation",
      displayName: "Saturate",
      icon: <Palette className="h-4 w-4" />,
      defaultIntensity: 0.6,
    },
  ],
  effect: [
    {
      name: "blur",
      displayName: "Blur",
      icon: <Wand2 className="h-4 w-4" />,
      defaultIntensity: 0.3,
    },
    {
      name: "sharpen",
      displayName: "Sharpen",
      icon: <Sparkles className="h-4 w-4" />,
      defaultIntensity: 0.5,
    },
    {
      name: "vignette",
      displayName: "Vignette",
      icon: <Wand2 className="h-4 w-4" />,
      defaultIntensity: 0.5,
    },
    {
      name: "noise",
      displayName: "Noise",
      icon: <Sparkles className="h-4 w-4" />,
      defaultIntensity: 0.3,
    },
  ],
  artistic: [
    {
      name: "vintage",
      displayName: "Vintage",
      icon: <Wand2 className="h-4 w-4" />,
      defaultIntensity: 1.0,
    },
    {
      name: "posterize",
      displayName: "Poster",
      icon: <Palette className="h-4 w-4" />,
      defaultIntensity: 0.5,
    },
    {
      name: "emboss",
      displayName: "Emboss",
      icon: <Sparkles className="h-4 w-4" />,
      defaultIntensity: 0.5,
    },
    {
      name: "edge_detect",
      displayName: "Edges",
      icon: <Contrast className="h-4 w-4" />,
      defaultIntensity: 0.5,
    },
    {
      name: "pixelate",
      displayName: "Pixelate",
      icon: <Wand2 className="h-4 w-4" />,
      defaultIntensity: 0.3,
    },
  ],
};

const CATEGORY_LABELS: Record<string, string> = {
  color: "Color",
  adjust: "Adjust",
  effect: "Effects",
  artistic: "Artistic",
};

export function FilterPanel({ imageData, onApply, onClose }: FilterPanelProps) {
  const { state, applyFilter } = useImageProcessor();
  const [selectedFilter, setSelectedFilter] = useState<FilterName | null>(null);
  const [intensity, setIntensity] = useState(1.0);
  const [previewData, setPreviewData] = useState<ImageData | null>(null);
  const [activeCategory, setActiveCategory] = useState("color");

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // draw preview on canvas
  useEffect(() => {
    const dataToRender = previewData || imageData;
    if (!dataToRender || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = dataToRender.width;
    canvas.height = dataToRender.height;
    ctx.putImageData(dataToRender, 0, 0);
  }, [previewData, imageData]);

  // calculate preview dimensions
  const previewStyle = (() => {
    const maxWidth = 280;
    const maxHeight = 180;

    if (!imageData) {
      return { width: maxWidth, height: maxHeight };
    }

    const scaleX = maxWidth / imageData.width;
    const scaleY = maxHeight / imageData.height;
    const scale = Math.min(scaleX, scaleY, 1);

    return {
      width: imageData.width * scale,
      height: imageData.height * scale,
    };
  })();

  const handleFilterSelect = useCallback(
    async (filterName: FilterName, defaultIntensity: number) => {
      if (!imageData || state.isProcessing) return;

      setSelectedFilter(filterName);
      setIntensity(defaultIntensity);

      const result = await applyFilter(imageData, filterName, defaultIntensity);
      if (result) {
        setPreviewData(result);
      }
    },
    [imageData, state.isProcessing, applyFilter],
  );

  const handleIntensityChange = useCallback(
    (value: number[]) => {
      if (!imageData || !selectedFilter) return;

      const newIntensity = value[0];
      setIntensity(newIntensity);

      // debounce the actual processing
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }

      debounceRef.current = setTimeout(async () => {
        if (state.isProcessing) return;
        const result = await applyFilter(
          imageData,
          selectedFilter,
          newIntensity,
        );
        if (result) {
          setPreviewData(result);
        }
      }, 50);
    },
    [imageData, selectedFilter, state.isProcessing, applyFilter],
  );

  const handleApply = useCallback(() => {
    if (previewData) {
      onApply(previewData);
      onClose();
    }
  }, [previewData, onApply, onClose]);

  const handleReset = useCallback(() => {
    setSelectedFilter(null);
    setPreviewData(null);
    setIntensity(1.0);
  }, []);

  useEffect(() => {
    if (!imageData) {
      setPreviewData(null);
      setSelectedFilter(null);
    }
  }, [imageData]);

  if (!state.isSupported && !state.isLoading) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 p-6">
        <AlertCircle className="text-destructive h-12 w-12" />
        <p className="text-muted-foreground text-center text-sm">
          WebGPU is not supported in your browser. Image filters require WebGPU
          for hardware acceleration.
        </p>
        <Button variant="outline" onClick={onClose}>
          Close
        </Button>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="flex h-full flex-col overflow-hidden">
        <div className="flex shrink-0 items-center justify-between border-b px-4 py-3">
          <div className="flex items-center gap-2">
            <Sparkles className="text-primary h-5 w-5" />
            <h3 className="font-semibold">Filters</h3>
            {state.isProcessing && (
              <Loader2 className="text-muted-foreground h-4 w-4 animate-spin" />
            )}
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* preview */}
          <div className="flex items-center justify-center border-b bg-neutral-900 p-3">
            {imageData ? (
              <canvas
                ref={canvasRef}
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

          <Tabs
            value={activeCategory}
            onValueChange={setActiveCategory}
            className="flex-1"
          >
            <TabsList className="mx-2 mt-2 grid w-[calc(100%-16px)] grid-cols-4">
              {Object.keys(FILTER_PRESETS).map((category) => (
                <TabsTrigger
                  key={`filter-tab-${category}`}
                  value={category}
                  className="text-xs"
                >
                  {CATEGORY_LABELS[category]}
                </TabsTrigger>
              ))}
            </TabsList>

            <div className="p-3">
              {Object.entries(FILTER_PRESETS).map(([category, filters]) => (
                <TabsContent
                  key={`filter-content-${category}`}
                  value={category}
                  className="mt-0"
                >
                  <div className="grid grid-cols-3 gap-1.5">
                    {filters.map((filter) => (
                      <Tooltip key={`filter-btn-${filter.name}`}>
                        <TooltipTrigger asChild>
                          <Button
                            variant={
                              selectedFilter === filter.name
                                ? "default"
                                : "outline"
                            }
                            className={ny(
                              "flex h-auto flex-col gap-1 py-2",
                              selectedFilter === filter.name &&
                                "ring-primary ring-2",
                            )}
                            onClick={() =>
                              handleFilterSelect(
                                filter.name as FilterName,
                                filter.defaultIntensity,
                              )
                            }
                            disabled={state.isProcessing || !imageData}
                          >
                            {filter.icon}
                            <span className="text-[10px]">
                              {filter.displayName}
                            </span>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom">
                          {filter.displayName}
                        </TooltipContent>
                      </Tooltip>
                    ))}
                  </div>
                </TabsContent>
              ))}
            </div>
          </Tabs>
        </div>

        <AnimatePresence>
          {selectedFilter && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="shrink-0 overflow-hidden border-t"
            >
              <div className="space-y-3 px-4 py-3">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Intensity</span>
                    <span className="text-muted-foreground text-xs">
                      {Math.round(intensity * 100)}%
                    </span>
                  </div>
                  <Slider
                    value={[intensity]}
                    onValueChange={handleIntensityChange}
                    min={0}
                    max={1}
                    step={0.01}
                    disabled={state.isProcessing}
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={handleReset}
                    disabled={state.isProcessing}
                  >
                    <RotateCcw className="mr-1.5 h-4 w-4" />
                    Reset
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={handleApply}
                    disabled={state.isProcessing || !previewData}
                  >
                    {state.isProcessing ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Apply"
                    )}
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

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
      </div>
    </TooltipProvider>
  );
}
