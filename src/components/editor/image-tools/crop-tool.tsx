"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import {
  Crop,
  RotateCw,
  FlipHorizontal,
  FlipVertical,
  Check,
  X,
  Loader2,
  Square,
  RectangleHorizontal,
  RectangleVertical,
  Unlock,
} from "lucide-react";
import { Button } from "~/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "~/components/ui/tooltip";
import { useImageProcessor, type CropRegion } from "~/hooks/useImageProcessor";
import { ny } from "~/lib/utils";

interface CropToolProps {
  imageData: ImageData | null;
  imageWidth: number;
  imageHeight: number;
  onApply: (
    processedData: ImageData,
    newWidth: number,
    newHeight: number,
  ) => void;
  onClose: () => void;
}

type AspectRatio = "free" | "1:1" | "4:3" | "16:9" | "3:2";

interface AspectOption {
  name: AspectRatio;
  label: string;
  icon: React.ReactNode;
  ratio: number | null;
}

const ASPECT_OPTIONS: AspectOption[] = [
  {
    name: "free",
    label: "Free",
    icon: <Unlock className="h-4 w-4" />,
    ratio: null,
  },
  {
    name: "1:1",
    label: "1:1",
    icon: <Square className="h-4 w-4" />,
    ratio: 1,
  },
  {
    name: "4:3",
    label: "4:3",
    icon: <RectangleHorizontal className="h-4 w-4" />,
    ratio: 4 / 3,
  },
  {
    name: "16:9",
    label: "16:9",
    icon: <RectangleHorizontal className="h-4 w-4" />,
    ratio: 16 / 9,
  },
  {
    name: "3:2",
    label: "3:2",
    icon: <RectangleVertical className="h-4 w-4" />,
    ratio: 3 / 2,
  },
];

