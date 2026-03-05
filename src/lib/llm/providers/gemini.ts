import type { LLMProviderInterface, LLMModelConfig } from "../types";

const GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models";

function getApiKey(): string | null {
  return process.env.GEMINI_API_KEY || null;
}

export const geminiProvider: LLMProviderInterface = {
  name: "gemini",

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
    if (!apiKey) throw new Error("GEMINI_API_KEY not configured");

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const body: Record<string, unknown> = {
        contents: [
          {
            role: "user",
            parts: [{ text: `${systemPrompt}\n\nUSER: ${userMessage}` }],
          },
        ],
        generationConfig: {
          temperature: config.temperature,
          maxOutputTokens: config.maxTokens,
          topP: config.topP ?? 0.8,
          ...(config.responseMimeType && {
            responseMimeType: config.responseMimeType,
          }),
        },
      };

      const response = await fetch(
        `${GEMINI_BASE_URL}/${model}:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
          signal: controller.signal,
        },
      );

      if (!response.ok) {
        const errorText = await response.text();
        if (response.status === 429) {
          throw new Error("RATE_LIMITED");
        }
        throw new Error(`Gemini API error ${response.status}: ${errorText.slice(0, 200)}`);
      }

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) throw new Error("Empty response from Gemini");

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
