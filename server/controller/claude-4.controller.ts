import { Request, Response } from "express";
import { getAnthropicConfig } from "server/config/ai/anthropic/anthropic.config";
import { Claude4Provider } from "server/services/ai/provider/anthropic/claude-4.provider";
import { AIRequest } from "server/types/ai/providers";
import { StandardAiResponse } from "server/types/ai/responses";

let claude4Provider: Claude4Provider;

try {
  const config = getAnthropicConfig();

  claude4Provider = new Claude4Provider(config);
} catch (error) {
  console.error("Failed to initialize Claude-4 provider:", error);
}

export const claude4Handler = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const startTime = Date.now();

  try {
    if (!claude4Provider) {
      res.status(500).json({
        error: "Claude-4 provider not initialized",
        message: "Service temporarily unavailable",
      });

      return;
    }

    const requestBody = req.body as AIRequest;

    if (!requestBody) {
      res.status(400).json({
        error: "Request body is required",
        message: "Please provide a valid request body",
      });

      return;
    }

    const validationError = validateRequest(requestBody);

    if (validationError) {
      res.status(400).json({
        error: "Validation failed",
        message: validationError,
      });

      return;
    }

    const response: StandardAiResponse =
      await claude4Provider.sendMessage(requestBody);

    console.log("##################################");
    console.log("Claude-4 response:", response);
    console.log("##################################");

    res.status(200).json(response);
  } catch (error: any) {
    console.error("Claude-4 route error:", error);

    const statusCode = getHttpStatusFromError(error);

    res.status(statusCode).json({
      aiMessage: "عذرًا، حدث خطأ في النظام.",
      htmlContent: "",
      isHtmlGenerated: false,
      isConversationComplete: false,
    });

    // res.status(statusCode).json({
    //   error: "Claude-4 request failed",
    //   message: error.message || "An unexpected error occurred",
    //   metadata: {
    //     provider: "anthropic",
    //     model: "claude-4",
    //     timestamp: new Date().toISOString(),
    //     processingTime: Date.now() - startTime,
    //   },
    // });
  }
};

function validateRequest(request: AIRequest): string | null {
  if (!request.message) {
    return "Message is required";
  }

  if (!request.userId) {
    return "StudentId is required";
  }

  if (request.message.length === 0) {
    return "Message cannot be empty";
  }

  return null;
}

function getHttpStatusFromError(error: any): number {
  const message = error.message?.toLowerCase() || "";

  if (message.includes("bad request") || message.includes("validation")) {
    return 400;
  }

  if (message.includes("authentication") || message.includes("api key")) {
    return 401;
  }

  if (message.includes("forbidden") || message.includes("access")) {
    return 403;
  }

  if (message.includes("rate limit") || message.includes("429")) {
    return 429;
  }

  if (message.includes("overloaded") || message.includes("529")) {
    return 503;
  }

  return 500;
}

export default claude4Handler;
