import { fabric } from "fabric";
import {
  CanvasIndex,
  IndexedElement,
  ElementType,
  TokenBudget,
  Position,
  Size,
} from "./types";

const INDEX_VERSION = "1.0.0";
const CHARS_PER_TOKEN = 4;

// estimates token count
function estimateTokens(text: string): number {
  if (!text) return 0;
  return Math.ceil(text.length / CHARS_PER_TOKEN);
}

// maps fabric type to our element type
function mapElementType(fabricType: string | undefined): ElementType {
  if (!fabricType) return "unknown";
  const typeMap: Record<string, ElementType> = {
    textbox: "textbox",
    text: "text",
    "i-text": "i-text",
    image: "image",
    rect: "rect",
    circle: "circle",
    triangle: "triangle",
    polygon: "polygon",
    path: "path",
    line: "line",
    group: "group",
  };
  return typeMap[fabricType] || "unknown";
}

// safely extracts fill/stroke as string
function serializeColor(value: unknown): string {
  if (!value) return "none";
  if (typeof value === "string") return value;
  if (typeof value === "object") {
    if ("colorStops" in (value as object)) return "gradient";
    if ("source" in (value as object)) return "pattern";
  }
  return "complex";
}

// generates short image reference id
let imageCounter = 0;
const imageRefMap = new Map<string, string>();

function getImageRef(src: string): string {
  if (imageRefMap.has(src)) {
    return imageRefMap.get(src)!;
  }
  imageCounter++;
  const ref = `img_${imageCounter}`;
  imageRefMap.set(src, ref);
  return ref;
}

// resets image counter for new sessions
export function resetImageRefs(): void {
  imageCounter = 0;
  imageRefMap.clear();
}

// extracts image description from src
function getImageDescription(src: string): string {
  if (!src) return "unknown";
  if (src.startsWith("data:")) return "generated_by_ai";
  const match = src.match(/\/([^/]+)\.(jpg|jpeg|png|gif|webp|svg)/i);
  if (match) return match[1].replace(/[-_]/g, " ").slice(0, 30);
  if (src.includes("cloudinary")) return "cloud_image";
  if (src.includes("unsplash")) return "unsplash_image";
  return "external_image";
}

// indexes single canvas element
function indexElement(
  obj: fabric.Object,
  layerIndex: number,
  isSelected: boolean
): IndexedElement {
  const type = mapElementType(obj.type);
  const id = (obj as unknown as { id?: string }).id || `el_${layerIndex}`;

  const element: IndexedElement = {
    id,
    type,
    position: {
      x: Math.round(obj.left || 0),
      y: Math.round(obj.top || 0),
    },
    size: {
      w: Math.round((obj.width || 0) * (obj.scaleX || 1)),
      h: Math.round((obj.height || 0) * (obj.scaleY || 1)),
    },
    layer: layerIndex,
  };

  // optional common properties
  if (obj.angle && obj.angle !== 0) {
    element.angle = Math.round(obj.angle);
  }
  if (obj.opacity !== undefined && obj.opacity !== 1) {
    element.opacity = Math.round(obj.opacity * 100) / 100;
  }
  if (obj.fill) {
    element.fill = serializeColor(obj.fill);
  }
  if (obj.stroke) {
    element.stroke = serializeColor(obj.stroke);
  }
  if (obj.strokeWidth && obj.strokeWidth > 0) {
    element.strokeWidth = obj.strokeWidth;
  }
  if ((obj as unknown as { name?: string }).name) {
    element.name = (obj as unknown as { name: string }).name;
  }
  if (isSelected) {
    element.isSelected = true;
  }

  // text-specific
  if (type === "textbox" || type === "text" || type === "i-text") {
    const textObj = obj as fabric.IText;
    if (textObj.text) {
      element.text = textObj.text.slice(0, 100);
    }
    if (textObj.fontFamily) {
      element.fontFamily = textObj.fontFamily;
    }
    if (textObj.fontSize) {
      element.fontSize = Math.round(textObj.fontSize);
    }
  }

  // image-specific
  if (type === "image") {
    const imgObj = obj as fabric.Image;
    const src = imgObj.getSrc?.() || "";
    if (src) {
      element.imageRef = getImageRef(src);
      element.imageDesc = getImageDescription(src);
    }
  }

  // shape identifier for paths
  if (type === "path") {
    element.shape = "path";
  }

  return element;
}

