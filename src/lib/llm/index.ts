import type {
  LLMPurpose,
  LLMResponse,
  LLMModelConfig,
  LLMProvider,
} from "./types";
import { getEffectiveConfig, getRateLimitCooldown } from "./config";
import { getProvider } from "./providers";

// rate limit tracking per model
const rateLimitedUntil: Record<string, number> = {};

function isRateLimited(key: string): boolean {
  const expiry = rateLimitedUntil[key];
  if (expiry && Date.now() < expiry) return true;
  if (expiry) delete rateLimitedUntil[key];
  return false;
}

function markRateLimited(key: string): void {
  rateLimitedUntil[key] = Date.now() + getRateLimitCooldown();
}

// attempts a single model call
async function attemptCall(
  config: LLMModelConfig,
  systemPrompt: string,
  userMessage: string,
  timeoutMs: number,
): Promise<{ text: string; provider: LLMProvider; model: string }> {
  const key = `${config.provider}:${config.model}`;
  if (isRateLimited(key)) {
    throw new Error("RATE_LIMITED");
  }

  const provider = getProvider(config.provider);
  if (!provider.isAvailable()) {
    throw new Error(`Provider ${config.provider} not configured`);
  }

  try {
    const text = await provider.call(
      config.model,
      systemPrompt,
      userMessage,
      config,
      timeoutMs,
    );
    return { text, provider: config.provider, model: config.model };
  } catch (e) {
    if (e instanceof Error && e.message === "RATE_LIMITED") {
      markRateLimited(key);
    }
    throw e;
  }
}

// main entry point - calls llm with purpose-based config and fallback chain
export async function callLLM(
  purpose: LLMPurpose,
  systemPrompt: string,
  userMessage: string,
  overrideConfig?: Partial<LLMModelConfig>,
): Promise<LLMResponse> {
  const config = getEffectiveConfig(purpose);
  const startTime = Date.now();

  const primaryConfig = overrideConfig
    ? { ...config.primary, ...overrideConfig }
    : config.primary;

  let lastError: Error | null = null;

  // try primary
  try {
    const result = await attemptCall(
      primaryConfig,
      systemPrompt,
      userMessage,
      config.timeout,
    );

    return {
      text: result.text,
      model: result.model,
      provider: result.provider,
      latencyMs: Date.now() - startTime,
    };
  } catch (e) {
    lastError = e instanceof Error ? e : new Error(String(e));
    console.warn(`[LLM] Primary model failed (${primaryConfig.provider}/${primaryConfig.model}): ${lastError.message}`);
  }

  // try fallback
  if (config.fallback) {
    try {
      const result = await attemptCall(
        config.fallback,
        systemPrompt,
        userMessage,
        config.timeout,
      );

      return {
        text: result.text,
        model: result.model,
        provider: result.provider,
        latencyMs: Date.now() - startTime,
      };
    } catch (e) {
      lastError = e instanceof Error ? e : new Error(String(e));
      console.warn(`[LLM] Fallback model failed (${config.fallback.provider}/${config.fallback.model}): ${lastError.message}`);
    }
  }

  // classify the error for consumer
  const errorMsg = lastError?.message || "Unknown error";
  let errorCode = "UNKNOWN";
  if (errorMsg.includes("RATE_LIMITED")) errorCode = "RATE_LIMITED";
  else if (errorMsg.includes("TIMEOUT")) errorCode = "TIMEOUT";
  else if (errorMsg.includes("not configured")) errorCode = "NOT_CONFIGURED";
  else if (errorMsg.includes("API error")) errorCode = "API_ERROR";

  const err = new Error(`All LLM providers failed: ${errorMsg}`);
  (err as any).code = errorCode;
  (err as any).latencyMs = Date.now() - startTime;
  throw err;
}

// lightweight call for simple tasks (title gen, etc)
export async function callLLMSimple(
  purpose: LLMPurpose,
  prompt: string,
): Promise<string> {
  const response = await callLLM(purpose, "", prompt);
  return response.text;
}

export * from "./types";
export * from "./config";
export { getProvider, getAvailableProviders, isProviderAvailable } from "./providers";
