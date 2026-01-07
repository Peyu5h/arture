import { fabric } from "fabric";
import {
  AgentAction,
  ShapeOptions,
  ShapeType,
  Position,
  PositionPreset,
  ResizeElementPayload,
} from "./types";
import { indexCanvas, findElementByQuery } from "./canvas-indexer";

// loads image from url
function loadImageFromUrl(url: string): Promise<fabric.Image> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const fabricImage = new fabric.Image(img);
      resolve(fabricImage);
    };
    img.onerror = reject;
    img.src = url;
  });
}

interface AddTextPayload {
  text: string;
  fontSize?: number;
  fontFamily?: string;
  fill?: string;
  position?: PositionPreset;
}

interface ChangeBackgroundPayload {
  color: string;
}

// resolves position preset to coords
function resolvePosition(
  canvas: fabric.Canvas,
  position: Position | PositionPreset,
  objWidth: number,
  objHeight: number,
): { x: number; y: number } {
  if (typeof position === "object" && "x" in position && "y" in position) {
    return position;
  }

  const bounds = getWorkspaceBounds(canvas);
  const margin = 20;

  const positions: Record<PositionPreset, { x: number; y: number }> = {
    center: {
      x: bounds.left + bounds.width / 2 - objWidth / 2,
      y: bounds.top + bounds.height / 2 - objHeight / 2,
    },
    "top-left": {
      x: bounds.left + margin,
      y: bounds.top + margin,
    },
    "top-center": {
      x: bounds.left + bounds.width / 2 - objWidth / 2,
      y: bounds.top + margin,
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
      y: bounds.top + bounds.height - objHeight - margin,
    },
    "bottom-right": {
      x: bounds.left + bounds.width - objWidth - margin,
      y: bounds.top + bounds.height - objHeight - margin,
    },
  };

  return positions[position as PositionPreset] || positions.center;
}

// gets workspace bounds
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
    const vpt = canvas.viewportTransform || [1, 0, 0, 1, 0, 0];
    const zoom = canvas.getZoom();

    const wsLeft = (workspace.left || 0) * zoom + vpt[4];
    const wsTop = (workspace.top || 0) * zoom + vpt[5];
    const wsWidth = (workspace.width || 800) * zoom;
    const wsHeight = (workspace.height || 600) * zoom;

    return {
      width: wsWidth,
      height: wsHeight,
      left: wsLeft,
      top: wsTop,
    };
  }

  return { width: 800, height: 600, left: 0, top: 0 };
}

// calculates absolute position
function calculateAbsolutePosition(
  canvas: fabric.Canvas,
  position: Position | PositionPreset,
  objWidth: number,
  objHeight: number,
): { left: number; top: number } {
  const bounds = getWorkspaceBounds(canvas);
  const pos = resolvePosition(canvas, position, objWidth, objHeight);

  return {
    left: pos.x,
    top: pos.y,
  };
}

// spawns rectangle
export function spawnRectangle(
  canvas: fabric.Canvas,
  options: ShapeOptions = {},
): fabric.Rect {
  const width = options.width || 100;
  const height = options.height || 100;
  const position = options.position || "center";
  const absPos = calculateAbsolutePosition(canvas, position, width, height);

  const rect = new fabric.Rect({
    width,
    height,
    fill: options.fill || "#3b82f6",
    stroke: options.stroke || "#1e40af",
    strokeWidth: options.strokeWidth || 0,
    left: absPos.left,
    top: absPos.top,
    rx: options.rx || 0,
    ry: options.ry || 0,
  });

  canvas.add(rect);
  canvas.setActiveObject(rect);
  canvas.requestRenderAll();
  return rect;
}

// spawns circle
export function spawnCircle(
  canvas: fabric.Canvas,
  options: ShapeOptions = {},
): fabric.Circle {
  const radius = options.radius || (options.width ? options.width / 2 : 50);
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
    fill: options.fill || "#ef4444",
    stroke: options.stroke || "#b91c1c",
    strokeWidth: options.strokeWidth || 0,
    left: absPos.left,
    top: absPos.top,
  });

  canvas.add(circle);
  canvas.setActiveObject(circle);
  canvas.requestRenderAll();
  return circle;
}

