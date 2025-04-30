import { pgTable, text, serial, integer, boolean, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User schema for potential future authentication
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  firebaseUid: text("firebase_uid").unique(), // Add Firebase UID for anonymous auth integration
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

// Gallery image schema to store shared AI-generated images
export const galleryImages = pgTable("gallery_images", {
  id: serial("id").primaryKey(),
  imageUrl: text("image_url").notNull(),
  studentName: text("student_name").notNull(),
  missionNumber: integer("mission_number").notNull(),
  likes: integer("likes").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  sessionId: text("session_id"),
  firebaseUid: text("firebase_uid"),
});

// Schema to track user likes to prevent duplicates
export const galleryLikes = pgTable("gallery_likes", {
  id: serial("id").primaryKey(),
  imageId: integer("image_id").references(() => galleryImages.id).notNull(),
  sessionId: text("session_id").notNull(),
  firebaseUid: text("firebase_uid"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Schema to log OpenAI Assistant API interactions
export const assistantLogs = pgTable("assistant_logs", {
  id: serial("id").primaryKey(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  userId: integer("user_id").references(() => users.id),
  // User identity fields for cross-session tracking
  firebaseUid: text("firebase_uid"),
  deviceId: text("device_id"), // Fallback persistent ID when Firebase auth is not available
  userName: text("user_name"),
  sessionId: text("session_id").notNull(),
  threadId: text("thread_id").notNull(),
  assistantId: text("assistant_id").notNull(),
  model: text("model").notNull(),
  promptContent: jsonb("prompt_content").notNull(),
  responseContent: jsonb("response_content").notNull(),
  tokens: jsonb("tokens"),
  errorMessage: text("error_message"),
});

// Define insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  firebaseUid: true,
});

export const insertQuestSchema = createInsertSchema(quests).omit({
  id: true,
});

export const insertProjectIdeaSchema = createInsertSchema(projectIdeas).omit({
  id: true,
});

export const insertGalleryImageSchema = createInsertSchema(galleryImages).omit({
  id: true,
  createdAt: true,
  likes: true,
});

export const insertGalleryLikeSchema = createInsertSchema(galleryLikes).omit({
  id: true,
  createdAt: true,
});

export const insertAssistantLogSchema = createInsertSchema(assistantLogs).omit({
  id: true,
  timestamp: true,
});

// Define types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertQuest = z.infer<typeof insertQuestSchema>;
export type InsertProjectIdea = z.infer<typeof insertProjectIdeaSchema>;
export type InsertGalleryImage = z.infer<typeof insertGalleryImageSchema>;
export type InsertGalleryLike = z.infer<typeof insertGalleryLikeSchema>;
export type InsertAssistantLog = z.infer<typeof insertAssistantLogSchema>;

export type User = typeof users.$inferSelect;
export type Quest = typeof quests.$inferSelect;
export type ProjectIdea = typeof projectIdeas.$inferSelect;
export type GalleryImage = typeof galleryImages.$inferSelect;
export type GalleryLike = typeof galleryLikes.$inferSelect;
export type AssistantLog = typeof assistantLogs.$inferSelect;
