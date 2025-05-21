import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const studentHtmlMessages = pgTable("student_html_messages", {
  id: serial("id").primaryKey(),
  studentId: text("student_id").notNull(),
  message: text("message").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
