import {
  AgentAction,
  ParsedAIResponse,
  ShapeType,
  PositionPreset,
  Position,
} from "./types";

const generateId = () => Math.random().toString(36).substring(2, 9);

// shape type aliases
const SHAPE_ALIASES: Record<string, ShapeType> = {
  rect: "rectangle",
  rectangle: "rectangle",
  square: "rectangle",
  box: "rectangle",
  circle: "circle",
  oval: "circle",
  ellipse: "circle",
  round: "circle",
  triangle: "triangle",
  tri: "triangle",
  diamond: "diamond",
  rhombus: "diamond",
  star: "star",
  hexagon: "hexagon",
  hex: "hexagon",
  pentagon: "pentagon",
  pent: "pentagon",
  heart: "heart",
  octagon: "octagon",
  oct: "octagon",
  line: "line",
  arrow: "arrow",
};

// position aliases
const POSITION_ALIASES: Record<string, PositionPreset> = {
  center: "center",
  middle: "center",
  centered: "center",
  "top-left": "top-left",
  topleft: "top-left",
  "upper-left": "top-left",
  "top left": "top-left",
  "top-center": "top-center",
  topcenter: "top-center",
  top: "top-center",
  "top-right": "top-right",
  topright: "top-right",
  "upper-right": "top-right",
  "top right": "top-right",
  "middle-left": "middle-left",
  middleleft: "middle-left",
  left: "middle-left",
  "middle-right": "middle-right",
  middleright: "middle-right",
  right: "middle-right",
  "bottom-left": "bottom-left",
  bottomleft: "bottom-left",
  "lower-left": "bottom-left",
  "bottom left": "bottom-left",
  "bottom-center": "bottom-center",
  bottomcenter: "bottom-center",
  bottom: "bottom-center",
  "bottom-right": "bottom-right",
  bottomright: "bottom-right",
  "lower-right": "bottom-right",
  "bottom right": "bottom-right",
};

// color name to hex
const COLOR_MAP: Record<string, string> = {
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
  indigo: "#6366f1",
  lime: "#84cc16",
  amber: "#f59e0b",
  emerald: "#10b981",
  rose: "#f43f5e",
  violet: "#8b5cf6",
  sky: "#0ea5e9",
};

