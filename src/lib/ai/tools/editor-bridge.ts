// bridge between ai tools and editor methods

import { fabric } from "fabric";
import {
  ToolContext,
  ToolResult,
  EditorInstance,
  PositionPreset,
  TextOptions,
} from "./types";
import { CanvasIndex, IndexedElement } from "../types";

// resolve position preset to coordinates
function resolvePositionToCoords(
  position: PositionPreset | { x: number; y: number },
  workspaceBounds: { left: number; top: number; width: number; height: number },
  elementSize: { width: number; height: number } = { width: 100, height: 100 },
): { x: number; y: number } {
  if (typeof position === "object" && "x" in position) {
    return position;
  }

  const margin = 0.1;
  const { left, top, width, height } = workspaceBounds;
  const marginX = width * margin;
  const marginY = height * margin;

  const positions: Record<PositionPreset, { x: number; y: number }> = {
    center: {
      x: left + width / 2 - elementSize.width / 2,
      y: top + height / 2 - elementSize.height / 2,
    },
    "top-left": {
      x: left + marginX,
      y: top + marginY,
    },
    "top-center": {
      x: left + width / 2 - elementSize.width / 2,
      y: top + marginY,
    },
    "top-right": {
      x: left + width - marginX - elementSize.width,
      y: top + marginY,
    },
    "middle-left": {
      x: left + marginX,
      y: top + height / 2 - elementSize.height / 2,
    },
    "middle-right": {
      x: left + width - marginX - elementSize.width,
      y: top + height / 2 - elementSize.height / 2,
    },
    "bottom-left": {
      x: left + marginX,
      y: top + height - marginY - elementSize.height,
    },
    "bottom-center": {
      x: left + width / 2 - elementSize.width / 2,
      y: top + height - marginY - elementSize.height,
    },
    "bottom-right": {
      x: left + width - marginX - elementSize.width,
      y: top + height - marginY - elementSize.height,
    },
  };

  return positions[position as PositionPreset] || positions.center;
}

// get workspace bounds from canvas
function getWorkspaceBounds(canvas: fabric.Canvas | null): {
  left: number;
  top: number;
  width: number;
  height: number;
} {
  if (!canvas) return { left: 0, top: 0, width: 800, height: 600 };

  const workspace = canvas
    .getObjects()
    .find(
      (obj: fabric.Object) =>
        (obj as unknown as { name?: string }).name === "workspace",
    );

  if (workspace) {
    const vpt = canvas.viewportTransform || [1, 0, 0, 1, 0, 0];
    const zoom = canvas.getZoom();
    return {
      left: (workspace.left || 0) * zoom + vpt[4],
      top: (workspace.top || 0) * zoom + vpt[5],
      width: (workspace.width || 800) * zoom,
      height: (workspace.height || 600) * zoom,
    };
  }

  return { left: 0, top: 0, width: 800, height: 600 };
}

// find element by id or query
function findElement(
  canvas: fabric.Canvas | null,
  elementId?: string,
  elementQuery?: string,
  canvasIndex?: CanvasIndex,
): fabric.Object | null {
  if (!canvas) return null;
  const objects = canvas.getObjects().filter((obj: fabric.Object) => {
    const name = (obj as unknown as { name?: string }).name;
    return name !== "workspace";
  });

  // find by id first
  if (elementId) {
    const byId = objects.find((obj: fabric.Object) => {
      const id = (obj as unknown as { id?: string }).id;
      return id === elementId;
    });
    if (byId) return byId;
  }

  // handle "selected" query
  if (elementQuery?.toLowerCase() === "selected") {
    const active = canvas.getActiveObject();
    if (active) return active;
  }

  // find by query (type, text content, etc.)
  if (elementQuery) {
    const query = elementQuery.toLowerCase();

    // try to match by type
    const typeMatch = objects.find((obj: fabric.Object) => {
      const type = (obj.type || "").toLowerCase();
      return type.includes(query) || query.includes(type);
    });
    if (typeMatch) return typeMatch;

    // try to match by text content
    const textMatch = objects.find((obj: fabric.Object) => {
      if (
        obj.type === "textbox" ||
        obj.type === "text" ||
        obj.type === "i-text"
      ) {
        const text = ((obj as fabric.Textbox).text || "").toLowerCase();
        return text.includes(query) || query.includes(text.slice(0, 20));
      }
      return false;
    });
    if (textMatch) return textMatch;

    // try to match indexed element by description
    if (canvasIndex?.elements) {
      const indexed = canvasIndex.elements.find((el) => {
        const name = (el.name || "").toLowerCase();
        const text = (el.text || "").toLowerCase();
        return (
          name.includes(query) || text.includes(query) || query.includes(name)
        );
      });
      if (indexed) {
        const found = objects.find((obj: fabric.Object) => {
          const id = (obj as unknown as { id?: string }).id;
          return id === indexed.id;
        });
        if (found) return found;
      }
    }
  }

  return null;
}

