// json schemas for ai function calling (openai/gemini compatible)

import { FunctionSchema } from "./types";

// canvas manipulation tools
export const spawnShapeSchema: FunctionSchema = {
  name: "spawn_shape",
  description: "Create and add a new shape to the canvas",
  parameters: {
    type: "object",
    properties: {
      shapeType: {
        type: "string",
        description: "The type of shape to create",
        enum: [
          "rectangle",
          "circle",
          "triangle",
          "diamond",
          "star",
          "hexagon",
          "pentagon",
          "heart",
          "octagon",
          "line",
          "arrow",
        ],
      },
      fill: {
        type: "string",
        description: "Fill color in hex format (e.g., #ff0000)",
      },
      stroke: {
        type: "string",
        description: "Stroke/border color in hex format",
      },
      strokeWidth: {
        type: "number",
        description: "Width of the stroke/border in pixels",
      },
      width: {
        type: "number",
        description: "Width of the shape in pixels",
      },
      height: {
        type: "number",
        description: "Height of the shape in pixels",
      },
      position: {
        type: "string",
        description: "Position preset for placement",
        enum: [
          "center",
          "top-left",
          "top-center",
          "top-right",
          "middle-left",
          "middle-right",
          "bottom-left",
          "bottom-center",
          "bottom-right",
        ],
      },
    },
    required: ["shapeType"],
  },
};

export const addTextSchema: FunctionSchema = {
  name: "add_text",
  description: "Add text to the canvas",
  parameters: {
    type: "object",
    properties: {
      text: {
        type: "string",
        description: "The text content to add",
      },
      fontSize: {
        type: "number",
        description: "Font size in pixels",
        default: 32,
      },
      fontFamily: {
        type: "string",
        description: "Font family name",
        default: "Arial",
      },
      fontWeight: {
        type: "number",
        description: "Font weight (100-900)",
        default: 400,
      },
      fill: {
        type: "string",
        description: "Text color in hex format",
        default: "#000000",
      },
      position: {
        type: "string",
        description: "Position preset for placement",
        enum: [
          "center",
          "top-left",
          "top-center",
          "top-right",
          "middle-left",
          "middle-right",
          "bottom-left",
          "bottom-center",
          "bottom-right",
        ],
      },
    },
    required: ["text"],
  },
};

export const moveElementSchema: FunctionSchema = {
  name: "move_element",
  description: "Move an element to a new position on the canvas",
  parameters: {
    type: "object",
    properties: {
      elementId: {
        type: "string",
        description: "The unique ID of the element to move",
      },
      elementQuery: {
        type: "string",
        description:
          "Query to find the element (e.g., 'selected', 'rectangle', 'the blue circle')",
      },
      position: {
        type: "string",
        description: "Position preset or coordinates",
        enum: [
          "center",
          "top-left",
          "top-center",
          "top-right",
          "middle-left",
          "middle-right",
          "bottom-left",
          "bottom-center",
          "bottom-right",
        ],
      },
      x: {
        type: "number",
        description: "X coordinate in pixels (alternative to position preset)",
      },
      y: {
        type: "number",
        description: "Y coordinate in pixels (alternative to position preset)",
      },
    },
    required: ["position"],
  },
};

export const modifyElementSchema: FunctionSchema = {
  name: "modify_element",
  description: "Modify properties of an existing element",
  parameters: {
    type: "object",
    properties: {
      elementId: {
        type: "string",
        description: "The unique ID of the element to modify",
      },
      elementQuery: {
        type: "string",
        description:
          "Query to find the element (e.g., 'selected', 'rectangle', 'heading text')",
      },
      fill: {
        type: "string",
        description: "New fill color in hex format",
      },
      stroke: {
        type: "string",
        description: "New stroke/border color in hex format",
      },
      strokeWidth: {
        type: "number",
        description: "New stroke width in pixels",
      },
      opacity: {
        type: "number",
        description: "Opacity value between 0 and 1",
      },
      angle: {
        type: "number",
        description: "Rotation angle in degrees",
      },
    },
    required: [],
  },
};

