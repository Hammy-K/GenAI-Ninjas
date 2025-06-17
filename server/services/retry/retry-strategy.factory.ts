export interface RetryStrategy {
  shouldRetry(error: any, attempt: number): boolean;
  getDelay(attempt: number): number;
  getMaxRetries(): number;
}

class AnthropicRetryStrategy implements RetryStrategy {
  private readonly maxRetries = 3;
  private readonly baseDelay = 1000; // 1 second

  shouldRetry(error: any, attempt: number): boolean {
    if (attempt >= this.maxRetries) return false;

    // Retry on rate limits, server errors, and temporary issues
    const retryableStatuses = [429, 500, 502, 503, 504, 529];

    return retryableStatuses.includes(error.status);
  }

  getDelay(attempt: number): number {
    // Exponential backoff with jitter
    const exponentialDelay = this.baseDelay * Math.pow(2, attempt - 1);
    const jitter = Math.random() * 1000; // Add up to 1 second of jitter
    return Math.min(exponentialDelay + jitter, 30000); // Cap at 30 seconds
  }

  getMaxRetries(): number {
    return this.maxRetries;
  }
}

export class RetryStrategyFactory {
  static create(provider: string): RetryStrategy {
    switch (provider.toLowerCase()) {
      case "anthropic":
        return new AnthropicRetryStrategy();
      default:
        throw new Error(`Unknown provider for retry strategy: ${provider}`);
    }
  }
}
