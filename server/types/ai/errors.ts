export enum AIErrorType {
  RATE_LIMIT = 'rate_limit',
  OVERLOADED = 'overloaded',
  INVALID_REQUEST = 'invalid_request',
  AUTHENTICATION = 'authentication',
  NETWORK = 'network',
  PARSING = 'parsing',
  UNKNOWN = 'unknown'
}

export enum RetryAction {
  RETRY = 'retry',
  FALLBACK = 'fallback',
  FAIL = 'fail',
  SWITCH_MODEL = 'switch_model'
}

export interface AIError extends Error {
  type: AIErrorType;
  code?: string | number;
  statusCode?: number;
  retryAfter?: number;
  provider: string;
  originalError?: any;
}

export interface RetryDecision {
  action: RetryAction;
  delay?: number;
  maxRetries?: number;
  fallbackProvider?: string;
  shouldLog?: boolean;
}

export interface ErrorContext {
  provider: string;
  model?: string;
  attempt: number;
  timestamp: Date;
  requestId?: string;
}

export class AIProviderError extends Error implements AIError {
  public type: AIErrorType;
  public code?: string | number;
  public statusCode?: number;
  public retryAfter?: number;
  public provider: string;
  public originalError?: any;

  constructor(
    message: string,
    type: AIErrorType,
    provider: string,
    options?: {
      code?: string | number;
      statusCode?: number;
      retryAfter?: number;
      originalError?: any;
    }
  ) {
    super(message);
    this.name = 'AIProviderError';
    this.type = type;
    this.provider = provider;
    this.code = options?.code;
    this.statusCode = options?.statusCode;
    this.retryAfter = options?.retryAfter;
    this.originalError = options?.originalError;
  }
}