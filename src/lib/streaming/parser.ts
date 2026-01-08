// incremental json parser for streaming ai responses

export interface ParsedAction {
  id: string;
  type: string;
  payload: Record<string, unknown>;
  description?: string;
}

export interface ParsedChunk {
  message?: string;
  actions?: ParsedAction[];
  isComplete: boolean;
  rawText: string;
}

export interface ParserState {
  buffer: string;
  extractedActions: ParsedAction[];
  extractedMessage: string;
  braceCount: number;
  bracketCount: number;
  inString: boolean;
  escapeNext: boolean;
  lastCompleteIndex: number;
}

// creates initial parser state
export function createParserState(): ParserState {
  return {
    buffer: "",
    extractedActions: [],
    extractedMessage: "",
    braceCount: 0,
    bracketCount: 0,
    inString: false,
    escapeNext: false,
    lastCompleteIndex: 0,
  };
}

// generates unique action id
function generateActionId(): string {
  return `act_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

// finds balanced json objects in text
function findBalancedJson(text: string): { json: string; endIndex: number } | null {
  let braceCount = 0;
  let bracketCount = 0;
  let inString = false;
  let escapeNext = false;
  let startIndex = -1;
  let startChar = "";

  for (let i = 0; i < text.length; i++) {
    const char = text[i];

    if (escapeNext) {
      escapeNext = false;
      continue;
    }

    if (char === "\\") {
      escapeNext = true;
      continue;
    }

    if (char === '"' && !escapeNext) {
      inString = !inString;
      continue;
    }

    if (inString) continue;

    if (char === "{") {
      if (startIndex === -1) {
        startIndex = i;
        startChar = "{";
      }
      braceCount++;
    } else if (char === "}") {
      braceCount--;
      if (braceCount === 0 && startChar === "{" && bracketCount === 0) {
        return {
          json: text.slice(startIndex, i + 1),
          endIndex: i + 1,
        };
      }
    } else if (char === "[") {
      if (startIndex === -1) {
        startIndex = i;
        startChar = "[";
      }
      bracketCount++;
    } else if (char === "]") {
      bracketCount--;
      if (bracketCount === 0 && startChar === "[" && braceCount === 0) {
        return {
          json: text.slice(startIndex, i + 1),
          endIndex: i + 1,
        };
      }
    }
  }

  return null;
}

// tries to parse json with fixes for common issues
function tryParseJson(jsonStr: string): Record<string, unknown> | null {
  try {
    return JSON.parse(jsonStr);
  } catch {
    // try fixing common issues
    let fixed = jsonStr.trim();

    // remove trailing commas
    fixed = fixed.replace(/,\s*([}\]])/g, "$1");

    // balance braces
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

    try {
      return JSON.parse(fixed);
    } catch {
      return null;
    }
  }
}

// extracts actions array from parsed object
function extractActions(parsed: Record<string, unknown>): ParsedAction[] {
  const actions: ParsedAction[] = [];

  if (Array.isArray(parsed.actions)) {
    for (const action of parsed.actions) {
      if (action && typeof action === "object" && "type" in action) {
        const a = action as Record<string, unknown>;
        actions.push({
          id: (a.id as string) || generateActionId(),
          type: a.type as string,
          payload: (a.payload as Record<string, unknown>) || {},
          description: a.description as string | undefined,
        });
      }
    }
  }

  return actions;
}

// extracts message from parsed object
function extractMessage(parsed: Record<string, unknown>): string {
  if (typeof parsed.message === "string") {
    return parsed.message;
  }
  if (typeof parsed.response === "string") {
    return parsed.response;
  }
  if (typeof parsed.content === "string") {
    return parsed.content;
  }
  return "";
}

// processes a chunk of streaming text
export function processChunk(
  state: ParserState,
  chunk: string,
): { state: ParserState; newActions: ParsedAction[]; newMessage: string } {
  state.buffer += chunk;
  const newActions: ParsedAction[] = [];
  let newMessage = "";

  // look for complete json in buffer
  const result = findBalancedJson(state.buffer);

  if (result) {
    const parsed = tryParseJson(result.json);

    if (parsed) {
      // extract actions
      const actions = extractActions(parsed);
      for (const action of actions) {
        if (!state.extractedActions.find((a) => a.id === action.id)) {
          state.extractedActions.push(action);
          newActions.push(action);
        }
      }

      // extract message
      const message = extractMessage(parsed);
      if (message && message !== state.extractedMessage) {
        newMessage = message.slice(state.extractedMessage.length);
        state.extractedMessage = message;
      }

      // update buffer to remove processed json
      state.buffer = state.buffer.slice(result.endIndex);
      state.lastCompleteIndex = 0;
    }
  }

  // try to extract partial message from incomplete json
  if (!newMessage && state.buffer.length > 0) {
    const messageMatch = state.buffer.match(/"message"\s*:\s*"([^"]*)/);
    if (messageMatch && messageMatch[1]) {
      const partialMessage = messageMatch[1];
      if (partialMessage.length > state.extractedMessage.length) {
        newMessage = partialMessage.slice(state.extractedMessage.length);
        state.extractedMessage = partialMessage;
      }
    }
  }

  return { state, newActions, newMessage };
}

// tries to extract complete actions from partial json
export function extractPartialActions(text: string): ParsedAction[] {
  const actions: ParsedAction[] = [];

  // look for action patterns
  const actionPattern = /\{\s*"(?:id|type)"\s*:\s*"[^"]+"/g;
  let match;

  while ((match = actionPattern.exec(text)) !== null) {
    const startIndex = match.index;
    let braceCount = 0;
    let endIndex = startIndex;

    for (let i = startIndex; i < text.length; i++) {
      if (text[i] === "{") braceCount++;
      if (text[i] === "}") {
        braceCount--;
        if (braceCount === 0) {
          endIndex = i + 1;
          break;
        }
      }
    }

    if (endIndex > startIndex) {
      const actionJson = text.slice(startIndex, endIndex);
      const parsed = tryParseJson(actionJson);

      if (parsed && parsed.type && typeof parsed.type === "string") {
        actions.push({
          id: (parsed.id as string) || generateActionId(),
          type: parsed.type as string,
          payload: (parsed.payload as Record<string, unknown>) || {},
          description: parsed.description as string | undefined,
        });
      }
    }
  }

  return actions;
}

// parses complete response text
export function parseCompleteResponse(text: string): ParsedChunk {
  let cleanText = text.trim();

  // remove markdown code blocks
  const codeBlockMatch = cleanText.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) {
    cleanText = codeBlockMatch[1].trim();
  }

  // try to find and parse json
  const result = findBalancedJson(cleanText);

  if (result) {
    const parsed = tryParseJson(result.json);

    if (parsed) {
      return {
        message: extractMessage(parsed),
        actions: extractActions(parsed),
        isComplete: true,
        rawText: text,
      };
    }
  }

  // fallback: try to extract actions from raw text
  const actions = extractPartialActions(cleanText);

  // extract message as non-json text
  let message = cleanText
    .replace(/```(?:json)?[\s\S]*$/g, "")
    .replace(/\{[\s\S]*$/g, "")
    .trim();

  if (!message || message.length < 5) {
    message = text;
  }

  return {
    message,
    actions: actions.length > 0 ? actions : undefined,
    isComplete: true,
    rawText: text,
  };
}

