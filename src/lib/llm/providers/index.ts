import type { LLMProviderInterface, LLMProvider } from "../types";
import { geminiProvider } from "./gemini";
import { groqProvider } from "./groq";
import { cloudflareProvider } from "./cloudflare";

const providers: Record<LLMProvider, LLMProviderInterface> = {
  gemini: geminiProvider,
  groq: groqProvider,
  cloudflare: cloudflareProvider,
};

export function getProvider(name: LLMProvider): LLMProviderInterface {
  const provider = providers[name];
  if (!provider) {
    throw new Error(`Unknown LLM provider: ${name}`);
  }
  return provider;
}

export function getAvailableProviders(): LLMProvider[] {
  return (Object.keys(providers) as LLMProvider[]).filter(
    (name) => providers[name].isAvailable(),
  );
}

export function isProviderAvailable(name: LLMProvider): boolean {
  return providers[name]?.isAvailable() ?? false;
}

export { geminiProvider, groqProvider, cloudflareProvider };
