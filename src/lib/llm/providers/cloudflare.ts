import type { LLMProviderInterface, LLMModelConfig } from "../types";

function getAccountId(): string | null {
  return process.env.CLOUDFLARE_ACCOUNT_ID || null;
}

function getApiToken(): string | null {
  return process.env.CLOUDFLARE_API_TOKEN || null;
}

function buildUrl(accountId: string, model: string): string {
  return `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${model}`;
}

export const cloudflareProvider: LLMProviderInterface = {
  name: "cloudflare",

  isAvailable(): boolean {
    return !!getAccountId() && !!getApiToken();
  },

  async call(
    model: string,
    systemPrompt: string,
    userMessage: string,
    config: LLMModelConfig,
    timeoutMs: number,
  ): Promise<string> {
    const accountId = getAccountId();
    const apiToken = getApiToken();
    if (!accountId || !apiToken) {
      throw new Error("CLOUDFLARE_ACCOUNT_ID or CLOUDFLARE_API_TOKEN not configured");
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const body = {
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage },
        ],
        max_tokens: config.maxTokens,
        temperature: config.temperature,
        top_p: config.topP ?? 0.8,
      };

      const response = await fetch(buildUrl(accountId, model), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiToken}`,
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorText = await response.text();
        if (response.status === 429) {
          throw new Error("RATE_LIMITED");
        }
        throw new Error(
          `Cloudflare AI error ${response.status}: ${errorText.slice(0, 200)}`,
        );
      }

      const data = await response.json();

      // cloudflare wraps response in { result: { response: "..." } }
      const text = data.result?.response;
      if (!text) throw new Error("Empty response from Cloudflare Workers AI");

      return text.trim();
    } catch (e) {
      if (e instanceof Error && e.name === "AbortError") {
        throw new Error("TIMEOUT");
      }
      throw e;
    } finally {
      clearTimeout(timeoutId);
    }
  },
};
