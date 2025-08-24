import { pgTable, serial, integer, text, timestamp } from "drizzle-orm/pg-core";
import { schools } from "./schools";

export const genaiSchoolTraining = pgTable("genai_school_training", {
  id: serial("id").primaryKey(),

  schoolId: integer("school_id").references(() => schools.id, {
    onDelete: "set null",
  }),

  contactName: text("contact_name").notNull(),
  contactPhone: text("contact_phone").notNull(),
  contactEmail: text("contact_email"),
  note: text("note"),
  city: text("city"),

  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
});
