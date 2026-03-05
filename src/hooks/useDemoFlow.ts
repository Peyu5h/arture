import { useState, useCallback, useRef } from "react";
import type { DemoPreset, DemoStep, DemoTextElement, DemoImageElement } from "~/lib/ai/demos/types";
import { getDemoPreset, matchDemoPrompt, PREDEFINED_PROMPTS } from "~/lib/ai/demos";
import { resolveText, PUJA_THEMES } from "~/lib/ai/demos/satyanarayan";
import { resolveGymText, GYM_THEMES } from "~/lib/ai/demos/gym-poster";
import type { PredefinedPrompt } from "~/lib/ai/demos";
import type { ToolContext, ToolResult } from "~/lib/ai/tools/types";

type DemoPhase = "idle" | "active" | "complete" | "error";

interface UseDemoFlowOptions {
  editor: ToolContext["editor"] | null;
  canvas: fabric.Canvas | null;
}

interface UseDemoFlowReturn {
  phase: DemoPhase;
  activePreset: DemoPreset | null;
  collectedData: Record<string, unknown>;
  predefinedPrompts: PredefinedPrompt[];

  startDemo: (demoId: string) => void;
  startDemoFromPrompt: (prompt: PredefinedPrompt) => void;
  checkForDemo: (message: string) => PredefinedPrompt | null;
  executeStep: (step: DemoStep, data: Record<string, unknown>) => Promise<void>;
  onDemoComplete: (data: Record<string, unknown>) => void;
  cancelDemo: () => void;
  resetDemo: () => void;
}

// resolves text template based on demo type
function resolveTemplateText(
  template: string,
  data: Record<string, unknown>,
  demoId: string,
): string {
  if (demoId.startsWith("satyanarayan")) {
    const lang = (data.language as string) || "english";
    return resolveText(template, data, lang);
  }
  return resolveGymText(template, data);
}

// resolves theme colors based on demo type and user selection
function getThemeColors(
  demoId: string,
  themeId: string,
): Record<string, string | string[]> {
  if (demoId.startsWith("satyanarayan")) {
    const theme = PUJA_THEMES[themeId] || PUJA_THEMES.traditional;
    return {
      bg: theme.bg,
      primary: theme.primary,
      secondary: theme.secondary,
      accent: theme.accent,
      text: theme.text,
    };
  }
  const theme = GYM_THEMES[themeId] || GYM_THEMES.dark_energy;
  return {
    bg: theme.bg,
    primary: theme.primary,
    accent: theme.accent,
    cta: theme.cta,
    text: theme.text,
    muted: theme.muted,
  };
}

// finds the workspace bounds
function getWorkspaceBounds(canvas: fabric.Canvas | null): {
  left: number;
  top: number;
  width: number;
  height: number;
} {
  if (!canvas) return { left: 0, top: 0, width: 800, height: 600 };

  const objects = canvas.getObjects();
  const workspace = objects.find(
    (obj) => (obj as unknown as { name?: string }).name === "clip",
  );

  if (workspace) {
    return {
      left: workspace.left || 0,
      top: workspace.top || 0,
      width: workspace.width || 800,
      height: workspace.height || 600,
    };
  }

  return { left: 0, top: 0, width: canvas.getWidth(), height: canvas.getHeight() };
}

// resolves position presets or coordinates relative to workspace
function resolvePosition(
  position: { x: number; y: number } | string,
  bounds: { left: number; top: number; width: number; height: number },
  objWidth: number,
  objHeight: number,
): { x: number; y: number } {
  if (typeof position === "object") {
    // position is relative to canvas design area, offset by workspace
    const scaleX = bounds.width / 800;
    const scaleY = bounds.height / 1100;
    return {
      x: bounds.left + position.x * scaleX - objWidth / 2,
      y: bounds.top + position.y * scaleY - objHeight / 2,
    };
  }

  const margin = 20;
  const presets: Record<string, { x: number; y: number }> = {
    center: {
      x: bounds.left + bounds.width / 2 - objWidth / 2,
      y: bounds.top + bounds.height / 2 - objHeight / 2,
    },
    "top-left": { x: bounds.left + margin, y: bounds.top + margin },
    "top-center": {
      x: bounds.left + bounds.width / 2 - objWidth / 2,
      y: bounds.top + margin + 30,
    },
    "top-right": {
      x: bounds.left + bounds.width - objWidth - margin,
      y: bounds.top + margin,
    },
    "middle-left": {
      x: bounds.left + margin,
      y: bounds.top + bounds.height / 2 - objHeight / 2,
    },
    "middle-right": {
      x: bounds.left + bounds.width - objWidth - margin,
      y: bounds.top + bounds.height / 2 - objHeight / 2,
    },
    "bottom-left": {
      x: bounds.left + margin,
      y: bounds.top + bounds.height - objHeight - margin,
    },
    "bottom-center": {
      x: bounds.left + bounds.width / 2 - objWidth / 2,
      y: bounds.top + bounds.height - objHeight - margin - 30,
    },
    "bottom-right": {
      x: bounds.left + bounds.width - objWidth - margin,
      y: bounds.top + bounds.height - objHeight - margin,
    },
  };

  return presets[position] || presets.center;
}

