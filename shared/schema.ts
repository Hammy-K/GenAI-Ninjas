import { pgTable, text, serial, integer, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User schema for potential future authentication
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

// Quest progress schema to store user progress
export const quests = pgTable("quests", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  currentStage: integer("current_stage").notNull().default(1),
  xp: integer("xp").notNull().default(0),
  unlockedBadges: jsonb("unlocked_badges").notNull().default([]),
  completedAt: text("completed_at"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

// Project ideas schema to store user-generated projects
export const projectIdeas = pgTable("project_ideas", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  steps: jsonb("steps").notNull(),
  tools: jsonb("tools").notNull(),
  difficulty: text("difficulty").notNull(),
  createdAt: text("created_at").notNull(),
});

// Define insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertQuestSchema = createInsertSchema(quests).omit({
  id: true,
});

export const insertProjectIdeaSchema = createInsertSchema(projectIdeas).omit({
  id: true,
});

// Define types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertQuest = z.infer<typeof insertQuestSchema>;
export type InsertProjectIdea = z.infer<typeof insertProjectIdeaSchema>;

export type User = typeof users.$inferSelect;
export type Quest = typeof quests.$inferSelect;
export type ProjectIdea = typeof projectIdeas.$inferSelect;
