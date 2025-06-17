// server/services/ai/error-handling/error-handler-factory.ts

export interface ErrorHandler {
  shouldRetry(error: any): boolean;
  getRetryDelay(error: any): number;
  classifyError(error: any): string;
}

class AnthropicErrorHandler implements ErrorHandler {
  shouldRetry(error: any): boolean {
    if (!error.status) return false;

    switch (error.status) {
      case 429: // Rate limit
      case 500: // Internal server error
      case 502: // Bad gateway
      case 503: // Service unavailable
      case 504: // Gateway timeout
      case 529: // Overloaded
        return true;
      default:
        return false;
    }
  }

  getRetryDelay(error: any): number {
    // Check for retry-after header first
    if (error.headers && error.headers['retry-after']) {
      const retryAfter = parseInt(error.headers['retry-after']);
      if (!isNaN(retryAfter)) {
        return retryAfter * 1000; // Convert seconds to milliseconds
      }
    }

    // Default delays based on error type
    switch (error.status) {
      case 429: // Rate limit
        return 60000; // 1 minute
      case 529: // Overloaded
        return 10000; // 10 seconds
      default:
        return 2000; // 2 seconds
    }
  }

  classifyError(error: any): string {
    if (!error.status) return 'network_error';

    switch (error.status) {
      case 400:
        return 'bad_request';
      case 401:
        return 'unauthorized';
      case 403:
        return 'forbidden';
      case 404:
        return 'not_found';
      case 413:
        return 'request_too_large';
      case 429:
        return 'rate_limited';
      case 500:
        return 'server_error';
      case 529:
        return 'overloaded';
      default:
        return 'unknown_error';
    }
  }
}

export class ErrorHandlerFactory {
  static create(provider: string): ErrorHandler {
    switch (provider.toLowerCase()) {
      case 'anthropic':
        return new AnthropicErrorHandler();
      default:
        throw new Error(`Unknown provider for error handler: ${provider}`);
    }
  }
}