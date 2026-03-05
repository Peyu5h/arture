// parses raw llm text into structured response

export interface ParsedAIResponse {
  message: string;
  actions: unknown[];
  uiComponentRequest?: {
    id: string;
    componentType: string;
    props: Record<string, unknown>;
    context?: string;
    followUpPrompt?: string;
  };
}

// attempts to fix and parse potentially malformed json from llm output
function tryParseJSON(text: string): Record<string, unknown> | null {
  try {
    let fixed = text.replace(/,\s*([}\]])/g, "$1");

    const openBraces = (fixed.match(/\{/g) || []).length;
    const closeBraces = (fixed.match(/\}/g) || []).length;
    const openBrackets = (fixed.match(/\[/g) || []).length;
    const closeBrackets = (fixed.match(/\]/g) || []).length;

    if (openBrackets > closeBrackets) {
      fixed += "]".repeat(openBrackets - closeBrackets);
    }
    if (openBraces > closeBraces) {
      fixed += "}".repeat(openBraces - closeBraces);
    }

    return JSON.parse(fixed);
  } catch {
    return null;
  }
}

// normalizes spawn_shape payloads to consistent format
function normalizeAction(action: Record<string, unknown>): Record<string, unknown> {
  if (action.type === "spawn_shape" && action.payload) {
    const payload = action.payload as Record<string, unknown>;
    if (!payload.options) {
      const { shapeType, ...rest } = payload;
      return { ...action, payload: { shapeType, options: rest } };
    }
  }
  return action;
}

// extracts ui component request from parsed json
function extractUIComponentRequest(
  parsed: Record<string, unknown>,
): ParsedAIResponse["uiComponentRequest"] | undefined {
  const req = parsed.ui_component_request as Record<string, unknown> | undefined;
  if (!req) return undefined;

  return {
    id: (req.id as string) || `wiz_${Date.now()}`,
    componentType: req.componentType as string,
    props: (req.props as Record<string, unknown>) || {},
    context: req.context as string | undefined,
    followUpPrompt: req.followUpPrompt as string | undefined,
  };
}

export function parseAIResponse(text: string): ParsedAIResponse {
  let message = "I'll help you with that.";
  let actions: unknown[] = [];
  let uiComponentRequest: ParsedAIResponse["uiComponentRequest"] = undefined;

  let cleanText = text.trim();

  // strip markdown code blocks
  const codeBlockMatch = cleanText.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) {
    cleanText = codeBlockMatch[1].trim();
  }

  if (!cleanText.startsWith("{")) {
    return { message: cleanText || message, actions };
  }

  const parsed = tryParseJSON(cleanText);
  if (!parsed) {
    // last resort: extract message from partial json
    const msgMatch = cleanText.match(/"message"\s*:\s*"([^"]+)"/);
    if (msgMatch) message = msgMatch[1];
    return { message, actions };
  }

  if (parsed.message) message = parsed.message as string;

  if (Array.isArray(parsed.actions)) {
    actions = (parsed.actions as Record<string, unknown>[]).map(normalizeAction);
  }

  uiComponentRequest = extractUIComponentRequest(parsed);

  return { message, actions, uiComponentRequest };
}
