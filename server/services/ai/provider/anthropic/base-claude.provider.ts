import Anthropic from "@anthropic-ai/sdk";
import {
  ANTHROPIC_RESPONSE_FORMAT_REMINDER,
  HTML_ANTHROPIC_AI_SYSTEM_PROMPT,
} from "server/templates/html-ai-prompt";
import {
  AnthropicConfig,
  AnthropicMessage,
} from "server/types/ai/anthropic/anthropic";

export abstract class BaseClaudeProvider {
  protected readonly anthropic: Anthropic;
  protected readonly config: AnthropicConfig;

  constructor(config: AnthropicConfig) {
    this.config = config;

    this.anthropic = new Anthropic({
      apiKey: config.apiKey,
    });
  }

  abstract getName(): string;

  abstract getModelName(): string;

  public getAnthropicSystemPrompt(): string {
    return HTML_ANTHROPIC_AI_SYSTEM_PROMPT;
  }

  getAnthropicSystemMessage(): AnthropicMessage {
    return {
      role: "assistant",
      content: this.getAnthropicSystemPrompt(),
    };
  }

  getResponseFormatReminderMessage(): AnthropicMessage {
    return {
      role: "assistant",
      content: ANTHROPIC_RESPONSE_FORMAT_REMINDER,
    };
  }

  abstract callAnthropic(
    messages: Anthropic.MessageParam[],
    config: AnthropicConfig,
    requestId: string,
  ): Promise<Anthropic.Message>;

  abstract callAnthropicWithRetry(
    messages: Anthropic.MessageParam[],
    config: AnthropicConfig,
    requestId: string,
  ): Promise<Anthropic.Message>;

  protected validateAnthropicConfig(config: AnthropicConfig): void {
    if (!config.apiKey) {
      throw new Error("Anthropic API key is required");
    }

    if (!config.maxTokens || config.maxTokens <= 0) {
      throw new Error("Valid maxTokens configuration is required");
    }

    if (
      config.temperature !== undefined &&
      (config.temperature < 0 || config.temperature > 1)
    ) {
      throw new Error("Temperature must be between 0 and 1");
    }
  }

  protected isAnthropicError(error: any): boolean {
    return error?.status !== undefined && error?.type !== undefined;
  }

  protected formatAnthropicError(error: any): string {
    if (this.isAnthropicError(error)) {
      return `Anthropic API Error (${error.status}): ${error.message}`;
    }

    return `Unexpected error: ${error.message || "Unknown error"}`;
  }
}