// color name to hex mapping
const colorMap: Record<string, string> = {
  red: "#ef4444",
  blue: "#3b82f6",
  green: "#22c55e",
  yellow: "#eab308",
  orange: "#f97316",
  purple: "#a855f7",
  pink: "#ec4899",
  black: "#000000",
  white: "#ffffff",
  gray: "#6b7280",
  grey: "#6b7280",
  cyan: "#06b6d4",
  teal: "#14b8a6",
};

function parseColor(color: string): string {
  if (!color) return "#000000";
  const lower = color.toLowerCase().trim();
  if (colorMap[lower]) return colorMap[lower];
  if (lower.startsWith("#")) return lower;
  if (lower.startsWith("rgb")) return lower;
  return color;
}

// tool execution functions
export async function executeSpawnShape(
  params: Record<string, unknown>,
  context: ToolContext,
): Promise<ToolResult> {
  const { editor, canvas } = context;
  if (!editor || !canvas) {
    return { success: false, message: "Editor not available" };
  }

  const shapeType = params.shapeType as string;
  const fill = params.fill ? parseColor(params.fill as string) : undefined;
  const stroke = params.stroke
    ? parseColor(params.stroke as string)
    : undefined;
  const strokeWidth = params.strokeWidth as number | undefined;
  const position = params.position as PositionPreset | undefined;

  try {
    // create shape using editor methods
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
      case "diamond":
        editor.addDiamond();
        break;
      case "star":
        editor.addStar();
        break;
      case "hexagon":
        editor.addHexagon();
        break;
      case "pentagon":
        editor.addPentagon();
        break;
      case "heart":
        editor.addHeart();
        break;
      case "octagon":
        editor.addOctagon();
        break;
      case "line":
        editor.addLine();
        break;
      case "arrow":
        editor.addArrow();
        break;
      default:
        return { success: false, message: `Unknown shape type: ${shapeType}` };
    }

    // get the newly created object (last added)
    const objects = canvas.getObjects();
    const newObject = objects[objects.length - 1];

    if (newObject) {
      // apply color if specified
      if (fill) {
        newObject.set({ fill });
      }
      if (stroke) {
        newObject.set({ stroke });
      }
      if (strokeWidth !== undefined) {
        newObject.set({ strokeWidth });
      }

      // apply position if specified
      if (position) {
        const bounds = getWorkspaceBounds(canvas);
        const objWidth = (newObject.width || 100) * (newObject.scaleX || 1);
        const objHeight = (newObject.height || 100) * (newObject.scaleY || 1);
        const coords = resolvePositionToCoords(position, bounds, {
          width: objWidth,
          height: objHeight,
        });
        newObject.set({ left: coords.x, top: coords.y });
      }

      canvas.setActiveObject(newObject);
      canvas.renderAll();
      editor.save();

      const elementId = (newObject as unknown as { id?: string }).id;
      return {
        success: true,
        message: `Created ${shapeType}${fill ? ` with color ${fill}` : ""}`,
        elementId,
      };
    }

    return { success: false, message: "Failed to create shape" };
  } catch (error) {
    return {
      success: false,
      message: `Error creating shape: ${error instanceof Error ? error.message : "Unknown error"}`,
    };
  }
}

