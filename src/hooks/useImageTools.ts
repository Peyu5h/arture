import { useState, useCallback, useRef, useEffect } from "react";
import { fabric } from "fabric";

interface UseImageToolsProps {
  canvas: fabric.Canvas | null;
  onImageUpdate?: (
    image: fabric.Image,
    imageData: ImageData,
    width: number,
    height: number,
  ) => void;
}

interface UseImageToolsReturn {
  isDialogOpen: boolean;
  selectedImage: fabric.Image | null;
  openImageTools: (image: fabric.Image) => void;
  closeImageTools: () => void;
  handleImageUpdate: (
    imageData: ImageData,
    width: number,
    height: number,
  ) => void;
}

const DOUBLE_TAP_DELAY = 300;

export function useImageTools({
  canvas,
  onImageUpdate,
}: UseImageToolsProps): UseImageToolsReturn {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<fabric.Image | null>(null);
  const lastTapRef = useRef<number>(0);
  const lastTargetRef = useRef<fabric.Object | null>(null);

  const openImageTools = useCallback((image: fabric.Image) => {
    setSelectedImage(image);
    setIsDialogOpen(true);
  }, []);

  const closeImageTools = useCallback(() => {
    setIsDialogOpen(false);
    setSelectedImage(null);
  }, []);

  const handleImageUpdate = useCallback(
    (imageData: ImageData, width: number, height: number) => {
      if (!selectedImage || !canvas) return;

      const tempCanvas = document.createElement("canvas");
      tempCanvas.width = width;
      tempCanvas.height = height;
      const ctx = tempCanvas.getContext("2d");
      if (!ctx) return;

      ctx.putImageData(imageData, 0, 0);

      const dataUrl = tempCanvas.toDataURL("image/png");

      fabric.Image.fromURL(
        dataUrl,
        (newImage) => {
          if (!newImage || !canvas) return;

          newImage.set({
            left: selectedImage.left,
            top: selectedImage.top,
            scaleX: selectedImage.scaleX,
            scaleY: selectedImage.scaleY,
            angle: selectedImage.angle,
            flipX: selectedImage.flipX,
            flipY: selectedImage.flipY,
            opacity: selectedImage.opacity,
            shadow: selectedImage.shadow,
            name: selectedImage.name,
          });

          canvas.remove(selectedImage);
          canvas.add(newImage);
          canvas.setActiveObject(newImage);
          canvas.requestRenderAll();

          if (onImageUpdate) {
            onImageUpdate(newImage, imageData, width, height);
          }

          setSelectedImage(newImage);
        },
        { crossOrigin: "anonymous" },
      );
    },
    [selectedImage, canvas, onImageUpdate],
  );

  useEffect(() => {
    if (!canvas) return;

    const handleMouseDown = (e: fabric.IEvent<Event>) => {
      const target = e.target;
      if (!target || !(target instanceof fabric.Image)) return;

      const now = Date.now();
      const timeSinceLastTap = now - lastTapRef.current;

      if (
        timeSinceLastTap < DOUBLE_TAP_DELAY &&
        lastTargetRef.current === target
      ) {
        openImageTools(target);
        lastTapRef.current = 0;
        lastTargetRef.current = null;
      } else {
        lastTapRef.current = now;
        lastTargetRef.current = target;
      }
    };

    const handleTouchEnd = (e: fabric.IEvent<Event>) => {
      const target = e.target;
      if (!target || !(target instanceof fabric.Image)) return;

      const now = Date.now();
      const timeSinceLastTap = now - lastTapRef.current;

      if (
        timeSinceLastTap < DOUBLE_TAP_DELAY &&
        lastTargetRef.current === target
      ) {
        openImageTools(target);
        lastTapRef.current = 0;
        lastTargetRef.current = null;
      } else {
        lastTapRef.current = now;
        lastTargetRef.current = target;
      }
    };

    const handleDoubleClick = (e: fabric.IEvent<Event>) => {
      const target = e.target;
      if (!target || !(target instanceof fabric.Image)) return;
      openImageTools(target);
    };

    canvas.on("mouse:down", handleMouseDown);
    canvas.on("mouse:dblclick", handleDoubleClick);

    const canvasElement = canvas.getElement();
    canvasElement.addEventListener(
      "touchend",
      handleTouchEnd as unknown as EventListener,
    );

    return () => {
      canvas.off("mouse:down", handleMouseDown);
      canvas.off("mouse:dblclick", handleDoubleClick);
      canvasElement.removeEventListener(
        "touchend",
        handleTouchEnd as unknown as EventListener,
      );
    };
  }, [canvas, openImageTools]);

  return {
    isDialogOpen,
    selectedImage,
    openImageTools,
    closeImageTools,
    handleImageUpdate,
  };
}
