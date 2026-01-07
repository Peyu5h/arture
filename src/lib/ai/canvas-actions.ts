import { fabric } from "fabric";
import {
  ShapeType,
  ShapeOptions,
  Position,
  PositionPreset,
  AgentAction,
  ResizeElementPayload,
  IndexedElement,
} from "./types";
import { findElementByQuery, indexCanvas } from "./canvas-indexer";

// helper to load image from url
function loadImageFromUrl(
  url: string,
  options?: { crossOrigin?: string },
): Promise<fabric.Image | null> {
  return new Promise((resolve) => {
    const imgElement = new Image();
    if (options?.crossOrigin) {
      imgElement.crossOrigin = options.crossOrigin;
    }
    imgElement.onload = () => {
      const fabricImage = new fabric.Image(imgElement);
      resolve(fabricImage);
    };
    imgElement.onerror = () => {
      resolve(null);
    };
    imgElement.src = url;
  });
}

interface AddTextPayload {
  text: string;
  fontSize?: number;
  fontFamily?: string;
  fill?: string;
  position?: PositionPreset | Position;
}

interface ChangeBackgroundPayload {
  color: string;
}

// resolves position preset to coordinates relative to workspace
export function resolvePosition(
  preset: PositionPreset | Position,
  canvasWidth: number,
  canvasHeight: number,
  elementWidth: number = 100,
  elementHeight: number = 100,
): Position {
  if (typeof preset === "object" && "x" in preset && "y" in preset) {
    return preset;
  }

  // dynamic margin based on canvas size (5% of smaller dimension)
  const margin = Math.min(canvasWidth, canvasHeight) * 0.05;

  const positions: Record<PositionPreset, Position> = {
    center: {
      x: (canvasWidth - elementWidth) / 2,
      y: (canvasHeight - elementHeight) / 2,
    },
    "top-left": {
      x: margin,
      y: margin,
    },
    "top-center": {
      x: (canvasWidth - elementWidth) / 2,
      y: margin,
    },
    "top-right": {
      x: canvasWidth - elementWidth - margin,
      y: margin,
    },
    "middle-left": {
      x: margin,
      y: (canvasHeight - elementHeight) / 2,
    },
    "middle-right": {
      x: canvasWidth - elementWidth - margin,
      y: (canvasHeight - elementHeight) / 2,
    },
    "bottom-left": {
      x: margin,
      y: canvasHeight - elementHeight - margin,
    },
    "bottom-center": {
      x: (canvasWidth - elementWidth) / 2,
      y: canvasHeight - elementHeight - margin,
    },
    "bottom-right": {
      x: canvasWidth - elementWidth - margin,
      y: canvasHeight - elementHeight - margin,
    },
  };

  return positions[preset as PositionPreset] || positions.center;
}

// gets workspace dimensions and absolute position
function getWorkspaceBounds(canvas: fabric.Canvas): {
  width: number;
  height: number;
  left: number;
  top: number;
} {
  const workspace = canvas
    .getObjects()
    .find((obj) => (obj as unknown as { name?: string }).name === "clip") as
    | fabric.Rect
    | undefined;

  if (workspace) {
    // get the absolute position accounting for viewport transform
    const vpt = canvas.viewportTransform || [1, 0, 0, 1, 0, 0];
    const zoom = vpt[0];

    // workspace position is its left/top in canvas coordinates
    const wsLeft = workspace.left || 0;
    const wsTop = workspace.top || 0;
    const wsWidth = workspace.width || 500;
    const wsHeight = workspace.height || 500;

    return {
      width: wsWidth,
      height: wsHeight,
      left: wsLeft,
      top: wsTop,
    };
  }

  return { width: 500, height: 500, left: 0, top: 0 };
}

