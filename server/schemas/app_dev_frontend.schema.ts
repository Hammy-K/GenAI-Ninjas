import {
  pgTable,
  serial,
  text,
  boolean,
  timestamp,
  pgEnum,
} from "drizzle-orm/pg-core";

export const appDevFrontendMissionEnum = pgEnum("appdev_frontend_mission", [
  "inputs-outputs",
  "buttons-events",
  "random-selection",
  "conditional-logic",
  "layout-design",
  "dynamic-images",
  "final-project",
]);

export const appDevFrontend = pgTable("app_dev_frontend", {
  id: serial("id").primaryKey(),
  projectId: text("project_id").notNull().unique(),
  html: text("html").notNull(),
  userId: text("user_id").notNull().default("0"),
  organization: text("organization").notNull().default("main"),
  isFeatured: boolean("is_featured").notNull().default(false),
  mission: appDevFrontendMissionEnum("mission").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type AppDevFrontend = typeof appDevFrontend.$inferSelect;
export type NewAppDevFrontend = typeof appDevFrontend.$inferInsert;
