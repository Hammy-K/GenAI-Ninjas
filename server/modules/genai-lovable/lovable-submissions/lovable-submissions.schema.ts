import { boolean, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const lovableSubmissionsV2 = pgTable("lovable_submissions_v2", {
  id: serial("id").primaryKey(),

  studentName: text("student_name").notNull(),
  noonCode: text("noon_code"),
  projectTitle: text("project_title").notNull(),
  projectLink: text("project_link").notNull(),
  email: text("email"),
  phoneNumber: text("phone_number"),
  schoolName: text("school_name"),

  isFeatured: boolean("is_featured").notNull().default(false),

  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
});