// parses color from text
function parseColor(text: string): string | undefined {
  const lower = text.toLowerCase();

  for (const [name, hex] of Object.entries(COLOR_MAP)) {
    if (lower.includes(name)) {
      return hex;
    }
  }

  const hexMatch = text.match(/#[0-9a-fA-F]{3,6}/);
  if (hexMatch) {
    return hexMatch[0];
  }

  return undefined;
}

// parses shape type from text
function parseShapeType(text: string): ShapeType | null {
  const lower = text.toLowerCase();

  for (const [alias, type] of Object.entries(SHAPE_ALIASES)) {
    if (lower.includes(alias)) {
      return type;
    }
  }

  return null;
}

// parses position from text
function parsePosition(text: string): PositionPreset | Position | null {
  const lower = text.toLowerCase();

  for (const [alias, preset] of Object.entries(POSITION_ALIASES)) {
    if (lower.includes(alias)) {
      return preset;
    }
  }

  const coordMatch = text.match(/(\d+)\s*,\s*(\d+)/);
  if (coordMatch) {
    return {
      x: parseInt(coordMatch[1], 10),
      y: parseInt(coordMatch[2], 10),
    };
  }

  return null;
}

// parses size from text
function parseSize(text: string): {
  width?: number;
  height?: number;
  radius?: number;
} {
  const result: { width?: number; height?: number; radius?: number } = {};

  const sizeMatch = text.match(/(\d+)\s*(?:x|by)\s*(\d+)/i);
  if (sizeMatch) {
    result.width = parseInt(sizeMatch[1], 10);
    result.height = parseInt(sizeMatch[2], 10);
    return result;
  }

  const radiusMatch = text.match(/radius\s*(?:of\s*)?(\d+)/i);
  if (radiusMatch) {
    result.radius = parseInt(radiusMatch[1], 10);
    return result;
  }

  const singleMatch = text.match(
    /(\d+)\s*(?:px|pixels?)?(?:\s+(?:wide|tall|big|large|small))?/i,
  );
  if (singleMatch) {
    const size = parseInt(singleMatch[1], 10);
    if (size > 10 && size < 2000) {
      result.width = size;
      result.height = size;
    }
  }

  return result;
}

// checks if message asks for clarification about direction
function needsDirectionClarification(text: string): boolean {
  const movePatterns = [
    /move\s+(?:the\s+)?(?:it|this|that|shape|element|object)/i,
    /put\s+(?:it|this|that)\s+somewhere/i,
    /relocate/i,
    /reposition/i,
  ];

  const hasMove = movePatterns.some((p) => p.test(text));
  const hasDirection = Object.keys(POSITION_ALIASES).some((alias) =>
    text.toLowerCase().includes(alias),
  );

  return hasMove && !hasDirection;
}

// detects spawn intent
function detectSpawnIntent(text: string): {
  detected: boolean;
  shapeType?: ShapeType;
  options?: Record<string, unknown>;
} {
  const spawnPatterns = [
    /(?:create|add|draw|make|spawn|place|put|insert)\s+(?:a\s+)?(?:new\s+)?(\w+)/i,
    /(?:i\s+want|i\s+need|give\s+me)\s+(?:a\s+)?(\w+)/i,
  ];

  for (const pattern of spawnPatterns) {
    const match = text.match(pattern);
    if (match) {
      const shapeType = parseShapeType(match[1]);
      if (shapeType) {
        const color = parseColor(text);
        const position = parsePosition(text);
        const size = parseSize(text);

        return {
          detected: true,
          shapeType,
          options: {
            ...(color && { fill: color }),
            ...(position && { position }),
            ...size,
          },
        };
      }
    }
  }

  const shapeType = parseShapeType(text);
  if (shapeType) {
    const createWords = [
      "create",
      "add",
      "make",
      "draw",
      "spawn",
      "place",
      "put",
      "insert",
      "want",
      "need",
    ];
    const hasCreateWord = createWords.some((w) =>
      text.toLowerCase().includes(w),
    );

    if (hasCreateWord) {
      const color = parseColor(text);
      const position = parsePosition(text);
      const size = parseSize(text);

      return {
        detected: true,
        shapeType,
        options: {
          ...(color && { fill: color }),
          ...(position && { position }),
          ...size,
        },
      };
    }
  }

  return { detected: false };
}

// detects move intent
function detectMoveIntent(text: string): {
  detected: boolean;
  query?: string;
  position?: PositionPreset | Position;
  needsClarification?: boolean;
} {
  const lowerText = text.toLowerCase();

  // first check if there's any position mentioned anywhere in the text
  const globalPosition = parsePosition(text);

  const movePatterns = [
    /move\s+(?:the\s+)?(?:(\w+)|it)\s+(?:to\s+)?(?:the\s+)?(.+)/i,
    /put\s+(?:the\s+)?(?:(\w+)|it)\s+(?:(?:at|in|on|to)\s+)?(?:the\s+)?(.+)/i,
    /place\s+(?:the\s+)?(?:(\w+)|it)\s+(?:(?:at|in|on|to)\s+)?(?:the\s+)?(.+)/i,
    /(?:move|put|place)\s+(?:to\s+)?(?:the\s+)?(.+)/i,
  ];

  for (const pattern of movePatterns) {
    const match = text.match(pattern);
    if (match) {
      // extract element query (default to "selected" if "it" or not specified)
      let query = "selected";
      if (match[1] && match[1].toLowerCase() !== "it") {
        query = match[1];
      }

      // try to get position from the captured group first
      const positionText = match[2] || match[1] || "";
      let position = parsePosition(positionText);

      // if no position found in captured group, use global position from full text
      if (!position && globalPosition) {
        position = globalPosition;
      }

      if (position) {
        return {
          detected: true,
          query,
          position,
        };
      }

      // only ask for clarification if we detected move intent but no position
      return {
        detected: true,
        query,
        needsClarification: true,
      };
    }
  }

  // check for simple "move it" without position
  if (needsDirectionClarification(text)) {
    // but first check if there's a position in the text
    if (globalPosition) {
      return {
        detected: true,
        query: "selected",
        position: globalPosition,
      };
    }
    return {
      detected: true,
      needsClarification: true,
    };
  }

  return { detected: false };
}

// detects modify intent
function detectModifyIntent(text: string): {
  detected: boolean;
  query?: string;
  properties?: Record<string, unknown>;
} {
  const lowerText = text.toLowerCase();
  const properties: Record<string, unknown> = {};
  let query = "selected";
  let detected = false;

  // detect border/stroke changes
  const borderPatterns = [
    /(?:make|set|change)\s+(?:the\s+)?(?:(\w+)\s+)?(?:border|stroke|outline)\s+(?:to\s+)?(\w+)/i,
    /(?:border|stroke|outline)\s+(?:of\s+)?(?:the\s+)?(?:(\w+)\s+)?(?:to\s+)?(\w+)/i,
    /(?:make|change)\s+(?:the\s+)?(?:(\w+)\s+)?(\w+)\s+(?:border|stroke|outline)/i,
  ];

  for (const pattern of borderPatterns) {
    const match = text.match(pattern);
    if (match) {
      const colorText = match[2] || match[1] || "";
      const color = parseColor(colorText) || parseColor(text);
      if (color) {
        properties.stroke = color;
        if (match[1] && !parseColor(match[1])) {
          query = match[1];
        }
        detected = true;
        break;
      }
    }
  }

  // detect fill/color changes
  const fillPatterns = [
    /(?:make|set|change)\s+(?:the\s+)?(?:(\w+)\s+)?(?:color|fill|background)\s+(?:to\s+)?(\w+)/i,
    /(?:make|change)\s+(?:the\s+)?(?:(\w+)\s+)?(\w+)$/i,
    /(?:color|fill)\s+(?:the\s+)?(?:(\w+)\s+)?(?:to\s+)?(\w+)/i,
    /make\s+(?:it|the\s+\w+)\s+(\w+)/i,
  ];

  if (!detected) {
    for (const pattern of fillPatterns) {
      const match = text.match(pattern);
      if (match) {
        const colorText = match[2] || match[1] || "";
        const color = parseColor(colorText) || parseColor(text);
        if (color) {
          properties.fill = color;
          if (match[1] && !parseColor(match[1])) {
            query = match[1];
          }
          detected = true;
          break;
        }
      }
    }
  }

  // detect opacity changes
  const opacityMatch = text.match(
    /(?:opacity|transparency)\s+(?:to\s+)?(\d+)/i,
  );
  if (opacityMatch) {
    const opacity = parseInt(opacityMatch[1], 10);
    properties.opacity = opacity > 1 ? opacity / 100 : opacity;
    detected = true;
  }

  if (detected) {
    return { detected, query, properties };
  }

  return { detected: false };
}

// detects resize intent
function detectResizeIntent(text: string): {
  detected: boolean;
  query?: string;
  options?: {
    width?: number;
    height?: number;
    scale?: number;
    increaseBy?: number;
    decreaseBy?: number;
  };
} {
  const lowerText = text.toLowerCase();

  // detect increase/decrease by amount
  const increaseMatch = text.match(
    /(?:increase|enlarge|grow|bigger|expand)\s+(?:the\s+)?(?:(\w+)\s+)?(?:size\s+)?(?:by\s+)?(\d+)/i,
  );
  if (increaseMatch) {
    return {
      detected: true,
      query: increaseMatch[1] || "selected",
      options: { increaseBy: parseInt(increaseMatch[2], 10) },
    };
  }

  const decreaseMatch = text.match(
    /(?:decrease|shrink|reduce|smaller)\s+(?:the\s+)?(?:(\w+)\s+)?(?:size\s+)?(?:by\s+)?(\d+)/i,
  );
  if (decreaseMatch) {
    return {
      detected: true,
      query: decreaseMatch[1] || "selected",
      options: { decreaseBy: parseInt(decreaseMatch[2], 10) },
    };
  }

  // detect scale
  const scaleMatch = text.match(
    /(?:scale|resize)\s+(?:the\s+)?(?:(\w+)\s+)?(?:to\s+|by\s+)?(\d+(?:\.\d+)?)/i,
  );
  if (scaleMatch) {
    const scaleValue = parseFloat(scaleMatch[2]);
    return {
      detected: true,
      query: scaleMatch[1] || "selected",
      options: { scale: scaleValue > 10 ? scaleValue / 100 : scaleValue },
    };
  }

  // detect width/height
  const sizeMatch = text.match(
    /(?:set|make|change)\s+(?:the\s+)?(?:(\w+)\s+)?(?:width|height|size)\s+(?:to\s+)?(\d+)/i,
  );
  if (sizeMatch) {
    const size = parseInt(sizeMatch[2], 10);
    const isWidth = lowerText.includes("width");
    const isHeight = lowerText.includes("height");
    return {
      detected: true,
      query: sizeMatch[1] || "selected",
      options: {
        ...(isWidth && { width: size }),
        ...(isHeight && { height: size }),
        ...(!isWidth && !isHeight && { width: size, height: size }),
      },
    };
  }

  // detect simple "make bigger/smaller"
  if (
    lowerText.includes("bigger") ||
    lowerText.includes("larger") ||
    lowerText.includes("enlarge")
  ) {
    return {
      detected: true,
      query: "selected",
      options: { increaseBy: 50 },
    };
  }

  if (
    lowerText.includes("smaller") ||
    lowerText.includes("shrink") ||
    lowerText.includes("reduce")
  ) {
    return {
      detected: true,
      query: "selected",
      options: { decreaseBy: 50 },
    };
  }

  return { detected: false };
}

// detects delete intent
function detectDeleteIntent(text: string): {
  detected: boolean;
  query?: string;
} {
  const deletePatterns = [
    /(?:delete|remove|erase|clear)\s+(?:the\s+)?(\w+)/i,
    /(?:get\s+rid\s+of)\s+(?:the\s+)?(\w+)/i,
  ];

  for (const pattern of deletePatterns) {
    const match = text.match(pattern);
    if (match) {
      return {
        detected: true,
        query: match[1] || "selected",
      };
    }
  }

  return { detected: false };
}

// parses user message for intents
export function parseUserMessage(message: string): AgentAction[] {
  const actions: AgentAction[] = [];

  const spawn = detectSpawnIntent(message);
  if (spawn.detected && spawn.shapeType) {
    actions.push({
      id: generateId(),
      type: "spawn_shape",
      description: `Create ${spawn.shapeType}`,
      payload: {
        shapeType: spawn.shapeType,
        options: spawn.options,
      },
    });
  }

  const move = detectMoveIntent(message);
  if (move.detected) {
    if (move.needsClarification) {
      actions.push({
        id: generateId(),
        type: "ask_clarification",
        description: "Need position clarification",
        payload: {
          question:
            "Where would you like me to move it? (e.g., center, top-left, bottom-right)",
          options: [
            "center",
            "top-left",
            "top-right",
            "bottom-left",
            "bottom-right",
          ],
        },
      });
    } else if (move.position) {
      actions.push({
        id: generateId(),
        type: "move_element",
        description: `Move to ${JSON.stringify(move.position)}`,
        payload: {
          elementQuery: move.query,
          position: move.position,
        },
      });
    }
  }

  const modify = detectModifyIntent(message);
  if (modify.detected && modify.properties) {
    actions.push({
      id: generateId(),
      type: "modify_element",
      description: "Modify element",
      payload: {
        elementQuery: modify.query,
        properties: modify.properties,
      },
    });
  }

  const resize = detectResizeIntent(message);
  if (resize.detected && resize.options) {
    actions.push({
      id: generateId(),
      type: "resize_element",
      description: "Resize element",
      payload: {
        elementQuery: resize.query,
        ...resize.options,
      },
    });
  }

  const del = detectDeleteIntent(message);
  if (del.detected) {
    actions.push({
      id: generateId(),
      type: "delete_element",
      description: "Delete element",
      payload: {
        elementQuery: del.query,
      },
    });
  }

  return actions;
}

// parses AI response for actions in JSON format
export function parseAIResponse(response: string): ParsedAIResponse {
  const result: ParsedAIResponse = {
    message: response,
    actions: [],
    requiresClarification: false,
  };

  const jsonMatch = response.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[1]);
      if (parsed.actions && Array.isArray(parsed.actions)) {
        result.actions = parsed.actions.map((a: unknown) => ({
          id: generateId(),
          ...(a as object),
        }));
      }
      if (parsed.message) {
        result.message = parsed.message;
      }
    } catch {
      // json parse failed, use original message
    }
  }

  const actionMatch = response.match(/\[ACTION:(\w+)\s*({.*?})\]/);
  if (actionMatch) {
    try {
      const actionType = actionMatch[1];
      const payload = JSON.parse(actionMatch[2]);
      result.actions.push({
        id: generateId(),
        type: actionType as AgentAction["type"],
        description: `Parsed action: ${actionType}`,
        payload,
      } as AgentAction);
    } catch {
      // action parse failed
    }
  }

  for (const action of result.actions) {
    if (action.type === "ask_clarification") {
      result.requiresClarification = true;
      const payload = action.payload as { question?: string } | undefined;
      result.clarificationQuestion = payload?.question;
      break;
    }
  }

  return result;
}

// combined parser for both user and AI messages
export function parseMessage(
  message: string,
  isUserMessage: boolean,
): ParsedAIResponse {
  if (isUserMessage) {
    const actions = parseUserMessage(message);
    return {
      message,
      actions,
      requiresClarification: actions.some(
        (a) => a.type === "ask_clarification",
      ),
      clarificationQuestion: (
        actions.find((a) => a.type === "ask_clarification")?.payload as
          | { question?: string }
          | undefined
      )?.question,
    };
  }

  return parseAIResponse(message);
}