export async function executeAddText(
  params: Record<string, unknown>,
  context: ToolContext,
): Promise<ToolResult> {
  const { editor, canvas } = context;
  if (!editor || !canvas) {
    return { success: false, message: "Editor not available" };
  }

  const text = params.text as string;
  if (!text) {
    return { success: false, message: "Text content is required" };
  }

  const fontSize = (params.fontSize as number) || 32;
  const fontFamily = (params.fontFamily as string) || "Arial";
  const fontWeight = (params.fontWeight as number) || 400;
  const fill = params.fill ? parseColor(params.fill as string) : "#000000";
  const position = params.position as PositionPreset | undefined;

  try {
    editor.addText(text, { fontSize, fontFamily, fontWeight, fill });

    const objects = canvas.getObjects();
    const newText = objects[objects.length - 1];

    if (newText && position) {
      const bounds = getWorkspaceBounds(canvas);
      const objWidth = (newText.width || 100) * (newText.scaleX || 1);
      const objHeight = (newText.height || 30) * (newText.scaleY || 1);
      const coords = resolvePositionToCoords(position, bounds, {
        width: objWidth,
        height: objHeight,
      });
      newText.set({ left: coords.x, top: coords.y });
      canvas.renderAll();
    }

    editor.save();

    const elementId = (newText as unknown as { id?: string }).id;
    return {
      success: true,
      message: `Added text: "${text.slice(0, 30)}${text.length > 30 ? "..." : ""}"`,
      elementId,
    };
  } catch (error) {
    return {
      success: false,
      message: `Error adding text: ${error instanceof Error ? error.message : "Unknown error"}`,
    };
  }
}

export async function executeMoveElement(
  params: Record<string, unknown>,
  context: ToolContext,
  canvasIndex?: CanvasIndex,
): Promise<ToolResult> {
  const { canvas, editor } = context;
  if (!canvas) {
    return { success: false, message: "Canvas not available" };
  }

  const elementId = params.elementId as string | undefined;
  const elementQuery = params.elementQuery as string | undefined;
  const position = params.position as PositionPreset;
  const x = params.x as number | undefined;
  const y = params.y as number | undefined;

  const element = findElement(canvas, elementId, elementQuery, canvasIndex);
  if (!element) {
    return {
      success: false,
      message: `Element not found: ${elementQuery || elementId || "no query provided"}`,
    };
  }

  try {
    const bounds = getWorkspaceBounds(canvas);
    const objWidth = (element.width || 100) * (element.scaleX || 1);
    const objHeight = (element.height || 100) * (element.scaleY || 1);

    let coords: { x: number; y: number };
    if (x !== undefined && y !== undefined) {
      coords = { x: bounds.left + x, y: bounds.top + y };
    } else {
      coords = resolvePositionToCoords(position, bounds, {
        width: objWidth,
        height: objHeight,
      });
    }

    element.set({ left: coords.x, top: coords.y });
    canvas.renderAll();
    editor?.save();

    return {
      success: true,
      message: `Moved element to ${position || `(${x}, ${y})`}`,
    };
  } catch (error) {
    return {
      success: false,
      message: `Error moving element: ${error instanceof Error ? error.message : "Unknown error"}`,
    };
  }
}

