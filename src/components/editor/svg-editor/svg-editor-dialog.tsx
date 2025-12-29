"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Button } from "~/components/ui/button";
import { ScrollArea } from "~/components/ui/scroll-area";
import { Popover, PopoverContent, PopoverTrigger } from "~/components/ui/popover";
import { ny } from "~/lib/utils";
import { Trash2, Check, Eye, EyeOff, Pipette } from "lucide-react";
import { fabric } from "fabric";
import { HexColorPicker, HexColorInput } from "react-colorful";

// primary colors to detect
const PRIMARY_COLORS = [
  "#407bff", "#3b82f6", "#2563eb",
  "#ba68c8", "#a855f7", "#9333ea",
  "#92e3a9", "#4ade80", "#22c55e",
  "#ffc727", "#facc15", "#eab308",
  "#ff725e", "#ef4444", "#dc2626",
];

interface SvgEditorDialogProps {
  isOpen: boolean;
  onClose: () => void;
  svgGroup: fabric.Group | null;
  canvas: fabric.Canvas | null;
}

interface ColorGroup {
  color: string;
  count: number;
  objects: fabric.Object[];
  visible: boolean;
}

// check if color is primary
function isPrimaryColor(color: string): boolean {
  return PRIMARY_COLORS.some((p) => p.toLowerCase() === color.toLowerCase());
}