// finalizes parser state and returns all extracted data
export function finalizeParser(state: ParserState): ParsedChunk {
  // try to parse any remaining buffer
  if (state.buffer.trim()) {
    const result = parseCompleteResponse(state.buffer);

    if (result.actions) {
      for (const action of result.actions) {
        if (!state.extractedActions.find((a) => a.id === action.id)) {
          state.extractedActions.push(action);
        }
      }
    }

    if (result.message && result.message.length > state.extractedMessage.length) {
      state.extractedMessage = result.message;
    }
  }

  return {
    message: state.extractedMessage,
    actions: state.extractedActions.length > 0 ? state.extractedActions : undefined,
    isComplete: true,
    rawText: state.buffer,
  };
}

// checks if buffer contains complete json
export function isJsonComplete(state: ParserState): boolean {
  let braceCount = 0;
  let bracketCount = 0;
  let inString = false;
  let escapeNext = false;
  let hasContent = false;

  for (const char of state.buffer) {
    if (escapeNext) {
      escapeNext = false;
      continue;
    }

    if (char === "\\") {
      escapeNext = true;
      continue;
    }

    if (char === '"') {
      inString = !inString;
      continue;
    }

    if (inString) continue;

    if (char === "{") {
      braceCount++;
      hasContent = true;
    } else if (char === "}") {
      braceCount--;
    } else if (char === "[") {
      bracketCount++;
      hasContent = true;
    } else if (char === "]") {
      bracketCount--;
    }
  }

  return hasContent && braceCount === 0 && bracketCount === 0;
}
