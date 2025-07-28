import { pgTable, serial, text, timestamp, integer } from "drizzle-orm/pg-core";

export const htmlAiRequestLogs = pgTable("html_ai_request_logs", {
  id: serial("id").primaryKey(),
  studentId: text("student_id").notNull(),

  modelUsed: text("model_used"),
  inputTokens: integer("input_tokens"),
  outputTokens: integer("output_tokens"),

  rawRequest: text("raw_request"),
  rawResponse: text("raw_response"),

  requestTime: timestamp("request_time", { mode: "date" }),
  responseTime: timestamp("response_time", { mode: "date" }),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
});
