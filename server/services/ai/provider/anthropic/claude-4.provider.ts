import Anthropic from "@anthropic-ai/sdk";
import { StandardAiResponse } from "../../../../types/ai/responses";
import { AIProvider, AIRequest, ProviderType } from "server/types/ai/providers";
import { BaseClaudeProvider } from "./base-claude.provider";
import { AILogger } from "server/services/shared/ai-logger";
import {
  AnthropicConfig,
  AnthropicModelName,
} from "server/types/ai/anthropic/anthropic";
import { RetryStrategyFactory } from "server/services/retry/retry-strategy.factory";
import { ErrorHandlerFactory } from "server/services/error-handling/error-handler-factory";
import { HTML_CLAUDE_AI_SYSTEM_PROMPT } from "server/templates/html-claude-ai-prompt";

export class Claude4Provider extends BaseClaudeProvider implements AIProvider {
  private readonly modelName = AnthropicModelName.CLAUDE_4;
  private readonly logger: AILogger;
  private readonly retryStrategy;
  private readonly errorHandler;

  constructor(config: AnthropicConfig) {
    super(config);

    this.logger = new AILogger("Claude4Provider");
    this.retryStrategy = RetryStrategyFactory.create("anthropic");
    this.errorHandler = ErrorHandlerFactory.create("anthropic");
  }

  getName(): string {
    return "Claude-4";
  }

  getModelName(): string {
    return this.modelName;
  }

  getProviderType(): ProviderType {
    return ProviderType.ANTHROPIC;
  }

  async sendMessage(
    request: AIRequest,
    customConfig?: Partial<AnthropicConfig>,
  ): Promise<StandardAiResponse> {
    const startTime = Date.now();
    const requestId = this.generateRequestId();

    try {
      // this.logger.logRequest(requestId, {
      //   provider: this.getName(),
      //   model: this.modelName,
      //   studentId: request.studentId,
      //   messageLength: request.message.length,
      //   historyLength: request.history?.length || 0,
      // });

      this.validateRequest(request);

      const messages = this.formatMessages(request.message, request.history);

      const config = { ...this.config, ...customConfig };

      const response = await this.callAnthropic(
        messages,
        // request,
        config,
      );

      const standardResponse = this.normalizeResponse(response);

      // this.logger.logResponse(requestId, {
      //   success: true,
      //   responseLength: standardResponse.message.length,
      //   tokensUsed: standardResponse.metadata.usage?.tokens || 0,
      //   duration: Date.now() - startTime,
      // });

      return standardResponse;
    } catch (error) {
      this.logger.logError(requestId, error, {
        provider: this.getName(),
        model: this.modelName,
        studentId: request.userId,
        duration: Date.now() - startTime,
      });

      // throw this.handleProviderError(error);
      throw error;
    }
  }

  validateRequest(request: AIRequest): boolean {
    if (
      !request.message ||
      typeof request.message !== "string" ||
      request.history.length === 0 ||
      !request.userId ||
      typeof request.userId !== "string"
    ) {
      return false;
    }

    return true;
  }

  async callAnthropic(
    messages: Anthropic.MessageParam[],
    // request: AIRequest,
    config: AnthropicConfig,
  ): Promise<any> {
    try {
      const response = await this.anthropic.messages.create({
        model: this.modelName,
        messages: messages,
        max_tokens: config.maxTokens,
        temperature: config.temperature || 0.1,
        system: this.getAnthropicSystemPrompt(),
      });

      console.log("##################################");
      console.log("Claude-4 response: ", response);
      console.log("##################################");

      return response;
    } catch (error: any) {
      console.error("Anthropic API Error:", error);

      throw error;
    }
  }

  async callAnthropicWithRetry(
    messages: Anthropic.MessageParam[],
    // request: AIRequest,
    config: AnthropicConfig,
    requestId: string,
  ): Promise<Anthropic.Message> {
    const maxRetries = this.retryStrategy.getMaxRetries();

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await this.anthropic.messages.create({
          model: this.modelName,
          messages: messages,
          max_tokens: config.maxTokens,
          temperature: config.temperature || 0.1,
          system: this.getSystemPrompt(),
        });

        return response;
      } catch (error: any) {
        const shouldRetry =
          this.errorHandler.shouldRetry(error) && attempt < maxRetries;

        if (shouldRetry) {
          const delay = this.retryStrategy.getDelay(attempt);

          this.logger.logRetry(requestId, {
            attempt,
            maxRetries,
            delay,
            error: error.message,
          });

          await this.sleep(delay);
          continue;
        }

        // If we shouldn't retry or we've exhausted retries, throw the error
        throw error;
      }
    }

    throw new Error("Max retries exceeded");
  }

  private formatMessages(
    message: string,
    history?: Array<{ role: "user" | "assistant"; content: string }>,
  ): Anthropic.MessageParam[] {
    const messages: Anthropic.MessageParam[] = [];

    messages.push(this.getAnthropicSystemMessage());

    if (history && history.length > 0) {
      for (const historyItem of history) {
        messages.push({
          role: historyItem.role,
          content: historyItem.content,
        });
      }
    }

    messages.push(this.getResponseFormatReminderMessage());

    return messages;
  }

  private normalizeResponse(
    response: Anthropic.Message,
    // requestId: string,
  ): StandardAiResponse {
    const responseContent: StandardAiResponse = JSON.parse(
      response.content[0].text,
    );

    if (!responseContent) {
      throw new Error("No text content found in Claude response");
    }

    const normalizedResponse: StandardAiResponse = {
      aiMessage: responseContent.aiMessage,
      htmlContent: responseContent.htmlContent || "",
      isHtmlGenerated: responseContent.isHtmlGenerated,
      isConversationComplete: responseContent.isConversationComplete,
    };

    return normalizedResponse;
  }

  getSystemPrompt(): string {
    return HTML_CLAUDE_AI_SYSTEM_PROMPT;
  }

  private handleProviderError(error: any): Error {
    // Map Anthropic errors to standardized errors
    if (error.status === 400) {
      return new Error(`Bad Request: ${error.message}`);
    }

    if (error.status === 401) {
      return new Error("Authentication failed: Invalid API key");
    }

    if (error.status === 403) {
      return new Error("Access forbidden: Check API permissions");
    }

    if (error.status === 429) {
      return new Error("Rate limit exceeded: Please try again later");
    }

    if (error.status === 500) {
      return new Error("Anthropic server error: Please try again later");
    }

    if (error.status === 529) {
      return new Error(
        "Anthropic is temporarily overloaded: Please try again later",
      );
    }

    // Default error handling
    return new Error(
      `Claude-4 Provider Error: ${error.message || "Unknown error occurred"}`,
    );
  }

  private generateRequestId(): string {
    return `claude4_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