// small delay helper
const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

export function useDemoFlow({ editor, canvas }: UseDemoFlowOptions): UseDemoFlowReturn {
  const [phase, setPhase] = useState<DemoPhase>("idle");
  const [activePreset, setActivePreset] = useState<DemoPreset | null>(null);
  const [collectedData, setCollectedData] = useState<Record<string, unknown>>({});
  const abortRef = useRef(false);

  const startDemo = useCallback((demoId: string) => {
    const preset = getDemoPreset(demoId);
    if (!preset) {
      console.warn(`Demo preset not found: ${demoId}`);
      return;
    }
    abortRef.current = false;
    setActivePreset(preset);
    setPhase("active");
    setCollectedData({});
  }, []);

  const startDemoFromPrompt = useCallback(
    (prompt: PredefinedPrompt) => {
      startDemo(prompt.demoId);
    },
    [startDemo],
  );

  const checkForDemo = useCallback((message: string): PredefinedPrompt | null => {
    return matchDemoPrompt(message);
  }, []);

  const cancelDemo = useCallback(() => {
    abortRef.current = true;
    setPhase("idle");
    setActivePreset(null);
    setCollectedData({});
  }, []);

  const resetDemo = useCallback(() => {
    abortRef.current = false;
    setPhase("idle");
    setActivePreset(null);
    setCollectedData({});
  }, []);

  // executes a single demo step on the real canvas
  const executeStep = useCallback(
    async (step: DemoStep, data: Record<string, unknown>): Promise<void> => {
      if (!canvas || !editor || abortRef.current) return;

      const preset = activePreset;
      if (!preset) return;

      const bounds = getWorkspaceBounds(canvas);
      const themeId = (data.theme as string) || "traditional";
      const demoId = preset.id;

      switch (step.toolName) {
        case "apply_gradient_background": {
          const colors = getThemeColors(demoId, themeId);
          const bgColors = (colors.bg as string[]) || ["#FFFFFF", "#F0F0F0"];
          const workspace = canvas
            .getObjects()
            .find((obj) => (obj as unknown as { name?: string }).name === "clip");

          if (workspace) {
            const gradient = new (window as any).fabric.Gradient({
              type: "linear",
              coords: { x1: 0, y1: 0, x2: 0, y2: workspace.height || 600 },
              colorStops: bgColors.map((c: string, i: number) => ({
                offset: i / (bgColors.length - 1),
                color: c,
              })),
            });
            workspace.set("fill", gradient);
            canvas.requestRenderAll();
            editor.save();
          }
          break;
        }

        case "load_font": {
          const fontFamily = step.toolArgs.fontFamily as string;
          if (fontFamily && typeof document !== "undefined") {
            try {
              const encoded = fontFamily.replace(/\s+/g, "+");
              const link = document.createElement("link");
              link.href = `https://fonts.googleapis.com/css2?family=${encoded}:wght@400;600;700;800&display=swap`;
              link.rel = "stylesheet";
              document.head.appendChild(link);
              // wait for font to load
              await sleep(600);
            } catch {
              // font load failed silently
            }
          }
          break;
        }

        case "add_text": {
          const elementRef = step.toolArgs.elementRef as string;
          const textEl = preset.textElements.find((t) => t.id === elementRef);
          if (!textEl) break;

          const resolvedText = resolveTemplateText(textEl.text, data, demoId);
          if (!resolvedText) break;

          const fontSize = textEl.fontSize || 32;
          const estimatedWidth = textEl.width || Math.min(resolvedText.length * fontSize * 0.5, bounds.width * 0.8);
          const estimatedHeight = fontSize * 1.3;
          const pos = resolvePosition(textEl.position, bounds, estimatedWidth, estimatedHeight);

          const textOptions: Record<string, unknown> = {
            fontSize: textEl.fontSize,
            fontFamily: textEl.fontFamily || "Arial",
            fill: textEl.fill || "#000000",
            textAlign: textEl.textAlign || "center",
          };

          if (textEl.fontWeight) textOptions.fontWeight = textEl.fontWeight;

          editor.addText(resolvedText, textOptions);

          // position the newly added text
          await sleep(50);
          const objects = canvas.getObjects();
          const newObj = objects[objects.length - 1];
          if (newObj) {
            newObj.set({
              left: pos.x,
              top: pos.y,
              opacity: textEl.opacity ?? 1,
            } as any);

            if (textEl.charSpacing) {
              (newObj as any).set("charSpacing", textEl.charSpacing);
            }
            if (textEl.lineHeight) {
              (newObj as any).set("lineHeight", textEl.lineHeight);
            }
            if (textEl.width) {
              (newObj as any).set("width", textEl.width * (bounds.width / 800));
            }

            canvas.requestRenderAll();
            editor.save();
          }
          break;
        }

        case "search_images": {
          const imageRef = step.toolArgs.imageRef as string;
          const imgEl = preset.imageElements.find((i) => i.id === imageRef);
          if (!imgEl) break;

          try {
            // search for images via api
            const searchRes = await fetch(
              `/api/pixabay/search?q=${encodeURIComponent(imgEl.query)}&per_page=3&image_type=vector`,
            );

            if (!searchRes.ok) break;

            const searchData = await searchRes.json();
            const images = searchData?.data?.images;
            if (!images?.length) break;

            const imageUrl = images[0].url || images[0].thumbnail;
            if (!imageUrl) break;

            // load and place image
            await new Promise<void>((resolve) => {
              const img = new Image();
              img.crossOrigin = "anonymous";

              img.onload = () => {
                const targetWidth = (imgEl.width || 120) * (bounds.width / 800);
                const scale = targetWidth / img.width;
                const scaledWidth = img.width * scale;
                const scaledHeight = img.height * scale;
                const pos = resolvePosition(imgEl.position, bounds, scaledWidth, scaledHeight);

                const fabricImg = new (window as any).fabric.Image(img, {
                  left: pos.x,
                  top: pos.y,
                  scaleX: scale,
                  scaleY: scale,
                  opacity: imgEl.opacity ?? 1,
                });

                canvas.add(fabricImg);
                canvas.requestRenderAll();
                editor.save();
                resolve();
              };

              img.onerror = () => resolve();
              img.src = imageUrl;
            });
          } catch {
            // image search/load failed silently
          }
          break;
        }

        case "spawn_shape": {
          const opts = step.toolArgs.options as Record<string, unknown> | undefined;
          if (!opts) break;

          const shapeType = (step.toolArgs.shapeType as string) || "rectangle";

          switch (shapeType) {
            case "rectangle":
              editor.addRectangle();
              break;
            case "circle":
              editor.addCircle();
              break;
            case "triangle":
              editor.addTriangle();
              break;
            default:
              editor.addRectangle();
          }

          await sleep(50);
          const objects = canvas.getObjects();
          const newShape = objects[objects.length - 1];
          if (newShape && opts) {
            const shapeWidth = (opts.width as number) || 100;
            const shapeHeight = (opts.height as number) || 50;
            const scaleW = (shapeWidth * bounds.width) / 800;
            const scaleH = (shapeHeight * bounds.height) / 1100;

            const shapePos = opts.position
              ? resolvePosition(
                  opts.position as { x: number; y: number } | string,
                  bounds,
                  scaleW,
                  scaleH,
                )
              : { x: bounds.left + bounds.width / 2 - scaleW / 2, y: bounds.top + bounds.height / 2 - scaleH / 2 };

            newShape.set({
              left: shapePos.x,
              top: shapePos.y,
              width: scaleW,
              height: scaleH,
              fill: (opts.fill as string) || "#FFFFFF",
              rx: (opts.rx as number) || 0,
              ry: (opts.ry as number) || 0,
              scaleX: 1,
              scaleY: 1,
            } as any);

            canvas.requestRenderAll();
            editor.save();
          }
          break;
        }

        case "finalize_layout": {
          // deselect all and trigger autozoom
          canvas.discardActiveObject();
          canvas.requestRenderAll();
          editor.autoZoom();
          editor.save();
          break;
        }

        default:
          // unknown tool, simulate execution delay
          await sleep(step.executionDurationMs || 300);
          break;
      }
    },
    [canvas, editor, activePreset],
  );

  const onDemoComplete = useCallback((data: Record<string, unknown>) => {
    setCollectedData(data);
    setPhase("complete");
  }, []);

  return {
    phase,
    activePreset,
    collectedData,
    predefinedPrompts: PREDEFINED_PROMPTS,

    startDemo,
    startDemoFromPrompt,
    checkForDemo,
    executeStep,
    onDemoComplete,
    cancelDemo,
    resetDemo,
  };
}
