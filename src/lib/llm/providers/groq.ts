import type { LLMProviderInterface, LLMModelConfig } from "../types";

const GROQ_BASE_URL = "https://api.groq.com/openai/v1/chat/completions";

function getApiKey(): string | null {
  return process.env.GROQ_API_KEY || null;
}

export const groqProvider: LLMProviderInterface = {
  name: "groq",

  isAvailable(): boolean {
    return !!getApiKey();
  },

  async call(
    model: string,
    systemPrompt: string,
    userMessage: string,
    config: LLMModelConfig,
    timeoutMs: number,
  ): Promise<string> {
    const apiKey = getApiKey();
    if (!apiKey) throw new Error("GROQ_API_KEY not configured");

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const body = {
        model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage },
        ],
        temperature: config.temperature,
        max_tokens: config.maxTokens,
        top_p: config.topP ?? 0.8,
        response_format: config.responseMimeType === "application/json"
          ? { type: "json_object" as const }
          : undefined,
      };

      const response = await fetch(GROQ_BASE_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorText = await response.text();
        if (response.status === 429) {
          throw new Error("RATE_LIMITED");
        }
        throw new Error(`Groq API error ${response.status}: ${errorText.slice(0, 200)}`);
      }

      const data = await response.json();
      const text = data.choices?.[0]?.message?.content;
      if (!text) throw new Error("Empty response from Groq");

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