// calculates absolute position within workspace
function calculateAbsolutePosition(
  canvas: fabric.Canvas,
  position: Position | PositionPreset,
  elementWidth: number,
  elementHeight: number,
): { left: number; top: number } {
  const bounds = getWorkspaceBounds(canvas);
  const pos = resolvePosition(
    position,
    bounds.width,
    bounds.height,
    elementWidth,
    elementHeight,
  );

  return {
    left: bounds.left + pos.x,
    top: bounds.top + pos.y,
  };
}

// spawns rectangle
function spawnRectangle(
  canvas: fabric.Canvas,
  options: ShapeOptions = {},
): fabric.Rect {
  const width = options.width || 150;
  const height = options.height || 150;
  const position = options.position || "center";

  const absPos = calculateAbsolutePosition(canvas, position, width, height);

  const rect = new fabric.Rect({
    width,
    height,
    fill: options.fill || "#3b82f6",
    stroke: options.stroke || "#1d4ed8",
    strokeWidth: options.strokeWidth || 2,
    left: absPos.left,
    top: absPos.top,
  });

  canvas.add(rect);
  canvas.setActiveObject(rect);
  canvas.requestRenderAll();

  return rect;
}

// spawns circle
function spawnCircle(
  canvas: fabric.Canvas,
  options: ShapeOptions = {},
): fabric.Circle {
  const radius = options.radius || 75;
  const diameter = radius * 2;
  const position = options.position || "center";

  const absPos = calculateAbsolutePosition(
    canvas,
    position,
    diameter,
    diameter,
  );

  const circle = new fabric.Circle({
    radius,
    fill: options.fill || "#10b981",
    stroke: options.stroke || "#059669",
    strokeWidth: options.strokeWidth || 2,
    left: absPos.left,
    top: absPos.top,
  });

  canvas.add(circle);
  canvas.setActiveObject(circle);
  canvas.requestRenderAll();

  return circle;
}

// spawns triangle
function spawnTriangle(
  canvas: fabric.Canvas,
  options: ShapeOptions = {},
): fabric.Triangle {
  const width = options.width || 150;
  const height = options.height || 150;
  const position = options.position || "center";

  const absPos = calculateAbsolutePosition(canvas, position, width, height);

  const triangle = new fabric.Triangle({
    width,
    height,
    fill: options.fill || "#f59e0b",
    stroke: options.stroke || "#d97706",
    strokeWidth: options.strokeWidth || 2,
    left: absPos.left,
    top: absPos.top,
  });

  canvas.add(triangle);
  canvas.setActiveObject(triangle);
  canvas.requestRenderAll();

  return triangle;
}

// spawns diamond
function spawnDiamond(
  canvas: fabric.Canvas,
  options: ShapeOptions = {},
): fabric.Rect {
  const size = options.width || 120;
  const position = options.position || "center";

  // diamond needs extra space due to rotation
  const absPos = calculateAbsolutePosition(
    canvas,
    position,
    size * 1.4,
    size * 1.4,
  );

  const diamond = new fabric.Rect({
    width: size,
    height: size,
    fill: options.fill || "#8b5cf6",
    stroke: options.stroke || "#7c3aed",
    strokeWidth: options.strokeWidth || 2,
    left: absPos.left + (size * 1.4) / 2,
    top: absPos.top + (size * 1.4) / 2,
    angle: 45,
    originX: "center",
    originY: "center",
  });

  canvas.add(diamond);
  canvas.setActiveObject(diamond);
  canvas.requestRenderAll();

  return diamond;
}

