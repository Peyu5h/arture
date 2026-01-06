"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MousePointer2, X, Plus } from "lucide-react";
import { ElementReference } from "./types";

interface InspectToolProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  editor: any;
  isActive: boolean;
  onToggle: () => void;
  onElementSelect: (element: ElementReference) => void;
}

// extracts element reference from fabric object
function extractElementRef(obj: fabric.Object): ElementReference {
  const type = obj.type || "unknown";
  let name = "";
  let text: string | undefined;
  let imageSrc: string | undefined;
  let thumbnail: string | undefined;

  if (type === "textbox" || type === "text" || type === "i-text") {
    const textObj = obj as fabric.Textbox;
    text = textObj.text || "";
    name = text.slice(0, 30) + (text.length > 30 ? "..." : "");
  } else if (type === "image") {
    const imgObj = obj as fabric.Image;
    const src = imgObj.getSrc?.() || (obj as any)._element?.src || "";
    imageSrc = src;

    const match = src.match(/\/([^/]+)\.(jpg|jpeg|png|gif|webp)/i);
    if (match) {
      name = decodeURIComponent(match[1]).replace(/[-_]/g, " ");
    } else if ((obj as any).name) {
      name = (obj as any).name;
    } else {
      name = "Image";
    }

    try {
      thumbnail = obj.toDataURL?.({
        format: "png",
        quality: 0.3,
        multiplier: 0.2,
      });
    } catch {
      // ignore
    }
  } else if (type === "rect") {
    name = "Rectangle";
  } else if (type === "circle") {
    name = "Circle";
  } else if (type === "triangle") {
    name = "Triangle";
  } else if (type === "polygon") {
    name = "Polygon";
  } else if (type === "path") {
    name = "Path";
  } else if (type === "group") {
    name = "Group";
  } else {
    name = (obj as any).name || type.charAt(0).toUpperCase() + type.slice(1);
  }

  return {
    id: (obj as any).id || String(Date.now()),
    type,
    name,
    text,
    imageSrc,
    thumbnail,
    fill: typeof obj.fill === "string" ? obj.fill : undefined,
    isOnCanvas: true,
  };
}

// store original styles for restoration
interface OriginalStyles {
  opacity: number;
  shadow: fabric.Shadow | string | undefined;
  strokeWidth: number;
  stroke: string | undefined;
}