export const resizeElementSchema: FunctionSchema = {
  name: "resize_element",
  description: "Resize an element on the canvas",
  parameters: {
    type: "object",
    properties: {
      elementId: {
        type: "string",
        description: "The unique ID of the element to resize",
      },
      elementQuery: {
        type: "string",
        description: "Query to find the element",
      },
      width: {
        type: "number",
        description: "New width in pixels",
      },
      height: {
        type: "number",
        description: "New height in pixels",
      },
      scale: {
        type: "number",
        description: "Scale factor (e.g., 1.5 for 150%)",
      },
      increaseBy: {
        type: "number",
        description: "Increase size by this many pixels",
      },
      decreaseBy: {
        type: "number",
        description: "Decrease size by this many pixels",
      },
    },
    required: [],
  },
};

export const deleteElementSchema: FunctionSchema = {
  name: "delete_element",
  description: "Delete an element from the canvas",
  parameters: {
    type: "object",
    properties: {
      elementId: {
        type: "string",
        description: "The unique ID of the element to delete",
      },
      elementQuery: {
        type: "string",
        description:
          "Query to find the element (e.g., 'selected', 'the red rectangle')",
      },
    },
    required: [],
  },
};

export const selectElementSchema: FunctionSchema = {
  name: "select_element",
  description: "Select an element on the canvas",
  parameters: {
    type: "object",
    properties: {
      elementId: {
        type: "string",
        description: "The unique ID of the element to select",
      },
      elementQuery: {
        type: "string",
        description: "Query to find the element",
      },
    },
    required: [],
  },
};

// text modification tools
export const modifyTextSchema: FunctionSchema = {
  name: "modify_text",
  description: "Modify text properties of a text element",
  parameters: {
    type: "object",
    properties: {
      elementId: {
        type: "string",
        description: "The unique ID of the text element",
      },
      elementQuery: {
        type: "string",
        description: "Query to find the text element",
      },
      text: {
        type: "string",
        description: "New text content",
      },
      fontSize: {
        type: "number",
        description: "New font size in pixels",
      },
      fontFamily: {
        type: "string",
        description: "New font family",
      },
      fontWeight: {
        type: "number",
        description: "New font weight (100-900)",
      },
      textAlign: {
        type: "string",
        description: "Text alignment",
        enum: ["left", "center", "right"],
      },
      underline: {
        type: "boolean",
        description: "Whether text should be underlined",
      },
      linethrough: {
        type: "boolean",
        description: "Whether text should have strikethrough",
      },
      italic: {
        type: "boolean",
        description: "Whether text should be italic",
      },
    },
    required: [],
  },
};

// asset search tools
export const searchImagesSchema: FunctionSchema = {
  name: "search_images",
  description:
    "Search for images from stock photo libraries (Pixabay, Pexels)",
  parameters: {
    type: "object",
    properties: {
      query: {
        type: "string",
        description: "Search query for images (e.g., 'cat', 'sunset beach')",
      },
      source: {
        type: "string",
        description: "Which image source to search",
        enum: ["pixabay", "pexels", "all"],
        default: "all",
      },
      imageType: {
        type: "string",
        description: "Type of images to search for",
        enum: ["all", "photo", "illustration", "vector"],
        default: "all",
      },
      count: {
        type: "number",
        description: "Number of results to return (max 10)",
        default: 5,
      },
    },
    required: ["query"],
  },
};

export const addImageToCanvasSchema: FunctionSchema = {
  name: "add_image_to_canvas",
  description: "Add an image to the canvas from a URL",
  parameters: {
    type: "object",
    properties: {
      url: {
        type: "string",
        description: "URL of the image to add",
      },
      position: {
        type: "string",
        description: "Position preset for placement",
        enum: [
          "center",
          "top-left",
          "top-center",
          "top-right",
          "middle-left",
          "middle-right",
          "bottom-left",
          "bottom-center",
          "bottom-right",
        ],
        default: "center",
      },
      width: {
        type: "number",
        description: "Desired width in pixels (maintains aspect ratio)",
      },
      height: {
        type: "number",
        description: "Desired height in pixels (maintains aspect ratio)",
      },
    },
    required: ["url"],
  },
};

export const searchIllustrationsSchema: FunctionSchema = {
  name: "search_illustrations",
  description: "Search for vector illustrations",
  parameters: {
    type: "object",
    properties: {
      query: {
        type: "string",
        description: "Search query for illustrations",
      },
      count: {
        type: "number",
        description: "Number of results to return (max 10)",
        default: 5,
      },
    },
    required: ["query"],
  },
};

// smart tools
export const removeBackgroundSchema: FunctionSchema = {
  name: "remove_background",
  description: "Remove the background from an image element on the canvas",
  parameters: {
    type: "object",
    properties: {
      elementId: {
        type: "string",
        description: "The unique ID of the image element",
      },
      elementQuery: {
        type: "string",
        description:
          "Query to find the image element (e.g., 'selected', 'the photo', 'car image')",
      },
    },
    required: [],
  },
};