// calculates token budget for index
function calculateTokenBudget(
  elements: IndexedElement[],
  summary: string
): TokenBudget {
  let elementTokens = 0;
  for (const el of elements) {
    elementTokens += estimateTokens(JSON.stringify(el));
  }
  const summaryTokens = estimateTokens(summary);

  return {
    total: elementTokens + summaryTokens + 50,
    used: elementTokens + summaryTokens,
    elements: elementTokens,
    messages: 0,
    summary: summaryTokens,
  };
}

// main indexer function
export function indexCanvas(canvas: fabric.Canvas): CanvasIndex {
  const objects = canvas
    .getObjects()
    .filter((obj) => (obj as unknown as { name?: string }).name !== "clip");

  const activeObject = canvas.getActiveObject();
  const activeIds = new Set<string>();

  if (activeObject) {
    if ((activeObject as fabric.ActiveSelection).type === "activeSelection") {
      const selection = activeObject as fabric.ActiveSelection;
      selection.getObjects().forEach((obj) => {
        const id = (obj as unknown as { id?: string }).id;
        if (id) activeIds.add(id);
      });
    } else {
      const id = (activeObject as unknown as { id?: string }).id;
      if (id) activeIds.add(id);
    }
  }

  const workspace = canvas
    .getObjects()
    .find((obj) => (obj as unknown as { name?: string }).name === "clip") as
    | fabric.Rect
    | undefined;

  const canvasWidth = workspace?.width || 500;
  const canvasHeight = workspace?.height || 500;
  let background = "#ffffff";
  if (workspace?.fill) {
    background = serializeColor(workspace.fill);
  }

  const elements = objects.map((obj, idx) => {
    const id = (obj as unknown as { id?: string }).id || `el_${idx}`;
    return indexElement(obj, idx, activeIds.has(id));
  });

  const summary = generateContextSummary(elements, {
    width: canvasWidth,
    height: canvasHeight,
    background,
  });

  const tokenBudget = calculateTokenBudget(elements, summary);

  return {
    version: INDEX_VERSION,
    timestamp: Date.now(),
    canvas: {
      width: Math.round(canvasWidth),
      height: Math.round(canvasHeight),
      background,
    },
    elements,
    elementCount: elements.length,
    summary,
    tokenBudget,
  };
}

