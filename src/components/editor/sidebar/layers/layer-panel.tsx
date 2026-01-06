import { useCallback, useEffect, useState, useRef } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { LayerItem, LayerData } from "./layer-item";
import { Layers, ChevronDown, ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface LayerPanelProps {
  editor: any;
}

const getLayerType = (obj: fabric.Object): LayerData["type"] => {
  if (obj.type === "i-text" || obj.type === "textbox" || obj.type === "text") {
    return "text";
  }
  if (obj.type === "image") {
    return "image";
  }
  if (obj.type === "path") {
    return "path";
  }
  if (obj.type === "group") {
    const name = (obj as any).name || "";
    if (name.includes("svg")) return "svg";
    return "group";
  }
  return "shape";
};

const getLayerName = (obj: fabric.Object, index: number): string => {
  const customName = (obj as any).name;
  if (customName && customName !== "clip") return customName;

  const type = obj.type;
  if (type === "i-text" || type === "textbox" || type === "text") {
    const text = (obj as any).text || "";
    return text.slice(0, 20) || `Text ${index + 1}`;
  }
  if (type === "image") return `Image ${index + 1}`;
  if (type === "rect") return `Rectangle ${index + 1}`;
  if (type === "circle") return `Circle ${index + 1}`;
  if (type === "triangle") return `Triangle ${index + 1}`;
  if (type === "polygon") return `Polygon ${index + 1}`;
  if (type === "path") return `Path ${index + 1}`;
  if (type === "group") return `Group ${index + 1}`;
  if (type === "line") return `Line ${index + 1}`;

  return `Layer ${index + 1}`;
};

const generateThumbnailAsync = (obj: fabric.Object): Promise<string | null> => {
  return new Promise((resolve) => {
    try {
      const size = 80;

      obj.clone((cloned: fabric.Object) => {
        try {
          const bounds = cloned.getBoundingRect();
          const objWidth = bounds.width || 1;
          const objHeight = bounds.height || 1;

          // calculate canvas size based on aspect ratio for better fit
          const aspectRatio = objWidth / objHeight;
          let canvasWidth = size;
          let canvasHeight = size;

          if (aspectRatio > 1) {
            // landscape - full width, reduce height
            canvasHeight = Math.round(size / aspectRatio);
          } else if (aspectRatio < 1) {
            // portrait - full height, reduce width
            canvasWidth = Math.round(size * aspectRatio);
          }

          const tempCanvas = new (window as any).fabric.StaticCanvas(null, {
            width: canvasWidth,
            height: canvasHeight,
            backgroundColor: "transparent",
          });

          // maximize visible area while maintaining padding
          const scale =
            Math.min(canvasWidth / objWidth, canvasHeight / objHeight) * 0.85;

          // skip objects with pattern/gradient fills that might cause issues
          const fill = cloned.fill;
          if (fill && typeof fill === "object" && "source" in fill) {
            // pattern fill - check if source is valid
            const pattern = fill as { source?: HTMLImageElement | null };
            if (
              !pattern.source ||
              (pattern.source instanceof HTMLImageElement &&
                (!pattern.source.complete || pattern.source.naturalWidth === 0))
            ) {
              // invalid pattern source, use placeholder color
              cloned.set({ fill: "#e5e7eb" });
            }
          }

          cloned.set({
            left: canvasWidth / 2,
            top: canvasHeight / 2,
            originX: "center",
            originY: "center",
            scaleX: (cloned.scaleX || 1) * scale,
            scaleY: (cloned.scaleY || 1) * scale,
          });

          tempCanvas.add(cloned);
          tempCanvas.renderAll();

          setTimeout(() => {
            try {
              const dataUrl = tempCanvas.toDataURL({
                format: "png",
                quality: 0.6,
              });
              tempCanvas.dispose();
              resolve(dataUrl);
            } catch {
              tempCanvas.dispose();
              resolve(null);
            }
          }, 50);
        } catch {
          resolve(null);
        }
      });
    } catch {
      resolve(null);
    }
  });
};

export const LayerPanel = ({ editor }: LayerPanelProps) => {
  const [layers, setLayers] = useState<LayerData[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(true);
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);
  const thumbnailCacheRef = useRef<Map<string, string>>(new Map());

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const generateThumbnails = useCallback(async (layerData: LayerData[]) => {
    const cache = thumbnailCacheRef.current;

    for (const layer of layerData) {
      if (!cache.has(layer.id)) {
        const thumbnail = await generateThumbnailAsync(layer.fabricObject);
        if (thumbnail) {
          cache.set(layer.id, thumbnail);
          setLayers((prev) =>
            prev.map((l) => (l.id === layer.id ? { ...l, thumbnail } : l)),
          );
        }
      }
    }
  }, []);

  const syncLayers = useCallback(() => {
    if (!editor?.canvas) return;

    const canvas = editor.canvas;
    const objects = canvas
      .getObjects()
      .filter((obj: fabric.Object) => (obj as any).name !== "clip");

    const layerData: LayerData[] = objects.map(
      (obj: fabric.Object, index: number) => {
        const id = (obj as any).__layerId || `layer-${Date.now()}-${index}`;
        (obj as any).__layerId = id;

        const cachedThumbnail = thumbnailCacheRef.current.get(id) || null;

        return {
          id,
          name: getLayerName(obj, index),
          type: getLayerType(obj),
          locked: !!(obj.lockMovementX && obj.lockMovementY),
          visible: !!obj.visible,
          thumbnail: cachedThumbnail,
          fabricObject: obj,
        };
      },
    );

    const reversedLayers = layerData.reverse();
    setLayers(reversedLayers);

    const layersNeedingThumbnails = reversedLayers.filter(
      (l) => !thumbnailCacheRef.current.has(l.id),
    );
    if (layersNeedingThumbnails.length > 0) {
      generateThumbnails(layersNeedingThumbnails);
    }

    const activeObject = canvas.getActiveObject();
    if (activeObject) {
      const activeLayerId = (activeObject as any).__layerId;
      setSelectedLayerId(activeLayerId || null);
    }
  }, [editor, generateThumbnails]);

  useEffect(() => {
    if (!editor?.canvas) return;

    const canvas = editor.canvas;

    const handleUpdate = () => syncLayers();
    canvas.on("object:added", handleUpdate);
    canvas.on("object:removed", handleUpdate);
    canvas.on("object:modified", handleUpdate);
    canvas.on("selection:created", handleUpdate);
    canvas.on("selection:updated", handleUpdate);
    canvas.on("selection:cleared", () => setSelectedLayerId(null));

    syncLayers();

    return () => {
      canvas.off("object:added", handleUpdate);
      canvas.off("object:removed", handleUpdate);
      canvas.off("object:modified", handleUpdate);
      canvas.off("selection:created", handleUpdate);
      canvas.off("selection:updated", handleUpdate);
      canvas.off("selection:cleared");
    };
  }, [editor, syncLayers]);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over || active.id === over.id || !editor?.canvas) return;

    const canvas = editor.canvas;
    const objects = canvas
      .getObjects()
      .filter((obj: fabric.Object) => (obj as any).name !== "clip");

    const oldIndex = layers.findIndex((l) => l.id === active.id);
    const newIndex = layers.findIndex((l) => l.id === over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    const newLayers = arrayMove(layers, oldIndex, newIndex);
    setLayers(newLayers);

    const reversedLayers = [...newLayers].reverse();
    reversedLayers.forEach((layer, canvasIndex) => {
      const obj = objects.find(
        (o: fabric.Object) => (o as any).__layerId === layer.id,
      );
      if (obj) {
        canvas.moveTo(obj, canvasIndex + 1);
      }
    });

    canvas.requestRenderAll();
    editor.save?.();
  };

  const handleSelectLayer = (layerId: string) => {
    if (!editor?.canvas) return;

    const layer = layers.find((l) => l.id === layerId);
    if (!layer || layer.locked) return;

    setSelectedLayerId(layerId);
    editor.canvas.setActiveObject(layer.fabricObject);
    editor.canvas.requestRenderAll();
  };

  const handleToggleLock = (layerId: string) => {
    if (!editor?.canvas) return;

    const layer = layers.find((l) => l.id === layerId);
    if (!layer) return;

    const newLocked = !layer.locked;
    const obj = layer.fabricObject;

    obj.set({
      lockMovementX: newLocked,
      lockMovementY: newLocked,
      lockRotation: newLocked,
      lockScalingX: newLocked,
      lockScalingY: newLocked,
      hasControls: !newLocked,
      selectable: !newLocked,
    });

    if (newLocked) {
      editor.canvas.discardActiveObject();
    }

    editor.canvas.requestRenderAll();
    editor.save?.();
    syncLayers();
  };

  const handleToggleVisibility = (layerId: string) => {
    if (!editor?.canvas) return;

    const layer = layers.find((l) => l.id === layerId);
    if (!layer) return;

    const newVisible = !layer.visible;
    layer.fabricObject.set({ visible: newVisible });

    if (!newVisible) {
      editor.canvas.discardActiveObject();
    }

    editor.canvas.requestRenderAll();
    editor.save?.();
    syncLayers();
  };

  const handleDeleteLayer = (layerId: string) => {
    if (!editor?.canvas) return;

    const layer = layers.find((l) => l.id === layerId);
    if (!layer || layer.locked) return;

    thumbnailCacheRef.current.delete(layerId);

    editor.canvas.remove(layer.fabricObject);
    editor.canvas.requestRenderAll();
    editor.save?.();
    syncLayers();
  };

  const activeLayer = layers.find((l) => l.id === activeId);

  return (
    <div className="space-y-2">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="hover:bg-muted/50 flex w-full items-center justify-between rounded-lg px-1 py-1.5 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Layers className="text-muted-foreground size-4" />
          <span className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
            Layers
          </span>
          <span className="bg-muted text-muted-foreground rounded-full px-1.5 py-0.5 text-[10px]">
            {layers.length}
          </span>
        </div>
        {isExpanded ? (
          <ChevronUp className="text-muted-foreground size-4" />
        ) : (
          <ChevronDown className="text-muted-foreground size-4" />
        )}
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            {layers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <div className="bg-muted/50 mb-2 flex size-10 items-center justify-center rounded-lg">
                  <Layers className="text-muted-foreground size-5" />
                </div>
                <p className="text-muted-foreground text-xs">No layers yet</p>
                <p className="text-muted-foreground/70 text-[10px]">
                  Add elements to the canvas
                </p>
              </div>
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={layers.map((l) => l.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="max-h-[280px] space-y-1.5 overflow-y-auto pr-1">
                    {layers.map((layer) => (
                      <LayerItem
                        key={layer.id}
                        layer={layer}
                        isSelected={selectedLayerId === layer.id}
                        onSelect={() => handleSelectLayer(layer.id)}
                        onToggleLock={() => handleToggleLock(layer.id)}
                        onToggleVisibility={() =>
                          handleToggleVisibility(layer.id)
                        }
                        onDelete={() => handleDeleteLayer(layer.id)}
                      />
                    ))}
                  </div>
                </SortableContext>

                <DragOverlay>
                  {activeLayer ? (
                    <div className="border-primary bg-card rounded-lg border p-2 opacity-90 shadow-xl">
                      <div className="flex items-center gap-2">
                        <div className="bg-muted flex size-8 items-center justify-center rounded">
                          <span className="text-muted-foreground text-xs">
                            {activeLayer.type === "text" ? "T" : "L"}
                          </span>
                        </div>
                        <span className="text-xs font-medium">
                          {activeLayer.name}
                        </span>
                      </div>
                    </div>
                  ) : null}
                </DragOverlay>
              </DndContext>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