export function CropTool({
  imageData,
  imageWidth,
  imageHeight,
  onApply,
  onClose,
}: CropToolProps) {
  const { state, crop, rotate, flip } = useImageProcessor();
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [currentImageData, setCurrentImageData] = useState<ImageData | null>(
    imageData,
  );
  const [currentDimensions, setCurrentDimensions] = useState({
    width: imageWidth,
    height: imageHeight,
  });
  const [cropRegion, setCropRegion] = useState<CropRegion>({
    x: 0,
    y: 0,
    width: imageWidth,
    height: imageHeight,
  });
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>("free");
  const [isDragging, setIsDragging] = useState(false);
  const [dragHandle, setDragHandle] = useState<string | null>(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [initialRegion, setInitialRegion] = useState<CropRegion | null>(null);
  const [displayScale, setDisplayScale] = useState(1);

  // draw image on canvas
  useEffect(() => {
    if (!currentImageData || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = currentImageData.width;
    canvas.height = currentImageData.height;
    ctx.putImageData(currentImageData, 0, 0);

    // update dimensions
    setCurrentDimensions({
      width: currentImageData.width,
      height: currentImageData.height,
    });
  }, [currentImageData]);

  // initialize with imageData prop
  useEffect(() => {
    if (imageData) {
      setCurrentImageData(imageData);
      setCurrentDimensions({
        width: imageData.width,
        height: imageData.height,
      });
      setCropRegion({
        x: 0,
        y: 0,
        width: imageData.width,
        height: imageData.height,
      });
    }
  }, [imageData]);

  // calculate display scale
  useEffect(() => {
    if (!containerRef.current || !currentDimensions.width) return;

    const containerWidth = containerRef.current.clientWidth;
    const containerHeight = containerRef.current.clientHeight;
    const scaleX = containerWidth / currentDimensions.width;
    const scaleY = containerHeight / currentDimensions.height;
    setDisplayScale(Math.min(scaleX, scaleY, 1));
  }, [currentDimensions]);

  const getConstrainedRegion = useCallback(
    (region: CropRegion, ratio: number | null): CropRegion => {
      if (!ratio) return region;

      let { x, y, width, height } = region;
      const currentRatio = width / height;

      if (currentRatio > ratio) {
        width = height * ratio;
      } else {
        height = width / ratio;
      }

      x = Math.max(0, Math.min(x, currentDimensions.width - width));
      y = Math.max(0, Math.min(y, currentDimensions.height - height));
      width = Math.min(width, currentDimensions.width - x);
      height = Math.min(height, currentDimensions.height - y);

      return {
        x: Math.round(x),
        y: Math.round(y),
        width: Math.round(width),
        height: Math.round(height),
      };
    },
    [currentDimensions],
  );

  const handleAspectChange = useCallback(
    (aspect: AspectRatio) => {
      setAspectRatio(aspect);
      const option = ASPECT_OPTIONS.find((o) => o.name === aspect);
      if (option?.ratio) {
        setCropRegion((prev) => getConstrainedRegion(prev, option.ratio));
      }
    },
    [getConstrainedRegion],
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent, handle: string) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(true);
      setDragHandle(handle);
      setDragStart({ x: e.clientX, y: e.clientY });
      setInitialRegion({ ...cropRegion });
    },
    [cropRegion],
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging || !initialRegion || !containerRef.current) return;

      const scaleX =
        currentDimensions.width /
        (containerRef.current.clientWidth * displayScale);
      const scaleY =
        currentDimensions.height /
        (containerRef.current.clientHeight * displayScale);

      const deltaX = (e.clientX - dragStart.x) * scaleX;
      const deltaY = (e.clientY - dragStart.y) * scaleY;

      let newRegion = { ...initialRegion };
      const option = ASPECT_OPTIONS.find((o) => o.name === aspectRatio);
      const ratio = option?.ratio || null;

      switch (dragHandle) {
        case "move":
          newRegion.x = Math.max(
            0,
            Math.min(
              initialRegion.x + deltaX,
              currentDimensions.width - initialRegion.width,
            ),
          );
          newRegion.y = Math.max(
            0,
            Math.min(
              initialRegion.y + deltaY,
              currentDimensions.height - initialRegion.height,
            ),
          );
          break;
        case "nw":
          newRegion.x = Math.max(0, initialRegion.x + deltaX);
          newRegion.y = Math.max(0, initialRegion.y + deltaY);
          newRegion.width =
            initialRegion.width - (newRegion.x - initialRegion.x);
          newRegion.height =
            initialRegion.height - (newRegion.y - initialRegion.y);
          break;
        case "ne":
          newRegion.y = Math.max(0, initialRegion.y + deltaY);
          newRegion.width = Math.min(
            currentDimensions.width - initialRegion.x,
            initialRegion.width + deltaX,
          );
          newRegion.height =
            initialRegion.height - (newRegion.y - initialRegion.y);
          break;
        case "sw":
          newRegion.x = Math.max(0, initialRegion.x + deltaX);
          newRegion.width =
            initialRegion.width - (newRegion.x - initialRegion.x);
          newRegion.height = Math.min(
            currentDimensions.height - initialRegion.y,
            initialRegion.height + deltaY,
          );
          break;
        case "se":
          newRegion.width = Math.min(
            currentDimensions.width - initialRegion.x,
            initialRegion.width + deltaX,
          );
          newRegion.height = Math.min(
            currentDimensions.height - initialRegion.y,
            initialRegion.height + deltaY,
          );
          break;
        case "n":
          newRegion.y = Math.max(0, initialRegion.y + deltaY);
          newRegion.height =
            initialRegion.height - (newRegion.y - initialRegion.y);
          break;
        case "s":
          newRegion.height = Math.min(
            currentDimensions.height - initialRegion.y,
            initialRegion.height + deltaY,
          );
          break;
        case "w":
          newRegion.x = Math.max(0, initialRegion.x + deltaX);
          newRegion.width =
            initialRegion.width - (newRegion.x - initialRegion.x);
          break;
        case "e":
          newRegion.width = Math.min(
            currentDimensions.width - initialRegion.x,
            initialRegion.width + deltaX,
          );
          break;
      }

      newRegion.width = Math.max(20, newRegion.width);
      newRegion.height = Math.max(20, newRegion.height);

      if (ratio && dragHandle !== "move") {
        newRegion = getConstrainedRegion(newRegion, ratio);
      }

      setCropRegion({
        x: Math.round(newRegion.x),
        y: Math.round(newRegion.y),
        width: Math.round(newRegion.width),
        height: Math.round(newRegion.height),
      });
    },
    [
      isDragging,
      initialRegion,
      dragStart,
      dragHandle,
      aspectRatio,
      currentDimensions,
      displayScale,
      getConstrainedRegion,
    ],
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setDragHandle(null);
    setInitialRegion(null);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      return () => {
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const handleRotate = useCallback(
    async (degrees: number) => {
      if (!currentImageData || state.isProcessing) return;

      const result = await rotate(currentImageData, degrees);
      if (result) {
        setCurrentImageData(result.imageData);
        setCurrentDimensions({ width: result.width, height: result.height });
        setCropRegion({
          x: 0,
          y: 0,
          width: result.width,
          height: result.height,
        });
      }
    },
    [currentImageData, rotate, state.isProcessing],
  );

  const handleFlip = useCallback(
    async (horizontal: boolean) => {
      if (!currentImageData || state.isProcessing) return;
      const result = await flip(currentImageData, horizontal);
      if (result) {
        setCurrentImageData(result);
      }
    },
    [currentImageData, flip, state.isProcessing],
  );

  const handleApply = useCallback(async () => {
    if (!currentImageData || state.isProcessing) return;

    const result = await crop(currentImageData, cropRegion);
    if (result) {
      onApply(result, cropRegion.width, cropRegion.height);
      onClose();
    }
  }, [
    currentImageData,
    cropRegion,
    crop,
    onApply,
    onClose,
    state.isProcessing,
  ]);

  const handleReset = useCallback(() => {
    if (imageData) {
      setCurrentImageData(imageData);
      setCurrentDimensions({
        width: imageData.width,
        height: imageData.height,
      });
      setCropRegion({
        x: 0,
        y: 0,
        width: imageData.width,
        height: imageData.height,
      });
    }
    setAspectRatio("free");
  }, [imageData]);

  const cropPercentages = {
    left: (cropRegion.x / currentDimensions.width) * 100,
    top: (cropRegion.y / currentDimensions.height) * 100,
    width: (cropRegion.width / currentDimensions.width) * 100,
    height: (cropRegion.height / currentDimensions.height) * 100,
  };

  const scaledCanvasStyle = {
    width: currentDimensions.width * displayScale,
    height: currentDimensions.height * displayScale,
  };

  return (
    <TooltipProvider>
      <div className="flex h-full flex-col overflow-hidden">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div className="flex items-center gap-2">
            <Crop className="text-primary h-5 w-5" />
            <h3 className="font-semibold">Crop & Transform</h3>
            {state.isProcessing && (
              <Loader2 className="text-muted-foreground h-4 w-4 animate-spin" />
            )}
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto p-4">
          <div className="space-y-2">
            <span className="text-sm font-medium">Aspect Ratio</span>
            <div className="flex flex-wrap gap-1.5">
              {ASPECT_OPTIONS.map((option) => (
                <Tooltip key={`crop-aspect-${option.name}`}>
                  <TooltipTrigger asChild>
                    <Button
                      variant={
                        aspectRatio === option.name ? "default" : "outline"
                      }
                      size="sm"
                      className="h-8 px-2"
                      onClick={() => handleAspectChange(option.name)}
                      disabled={state.isProcessing}
                    >
                      {option.icon}
                      <span className="ml-1 text-xs">{option.label}</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>{option.label}</TooltipContent>
                </Tooltip>
              ))}
            </div>
          </div>

          <div
            ref={containerRef}
            className="relative flex items-center justify-center rounded-lg border bg-neutral-900 p-2"
            style={{ minHeight: 200, maxHeight: 280 }}
          >
            {currentImageData ? (
              <div className="relative" style={scaledCanvasStyle}>
                <canvas
                  ref={canvasRef}
                  className="block"
                  style={{
                    width: scaledCanvasStyle.width,
                    height: scaledCanvasStyle.height,
                  }}
                />

                {/* dark overlay for outside crop area */}
                <div className="pointer-events-none absolute inset-0">
                  {/* top overlay */}
                  <div
                    className="absolute top-0 right-0 left-0 bg-black/60"
                    style={{ height: `${cropPercentages.top}%` }}
                  />
                  {/* bottom overlay */}
                  <div
                    className="absolute right-0 bottom-0 left-0 bg-black/60"
                    style={{
                      height: `${100 - cropPercentages.top - cropPercentages.height}%`,
                    }}
                  />
                  {/* left overlay */}
                  <div
                    className="absolute left-0 bg-black/60"
                    style={{
                      top: `${cropPercentages.top}%`,
                      width: `${cropPercentages.left}%`,
                      height: `${cropPercentages.height}%`,
                    }}
                  />
                  {/* right overlay */}
                  <div
                    className="absolute right-0 bg-black/60"
                    style={{
                      top: `${cropPercentages.top}%`,
                      width: `${100 - cropPercentages.left - cropPercentages.width}%`,
                      height: `${cropPercentages.height}%`,
                    }}
                  />
                </div>

                {/* crop selection */}
                <div
                  className="border-primary absolute border-2"
                  style={{
                    left: `${cropPercentages.left}%`,
                    top: `${cropPercentages.top}%`,
                    width: `${cropPercentages.width}%`,
                    height: `${cropPercentages.height}%`,
                  }}
                >
                  {/* move handle */}
                  <div
                    className="absolute inset-0 cursor-move"
                    onMouseDown={(e) => handleMouseDown(e, "move")}
                  />

                  {/* corner handles */}
                  <div
                    className="bg-primary absolute -top-1.5 -left-1.5 h-3 w-3 cursor-nw-resize rounded-full"
                    onMouseDown={(e) => handleMouseDown(e, "nw")}
                  />
                  <div
                    className="bg-primary absolute -top-1.5 -right-1.5 h-3 w-3 cursor-ne-resize rounded-full"
                    onMouseDown={(e) => handleMouseDown(e, "ne")}
                  />
                  <div
                    className="bg-primary absolute -bottom-1.5 -left-1.5 h-3 w-3 cursor-sw-resize rounded-full"
                    onMouseDown={(e) => handleMouseDown(e, "sw")}
                  />
                  <div
                    className="bg-primary absolute -right-1.5 -bottom-1.5 h-3 w-3 cursor-se-resize rounded-full"
                    onMouseDown={(e) => handleMouseDown(e, "se")}
                  />

                  {/* edge handles */}
                  <div
                    className="bg-primary absolute -top-1 left-1/2 h-2 w-6 -translate-x-1/2 cursor-n-resize rounded"
                    onMouseDown={(e) => handleMouseDown(e, "n")}
                  />
                  <div
                    className="bg-primary absolute -bottom-1 left-1/2 h-2 w-6 -translate-x-1/2 cursor-s-resize rounded"
                    onMouseDown={(e) => handleMouseDown(e, "s")}
                  />
                  <div
                    className="bg-primary absolute top-1/2 -left-1 h-6 w-2 -translate-y-1/2 cursor-w-resize rounded"
                    onMouseDown={(e) => handleMouseDown(e, "w")}
                  />
                  <div
                    className="bg-primary absolute top-1/2 -right-1 h-6 w-2 -translate-y-1/2 cursor-e-resize rounded"
                    onMouseDown={(e) => handleMouseDown(e, "e")}
                  />

                  {/* rule of thirds grid */}
                  <div className="pointer-events-none absolute inset-0">
                    <div className="bg-primary/30 absolute top-0 left-1/3 h-full w-px" />
                    <div className="bg-primary/30 absolute top-0 left-2/3 h-full w-px" />
                    <div className="bg-primary/30 absolute top-1/3 left-0 h-px w-full" />
                    <div className="bg-primary/30 absolute top-2/3 left-0 h-px w-full" />
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-muted-foreground flex h-40 items-center justify-center">
                No image loaded
              </div>
            )}
          </div>

          <div className="space-y-2">
            <span className="text-sm font-medium">Transform</span>
            <div className="flex flex-wrap gap-1.5">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8"
                    onClick={() => handleRotate(90)}
                    disabled={state.isProcessing}
                  >
                    <RotateCw className="h-4 w-4" />
                    <span className="ml-1 text-xs">90°</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Rotate 90°</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8"
                    onClick={() => handleFlip(true)}
                    disabled={state.isProcessing}
                  >
                    <FlipHorizontal className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Flip horizontal</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8"
                    onClick={() => handleFlip(false)}
                    disabled={state.isProcessing}
                  >
                    <FlipVertical className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Flip vertical</TooltipContent>
              </Tooltip>
            </div>
          </div>

          <div className="text-muted-foreground text-xs">
            {Math.round(cropRegion.width)} × {Math.round(cropRegion.height)} px
          </div>
        </div>

        <div className="flex gap-2 border-t p-3">
          <Button
            variant="outline"
            className="flex-1"
            onClick={handleReset}
            disabled={state.isProcessing}
          >
            Reset
          </Button>
          <Button
            className="flex-1"
            onClick={handleApply}
            disabled={state.isProcessing || !currentImageData}
          >
            {state.isProcessing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Check className="mr-1 h-4 w-4" />
                Apply
              </>
            )}
          </Button>
        </div>
      </div>
    </TooltipProvider>
  );
}