// spawns star
function spawnStar(
  canvas: fabric.Canvas,
  options: ShapeOptions = {},
): fabric.Polygon {
  const outerRadius = options.radius || 75;
  const innerRadius = outerRadius * 0.4;
  const numPoints = 5;
  const position = options.position || "center";

  const points: Array<{ x: number; y: number }> = [];
  for (let i = 0; i < numPoints * 2; i++) {
    const radius = i % 2 === 0 ? outerRadius : innerRadius;
    const angle = (Math.PI / numPoints) * i - Math.PI / 2;
    points.push({
      x: radius * Math.cos(angle),
      y: radius * Math.sin(angle),
    });
  }

  const diameter = outerRadius * 2;
  const absPos = calculateAbsolutePosition(
    canvas,
    position,
    diameter,
    diameter,
  );

  const star = new fabric.Polygon(points, {
    fill: options.fill || "#eab308",
    stroke: options.stroke || "#ca8a04",
    strokeWidth: options.strokeWidth || 2,
    left: absPos.left + outerRadius,
    top: absPos.top + outerRadius,
    originX: "center",
    originY: "center",
  });

  canvas.add(star);
  canvas.setActiveObject(star);
  canvas.requestRenderAll();

  return star;
}

// spawns hexagon
function spawnHexagon(
  canvas: fabric.Canvas,
  options: ShapeOptions = {},
): fabric.Polygon {
  const radius = options.radius || 75;
  const position = options.position || "center";

  const points: Array<{ x: number; y: number }> = [];
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i - Math.PI / 2;
    points.push({
      x: radius * Math.cos(angle),
      y: radius * Math.sin(angle),
    });
  }

  const diameter = radius * 2;
  const absPos = calculateAbsolutePosition(
    canvas,
    position,
    diameter,
    diameter,
  );

  const hexagon = new fabric.Polygon(points, {
    fill: options.fill || "#ec4899",
    stroke: options.stroke || "#db2777",
    strokeWidth: options.strokeWidth || 2,
    left: absPos.left + radius,
    top: absPos.top + radius,
    originX: "center",
    originY: "center",
  });

  canvas.add(hexagon);
  canvas.setActiveObject(hexagon);
  canvas.requestRenderAll();

  return hexagon;
}

// main spawn shape function
export function spawnShape(
  canvas: fabric.Canvas,
  shapeType: ShapeType,
  options: ShapeOptions = {},
): fabric.Object | null {
  switch (shapeType) {
    case "rectangle":
      return spawnRectangle(canvas, options);
    case "circle":
      return spawnCircle(canvas, options);
    case "triangle":
      return spawnTriangle(canvas, options);
    case "diamond":
      return spawnDiamond(canvas, options);
    case "star":
      return spawnStar(canvas, options);
    case "hexagon":
      return spawnHexagon(canvas, options);
    default:
      console.warn(`Unknown shape type: ${shapeType}`);
      return null;
  }
}

// finds fabric object by element query
function findFabricObject(
  canvas: fabric.Canvas,
  query: string,
): fabric.Object | null {
  const lowerQuery = query.toLowerCase().trim();

  // handle "selected" query directly
  if (
    lowerQuery === "selected" ||
    lowerQuery === "it" ||
    lowerQuery === "this"
  ) {
    const activeObject = canvas.getActiveObject();
    if (activeObject) return activeObject;
    const activeObjects = canvas.getActiveObjects();
    if (activeObjects.length > 0) return activeObjects[0];
    return null;
  }

  const objects = canvas
    .getObjects()
    .filter((obj) => (obj as unknown as { name?: string }).name !== "clip");

  // find by id directly
  const byId = objects.find(
    (obj) =>
      (obj as unknown as { id?: string }).id?.toLowerCase() === lowerQuery,
  );
  if (byId) return byId;

  // find by type
  const byType = objects.find((obj) => {
    const type = obj.type?.toLowerCase() || "";
    return type === lowerQuery || type.includes(lowerQuery);
  });
  if (byType) return byType;

  // find by name
  const byName = objects.find((obj) => {
    const name =
      (obj as unknown as { name?: string }).name?.toLowerCase() || "";
    return name === lowerQuery || name.includes(lowerQuery);
  });
  if (byName) return byName;

  // use indexer as fallback
  const index = indexCanvas(canvas);
  const element = findElementByQuery(index, query);
  if (!element) return null;

  const byElementId = objects.find(
    (obj) => (obj as unknown as { id?: string }).id === element.id,
  );
  if (byElementId) return byElementId;

  if (element.layer < objects.length) {
    return objects[element.layer];
  }

  return null;
}