// generates natural language summary
export function generateContextSummary(
  elements: IndexedElement[],
  canvas: { width: number; height: number; background: string }
): string {
  if (elements.length === 0) {
    return `Empty canvas (${canvas.width}x${canvas.height}px, bg: ${canvas.background})`;
  }

  const textEls = elements.filter(
    (e) => e.type === "textbox" || e.type === "text" || e.type === "i-text"
  );
  const imageEls = elements.filter((e) => e.type === "image");
  const shapeEls = elements.filter((e) =>
    ["rect", "circle", "triangle", "polygon", "path", "line"].includes(e.type)
  );
  const selectedEls = elements.filter((e) => e.isSelected);

  const parts: string[] = [];

  parts.push(
    `Canvas: ${canvas.width}x${canvas.height}px, background ${canvas.background}`
  );

  if (selectedEls.length > 0) {
    const selDesc = selectedEls
      .map((e) => {
        if (e.text) return `text "${e.text.slice(0, 20)}"`;
        if (e.imageRef) return `image (${e.imageDesc})`;
        return e.type;
      })
      .join(", ");
    parts.push(`Selected: ${selDesc}`);
  }

  if (textEls.length > 0) {
    const textPreviews = textEls
      .slice(0, 3)
      .map((e) => `"${(e.text || "").slice(0, 25)}..."`)
      .join(", ");
    parts.push(
      `${textEls.length} text element${textEls.length > 1 ? "s" : ""}: ${textPreviews}`
    );
  }

  if (imageEls.length > 0) {
    parts.push(
      `${imageEls.length} image${imageEls.length > 1 ? "s" : ""} (${imageEls.map((e) => e.imageDesc).join(", ")})`
    );
  }

  if (shapeEls.length > 0) {
    const shapeCounts: Record<string, number> = {};
    shapeEls.forEach((e) => {
      shapeCounts[e.type] = (shapeCounts[e.type] || 0) + 1;
    });
    const shapeDesc = Object.entries(shapeCounts)
      .map(([type, count]) => `${count} ${type}${count > 1 ? "s" : ""}`)
      .join(", ");
    parts.push(`Shapes: ${shapeDesc}`);
  }

  // describe layout zones
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;

  const zones = {
    topLeft: 0,
    topRight: 0,
    bottomLeft: 0,
    bottomRight: 0,
    center: 0,
  };

  elements.forEach((e) => {
    const elCenterX = e.position.x + e.size.w / 2;
    const elCenterY = e.position.y + e.size.h / 2;

    const distFromCenter = Math.sqrt(
      Math.pow(elCenterX - centerX, 2) + Math.pow(elCenterY - centerY, 2)
    );

    if (distFromCenter < Math.min(canvas.width, canvas.height) * 0.2) {
      zones.center++;
    } else if (elCenterX < centerX && elCenterY < centerY) {
      zones.topLeft++;
    } else if (elCenterX >= centerX && elCenterY < centerY) {
      zones.topRight++;
    } else if (elCenterX < centerX && elCenterY >= centerY) {
      zones.bottomLeft++;
    } else {
      zones.bottomRight++;
    }
  });

  const zoneDescs = [];
  if (zones.center > 0) zoneDescs.push(`${zones.center} centered`);
  if (zones.topLeft > 0) zoneDescs.push(`${zones.topLeft} top-left`);
  if (zones.topRight > 0) zoneDescs.push(`${zones.topRight} top-right`);
  if (zones.bottomLeft > 0) zoneDescs.push(`${zones.bottomLeft} bottom-left`);
  if (zones.bottomRight > 0)
    zoneDescs.push(`${zones.bottomRight} bottom-right`);

  if (zoneDescs.length > 0) {
    parts.push(`Layout: ${zoneDescs.join(", ")}`);
  }

  return parts.join(". ");
}

// finds element by query
export function findElementByQuery(
  index: CanvasIndex,
  query: string
): IndexedElement | null {
  const lowerQuery = query.toLowerCase().trim();

  // exact id match
  const byId = index.elements.find(
    (e) => e.id.toLowerCase() === lowerQuery
  );
  if (byId) return byId;

  // by name
  const byName = index.elements.find(
    (e) => e.name?.toLowerCase() === lowerQuery
  );
  if (byName) return byName;

  // by type
  const byType = index.elements.find(
    (e) => e.type === lowerQuery || e.shape === lowerQuery
  );
  if (byType) return byType;

  // fuzzy match on text content
  const byText = index.elements.find(
    (e) => e.text?.toLowerCase().includes(lowerQuery)
  );
  if (byText) return byText;

  // selected element fallback
  const selected = index.elements.find((e) => e.isSelected);
  if (selected) return selected;

  return null;
}

// gets lightweight context for AI
export function getMinimalContext(index: CanvasIndex): string {
  return JSON.stringify({
    canvas: index.canvas,
    summary: index.summary,
    elementCount: index.elementCount,
    elements: index.elements.map((e) => ({
      id: e.id,
      type: e.type,
      pos: `${e.position.x},${e.position.y}`,
      ...(e.text && { text: e.text.slice(0, 30) }),
      ...(e.imageRef && { img: e.imageRef }),
      ...(e.isSelected && { sel: true }),
    })),
  });
}
