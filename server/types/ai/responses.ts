export interface StandardAiResponse {
  aiMessage: string;
  htmlContent: string;
  isHtmlGenerated: boolean;
  isConversationComplete: boolean;
}

export interface ResponseMetadata {
  provider: string;
  model: string;
  tokensUsed?: {
    input: number;
    output: number;
  };
  responseTime: number;
  retryCount?: number;
  finishReason?: string;
}

export interface AIResponseWithMetadata {
  response: StandardAiResponse;
  metadata: ResponseMetadata;
}

export interface ErrorResponse {
  error: string;
  code?: string | number;
  details?: string;
  timestamp: Date;
  provider?: string;
}
