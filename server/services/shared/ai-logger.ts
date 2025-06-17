export interface LogContext {
  [key: string]: any;
}

export interface RequestLogData {
  provider: string;
  model: string;
  studentId: string;
  messageLength: number;
  historyLength: number;
}

export interface ResponseLogData {
  success: boolean;
  responseLength: number;
  tokensUsed: number;
  duration: number;
}

export interface RetryLogData {
  attempt: number;
  maxRetries: number;
  delay: number;
  error: string;
}

export class AILogger {
  private context: string;

  constructor(context: string) {
    this.context = context;
  }

  logRequest(requestId: string, data: RequestLogData): void {
    console.log(`[${this.context}] Request ${requestId}:`, {
      provider: data.provider,
      model: data.model,
      studentId: this.sanitizeStudentId(data.studentId),
      messageLength: data.messageLength,
      historyLength: data.historyLength,
      timestamp: new Date().toISOString(),
    });
  }

  logResponse(requestId: string, data: ResponseLogData): void {
    console.log(`[${this.context}] Response ${requestId}:`, {
      success: data.success,
      responseLength: data.responseLength,
      tokensUsed: data.tokensUsed,
      duration: `${data.duration}ms`,
      timestamp: new Date().toISOString(),
    });
  }

  logError(requestId: string, error: any, context?: LogContext): void {
    console.error(`[${this.context}] Error ${requestId}:`, {
      error: {
        message: error.message || "Unknown error",
        status: error.status,
        type: error.type,
        stack: error.stack,
      },
      context: context ? this.sanitizeContext(context) : {},
      timestamp: new Date().toISOString(),
    });
  }

  logRetry(requestId: string, data: RetryLogData): void {
    console.warn(`[${this.context}] Retry ${requestId}:`, {
      attempt: data.attempt,
      maxRetries: data.maxRetries,
      delay: `${data.delay}ms`,
      error: data.error,
      timestamp: new Date().toISOString(),
    });
  }

  logInfo(message: string, data?: LogContext): void {
    console.log(`[${this.context}] ${message}`, {
      ...data,
      timestamp: new Date().toISOString(),
    });
  }

  logWarning(message: string, data?: LogContext): void {
    console.warn(`[${this.context}] ${message}`, {
      ...data,
      timestamp: new Date().toISOString(),
    });
  }

  private sanitizeStudentId(studentId: string): string {
    // Mask most of the student ID for privacy
    if (studentId.length <= 4) return "***";
    return (
      studentId.substring(0, 2) +
      "*".repeat(studentId.length - 4) +
      studentId.slice(-2)
    );
  }

  private sanitizeContext(context: LogContext): LogContext {
    const sanitized = { ...context };

    // Remove or sanitize sensitive fields
    if (sanitized.studentId) {
      sanitized.studentId = this.sanitizeStudentId(sanitized.studentId);
    }

    // Remove API keys or tokens if accidentally included
    delete sanitized.apiKey;
    delete sanitized.token;
    delete sanitized.authorization;

    return sanitized;
  }
}