export const AgentInspectTool = ({
  editor,
  isActive,
  onToggle,
  onElementSelect,
}: InspectToolProps) => {
  const [hoveredElement, setHoveredElement] = useState<ElementReference | null>(
    null,
  );
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const previousCursorRef = useRef<string>("");
  const originalSelectableRef = useRef<Map<fabric.Object, boolean>>(new Map());
  const hoveredObjectRef = useRef<fabric.Object | null>(null);
  const originalStylesRef = useRef<OriginalStyles | null>(null);

  // safely render canvas
  const safeRenderCanvas = useCallback(() => {
    if (!editor?.canvas) return;
    try {
      const ctx = editor.canvas.getContext?.();
      if (ctx) {
        editor.canvas.renderAll();
      }
    } catch {
      // ignore render errors
    }
  }, [editor]);

  // apply hover highlight to element
  const applyHoverHighlight = useCallback(
    (obj: fabric.Object) => {
      if (!editor?.canvas) return;

      // store original styles
      originalStylesRef.current = {
        opacity: obj.opacity ?? 1,
        shadow: obj.shadow as fabric.Shadow | string | undefined,
        strokeWidth: obj.strokeWidth ?? 0,
        stroke: (obj.stroke as string) ?? undefined,
      };

      // apply highlight effect - blue glow with slight opacity change
      obj.set({
        opacity: 0.85,
        shadow: new (window as any).fabric.Shadow({
          color: "rgba(59, 130, 246, 0.6)",
          blur: 15,
          offsetX: 0,
          offsetY: 0,
        }),
        stroke: "#3b82f6",
        strokeWidth: 2,
      });

      safeRenderCanvas();
    },
    [editor, safeRenderCanvas],
  );

  // remove hover highlight
  const removeHoverHighlight = useCallback(
    (obj: fabric.Object) => {
      if (!editor?.canvas || !originalStylesRef.current) return;

      obj.set({
        opacity: originalStylesRef.current.opacity,
        shadow: originalStylesRef.current.shadow,
        stroke: originalStylesRef.current.stroke,
        strokeWidth: originalStylesRef.current.strokeWidth,
      });

      originalStylesRef.current = null;
      safeRenderCanvas();
    },
    [editor, safeRenderCanvas],
  );

  // handle canvas mouse move for highlighting
  const handleMouseMove = useCallback(
    (e: fabric.IEvent<MouseEvent>) => {
      if (!isActive || !editor?.canvas) return;

      const target = editor.canvas.findTarget(e.e, false);

      // if hovering over a different element
      if (target !== hoveredObjectRef.current) {
        // remove highlight from previous element
        if (hoveredObjectRef.current) {
          removeHoverHighlight(hoveredObjectRef.current);
        }

        if (
          target &&
          target !== editor.canvas.backgroundImage &&
          target.name !== "clip"
        ) {
          const ref = extractElementRef(target);
          setHoveredElement(ref);

          // position tooltip near cursor
          const canvasEl = editor.canvas.getElement?.();
          if (canvasEl) {
            const rect = canvasEl.getBoundingClientRect();
            setTooltipPosition({
              x: e.e.clientX - rect.left + 15,
              y: e.e.clientY - rect.top - 45,
            });
          }

          // apply highlight to new element
          applyHoverHighlight(target);
          hoveredObjectRef.current = target;
        } else {
          setHoveredElement(null);
          hoveredObjectRef.current = null;
        }
      } else if (target) {
        // update tooltip position while hovering same element
        const canvasEl = editor.canvas.getElement?.();
        if (canvasEl) {
          const rect = canvasEl.getBoundingClientRect();
          setTooltipPosition({
            x: e.e.clientX - rect.left + 15,
            y: e.e.clientY - rect.top - 45,
          });
        }
      }
    },
    [isActive, editor, applyHoverHighlight, removeHoverHighlight],
  );

  // handle click to select element
  const handleMouseDown = useCallback(
    (e: fabric.IEvent<MouseEvent>) => {
      if (!isActive || !editor?.canvas) return;

      const target = editor.canvas.findTarget(e.e, false);
      if (
        target &&
        target !== editor.canvas.backgroundImage &&
        target.name !== "clip"
      ) {
        e.e.preventDefault();
        e.e.stopPropagation();

        const ref = extractElementRef(target);
        onElementSelect(ref);

        // splash/ripple effect on click
        const originalOpacity = target.opacity ?? 1;

        // flash white then back
        target.set({ opacity: 0.3 });
        safeRenderCanvas();

        setTimeout(() => {
          if (!editor?.canvas) return;
          target.set({ opacity: 0.6 });
          safeRenderCanvas();
        }, 50);

        setTimeout(() => {
          if (!editor?.canvas) return;
          target.set({ opacity: originalOpacity });
          safeRenderCanvas();
        }, 150);
      }
    },
    [isActive, editor, onElementSelect, safeRenderCanvas],
  );

  // setup/cleanup inspect mode
  useEffect(() => {
    const canvas = editor?.canvas;
    if (!canvas) return;

    if (isActive) {
      previousCursorRef.current = canvas.defaultCursor || "default";
      canvas.defaultCursor = "crosshair";
      canvas.hoverCursor = "crosshair";

      const objects = canvas.getObjects?.();
      if (objects) {
        objects.forEach((obj: fabric.Object) => {
          if (obj.name === "clip") return;
          originalSelectableRef.current.set(obj, obj.selectable || false);
          obj.set({
            selectable: false,
            evented: true,
          });
        });
      }

      canvas.discardActiveObject?.();
      safeRenderCanvas();

      canvas.on("mouse:move", handleMouseMove);
      canvas.on("mouse:down", handleMouseDown);
    } else {
      // cleanup hover highlight
      if (hoveredObjectRef.current && originalStylesRef.current) {
        removeHoverHighlight(hoveredObjectRef.current);
      }
      hoveredObjectRef.current = null;

      canvas.defaultCursor = previousCursorRef.current || "default";
      canvas.hoverCursor = "move";

      const objects = canvas.getObjects?.();
      if (objects) {
        objects.forEach((obj: fabric.Object) => {
          if (obj.name === "clip") return;
          const wasSelectable = originalSelectableRef.current.get(obj) ?? true;
          obj.set({
            selectable: wasSelectable,
            evented: true,
          });
        });
      }
      originalSelectableRef.current.clear();

      safeRenderCanvas();

      canvas.off("mouse:move", handleMouseMove);
      canvas.off("mouse:down", handleMouseDown);

      setHoveredElement(null);
    }

    return () => {
      if (canvas) {
        canvas.off("mouse:move", handleMouseMove);
        canvas.off("mouse:down", handleMouseDown);
      }
    };
  }, [
    isActive,
    editor,
    handleMouseMove,
    handleMouseDown,
    removeHoverHighlight,
    safeRenderCanvas,
  ]);

  return (
    <>
      <AnimatePresence>
        {isActive && hoveredElement && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 5 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 5 }}
            transition={{ duration: 0.12, ease: "easeOut" }}
            className="pointer-events-none fixed z-[9999]"
            style={{
              left: tooltipPosition.x,
              top: tooltipPosition.y,
            }}
          >
            <div className="bg-popover/95 border-border/80 flex items-center gap-2.5 rounded-xl border px-3 py-2 shadow-xl backdrop-blur-sm">
              {hoveredElement.thumbnail ? (
                <img
                  src={hoveredElement.thumbnail}
                  alt=""
                  className="ring-border/50 h-7 w-7 rounded-lg object-cover ring-1"
                />
              ) : (
                <div className="bg-primary/10 text-primary flex h-7 w-7 items-center justify-center rounded-lg text-xs font-semibold">
                  {hoveredElement.type.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="flex flex-col gap-0.5">
                <span className="text-foreground text-xs leading-none font-medium">
                  {hoveredElement.name}
                </span>
                <span className="text-muted-foreground text-[10px] leading-none">
                  Click to add as context
                </span>
              </div>
              <div className="bg-primary/10 rounded-full p-1">
                <Plus className="text-primary h-3 w-3" />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isActive && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="border-primary/40 pointer-events-none absolute inset-0 z-40 rounded-lg border-2"
            style={{
              boxShadow: "inset 0 0 20px rgba(59, 130, 246, 0.1)",
            }}
          >
            <div className="bg-primary text-primary-foreground absolute top-3 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-full px-4 py-1.5 text-xs font-medium shadow-lg">
              <MousePointer2 className="h-3.5 w-3.5" />
              <span>Select element</span>
              <button
                className="hover:bg-primary-foreground/20 pointer-events-auto -mr-1 rounded-full p-0.5 transition-colors"
                onClick={onToggle}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
