import { db } from "../db";
import { htmlAiRequestLogs } from "../schemas/html_ai_request_logs";

type LogAiRequestParams = {
  studentId: string;
  modelUsed?: string;
  inputTokens?: number;
  outputTokens?: number;
  rawRequest?: string;
  rawResponse?: string;
  requestTime?: Date;
  responseTime?: Date;
};

export async function createHtmlAiRequestLogs({
  studentId,
  modelUsed,
  inputTokens,
  outputTokens,
  requestTime,
  responseTime,
  rawRequest,
  rawResponse,
}: LogAiRequestParams) {
  if (!studentId) {
    console.log("Error: Missing studentId");
    return;
  }

  return db.insert(htmlAiRequestLogs).values({
    studentId,
    modelUsed,
    inputTokens,
    outputTokens,
    requestTime,
    responseTime,
    rawRequest,
    rawResponse,
    createdAt: new Date(),
  });
}
