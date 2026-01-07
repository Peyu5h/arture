// calculates approximate token count for context
export interface ContextStats {
  totalTokens: number;
  formattedTokens: string;
  elementTokens: number;
  messageTokens: number;
  mentionTokens: number;
  systemPromptTokens: number;
}

// system prompt base overhead (approximate)
const SYSTEM_PROMPT_BASE_TOKENS = 450;

// rough token estimation (1 token ≈ 3.5 chars for mixed content)
function estimateTokens(text: string): number {
  if (!text || typeof text !== "string") return 0;
  // use 3.5 chars per token for more accurate estimation with code/JSON
  return Math.ceil(text.length / 3.5);
}

// safely convert any value to string for token estimation
function safeStringify(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  if (typeof value === "object") {
    try {
      return JSON.stringify(value);
    } catch {
      return "[object]";
    }
  }
  return String(value);
}

// formats token count to readable format (e.g., 5k, 12.5k)
export function formatTokenCount(tokens: number): string {
  if (
    tokens === null ||
    tokens === undefined ||
    isNaN(tokens) ||
    !isFinite(tokens)
  ) {
    return "0";
  }
  if (tokens < 1000) return tokens.toString();
  if (tokens < 10000) return (tokens / 1000).toFixed(1) + "k";
  return Math.round(tokens / 1000) + "k";
}

// calculates tokens for a canvas element with full detail
function calculateElementTokens(element: Record<string, unknown>): number {
  if (!element || typeof element !== "object") return 0;

  let tokens = 0;

  // element type and id
  tokens += estimateTokens(safeStringify(element.type));
  tokens += estimateTokens(safeStringify(element.id));

  // text content
  if (element.text) {
    tokens += estimateTokens(safeStringify(element.text));
  }

  // position - including actual values sent to AI
  const left =
    element.left !== undefined ? Math.round(Number(element.left)) : 0;
  const top = element.top !== undefined ? Math.round(Number(element.top)) : 0;
  tokens += estimateTokens(`position=(${left},${top})`);

  // dimensions - calculate actual size with scale
  const width = Math.round(
    (Number(element.width) || 100) * (Number(element.scaleX) || 1),
  );
  const height = Math.round(
    (Number(element.height) || 100) * (Number(element.scaleY) || 1),
  );
  tokens += estimateTokens(`size=${width}x${height}px`);

  // style properties - safely serialize
  if (element.fill) {
    const fillStr =
      typeof element.fill === "string" ? element.fill : "gradient";
    tokens += estimateTokens(`fill=${fillStr}`);
  }
  if (element.stroke) {
    const strokeStr =
      typeof element.stroke === "string" ? element.stroke : "gradient";
    tokens += estimateTokens(`stroke=${strokeStr}`);
  }
  if (element.fontFamily) {
    tokens += estimateTokens(safeStringify(element.fontFamily));
  }

  // overhead for formatting in context
  tokens += 15;

  // image source (abbreviated)
  if (element.src) {
    tokens += 50; // fixed cost for image reference
  }

  // name if exists
  if (element.name) {
    tokens += estimateTokens(safeStringify(element.name));
  }

  return tokens;
}

// calculates tokens for chat messages
function calculateMessageTokens(
  messages: Array<{ content: string; role: string }>,
): number {
  if (!messages || !Array.isArray(messages)) return 0;

  let tokens = 0;
  for (const msg of messages) {
    if (msg && msg.content) {
      tokens += estimateTokens(safeStringify(msg.content));
      tokens += 4; // role marker
    }
  }
  return tokens;
}

// calculates tokens for mentions/references
function calculateMentionTokens(
  mentions: Array<{ type: string; label: string; data?: unknown }>,
): number {
  if (!mentions || !Array.isArray(mentions)) return 0;

  let tokens = 0;
  for (const mention of mentions) {
    if (!mention) continue;
    tokens += estimateTokens(safeStringify(mention.label));
    tokens += estimateTokens(safeStringify(mention.type));
    if (mention.data) {
      const dataStr = safeStringify(mention.data);
      tokens += estimateTokens(dataStr.slice(0, 200));
    }
  }
  return tokens;
}

export interface CalculateContextInput {
  elements?: Array<Record<string, unknown>>;
  messages?: Array<{ content: string; role: string }>;
  mentions?: Array<{ type: string; label: string; data?: unknown }>;
  canvasBackground?: string;
  canvasSize?: { width: number; height: number };
}

