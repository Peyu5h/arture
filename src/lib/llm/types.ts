export type LLMProvider = "gemini" | "groq" | "cloudflare";

export type LLMPurpose =
  | "chat"
  | "title_generation"
  | "analysis"
  | "quick_response";

export interface LLMModelConfig {
  provider: LLMProvider;
  model: string;
  maxTokens: number;
  temperature: number;
  topP?: number;
  responseMimeType?: string;
}

export interface LLMPurposeConfig {
  primary: LLMModelConfig;
  fallback?: LLMModelConfig;
  timeout: number;
}

export interface LLMRequest {
  systemPrompt: string;
  userMessage: string;
  purpose: LLMPurpose;
  overrideConfig?: Partial<LLMModelConfig>;
}

export interface LLMResponse {
  text: string;
  model: string;
  provider: LLMProvider;
  latencyMs: number;
  tokenUsage?: {
    prompt?: number;
    completion?: number;
    total?: number;
  };
}

export interface LLMProviderInterface {
  name: LLMProvider;
  call(
    model: string,
    systemPrompt: string,
    userMessage: string,
    config: LLMModelConfig,
    timeoutMs: number,
  ): Promise<string>;
  isAvailable(): boolean;
}

export interface LLMConfig {
  purposes: Record<LLMPurpose, LLMPurposeConfig>;
  rateLimitCooldownMs: number;
}