// layer tools
export const changeLayerOrderSchema: FunctionSchema = {
  name: "change_layer_order",
  description: "Change the layer order of an element (bring forward/send backward)",
  parameters: {
    type: "object",
    properties: {
      elementId: {
        type: "string",
        description: "The unique ID of the element",
      },
      elementQuery: {
        type: "string",
        description: "Query to find the element",
      },
      action: {
        type: "string",
        description: "Layer action to perform",
        enum: ["bring_forward", "send_backward", "bring_to_front", "send_to_back"],
      },
    },
    required: ["action"],
  },
};

// canvas tools
export const changeCanvasBackgroundSchema: FunctionSchema = {
  name: "change_canvas_background",
  description: "Change the background color of the canvas/workspace",
  parameters: {
    type: "object",
    properties: {
      color: {
        type: "string",
        description: "Background color in hex format (e.g., #ffffff)",
      },
    },
    required: ["color"],
  },
};

// duplicate tool
export const duplicateElementSchema: FunctionSchema = {
  name: "duplicate_element",
  description: "Duplicate an element on the canvas",
  parameters: {
    type: "object",
    properties: {
      elementId: {
        type: "string",
        description: "The unique ID of the element to duplicate",
      },
      elementQuery: {
        type: "string",
        description: "Query to find the element",
      },
      offsetX: {
        type: "number",
        description: "Horizontal offset for the duplicate (default 20)",
        default: 20,
      },
      offsetY: {
        type: "number",
        description: "Vertical offset for the duplicate (default 20)",
        default: 20,
      },
    },
    required: [],
  },
};

// all tool schemas
export const allToolSchemas: FunctionSchema[] = [
  spawnShapeSchema,
  addTextSchema,
  moveElementSchema,
  modifyElementSchema,
  resizeElementSchema,
  deleteElementSchema,
  selectElementSchema,
  modifyTextSchema,
  searchImagesSchema,
  addImageToCanvasSchema,
  searchIllustrationsSchema,
  removeBackgroundSchema,
  changeLayerOrderSchema,
  changeCanvasBackgroundSchema,
  duplicateElementSchema,
];

// get schemas by category
export const canvasToolSchemas: FunctionSchema[] = [
  spawnShapeSchema,
  addTextSchema,
  moveElementSchema,
  modifyElementSchema,
  resizeElementSchema,
  deleteElementSchema,
  selectElementSchema,
  modifyTextSchema,
  changeLayerOrderSchema,
  changeCanvasBackgroundSchema,
  duplicateElementSchema,
];

export const assetToolSchemas: FunctionSchema[] = [
  searchImagesSchema,
  addImageToCanvasSchema,
  searchIllustrationsSchema,
];

export const smartToolSchemas: FunctionSchema[] = [removeBackgroundSchema];

// generate schema description for system prompt
export function generateToolsDescription(): string {
  const sections: string[] = [];

  sections.push("## Available Tools\n");

  sections.push("### Canvas Manipulation");
  sections.push("- spawn_shape: Create shapes (rectangle, circle, triangle, etc.)");
  sections.push("- add_text: Add text with customizable font properties");
  sections.push("- move_element: Move elements to positions");
  sections.push("- modify_element: Change fill, stroke, opacity, angle");
  sections.push("- resize_element: Resize by pixels, scale, or dimensions");
  sections.push("- delete_element: Remove elements from canvas");
  sections.push("- select_element: Select an element");
  sections.push("- modify_text: Change text content and styling");
  sections.push("- change_layer_order: Bring forward/send backward");
  sections.push("- change_canvas_background: Set workspace background color");
  sections.push("- duplicate_element: Copy an element\n");

  sections.push("### Asset Search & Import");
  sections.push("- search_images: Search Pixabay/Pexels for photos");
  sections.push("- add_image_to_canvas: Add image from URL to canvas");
  sections.push("- search_illustrations: Find vector illustrations\n");

  sections.push("### Smart Tools");
  sections.push("- remove_background: AI-powered background removal from images\n");

  return sections.join("\n");
}

// convert schemas to gemini function declarations format
export function toGeminiFunctionDeclarations() {
  return allToolSchemas.map((schema) => ({
    name: schema.name,
    description: schema.description,
    parameters: schema.parameters,
  }));
}