// moves element to position
export function moveElement(
  canvas: fabric.Canvas,
  elementQuery: string,
  position: Position | PositionPreset,
): boolean {
  const obj = findFabricObject(canvas, elementQuery);
  if (!obj) {
    console.warn(`Element not found: ${elementQuery}`);
    return false;
  }

  // calculate actual element dimensions including scale
  const objWidth = (obj.width || 100) * (obj.scaleX || 1);
  const objHeight = (obj.height || 100) * (obj.scaleY || 1);

  const absPos = calculateAbsolutePosition(
    canvas,
    position,
    objWidth,
    objHeight,
  );

  obj.set({
    left: absPos.left,
    top: absPos.top,
  });

  obj.setCoords();
  canvas.fire("object:modified", { target: obj });
  canvas.setActiveObject(obj);
  canvas.requestRenderAll();

  return true;
}

// modifies element properties
export function modifyElement(
  canvas: fabric.Canvas,
  elementQuery: string,
  properties: Record<string, unknown>,
): boolean {
  const obj = findFabricObject(canvas, elementQuery);
  if (!obj) {
    console.warn(`Element not found: ${elementQuery}`);
    return false;
  }

  // handle special property mappings
  const mappedProps: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(properties)) {
    // map common aliases
    if (key === "border" || key === "borderColor") {
      mappedProps.stroke = value;
    } else if (key === "borderWidth") {
      mappedProps.strokeWidth = value;
    } else if (key === "color" || key === "backgroundColor") {
      mappedProps.fill = value;
    } else if (key === "rotation") {
      mappedProps.angle = value;
    } else {
      mappedProps[key] = value;
    }
  }

  obj.set(mappedProps as Partial<fabric.Object>);
  obj.setCoords();
  canvas.fire("object:modified", { target: obj });
  canvas.setActiveObject(obj);
  canvas.requestRenderAll();

  return true;
}

// resizes element
export function resizeElement(
  canvas: fabric.Canvas,
  elementQuery: string,
  options: {
    width?: number;
    height?: number;
    scale?: number;
    increaseBy?: number;
    decreaseBy?: number;
  },
): boolean {
  const obj = findFabricObject(canvas, elementQuery);
  if (!obj) {
    console.warn(`Element not found: ${elementQuery}`);
    return false;
  }

  const bounds = getWorkspaceBounds(canvas);
  const maxWidth = bounds.width * 0.95;
  const maxHeight = bounds.height * 0.95;

  const currentWidth = (obj.width || 100) * (obj.scaleX || 1);
  const currentHeight = (obj.height || 100) * (obj.scaleY || 1);

  let newWidth = currentWidth;
  let newHeight = currentHeight;

  if (options.increaseBy) {
    newWidth = currentWidth + options.increaseBy;
    newHeight = currentHeight + options.increaseBy;
  } else if (options.decreaseBy) {
    newWidth = Math.max(10, currentWidth - options.decreaseBy);
    newHeight = Math.max(10, currentHeight - options.decreaseBy);
  } else if (options.scale) {
    newWidth = currentWidth * options.scale;
    newHeight = currentHeight * options.scale;
  } else if (options.width !== undefined || options.height !== undefined) {
    if (options.width !== undefined) newWidth = options.width;
    if (options.height !== undefined) newHeight = options.height;
  }

  // constrain to workspace bounds
  newWidth = Math.min(newWidth, maxWidth);
  newHeight = Math.min(newHeight, maxHeight);
  newWidth = Math.max(10, newWidth);
  newHeight = Math.max(10, newHeight);

  const scaleX = newWidth / (obj.width || 100);
  const scaleY = newHeight / (obj.height || 100);
  obj.set({ scaleX, scaleY });

  // ensure element stays within workspace
  const objLeft = obj.left || 0;
  const objTop = obj.top || 0;
  const wsRight = bounds.left + bounds.width;
  const wsBottom = bounds.top + bounds.height;

  if (objLeft + newWidth > wsRight) {
    obj.set({ left: wsRight - newWidth });
  }
  if (objTop + newHeight > wsBottom) {
    obj.set({ top: wsBottom - newHeight });
  }

  obj.setCoords();
  canvas.fire("object:modified", { target: obj });
  canvas.setActiveObject(obj);
  canvas.requestRenderAll();

  return true;
}