export const SvgEditorDialog = ({
  isOpen,
  onClose,
  svgGroup,
  canvas,
}: SvgEditorDialogProps) => {
  const [colorGroups, setColorGroups] = useState<ColorGroup[]>([]);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [pickerColor, setPickerColor] = useState("#407bff");
  const [svgElement, setSvgElement] = useState<SVGSVGElement | null>(null);
  const [primaryColorDetected, setPrimaryColorDetected] = useState<string | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  // extract colors and create inline SVG
  useEffect(() => {
    if (!svgGroup || !isOpen) return;

    const objects = svgGroup.getObjects();
    const colorMap = new Map<string, { count: number; objects: fabric.Object[] }>();

    objects.forEach((obj) => {
      const fill = (obj.fill as string) || "";
      if (!fill || fill === "transparent" || fill === "none") return;
      
      const normalized = fill.toLowerCase();
      if (!colorMap.has(normalized)) {
        colorMap.set(normalized, { count: 0, objects: [] });
      }
      const entry = colorMap.get(normalized)!;
      entry.count++;
      entry.objects.push(obj);
    });

    const groups = Array.from(colorMap.entries())
      .map(([color, { count, objects }]) => ({
        color,
        count,
        objects,
        visible: objects[0]?.visible !== false,
      }))
      .sort((a, b) => b.count - a.count);

    setColorGroups(groups);

    // detect primary color
    const detected = groups.find((g) => isPrimaryColor(g.color));
    setPrimaryColorDetected(detected?.color || null);

    // render SVG to inline element
    renderSvgPreview();
  }, [svgGroup, isOpen]);

  // render SVG preview using toSVG
  const renderSvgPreview = useCallback(() => {
    if (!svgGroup || !previewRef.current) return;

    try {
      const svgString = svgGroup.toSVG();
      // parse and set
      const parser = new DOMParser();
      const doc = parser.parseFromString(svgString, "image/svg+xml");
      const svg = doc.querySelector("svg");
      
      if (svg) {
        svg.setAttribute("width", "100%");
        svg.setAttribute("height", "100%");
        svg.style.maxWidth = "100%";
        svg.style.maxHeight = "100%";
        setSvgElement(svg);
        
        // update preview container
        previewRef.current.innerHTML = "";
        previewRef.current.appendChild(svg.cloneNode(true));
      }
    } catch (e) {
      console.error("Failed to render SVG:", e);
    }
  }, [svgGroup]);

  // refresh preview
  const refreshPreview = useCallback(() => {
    canvas?.renderAll();
    setTimeout(renderSvgPreview, 20);
  }, [canvas, renderSvgPreview]);

  // change color for a group
  const changeGroupColor = useCallback(
    (fromColor: string, toColor: string) => {
      const group = colorGroups.find((g) => g.color === fromColor);
      if (!group) return;

      group.objects.forEach((obj) => {
        obj.set({ fill: toColor });
      });

      setColorGroups((prev) =>
        prev.map((g) =>
          g.color === fromColor ? { ...g, color: toColor } : g
        )
      );
      setSelectedColor(toColor);
      setPickerColor(toColor);
      
      // update primary if changed
      if (fromColor === primaryColorDetected) {
        setPrimaryColorDetected(toColor);
      }
      
      refreshPreview();
    },
    [colorGroups, primaryColorDetected, refreshPreview]
  );

  // change primary color (all primary colors become new color)
  const changePrimaryColor = useCallback(
    (newColor: string) => {
      colorGroups.forEach((group) => {
        if (isPrimaryColor(group.color)) {
          group.objects.forEach((obj) => {
            obj.set({ fill: newColor });
          });
        }
      });

      setColorGroups((prev) =>
        prev.map((g) =>
          isPrimaryColor(g.color) ? { ...g, color: newColor } : g
        )
      );
      setPrimaryColorDetected(newColor);
      refreshPreview();
    },
    [colorGroups, refreshPreview]
  );

  // toggle visibility
  const toggleVisibility = useCallback(
    (color: string) => {
      const group = colorGroups.find((g) => g.color === color);
      if (!group) return;

      const newVisible = !group.visible;
      group.objects.forEach((obj) => {
        obj.set({ visible: newVisible });
      });

      setColorGroups((prev) =>
        prev.map((g) =>
          g.color === color ? { ...g, visible: newVisible } : g
        )
      );
      refreshPreview();
    },
    [colorGroups, refreshPreview]
  );

  // delete group
  const deleteGroup = useCallback(
    (color: string) => {
      if (!svgGroup) return;
      const group = colorGroups.find((g) => g.color === color);
      if (!group) return;

      group.objects.forEach((obj) => {
        svgGroup.removeWithUpdate(obj);
      });

      setColorGroups((prev) => prev.filter((g) => g.color !== color));
      if (selectedColor === color) {
        setSelectedColor(null);
      }
      refreshPreview();
    },
    [colorGroups, svgGroup, selectedColor, refreshPreview]
  );

  // done
  const handleDone = useCallback(() => {
    canvas?.renderAll();
    onClose();
  }, [canvas, onClose]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="flex h-[90vh] max-w-6xl flex-col overflow-hidden p-0">
        <DialogHeader className="shrink-0 border-b px-6 py-4">
          <DialogTitle className="flex items-center gap-3">
            <span className="text-lg font-semibold">SVG Editor</span>
            <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground">
              {colorGroups.length} colors
            </span>
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-1 overflow-hidden">
          {/* left panel */}
          <div className="flex w-80 flex-col border-r bg-muted/10">
            {/* pick primary color */}
            {primaryColorDetected && (
              <div className="shrink-0 border-b p-3">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full gap-2 justify-start">
                      <div
                        className="size-4 rounded border"
                        style={{ backgroundColor: primaryColorDetected }}
                      />
                      <Pipette className="size-4" />
                      Pick Primary Color
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-3" align="start">
                    <HexColorPicker
                      color={primaryColorDetected}
                      onChange={changePrimaryColor}
                    />
                    <HexColorInput
                      color={primaryColorDetected}
                      onChange={changePrimaryColor}
                      className="mt-2 h-8 w-full rounded border px-2 font-mono text-xs uppercase"
                      prefixed
                    />
                  </PopoverContent>
                </Popover>
              </div>
            )}

            {/* color groups */}
            <ScrollArea className="flex-1">
              <div className="space-y-1 p-2">
                {colorGroups.map((group) => (
                  <div
                    key={group.color}
                    className={ny(
                      "group flex items-center gap-2.5 rounded-lg px-2.5 py-2 transition-all",
                      selectedColor === group.color
                        ? "bg-primary/10 ring-1 ring-primary/30"
                        : "hover:bg-muted"
                    )}
                  >
                    {/* color picker popover */}
                    <Popover>
                      <PopoverTrigger asChild>
                        <button
                          onClick={() => {
                            setSelectedColor(group.color);
                            setPickerColor(group.color);
                          }}
                          className={ny(
                            "size-9 shrink-0 rounded-lg border-2 shadow-sm transition-transform hover:scale-105",
                            !group.visible && "opacity-40"
                          )}
                          style={{ backgroundColor: group.color }}
                        />
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-3" align="start" side="right">
                        <HexColorPicker
                          color={pickerColor}
                          onChange={(c) => {
                            setPickerColor(c);
                            changeGroupColor(group.color, c);
                          }}
                        />
                        <HexColorInput
                          color={pickerColor}
                          onChange={(c) => {
                            setPickerColor(c);
                            changeGroupColor(group.color, c);
                          }}
                          className="mt-2 h-8 w-full rounded border px-2 font-mono text-xs uppercase"
                          prefixed
                        />
                      </PopoverContent>
                    </Popover>

                    {/* info */}
                    <div className="flex-1 min-w-0">
                      <span className="font-mono text-xs uppercase block truncate">
                        {group.color}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {group.count} element{group.count > 1 ? "s" : ""}
                      </span>
                    </div>

                    {/* actions */}
                    <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-7"
                        onClick={() => toggleVisibility(group.color)}
                      >
                        {group.visible ? (
                          <Eye className="size-3.5" />
                        ) : (
                          <EyeOff className="size-3.5" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-7 text-destructive hover:bg-destructive/10"
                        onClick={() => deleteGroup(group.color)}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}

                {colorGroups.length === 0 && (
                  <div className="py-12 text-center text-sm text-muted-foreground">
                    No colors found
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>

          {/* right panel: SVG preview */}
          <div
            className="flex flex-1 items-center justify-center p-8"
            style={{
              background: `
                linear-gradient(45deg, #e8e8e8 25%, transparent 25%),
                linear-gradient(-45deg, #e8e8e8 25%, transparent 25%),
                linear-gradient(45deg, transparent 75%, #e8e8e8 75%),
                linear-gradient(-45deg, transparent 75%, #e8e8e8 75%)
              `,
              backgroundSize: "20px 20px",
              backgroundPosition: "0 0, 0 10px, 10px -10px, -10px 0px",
            }}
          >
            <div
              ref={previewRef}
              className="w-full h-full flex items-center justify-center"
              style={{ maxWidth: 500, maxHeight: 500 }}
            />
          </div>
        </div>

        {/* footer */}
        <div className="shrink-0 flex justify-end gap-3 border-t px-6 py-4 bg-muted/20">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleDone} className="gap-2 px-8">
            <Check className="size-4" />
            Done
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
