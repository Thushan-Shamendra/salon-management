/**
 * SALVORA AI Assistant - Provider Abstraction
 * 
 * Supports OpenAI and OpenAI-compatible providers (OpenRouter, local gateways, etc.)
 * via native fetch with strict timeout protection and zero secret leakage.
 */

export interface AiChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface AiConfigInfo {
  configured: boolean;
  provider: string;
  model: string;
}

export class AiProviderError extends Error {
  public code: string;
  constructor(message: string, code: string = "AI_ERROR") {
    super(message);
    this.name = "AiProviderError";
    this.code = code;
  }
}

/**
 * Check if the AI provider has been configured with an API key
 */
export function isAiConfigured(): boolean {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  return Boolean(apiKey && apiKey.length > 0);
}

/**
 * Return safe public configuration details (never leaks keys)
 */
export function getAiConfig(): AiConfigInfo {
  const provider = (process.env.AI_PROVIDER || "openai").toLowerCase();
  const model = process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini";
  return {
    configured: isAiConfigured(),
    provider,
    model,
  };
}

/**
 * Generate chat completion from configured AI provider with 30s timeout guard
 */
export async function generateAiChatCompletion(
  messages: AiChatMessage[],
  options: {
    temperature?: number;
    maxTokens?: number;
    responseFormatJson?: boolean;
    timeoutMs?: number;
  } = {}
): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    throw new AiProviderError(
      "AI Assistant is not configured. Add your AI provider API key to enable SALVORA website insights.",
      "NOT_CONFIGURED"
    );
  }

  const model = process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini";
  let baseUrl = process.env.OPENAI_BASE_URL?.trim() || "https://api.openai.com/v1";
  if (baseUrl.endsWith("/")) baseUrl = baseUrl.slice(0, -1);

  const timeoutMs = options.timeoutMs ?? 30000;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const payload: Record<string, unknown> = {
      model,
      messages,
      temperature: options.temperature ?? 0.2, // Low temperature for high factual accuracy
      max_tokens: options.maxTokens ?? 2000,
    };

    if (options.responseFormatJson) {
      payload.response_format = { type: "json_object" };
    }

    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timer);

    if (!res.ok) {
      const errorBody = await res.text().catch(() => "");
      let errorMessage = `Provider returned HTTP ${res.status}`;
      try {
        const parsed = JSON.parse(errorBody);
        if (parsed?.error?.message) {
          errorMessage = parsed.error.message;
        }
      } catch {
        // use fallback
      }
      throw new AiProviderError(
        `AI Provider error (${res.status}): ${errorMessage}`,
        `HTTP_${res.status}`
      );
    }

    const data = await res.json();
    const content = data?.choices?.[0]?.message?.content;
    if (typeof content !== "string") {
      throw new AiProviderError("Invalid empty response received from AI provider", "EMPTY_RESPONSE");
    }

    return content.trim();
  } catch (err: unknown) {
    clearTimeout(timer);
    if (err instanceof AiProviderError) {
      throw err;
    }
    if ((err as Error)?.name === "AbortError") {
      throw new AiProviderError(
        "AI request timed out after 30 seconds. Please try again.",
        "TIMEOUT"
      );
    }
    const message = (err as Error)?.message || "Unknown AI provider error";
    throw new AiProviderError(`Failed to connect to AI provider: ${message}`, "NETWORK_ERROR");
  }
}