export async function executeModifyElement(
  params: Record<string, unknown>,
  context: ToolContext,
  canvasIndex?: CanvasIndex,
): Promise<ToolResult> {
  const { canvas, editor } = context;
  if (!canvas) {
    return { success: false, message: "Canvas not available" };
  }

  const elementId = params.elementId as string | undefined;
  const elementQuery = params.elementQuery as string | undefined;

  const element = findElement(canvas, elementId, elementQuery, canvasIndex);
  if (!element) {
    return {
      success: false,
      message: `Element not found: ${elementQuery || elementId || "no query provided"}`,
    };
  }

  try {
    const changes: string[] = [];

    if (params.fill) {
      const fill = parseColor(params.fill as string);
      element.set({ fill });
      changes.push(`fill to ${fill}`);
    }

    if (params.stroke) {
      const stroke = parseColor(params.stroke as string);
      element.set({ stroke });
      changes.push(`stroke to ${stroke}`);
    }

    if (params.strokeWidth !== undefined) {
      element.set({ strokeWidth: params.strokeWidth as number });
      changes.push(`stroke width to ${params.strokeWidth}px`);
    }

    if (params.opacity !== undefined) {
      element.set({ opacity: params.opacity as number });
      changes.push(`opacity to ${params.opacity}`);
    }

    if (params.angle !== undefined) {
      element.set({ angle: params.angle as number });
      changes.push(`rotation to ${params.angle}°`);
    }

    canvas.renderAll();
    editor?.save();

    return {
      success: true,
      message: `Modified element: ${changes.join(", ")}`,
    };
  } catch (error) {
    return {
      success: false,
      message: `Error modifying element: ${error instanceof Error ? error.message : "Unknown error"}`,
    };
  }
}

export async function executeResizeElement(
  params: Record<string, unknown>,
  context: ToolContext,
  canvasIndex?: CanvasIndex,
): Promise<ToolResult> {
  const { canvas, editor } = context;
  if (!canvas) {
    return { success: false, message: "Canvas not available" };
  }

  const elementId = params.elementId as string | undefined;
  const elementQuery = params.elementQuery as string | undefined;

  const element = findElement(canvas, elementId, elementQuery, canvasIndex);
  if (!element) {
    return {
      success: false,
      message: `Element not found: ${elementQuery || elementId || "no query provided"}`,
    };
  }

  try {
    const currentWidth = (element.width || 100) * (element.scaleX || 1);
    const currentHeight = (element.height || 100) * (element.scaleY || 1);

    let newWidth = currentWidth;
    let newHeight = currentHeight;

    if (params.width !== undefined && params.height !== undefined) {
      newWidth = params.width as number;
      newHeight = params.height as number;
    } else if (params.scale !== undefined) {
      const scale = params.scale as number;
      newWidth = currentWidth * scale;
      newHeight = currentHeight * scale;
    } else if (params.increaseBy !== undefined) {
      const increase = params.increaseBy as number;
      newWidth = currentWidth + increase;
      newHeight = currentHeight + increase;
    } else if (params.decreaseBy !== undefined) {
      const decrease = params.decreaseBy as number;
      newWidth = Math.max(10, currentWidth - decrease);
      newHeight = Math.max(10, currentHeight - decrease);
    } else if (params.width !== undefined) {
      newWidth = params.width as number;
      const ratio = newWidth / currentWidth;
      newHeight = currentHeight * ratio;
    } else if (params.height !== undefined) {
      newHeight = params.height as number;
      const ratio = newHeight / currentHeight;
      newWidth = currentWidth * ratio;
    }

    const scaleX = newWidth / (element.width || 100);
    const scaleY = newHeight / (element.height || 100);

    element.set({ scaleX, scaleY });
    canvas.renderAll();
    editor?.save();

    return {
      success: true,
      message: `Resized element to ${Math.round(newWidth)}x${Math.round(newHeight)}px`,
    };
  } catch (error) {
    return {
      success: false,
      message: `Error resizing element: ${error instanceof Error ? error.message : "Unknown error"}`,
    };
  }
}

export async function executeDeleteElement(
  params: Record<string, unknown>,
  context: ToolContext,
  canvasIndex?: CanvasIndex,
): Promise<ToolResult> {
  const { canvas, editor } = context;
  if (!canvas) {
    return { success: false, message: "Canvas not available" };
  }

  const elementId = params.elementId as string | undefined;
  const elementQuery = params.elementQuery as string | undefined;

  const element = findElement(canvas, elementId, elementQuery, canvasIndex);
  if (!element) {
    return {
      success: false,
      message: `Element not found: ${elementQuery || elementId || "no query provided"}`,
    };
  }

  try {
    canvas.remove(element);
    canvas.discardActiveObject();
    canvas.renderAll();
    editor?.save();

    return {
      success: true,
      message: "Deleted element from canvas",
    };
  } catch (error) {
    return {
      success: false,
      message: `Error deleting element: ${error instanceof Error ? error.message : "Unknown error"}`,
    };
  }
}

