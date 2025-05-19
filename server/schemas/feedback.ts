import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";

export const feedback = pgTable("feedback", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").notNull(),
  excitement: integer("excitement"), // 1 to 5
  firstAiIdea: text("first_ai_idea"),
  surprise: text("surprise"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
