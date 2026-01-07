import {
  CanvasIndex,
  IndexedElement,
  PrunedContext,
  ContextBudgetConfig,
  DEFAULT_BUDGET_CONFIG,
} from "./types";

const CHARS_PER_TOKEN = 4;

function estimateTokens(text: string): number {
  if (!text) return 0;
  return Math.ceil(text.length / CHARS_PER_TOKEN);
}

interface Message {
  role: string;
  content: string;
  timestamp?: number;
}

interface BudgetAllocation {
  messages: number;
  elements: number;
  summary: number;
  metadata: number;
}

// calculates budget allocation based on priorities
function allocateBudget(
  config: ContextBudgetConfig,
  messageCount: number,
  elementCount: number
): BudgetAllocation {
  const available = config.maxTokens - config.reserveForResponse;
  const metadataReserve = 100;

  const remaining = available - metadataReserve;

  // adjust priorities based on content
  let msgPriority = config.messagePriority;
  let elPriority = config.elementPriority;
  let sumPriority = config.summaryPriority;

  if (messageCount === 0) {
    elPriority += msgPriority * 0.5;
    sumPriority += msgPriority * 0.5;
    msgPriority = 0;
  }
  if (elementCount === 0) {
    msgPriority += elPriority * 0.5;
    sumPriority += elPriority * 0.5;
    elPriority = 0;
  }

  const total = msgPriority + elPriority + sumPriority;

  return {
    messages: Math.floor((remaining * msgPriority) / total),
    elements: Math.floor((remaining * elPriority) / total),
    summary: Math.floor((remaining * sumPriority) / total),
    metadata: metadataReserve,
  };
}

// prunes messages to fit budget
function pruneMessages(
  messages: Message[],
  budget: number
): Message[] {
  if (messages.length === 0) return [];

  const result: Message[] = [];
  let usedTokens = 0;

  // always keep last 2 messages
  const keepLast = 2;
  const recentMessages = messages.slice(-keepLast);
  const olderMessages = messages.slice(0, -keepLast);

  // reserve space for recent messages
  let recentTokens = 0;
  for (const msg of recentMessages) {
    recentTokens += estimateTokens(msg.content) + 10;
  }

  const olderBudget = Math.max(0, budget - recentTokens);

  // add older messages from newest to oldest until budget exhausted
  const reversedOlder = [...olderMessages].reverse();
  const keptOlder: Message[] = [];

  for (const msg of reversedOlder) {
    const msgTokens = estimateTokens(msg.content) + 10;
    if (usedTokens + msgTokens <= olderBudget) {
      keptOlder.unshift(msg);
      usedTokens += msgTokens;
    } else if (usedTokens < olderBudget) {
      // summarize this message
      const available = olderBudget - usedTokens - 20;
      if (available > 50) {
        const charLimit = available * CHARS_PER_TOKEN;
        const summarized = {
          ...msg,
          content: `[earlier] ${msg.content.slice(0, charLimit)}...`,
        };
        keptOlder.unshift(summarized);
      }
      break;
    }
  }

  result.push(...keptOlder, ...recentMessages);
  return result;
}

// prunes elements to fit budget
function pruneElements(
  elements: IndexedElement[],
  budget: number
): IndexedElement[] {
  if (elements.length === 0) return [];

  // sort by priority: selected first, then by layer
  const sorted = [...elements].sort((a, b) => {
    if (a.isSelected && !b.isSelected) return -1;
    if (!a.isSelected && b.isSelected) return 1;
    return b.layer - a.layer;
  });

  const result: IndexedElement[] = [];
  let usedTokens = 0;

  for (const el of sorted) {
    const elStr = JSON.stringify(el);
    const elTokens = estimateTokens(elStr);

    if (usedTokens + elTokens <= budget) {
      result.push(el);
      usedTokens += elTokens;
    } else {
      // add minimal version
      const minimal: IndexedElement = {
        id: el.id,
        type: el.type,
        position: el.position,
        size: el.size,
        layer: el.layer,
      };
      if (el.isSelected) minimal.isSelected = true;
      if (el.text) minimal.text = el.text.slice(0, 20);

      const minTokens = estimateTokens(JSON.stringify(minimal));
      if (usedTokens + minTokens <= budget) {
        result.push(minimal);
        usedTokens += minTokens;
      }
    }
  }

  return result;
}

