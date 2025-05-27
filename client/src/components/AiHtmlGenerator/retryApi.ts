// retryApi.ts - Create this as a new file
class RetryManager {
  private activeRequests = 0;
  private maxConcurrent = 3;

  async executeWithRetry<T>(
    requestFunction: () => Promise<T>,
    maxRetries = 3,
    baseDelay = 1000,
  ): Promise<T> {
    // If too many active requests, wait a bit and retry
    if (this.activeRequests >= this.maxConcurrent) {
      const delay = baseDelay + Math.random() * 1000; // Add jitter
      await new Promise((resolve) => setTimeout(resolve, delay));
      return this.executeWithRetry(
        requestFunction,
        maxRetries,
        baseDelay * 1.5,
      );
    }

    this.activeRequests++;

    try {
      const result = await requestFunction();
      return result;
    } catch (error) {
      if (maxRetries > 0 && this.isRetryableError(error)) {
        const delay = baseDelay + Math.random() * 1000;
        await new Promise((resolve) => setTimeout(resolve, delay));
        return this.executeWithRetry(
          requestFunction,
          maxRetries - 1,
          baseDelay * 1.5,
        );
      }
      throw error;
    } finally {
      this.activeRequests--;
    }
  }

  private isRetryableError(error: any): boolean {
    // Retry on rate limit or server busy errors
    return (
      error.message?.includes("rate limit") ||
      error.message?.includes("too many requests") ||
      error.status === 429 ||
      error.status === 503
    );
  }
}

export const retryManager = new RetryManager();
