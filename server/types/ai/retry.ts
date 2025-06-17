import { AIError, RetryDecision } from "./errors";

export interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  respectRetryAfter: boolean;
}

export interface RetryAttempt {
  attempt: number;
  delay: number;
  timestamp: Date;
  error?: AIError;
}

export interface RetryContext {
  attempts: RetryAttempt[];
  startTime: Date;
  provider: string;
  model?: string;
  requestId?: string;
}

export interface RetryStrategy {
  shouldRetry(error: AIError, attempt: number, context: RetryContext): boolean;
  getDelay(attempt: number, error?: AIError): number;
  getMaxRetries(): number;
  handleRetryDecision(error: AIError, context: RetryContext): RetryDecision;
}

export enum BackoffStrategy {
  EXPONENTIAL = "exponential",
  LINEAR = "linear",
  FIXED = "fixed",
}

export interface BackoffConfig {
  strategy: BackoffStrategy;
  baseDelay: number;
  maxDelay: number;
  multiplier?: number;
  jitter?: boolean;
}