export async function executeSelectElement(
  params: Record<string, unknown>,
  context: ToolContext,
  canvasIndex?: CanvasIndex,
): Promise<ToolResult> {
  const { canvas } = context;
  if (!canvas) {
    return { success: false, message: "Canvas not available" };
  }

  const elementId = params.elementId as string | undefined;
  const elementQuery = params.elementQuery as string | undefined;

  const element = findElement(canvas, elementId, elementQuery, canvasIndex);
  if (!element) {
    return {
      success: false,
      message: `Element not found: ${elementQuery || elementId || "no query provided"}`,
    };
  }

  try {
    canvas.setActiveObject(element);
    canvas.renderAll();

    return {
      success: true,
      message: "Selected element",
    };
  } catch (error) {
    return {
      success: false,
      message: `Error selecting element: ${error instanceof Error ? error.message : "Unknown error"}`,
    };
  }
}

export async function executeModifyText(
  params: Record<string, unknown>,
  context: ToolContext,
  canvasIndex?: CanvasIndex,
): Promise<ToolResult> {
  const { canvas, editor } = context;
  if (!canvas) {
    return { success: false, message: "Canvas not available" };
  }

  const elementId = params.elementId as string | undefined;
  const elementQuery = params.elementQuery as string | undefined;

  const element = findElement(canvas, elementId, elementQuery, canvasIndex);
  if (!element) {
    return {
      success: false,
      message: `Text element not found: ${elementQuery || elementId || "no query provided"}`,
    };
  }

  const type = element.type || "";
  if (!["textbox", "text", "i-text"].includes(type)) {
    return { success: false, message: "Element is not a text element" };
  }

  const textElement = element as fabric.IText;

  try {
    const changes: string[] = [];

    if (params.text !== undefined) {
      textElement.set({ text: params.text as string });
      changes.push("text content");
    }

    if (params.fontSize !== undefined) {
      textElement.set({ fontSize: params.fontSize as number });
      changes.push(`font size to ${params.fontSize}px`);
    }

    if (params.fontFamily !== undefined) {
      textElement.set({ fontFamily: params.fontFamily as string });
      changes.push(`font family to ${params.fontFamily}`);
    }

    if (params.fontWeight !== undefined) {
      textElement.set({ fontWeight: params.fontWeight as number });
      changes.push(`font weight to ${params.fontWeight}`);
    }

    if (params.textAlign !== undefined) {
      textElement.set({ textAlign: params.textAlign as string });
      changes.push(`alignment to ${params.textAlign}`);
    }

    if (params.underline !== undefined) {
      textElement.set({ underline: params.underline as boolean });
      changes.push(params.underline ? "added underline" : "removed underline");
    }

    if (params.linethrough !== undefined) {
      textElement.set({ linethrough: params.linethrough as boolean });
      changes.push(
        params.linethrough ? "added strikethrough" : "removed strikethrough",
      );
    }

    if (params.italic !== undefined) {
      textElement.set({ fontStyle: params.italic ? "italic" : "normal" });
      changes.push(params.italic ? "made italic" : "removed italic");
    }

    canvas.renderAll();
    editor?.save();

    return {
      success: true,
      message: `Modified text: ${changes.join(", ")}`,
    };
  } catch (error) {
    return {
      success: false,
      message: `Error modifying text: ${error instanceof Error ? error.message : "Unknown error"}`,
    };
  }
}

