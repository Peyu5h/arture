import type { LLMConfig, LLMPurpose, LLMPurposeConfig, LLMModelConfig } from "./types";

// env helpers
function getEnv(key: string): string | null {
  return process.env[key] || null;
}

export function hasGeminiKey(): boolean {
  return !!getEnv("GEMINI_API_KEY");
}

export function hasGroqKey(): boolean {
  return !!getEnv("GROQ_API_KEY");
}

export function hasCloudflareConfig(): boolean {
  return !!getEnv("CLOUDFLARE_ACCOUNT_ID") && !!getEnv("CLOUDFLARE_API_TOKEN");
}

// default model configs per provider
const GEMINI_FLASH: LLMModelConfig = {
  provider: "gemini",
  model: "gemini-2.5-flash",
  maxTokens: 4096,
  temperature: 0.1,
  topP: 0.8,
  responseMimeType: "application/json",
};

const GEMINI_FLASH_LITE: LLMModelConfig = {
  provider: "gemini",
  model: "gemini-2.0-flash-lite",
  maxTokens: 256,
  temperature: 0.3,
};

const GEMINI_FALLBACK: LLMModelConfig = {
  provider: "gemini",
  model: "gemini-2.0-flash",
  maxTokens: 4096,
  temperature: 0.1,
  topP: 0.8,
  responseMimeType: "application/json",
};

const GROQ_LLAMA: LLMModelConfig = {
  provider: "groq",
  model: "llama-3.3-70b-versatile",
  maxTokens: 4096,
  temperature: 0.1,
  topP: 0.8,
};

const GROQ_LLAMA_FAST: LLMModelConfig = {
  provider: "groq",
  model: "llama-3.1-8b-instant",
  maxTokens: 256,
  temperature: 0.3,
};

const CLOUDFLARE_LLAMA: LLMModelConfig = {
  provider: "cloudflare",
  model: "@cf/meta/llama-3.1-8b-instruct",
  maxTokens: 2048,
  temperature: 0.2,
};

// purpose-based config - determines which model to use for what
const DEFAULT_CONFIG: LLMConfig = {
  purposes: {
    chat: {
      primary: GEMINI_FLASH,
      fallback: GEMINI_FALLBACK,
      timeout: 25000,
    },
    title_generation: {
      primary: GEMINI_FLASH_LITE,
      fallback: GROQ_LLAMA_FAST,
      timeout: 10000,
    },
    analysis: {
      primary: GROQ_LLAMA,
      fallback: GEMINI_FLASH,
      timeout: 20000,
    },
    quick_response: {
      primary: GROQ_LLAMA_FAST,
      fallback: CLOUDFLARE_LLAMA,
      timeout: 8000,
    },
  },
  rateLimitCooldownMs: 30000,
};

// resolve the best available config for a given purpose
// skips providers that don't have API keys configured
function resolveAvailableConfig(purposeConfig: LLMPurposeConfig): LLMPurposeConfig {
  const primaryAvailable = isProviderAvailable(purposeConfig.primary.provider);
  const fallbackAvailable = purposeConfig.fallback
    ? isProviderAvailable(purposeConfig.fallback.provider)
    : false;

  if (primaryAvailable) return purposeConfig;

  // primary unavailable, promote fallback
  if (fallbackAvailable && purposeConfig.fallback) {
    return {
      primary: purposeConfig.fallback,
      fallback: undefined,
      timeout: purposeConfig.timeout,
    };
  }

  // try to find any available provider
  const anyGemini = hasGeminiKey();
  const anyGroq = hasGroqKey();
  const anyCf = hasCloudflareConfig();

  if (anyGemini) {
    return { primary: GEMINI_FLASH, fallback: GEMINI_FALLBACK, timeout: purposeConfig.timeout };
  }
  if (anyGroq) {
    return { primary: GROQ_LLAMA, fallback: GROQ_LLAMA_FAST, timeout: purposeConfig.timeout };
  }
  if (anyCf) {
    return { primary: CLOUDFLARE_LLAMA, timeout: purposeConfig.timeout };
  }

  // nothing available, return original (will fail at call time with clear error)
  return purposeConfig;
}

function isProviderAvailable(provider: string): boolean {
  switch (provider) {
    case "gemini": return hasGeminiKey();
    case "groq": return hasGroqKey();
    case "cloudflare": return hasCloudflareConfig();
    default: return false;
  }
}

// gets the resolved config for a purpose
export function getConfigForPurpose(purpose: LLMPurpose): LLMPurposeConfig {
  const raw = DEFAULT_CONFIG.purposes[purpose];
  return resolveAvailableConfig(raw);
}

export function getRateLimitCooldown(): number {
  return DEFAULT_CONFIG.rateLimitCooldownMs;
}

// allows runtime override (e.g. from admin panel later)
let runtimeOverrides: Partial<Record<LLMPurpose, Partial<LLMPurposeConfig>>> = {};

export function overridePurposeConfig(
  purpose: LLMPurpose,
  overrides: Partial<LLMPurposeConfig>,
): void {
  runtimeOverrides[purpose] = overrides;
}

export function getEffectiveConfig(purpose: LLMPurpose): LLMPurposeConfig {
  const base = getConfigForPurpose(purpose);
  const override = runtimeOverrides[purpose];
  if (!override) return base;

  return {
    ...base,
    ...override,
    primary: override.primary ? { ...base.primary, ...override.primary } : base.primary,
    fallback: override.fallback
      ? { ...base.fallback!, ...override.fallback }
      : base.fallback,
  };
}

export {
  GEMINI_FLASH,
  GEMINI_FLASH_LITE,
  GEMINI_FALLBACK,
  GROQ_LLAMA,
  GROQ_LLAMA_FAST,
  CLOUDFLARE_LLAMA,
  DEFAULT_CONFIG,
};