// spawns triangle
export function spawnTriangle(
  canvas: fabric.Canvas,
  options: ShapeOptions = {},
): fabric.Triangle {
  const width = options.width || 100;
  const height = options.height || 100;
  const position = options.position || "center";
  const absPos = calculateAbsolutePosition(canvas, position, width, height);

  const triangle = new fabric.Triangle({
    width,
    height,
    fill: options.fill || "#22c55e",
    stroke: options.stroke || "#15803d",
    strokeWidth: options.strokeWidth || 0,
    left: absPos.left,
    top: absPos.top,
  });

  canvas.add(triangle);
  canvas.setActiveObject(triangle);
  canvas.requestRenderAll();
  return triangle;
}

// spawns diamond
export function spawnDiamond(
  canvas: fabric.Canvas,
  options: ShapeOptions = {},
): fabric.Rect {
  const size = options.width || 100;
  const position = options.position || "center";
  const absPos = calculateAbsolutePosition(canvas, position, size, size);

  const diamond = new fabric.Rect({
    width: size,
    height: size,
    fill: options.fill || "#a855f7",
    stroke: options.stroke || "#7e22ce",
    strokeWidth: options.strokeWidth || 0,
    left: absPos.left,
    top: absPos.top,
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
export function spawnStar(
  canvas: fabric.Canvas,
  options: ShapeOptions = {},
): fabric.Polygon {
  const outerRadius = options.radius || 50;
  const innerRadius = outerRadius * 0.4;
  const numPoints = 5;
  const position = options.position || "center";
  const points: Array<{ x: number; y: number }> = [];

  for (let i = 0; i < numPoints * 2; i++) {
    const radius = i % 2 === 0 ? outerRadius : innerRadius;
    const angle = (i * Math.PI) / numPoints - Math.PI / 2;
    points.push({
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius,
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
    strokeWidth: options.strokeWidth || 0,
    left: absPos.left,
    top: absPos.top,
    originX: "center",
    originY: "center",
  });

  canvas.add(star);
  canvas.setActiveObject(star);
  canvas.requestRenderAll();
  return star;
}

// spawns hexagon
export function spawnHexagon(
  canvas: fabric.Canvas,
  options: ShapeOptions = {},
): fabric.Polygon {
  const radius = options.radius || 50;
  const position = options.position || "center";
  const points: Array<{ x: number; y: number }> = [];

  for (let i = 0; i < 6; i++) {
    const angle = (i * Math.PI) / 3 - Math.PI / 2;
    points.push({
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius,
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
    fill: options.fill || "#06b6d4",
    stroke: options.stroke || "#0891b2",
    strokeWidth: options.strokeWidth || 0,
    left: absPos.left,
    top: absPos.top,
    originX: "center",
    originY: "center",
  });

  canvas.add(hexagon);
  canvas.setActiveObject(hexagon);
  canvas.requestRenderAll();
  return hexagon;
}

// spawns shape by type
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
      return spawnRectangle(canvas, options);
  }
}

// finds fabric object by query - simplified and optimized
export function findFabricObject(
  canvas: fabric.Canvas,
  query: string,
): fabric.Object | null {
  if (!canvas || !query) return null;

  const lowerQuery = query.toLowerCase().trim();

  // handle selected query
  if (
    lowerQuery === "selected" ||
    lowerQuery === "it" ||
    lowerQuery === "this"
  ) {
    const active = canvas.getActiveObject();
    if (active) return active;

    const activeObjs = canvas.getActiveObjects();
    if (activeObjs.length > 0) return activeObjs[0];
    return null;
  }

  const objects = canvas
    .getObjects()
    .filter((obj) => (obj as unknown as { name?: string }).name !== "clip");

  // find by exact id
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

  const objWidth = (obj.width || 100) * (obj.scaleX || 1);
  const objHeight = (obj.height || 100) * (obj.scaleY || 1);

  const absPos = calculateAbsolutePosition(
    canvas,
    position,
    objWidth,
    objHeight,
  );

  obj.set({ left: absPos.left, top: absPos.top });
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

  const mappedProps: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(properties)) {
    if (key === "border" || key === "borderColor") {
      mappedProps.stroke = value;
    } else if (key === "borderWidth") {
      mappedProps.strokeWidth = value;
    } else if (key === "color" || key === "backgroundColor") {
      mappedProps.fill = value;
    } else if (key === "rotation") {
      mappedProps.angle = value;
    } else if (key === "cornerRadius" || key === "borderRadius") {
      mappedProps.rx = value;
      mappedProps.ry = value;
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
  const maxWidth = bounds.width * 0.9;
  const maxHeight = bounds.height * 0.9;

  const currentWidth = (obj.width || 100) * (obj.scaleX || 1);
  const currentHeight = (obj.height || 100) * (obj.scaleY || 1);

  let newWidth = currentWidth;
  let newHeight = currentHeight;

  if (options.scale) {
    newWidth = currentWidth * options.scale;
    newHeight = currentHeight * options.scale;
  } else if (options.increaseBy) {
    newWidth = currentWidth + options.increaseBy;
    newHeight = currentHeight + options.increaseBy;
  } else if (options.decreaseBy) {
    newWidth = Math.max(10, currentWidth - options.decreaseBy);
    newHeight = Math.max(10, currentHeight - options.decreaseBy);
  } else {
    if (options.width) newWidth = options.width;
    if (options.height) newHeight = options.height;
  }

  newWidth = Math.min(newWidth, maxWidth);
  newHeight = Math.min(newHeight, maxHeight);

  const scaleX = newWidth / (obj.width || 100);
  const scaleY = newHeight / (obj.height || 100);

  obj.set({ scaleX, scaleY });

  const objLeft = obj.left || 0;
  const objTop = obj.top || 0;
  const wsRight = bounds.left + bounds.width;
  const wsBottom = bounds.top + bounds.height;

  if (objLeft + newWidth > wsRight) {
    obj.set({ left: wsRight - newWidth - 10 });
  }
  if (objTop + newHeight > wsBottom) {
    obj.set({ top: wsBottom - newHeight - 10 });
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
  canvas.discardActiveObject();
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

// changes layer order
export function changeLayerOrder(
  canvas: fabric.Canvas,
  elementQuery: string,
  action: "bring_forward" | "send_backward" | "bring_to_front" | "send_to_back",
): boolean {
  const obj = findFabricObject(canvas, elementQuery);
  if (!obj) {
    console.warn(`Element not found: ${elementQuery}`);
    return false;
  }

  switch (action) {
    case "bring_forward":
      canvas.bringForward(obj);
      break;
    case "send_backward":
      canvas.sendBackwards(obj);
      break;
    case "bring_to_front":
      canvas.bringToFront(obj);
      break;
    case "send_to_back":
      canvas.sendToBack(obj);
      break;
  }

  // keep workspace at back
  const workspace = canvas
    .getObjects()
    .find((o) => (o as unknown as { name?: string }).name === "clip");
  if (workspace) {
    canvas.sendToBack(workspace);
  }

  canvas.requestRenderAll();
  return true;
}

// executes single action
export async function executeAction(
  canvas: fabric.Canvas,
  action: AgentAction,
): Promise<{ success: boolean; message: string }> {
  if (!canvas) {
    return { success: false, message: "Canvas not available" };
  }

  try {
    switch (action.type) {
      case "spawn_shape": {
        const payload = action.payload as unknown as Record<string, unknown>;
        let options: ShapeOptions = {};
        if (payload?.options && typeof payload.options === "object") {
          options = payload.options as ShapeOptions;
        } else if (payload) {
          const { shapeType: _, ...rest } = payload;
          options = rest as ShapeOptions;
        }
        const shapeType = (payload?.shapeType as ShapeType) || "rectangle";
        const shape = spawnShape(canvas, shapeType, options);
        return shape
          ? { success: true, message: `Created ${shapeType}` }
          : { success: false, message: `Failed to create shape` };
      }

      case "move_element": {
        const payload = action.payload as {
          elementQuery?: string;
          elementId?: string;
          position: Position | PositionPreset;
        };
        const query = payload.elementQuery || payload.elementId || "selected";
        const success = moveElement(canvas, query, payload.position);
        return success
          ? { success: true, message: `Moved element` }
          : { success: false, message: `Failed to move element` };
      }

      case "modify_element": {
        const payload = action.payload as {
          elementQuery?: string;
          elementId?: string;
          properties: Record<string, unknown>;
        };
        const query = payload.elementQuery || payload.elementId || "selected";
        const success = modifyElement(canvas, query, payload.properties);
        return success
          ? { success: true, message: `Modified element` }
          : { success: false, message: `Failed to modify element` };
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
        return success
          ? { success: true, message: `Resized element` }
          : { success: false, message: `Failed to resize element` };
      }

      case "delete_element": {
        const payload = action.payload as {
          elementQuery?: string;
          elementId?: string;
        };
        const query = payload.elementQuery || payload.elementId || "selected";

        // handle selected directly
        if (query.toLowerCase() === "selected") {
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
          const activeObject = canvas.getActiveObject();
          if (activeObject) {
            canvas.remove(activeObject);
            canvas.discardActiveObject();
            canvas.requestRenderAll();
            return { success: true, message: `Deleted element` };
          }
          return { success: false, message: `No element selected` };
        }

        const success = deleteElement(canvas, query);
        return success
          ? { success: true, message: `Deleted element` }
          : { success: false, message: `Failed to delete element` };
      }

      case "select_element": {
        const payload = action.payload as {
          elementQuery?: string;
          elementId?: string;
        };
        const query = payload.elementQuery || payload.elementId || "";
        const success = selectElement(canvas, query);
        return success
          ? { success: true, message: `Selected element` }
          : { success: false, message: `Failed to select element` };
      }

      case "change_layer_order": {
        const payload = action.payload as {
          elementQuery?: string;
          elementId?: string;
          action:
            | "bring_forward"
            | "send_backward"
            | "bring_to_front"
            | "send_to_back";
        };
        const query = payload.elementQuery || payload.elementId || "selected";
        const success = changeLayerOrder(canvas, query, payload.action);
        return success
          ? { success: true, message: `Changed layer order` }
          : { success: false, message: `Failed to change layer order` };
      }

      case "add_text": {
        const payload = action.payload as AddTextPayload;
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
          textAlign: "center",
        });

        const textWidth = textObj.width || 100;
        const textHeight = textObj.height || fontSize;
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

        return { success: true, message: `Added text "${text}"` };
      }

      case "change_canvas_background": {
        const payload = action.payload as ChangeBackgroundPayload;
        const color = payload.color || "#ffffff";

        const workspace = canvas
          .getObjects()
          .find((obj) => (obj as unknown as { name?: string }).name === "clip");
        if (workspace) {
          workspace.set({ fill: color });
          canvas.fire("object:modified", { target: workspace });
          canvas.requestRenderAll();
          return { success: true, message: `Changed background to ${color}` };
        }
        return { success: false, message: `Workspace not found` };
      }

      case "search_images": {
        const payload = action.payload as {
          query: string;
          count?: number;
          position?: PositionPreset;
        };
        const query = payload.query;
        if (!query) return { success: false, message: "No search query" };

        const count = payload.count || 1;
        let imageUrl: string | null = null;

        // try pexels first
        try {
          const pexelsRes = await fetch(
            `/api/pexels/search?q=${encodeURIComponent(query)}&per_page=${count}`,
          );
          const data = await pexelsRes.json();
          if (data?.success && data?.data?.images?.length) {
            const img = data.data.images[0];
            imageUrl = img.url || img.thumbnail;
          }
        } catch {}

        // fallback to pixabay
        if (!imageUrl) {
          try {
            const pixabayRes = await fetch(
              `/api/pixabay/search?q=${encodeURIComponent(query)}&per_page=${count}`,
            );
            const data = await pixabayRes.json();
            if (data?.success && data?.data?.images?.length) {
              const img = data.data.images[0];
              imageUrl = img.url || img.thumbnail;
            }
          } catch {}
        }

        if (!imageUrl) {
          return { success: false, message: `No images found for "${query}"` };
        }

        try {
          const fabricImg = await loadImageFromUrl(imageUrl);
          const bounds = getWorkspaceBounds(canvas);
          const imgWidth = fabricImg.width || 200;
          const imgHeight = fabricImg.height || 200;
          const scale = Math.min(
            (bounds.width * 0.5) / imgWidth,
            (bounds.height * 0.5) / imgHeight,
            1,
          );

          const position = payload.position || "center";
          const absPos = calculateAbsolutePosition(
            canvas,
            position,
            imgWidth * scale,
            imgHeight * scale,
          );

          fabricImg.set({
            left: absPos.left,
            top: absPos.top,
            scaleX: scale,
            scaleY: scale,
          });

          canvas.add(fabricImg);
          canvas.setActiveObject(fabricImg);
          canvas.requestRenderAll();

          return { success: true, message: `Added "${query}" image` };
        } catch {
          return { success: false, message: `Failed to load image` };
        }
      }

      case "add_image": {
        const payload = action.payload as {
          url?: string;
          imageUrl?: string;
          position?: PositionPreset;
          width?: number;
          height?: number;
        };
        const url = payload.url || payload.imageUrl;
        if (!url) return { success: false, message: "No image URL" };

        const position = payload.position || "center";
        const targetWidth = payload.width;
        const targetHeight = payload.height;

        try {
          const fabricImg = await loadImageFromUrl(url);
          const bounds = getWorkspaceBounds(canvas);
          const imgWidth = fabricImg.width || 200;
          const imgHeight = fabricImg.height || 200;

          let scale = Math.min(
            (bounds.width * 0.5) / imgWidth,
            (bounds.height * 0.5) / imgHeight,
            1,
          );

          if (targetWidth) {
            scale = targetWidth / imgWidth;
          } else if (targetHeight) {
            scale = targetHeight / imgHeight;
          }

          const scaledWidth = imgWidth * scale;
          const scaledHeight = imgHeight * scale;
          const absPos = calculateAbsolutePosition(
            canvas,
            position,
            scaledWidth,
            scaledHeight,
          );

          fabricImg.set({
            left: absPos.left,
            top: absPos.top,
            scaleX: scale,
            scaleY: scale,
          });

          canvas.add(fabricImg);
          canvas.setActiveObject(fabricImg);
          canvas.requestRenderAll();

          return { success: true, message: `Added image` };
        } catch {
          return { success: false, message: `Failed to load image` };
        }
      }

      case "remove_background": {
        const payload = action.payload as {
          elementQuery?: string;
          elementId?: string;
        };
        const query = payload.elementQuery || payload.elementId || "selected";
        const obj = findFabricObject(canvas, query);

        if (!obj) {
          return { success: false, message: "No image element found" };
        }

        if (obj.type !== "image") {
          return {
            success: false,
            message: "Selected element is not an image",
          };
        }

        // background removal needs to be handled by the UI
        return {
          success: false,
          message:
            "Background removal requires the toolbar. Select the image and click the BG Remove button.",
        };
      }

      case "duplicate_element": {
        const payload = action.payload as {
          elementQuery?: string;
          elementId?: string;
          offsetX?: number;
          offsetY?: number;
        };
        const query = payload.elementQuery || payload.elementId || "selected";
        const obj = findFabricObject(canvas, query);

        if (!obj) {
          return { success: false, message: "Element not found" };
        }

        const offsetX = payload.offsetX || 20;
        const offsetY = payload.offsetY || 20;

        return new Promise((resolve) => {
          obj.clone((cloned: fabric.Object) => {
            cloned.set({
              left: (obj.left || 0) + offsetX,
              top: (obj.top || 0) + offsetY,
            });
            canvas.add(cloned);
            canvas.setActiveObject(cloned);
            canvas.requestRenderAll();
            resolve({ success: true, message: "Duplicated element" });
          });
        });
      }

      default:
        return {
          success: false,
          message: `Unknown action type: ${action.type}`,
        };
    }
  } catch (error) {
    return {
      success: false,
      message: `Error: ${error instanceof Error ? error.message : "Unknown"}`,
    };
  }
}

// executes multiple actions sequentially
export async function executeActions(
  canvas: fabric.Canvas,
  actions: AgentAction[],
): Promise<
  Array<{ action: AgentAction; result: { success: boolean; message: string } }>
> {
  const results: Array<{
    action: AgentAction;
    result: { success: boolean; message: string };
  }> = [];

  if (!canvas) {
    return actions.map((action) => ({
      action,
      result: { success: false, message: "Canvas not available" },
    }));
  }

  // cache selected object before executing actions
  const initialSelected = canvas.getActiveObject();

  for (const action of actions) {
    // for actions on "selected", ensure we use the cached object
    if (action.payload) {
      const payload = action.payload as Record<string, unknown>;
      if (
        (payload.elementQuery === "selected" ||
          payload.elementId === "selected" ||
          (!payload.elementQuery && !payload.elementId)) &&
        initialSelected
      ) {
        // set the initial selected as active before each action
        canvas.setActiveObject(initialSelected);
      }
    }

    const result = await executeAction(canvas, action);
    results.push({ action, result });
  }

  // restore canvas interactivity
  canvas.selection = true;
  canvas.interactive = true;
  canvas.getObjects().forEach((obj) => {
    if ((obj as unknown as { name?: string }).name !== "clip") {
      obj.selectable = true;
      obj.evented = true;
    }
  });
  canvas.requestRenderAll();

  return results;
}