// deletes element
export function deleteElement(
  canvas: fabric.Canvas,
  elementQuery: string,
): boolean {
  const obj = findFabricObject(canvas, elementQuery);
  if (!obj) {
    console.warn(`Element not found: ${elementQuery}`);
    return false;
  }

  canvas.remove(obj);
  canvas.requestRenderAll();

  return true;
}

// selects element
export function selectElement(
  canvas: fabric.Canvas,
  elementQuery: string,
): boolean {
  const obj = findFabricObject(canvas, elementQuery);
  if (!obj) {
    console.warn(`Element not found: ${elementQuery}`);
    return false;
  }

  canvas.setActiveObject(obj);
  canvas.requestRenderAll();

  return true;
}

// executes agent action
export async function executeAction(
  canvas: fabric.Canvas,
  action: AgentAction,
): Promise<{ success: boolean; message: string }> {
  try {
    switch (action.type) {
      case "spawn_shape": {
        const payload = action.payload as unknown as Record<string, unknown>;
        let options: ShapeOptions = {};
        if (payload && payload.options && typeof payload.options === "object") {
          options = payload.options as ShapeOptions;
        } else if (payload) {
          const { shapeType: _, ...rest } = payload;
          options = rest as ShapeOptions;
        }
        const shapeType = (payload?.shapeType as ShapeType) || "rectangle";
        const shape = spawnShape(canvas, shapeType, options);
        if (shape) {
          return { success: true, message: `Created ${shapeType}` };
        }
        return { success: false, message: `Failed to create shape` };
      }

      case "move_element": {
        const payload = action.payload as {
          elementQuery?: string;
          elementId?: string;
          position: Position | PositionPreset;
        };
        const query = payload.elementQuery || payload.elementId || "selected";
        const success = moveElement(canvas, query, payload.position);
        if (success) {
          return {
            success: true,
            message: `Moved element to ${JSON.stringify(payload.position)}`,
          };
        }
        return { success: false, message: `Failed to move element` };
      }

      case "modify_element": {
        const payload = action.payload as {
          elementQuery?: string;
          elementId?: string;
          properties: Record<string, unknown>;
        };
        const query = payload.elementQuery || payload.elementId || "selected";
        const success = modifyElement(canvas, query, payload.properties);
        if (success) {
          return { success: true, message: `Modified element properties` };
        }
        return { success: false, message: `Failed to modify element` };
      }

      case "resize_element": {
        const payload = action.payload as ResizeElementPayload;
        const query = payload.elementQuery || payload.elementId || "selected";
        const success = resizeElement(canvas, query, {
          width: payload.width,
          height: payload.height,
          scale: payload.scale,
          increaseBy: payload.increaseBy,
          decreaseBy: payload.decreaseBy,
        });
        if (success) {
          return { success: true, message: `Resized element` };
        }
        return { success: false, message: `Failed to resize element` };
      }

      case "delete_element": {
        const payload = action.payload as {
          elementQuery?: string;
          elementId?: string;
        };
        const query = payload.elementQuery || payload.elementId || "selected";

        // try direct deletion first for selected
        if (query.toLowerCase() === "selected") {
          const activeObject = canvas.getActiveObject();
          const activeObjects = canvas.getActiveObjects();

          if (activeObjects.length > 0) {
            activeObjects.forEach((obj) => canvas.remove(obj));
            canvas.discardActiveObject();
            canvas.requestRenderAll();
            return {
              success: true,
              message: `Deleted ${activeObjects.length} element(s)`,
            };
          }
          if (activeObject) {
            canvas.remove(activeObject);
            canvas.discardActiveObject();
            canvas.requestRenderAll();
            return { success: true, message: `Deleted element` };
          }
          return { success: false, message: `No element selected` };
        }

        const success = deleteElement(canvas, query);
        if (success) {
          return { success: true, message: `Deleted element` };
        }
        return { success: false, message: `Failed to delete element` };
      }

      case "select_element": {
        const payload = action.payload as {
          elementQuery?: string;
          elementId?: string;
        };
        const query = payload.elementQuery || payload.elementId || "";
        const success = selectElement(canvas, query);
        if (success) {
          return { success: true, message: `Selected element` };
        }
        return { success: false, message: `Failed to select element` };
      }

      case "ask_clarification": {
        const payload = action.payload as { question: string };
        return { success: true, message: payload.question };
      }

      case "add_text": {
        const payload = (action.payload || {}) as AddTextPayload;
        const text = payload.text || "Text";
        const fontSize = payload.fontSize || 32;
        const fontFamily = payload.fontFamily || "Arial";
        const fill = payload.fill || "#000000";
        const position = payload.position || "center";

        const bounds = getWorkspaceBounds(canvas);
        const estimatedWidth = Math.min(
          text.length * fontSize * 0.6,
          bounds.width * 0.8,
        );
        const textObj = new fabric.Textbox(text, {
          fontSize,
          fontFamily,
          fill,
          width: estimatedWidth,
          textAlign: "left",
        });

        const textWidth = textObj.width || estimatedWidth;
        const textHeight = textObj.height || fontSize * 1.2;

        const absPos = calculateAbsolutePosition(
          canvas,
          position,
          textWidth,
          textHeight,
        );

        textObj.set({ left: absPos.left, top: absPos.top });
        canvas.add(textObj);
        canvas.setActiveObject(textObj);
        canvas.requestRenderAll();

        return { success: true, message: `Added text: "${text}"` };
      }

      case "change_canvas_background": {
        const payload = (action.payload || {}) as ChangeBackgroundPayload;
        const color = payload.color || "#ffffff";

        const workspace = canvas
          .getObjects()
          .find(
            (obj) => (obj as unknown as { name?: string }).name === "clip",
          ) as fabric.Rect | undefined;

        if (workspace) {
          workspace.set("fill", color);
          canvas.fire("object:modified", { target: workspace });
          canvas.requestRenderAll();
          return { success: true, message: `Changed background to ${color}` };
        }

        canvas.backgroundColor = color;
        canvas.requestRenderAll();
        return { success: true, message: `Changed background to ${color}` };
      }

      case "search_images": {
        const payload = action.payload as { query?: string; count?: number };
        const query = payload.query;
        if (!query) {
          return { success: false, message: "Search query is required" };
        }
        const count = payload.count || 1;

        try {
          // try pexels first (more reliable), then pixabay
          let imageUrl: string | null = null;

          try {
            const pexelsRes = await fetch(
              `/api/pexels/search?q=${encodeURIComponent(query)}&per_page=${count}`,
            );
            if (pexelsRes.ok) {
              const data = await pexelsRes.json();
              if (data.success && data.data?.images?.length) {
                const img = data.data.images[0];
                imageUrl = img.url || img.preview || img.thumbnail;
              }
            }
          } catch {
            // pexels failed, try pixabay
          }

          if (!imageUrl) {
            try {
              const pixabayRes = await fetch(
                `/api/pixabay/search?q=${encodeURIComponent(query)}&per_page=${count}`,
              );
              if (pixabayRes.ok) {
                const data = await pixabayRes.json();
                if (data.success && data.data?.images?.length) {
                  const img = data.data.images[0];
                  imageUrl = img.url || img.preview || img.thumbnail;
                }
              }
            } catch {
              // pixabay also failed
            }
          }

          if (!imageUrl) {
            return {
              success: false,
              message: `No images found for "${query}"`,
            };
          }

          const img = await loadImageFromUrl(imageUrl, {
            crossOrigin: "anonymous",
          });
          if (!img) {
            return { success: false, message: "Failed to load image" };
          }

          const bounds = getWorkspaceBounds(canvas);
          const imgWidth = img.width || 200;
          const imgHeight = img.height || 200;
          const scale = Math.min(
            (bounds.width * 0.4) / imgWidth,
            (bounds.height * 0.4) / imgHeight,
          );

          img.scale(scale);
          const absPos = calculateAbsolutePosition(
            canvas,
            "top-left",
            imgWidth * scale,
            imgHeight * scale,
          );

          img.set({ left: absPos.left, top: absPos.top });
          canvas.add(img);
          canvas.setActiveObject(img);
          canvas.requestRenderAll();

          return {
            success: true,
            message: `Added "${query}" image to canvas`,
          };
        } catch (error) {
          return {
            success: false,
            message: `Image search failed: ${error instanceof Error ? error.message : "Unknown error"}`,
          };
        }
      }

      case "add_image_to_canvas": {
        const payload = action.payload as {
          url?: string;
          position?: PositionPreset;
          width?: number;
          height?: number;
        };
        const url = payload.url;
        if (!url) {
          return { success: false, message: "Image URL is required" };
        }

        const position = payload.position || "center";
        const targetWidth = payload.width;
        const targetHeight = payload.height;

        const img = await loadImageFromUrl(url, { crossOrigin: "anonymous" });
        if (!img) {
          return { success: false, message: "Failed to load image" };
        }

        const bounds = getWorkspaceBounds(canvas);
        const imgWidth = img.width || 200;
        const imgHeight = img.height || 200;

        let scale = Math.min(
          (bounds.width * 0.5) / imgWidth,
          (bounds.height * 0.5) / imgHeight,
        );

        if (targetWidth) {
          scale = targetWidth / imgWidth;
        } else if (targetHeight) {
          scale = targetHeight / imgHeight;
        }

        img.scale(scale);
        const scaledWidth = imgWidth * scale;
        const scaledHeight = imgHeight * scale;

        const absPos = calculateAbsolutePosition(
          canvas,
          position,
          scaledWidth,
          scaledHeight,
        );

        img.set({ left: absPos.left, top: absPos.top });
        canvas.add(img);
        canvas.setActiveObject(img);
        canvas.requestRenderAll();

        return {
          success: true,
          message: `Added image at ${position}`,
        };
      }

      default:
        console.warn(`Unhandled action type: ${action.type}`);
        return {
          success: false,
          message: `Unknown action type: ${action.type}`,
        };
    }
  } catch (error) {
    console.error("Action execution error:", error);
    return { success: false, message: `Error executing action: ${error}` };
  }
}

// executes multiple actions
export async function executeActions(
  canvas: fabric.Canvas,
  actions: AgentAction[],
): Promise<
  Array<{
    action: AgentAction;
    result: { success: boolean; message: string };
  }>
> {
  const results: Array<{
    action: AgentAction;
    result: { success: boolean; message: string };
  }> = [];

  // save canvas state before actions
  const wasInteractive = canvas.interactive;

  try {
    for (const action of actions) {
      const result = await executeAction(canvas, action);
      results.push({ action, result });
    }
  } finally {
    // restore canvas state after all actions
    canvas.interactive = wasInteractive;
    canvas.selection = true;
    canvas.getObjects().forEach((obj) => {
      if ((obj as { name?: string }).name !== "clip") {
        obj.selectable = true;
        obj.evented = true;
      }
    });
    canvas.requestRenderAll();
  }

  return results;
}