// prunes summary to fit budget
function pruneSummary(summary: string, budget: number): string {
  const tokens = estimateTokens(summary);
  if (tokens <= budget) return summary;

  const charLimit = budget * CHARS_PER_TOKEN;
  return summary.slice(0, charLimit) + "...";
}

// main pruning function
export function pruneContext(
  canvasIndex: CanvasIndex,
  messages: Message[],
  config: ContextBudgetConfig = DEFAULT_BUDGET_CONFIG
): PrunedContext {
  const allocation = allocateBudget(
    config,
    messages.length,
    canvasIndex.elements.length
  );

  const prunedMessages = pruneMessages(messages, allocation.messages);
  const prunedElements = pruneElements(canvasIndex.elements, allocation.elements);
  const prunedSummary = pruneSummary(canvasIndex.summary, allocation.summary);

  // calculate actual token usage
  let totalTokens = 0;
  for (const msg of prunedMessages) {
    totalTokens += estimateTokens(msg.content) + 10;
  }
  for (const el of prunedElements) {
    totalTokens += estimateTokens(JSON.stringify(el));
  }
  totalTokens += estimateTokens(prunedSummary);
  totalTokens += allocation.metadata;

  const prunedIndex: CanvasIndex = {
    ...canvasIndex,
    elements: prunedElements,
    elementCount: prunedElements.length,
    summary: prunedSummary,
    tokenBudget: {
      total: config.maxTokens,
      used: totalTokens,
      elements: prunedElements.length,
      messages: prunedMessages.length,
      summary: estimateTokens(prunedSummary),
    },
  };

  return {
    canvasIndex: prunedIndex,
    messages: prunedMessages.map((m) => ({
      role: m.role,
      content: m.content,
    })),
    totalTokens,
  };
}

// checks if context fits within budget
export function isWithinBudget(
  canvasIndex: CanvasIndex,
  messages: Message[],
  config: ContextBudgetConfig = DEFAULT_BUDGET_CONFIG
): boolean {
  let totalTokens = 0;

  for (const msg of messages) {
    totalTokens += estimateTokens(msg.content) + 10;
  }
  for (const el of canvasIndex.elements) {
    totalTokens += estimateTokens(JSON.stringify(el));
  }
  totalTokens += estimateTokens(canvasIndex.summary);
  totalTokens += 100;

  return totalTokens <= config.maxTokens - config.reserveForResponse;
}

// gets context for AI with automatic pruning
export function getAIContext(
  canvasIndex: CanvasIndex,
  messages: Message[],
  config: ContextBudgetConfig = DEFAULT_BUDGET_CONFIG
): {
  context: string;
  tokenCount: number;
  wasPruned: boolean;
} {
  const needsPruning = !isWithinBudget(canvasIndex, messages, config);

  if (needsPruning) {
    const pruned = pruneContext(canvasIndex, messages, config);
    return {
      context: JSON.stringify({
        canvas: pruned.canvasIndex.canvas,
        summary: pruned.canvasIndex.summary,
        elements: pruned.canvasIndex.elements,
        recentMessages: pruned.messages.slice(-4),
      }),
      tokenCount: pruned.totalTokens,
      wasPruned: true,
    };
  }

  return {
    context: JSON.stringify({
      canvas: canvasIndex.canvas,
      summary: canvasIndex.summary,
      elements: canvasIndex.elements,
      recentMessages: messages.slice(-6).map((m) => ({
        role: m.role,
        content: m.content,
      })),
    }),
    tokenCount: canvasIndex.tokenBudget.used + messages.length * 50,
    wasPruned: false,
  };
}