// main function to calculate total context
export function calculateContext(input: CalculateContextInput): ContextStats {
  if (!input) {
    return {
      totalTokens: 0,
      formattedTokens: "0",
      elementTokens: 0,
      messageTokens: 0,
      mentionTokens: 0,
      systemPromptTokens: 0,
    };
  }

  const elementTokens =
    input.elements && Array.isArray(input.elements)
      ? input.elements.reduce((sum, el) => sum + calculateElementTokens(el), 0)
      : 0;

  const messageTokens =
    input.messages && Array.isArray(input.messages)
      ? calculateMessageTokens(input.messages)
      : 0;

  const mentionTokens =
    input.mentions && Array.isArray(input.mentions)
      ? calculateMentionTokens(input.mentions)
      : 0;

  // canvas metadata
  let metadataTokens = 0;
  if (input.canvasBackground) {
    const bgStr =
      typeof input.canvasBackground === "string"
        ? input.canvasBackground
        : "gradient";
    metadataTokens += estimateTokens(`Background: ${bgStr}`);
  }
  if (input.canvasSize) {
    metadataTokens += estimateTokens(
      `Canvas: ${input.canvasSize.width}x${input.canvasSize.height}px`,
    );
  }

  // include system prompt overhead
  const systemPromptTokens = SYSTEM_PROMPT_BASE_TOKENS;

  const totalTokens =
    elementTokens +
    messageTokens +
    mentionTokens +
    metadataTokens +
    systemPromptTokens;

  return {
    totalTokens: totalTokens || 0,
    formattedTokens: formatTokenCount(totalTokens || 0),
    elementTokens: elementTokens || 0,
    messageTokens: messageTokens || 0,
    mentionTokens: mentionTokens || 0,
    systemPromptTokens,
  };
}

// extracts minimal context from canvas elements
export function extractElementContext(
  element: Record<string, unknown>,
): Record<string, unknown> {
  if (!element || typeof element !== "object") {
    return { type: "unknown", id: "unknown" };
  }

  const context: Record<string, unknown> = {
    type: element.type || "unknown",
    id: element.id || "unknown",
  };

  // position - safely round numbers
  if (element.left !== undefined && typeof element.left === "number") {
    context.left = Math.round(element.left);
  }
  if (element.top !== undefined && typeof element.top === "number") {
    context.top = Math.round(element.top);
  }
  if (element.width !== undefined && typeof element.width === "number") {
    context.width = Math.round(element.width);
  }
  if (element.height !== undefined && typeof element.height === "number") {
    context.height = Math.round(element.height);
  }

  // text specific
  if (element.text && typeof element.text === "string") {
    context.text = element.text;
    if (element.fontFamily) context.fontFamily = String(element.fontFamily);
    if (element.fontSize) context.fontSize = element.fontSize;
  }

  // style - safely serialize fills/strokes (could be gradients)
  if (element.fill) {
    context.fill = typeof element.fill === "string" ? element.fill : "gradient";
  }
  if (element.stroke) {
    context.stroke =
      typeof element.stroke === "string" ? element.stroke : "gradient";
  }

  // image specific
  if (element.src) {
    const src = String(element.src);
    // extract image name from url if possible
    const match = src.match(/\/([^/]+)\.(jpg|jpeg|png|gif|webp)/i);
    context.imageName = match ? match[1] : "image";
    context.hasImage = true;
  }

  // custom name if set
  if (element.name) context.name = String(element.name);

  return context;
}

// generates a context summary for AI
export function generateContextSummary(
  elements: Array<Record<string, unknown>>,
  canvasSize: { width: number; height: number },
  backgroundColor: string,
): string {
  const textElements = elements.filter(
    (el) => el.type === "textbox" || el.type === "text" || el.type === "i-text",
  );
  const imageElements = elements.filter((el) => el.type === "image");
  const shapeElements = elements.filter((el) =>
    ["rect", "circle", "triangle", "polygon", "path"].includes(String(el.type)),
  );

  const parts: string[] = [
    `Canvas: ${canvasSize.width}x${canvasSize.height}, bg: ${backgroundColor}`,
  ];

  if (textElements.length > 0) {
    const texts = textElements
      .map((el) => `"${String(el.text || "").slice(0, 30)}"`)
      .slice(0, 5);
    parts.push(`Text (${textElements.length}): ${texts.join(", ")}`);
  }

  if (imageElements.length > 0) {
    parts.push(`Images: ${imageElements.length}`);
  }

  if (shapeElements.length > 0) {
    parts.push(`Shapes: ${shapeElements.length}`);
  }

  return parts.join(" | ");
}
