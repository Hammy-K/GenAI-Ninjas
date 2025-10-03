import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const students = pgTable("students", {
  id: serial("id").primaryKey(),
  fullName: text("full_name").notNull(),
  schoolName: text("school_name").notNull(),
  phoneNumber: text("phone_number"),
  email: text("email"),
  createdAt: timestamp("created_at").defaultNow(),
});