export async function executeChangeLayerOrder(
  params: Record<string, unknown>,
  context: ToolContext,
  canvasIndex?: CanvasIndex,
): Promise<ToolResult> {
  const { canvas, editor } = context;
  if (!canvas || !editor) {
    return { success: false, message: "Canvas or editor not available" };
  }

  const elementId = params.elementId as string | undefined;
  const elementQuery = params.elementQuery as string | undefined;
  const action = params.action as string;

  const element = findElement(canvas, elementId, elementQuery, canvasIndex);
  if (!element) {
    return {
      success: false,
      message: `Element not found: ${elementQuery || elementId || "no query provided"}`,
    };
  }

  try {
    canvas.setActiveObject(element);

    switch (action) {
      case "bring_forward":
        editor.bringForward();
        break;
      case "send_backward":
        editor.sendBackward();
        break;
      case "bring_to_front":
        canvas.bringToFront(element);
        break;
      case "send_to_back":
        canvas.sendToBack(element);
        break;
      default:
        return { success: false, message: `Unknown layer action: ${action}` };
    }

    canvas.renderAll();
    editor.save();

    return {
      success: true,
      message: `Changed layer order: ${action.replace("_", " ")}`,
    };
  } catch (error) {
    return {
      success: false,
      message: `Error changing layer order: ${error instanceof Error ? error.message : "Unknown error"}`,
    };
  }
}

export async function executeChangeCanvasBackground(
  params: Record<string, unknown>,
  context: ToolContext,
): Promise<ToolResult> {
  const { canvas, editor } = context;
  if (!canvas) {
    return { success: false, message: "Canvas not available" };
  }

  const color = parseColor(params.color as string);

  try {
    const workspace = canvas
      .getObjects()
      .find(
        (obj) => (obj as unknown as { name?: string }).name === "workspace",
      );

    if (workspace) {
      workspace.set({ fill: color });
      canvas.renderAll();
      editor?.save();

      return {
        success: true,
        message: `Changed canvas background to ${color}`,
      };
    }

    return { success: false, message: "Workspace not found" };
  } catch (error) {
    return {
      success: false,
      message: `Error changing background: ${error instanceof Error ? error.message : "Unknown error"}`,
    };
  }
}

export async function executeDuplicateElement(
  params: Record<string, unknown>,
  context: ToolContext,
  canvasIndex?: CanvasIndex,
): Promise<ToolResult> {
  const { canvas, editor } = context;
  if (!canvas) {
    return { success: false, message: "Canvas not available" };
  }

  const elementId = params.elementId as string | undefined;
  const elementQuery = params.elementQuery as string | undefined;
  const offsetX = (params.offsetX as number) || 20;
  const offsetY = (params.offsetY as number) || 20;

  const element = findElement(canvas, elementId, elementQuery, canvasIndex);
  if (!element) {
    return {
      success: false,
      message: `Element not found: ${elementQuery || elementId || "no query provided"}`,
    };
  }

  try {
    return new Promise((resolve) => {
      element.clone((cloned: fabric.Object) => {
        cloned.set({
          left: (element.left || 0) + offsetX,
          top: (element.top || 0) + offsetY,
        });

        canvas.add(cloned);
        canvas.setActiveObject(cloned);
        canvas.renderAll();
        editor?.save();

        resolve({
          success: true,
          message: "Duplicated element",
        });
      });
    });
  } catch (error) {
    return {
      success: false,
      message: `Error duplicating element: ${error instanceof Error ? error.message : "Unknown error"}`,
    };
  }
}

// tool executor map
export const toolExecutors: Record<
  string,
  (
    params: Record<string, unknown>,
    context: ToolContext,
    canvasIndex?: CanvasIndex,
  ) => Promise<ToolResult>
> = {
  spawn_shape: executeSpawnShape,
  add_text: executeAddText,
  move_element: executeMoveElement,
  modify_element: executeModifyElement,
  resize_element: executeResizeElement,
  delete_element: executeDeleteElement,
  select_element: executeSelectElement,
  modify_text: executeModifyText,
  change_layer_order: executeChangeLayerOrder,
  change_canvas_background: executeChangeCanvasBackground,
  duplicate_element: executeDuplicateElement,
};

// execute a tool by name
export async function executeTool(
  toolName: string,
  params: Record<string, unknown>,
  context: ToolContext,
  canvasIndex?: CanvasIndex,
): Promise<ToolResult> {
  const executor = toolExecutors[toolName];
  if (!executor) {
    return { success: false, message: `Unknown tool: ${toolName}` };
  }

  return executor(params, context, canvasIndex);
}
