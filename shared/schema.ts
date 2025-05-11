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

// App Builder Stream Steps - Stores the 11 steps of the App Builder journey
export const appBuilderSteps = pgTable("app_builder_steps", {
  id: serial("id").primaryKey(),
  stepNumber: integer("step_number").notNull().unique(),
  title: text("title").notNull(),
  subtitle: text("subtitle"),
  content: text("content").notNull(),
  submissionType: text("submission_type").notNull(), // text, link, file, etc.
  requiredForProgress: boolean("required_for_progress").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// App Builder User Progress - Tracks user progression through the App Builder Stream
export const appBuilderProgress = pgTable("app_builder_progress", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  firebaseUid: text("firebase_uid").notNull(),
  currentStep: integer("current_step").notNull().default(1),
  isCompleted: boolean("is_completed").notNull().default(false),
  startedAt: timestamp("started_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// App Builder Submissions - Stores all student work for each step
export const appBuilderSubmissions = pgTable("app_builder_submissions", {
  id: serial("id").primaryKey(),
  progressId: integer("progress_id").references(() => appBuilderProgress.id).notNull(),
  stepNumber: integer("step_number").notNull(),
  submissionContent: text("submission_content").notNull(),
  submissionData: jsonb("submission_data"), // For structured data like links, files, etc.
  version: integer("version").notNull().default(1), // For tracking submission versions
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// App Builder Chat History - Stores all interactions with Dr. Pengy in the context of App Builder
export const appBuilderChatHistory = pgTable("app_builder_chat_history", {
  id: serial("id").primaryKey(),
  progressId: integer("progress_id").references(() => appBuilderProgress.id).notNull(),
  stepNumber: integer("step_number").notNull(),
  role: text("role").notNull(), // user or assistant
  content: text("content").notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
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

// Schema to store HTML projects
export const htmlProjects = pgTable("html_projects", {
  id: serial("id").primaryKey(),
  projectId: text("project_id").notNull().unique(), // Preserve existing project IDs for URL compatibility
  html: text("html").notNull(), // Store the HTML content
  firebaseUid: text("firebase_uid"), // Optional link to user's Firebase ID
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
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

export const insertAppBuilderStepSchema = createInsertSchema(appBuilderSteps).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAppBuilderProgressSchema = createInsertSchema(appBuilderProgress).omit({
  id: true,
  completedAt: true,
  startedAt: true,
  updatedAt: true,
});

export const insertAppBuilderSubmissionSchema = createInsertSchema(appBuilderSubmissions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAppBuilderChatHistorySchema = createInsertSchema(appBuilderChatHistory).omit({
  id: true,
  timestamp: true,
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

export const insertHtmlProjectSchema = createInsertSchema(htmlProjects).omit({
  id: true,
  createdAt: true, 
  updatedAt: true,
});

// Define types
// Adding LovableMission types
export const lovableMissionProgress = pgTable("lovable_mission_progress", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  firebaseUid: text("firebase_uid").notNull(),
  currentStep: integer("current_step").default(1),
  hasSubmitted: boolean("has_submitted").default(false),
  projectLink: text("project_link"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const lovableMissionChatHistory = pgTable("lovable_mission_chat_history", {
  id: serial("id").primaryKey(),
  progressId: integer("progress_id").notNull().references(() => lovableMissionProgress.id),
  role: text("role").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Create insert schemas
export const insertLovableMissionProgressSchema = createInsertSchema(lovableMissionProgress, {
  id: z.number(),
  userId: z.number(),
  firebaseUid: z.string(),
  currentStep: z.number().optional(),
  hasSubmitted: z.boolean().optional(),
  projectLink: z.string().optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
}).omit({ id: true, createdAt: true, updatedAt: true });

export const insertLovableMissionChatHistorySchema = createInsertSchema(lovableMissionChatHistory, {
  id: z.number(),
  progressId: z.number(),
  role: z.string(),
  content: z.string(),
  createdAt: z.date().optional(),
}).omit({ id: true, createdAt: true });

export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertQuest = z.infer<typeof insertQuestSchema>;
export type InsertProjectIdea = z.infer<typeof insertProjectIdeaSchema>;
export type InsertAppBuilderStep = z.infer<typeof insertAppBuilderStepSchema>;
export type InsertAppBuilderProgress = z.infer<typeof insertAppBuilderProgressSchema>;
export type InsertAppBuilderSubmission = z.infer<typeof insertAppBuilderSubmissionSchema>;
export type InsertAppBuilderChatHistory = z.infer<typeof insertAppBuilderChatHistorySchema>;
export type InsertGalleryImage = z.infer<typeof insertGalleryImageSchema>;
export type InsertGalleryLike = z.infer<typeof insertGalleryLikeSchema>;
export type InsertAssistantLog = z.infer<typeof insertAssistantLogSchema>;
export type InsertHtmlProject = z.infer<typeof insertHtmlProjectSchema>;
export type InsertLovableMissionProgress = z.infer<typeof insertLovableMissionProgressSchema>;
export type InsertLovableMissionChatHistory = z.infer<typeof insertLovableMissionChatHistorySchema>;

export type User = typeof users.$inferSelect;
export type Quest = typeof quests.$inferSelect;
export type ProjectIdea = typeof projectIdeas.$inferSelect;
export type AppBuilderStep = typeof appBuilderSteps.$inferSelect;
export type AppBuilderProgress = typeof appBuilderProgress.$inferSelect;
export type AppBuilderSubmission = typeof appBuilderSubmissions.$inferSelect;
export type AppBuilderChatHistory = typeof appBuilderChatHistory.$inferSelect;
export type GalleryImage = typeof galleryImages.$inferSelect;
export type GalleryLike = typeof galleryLikes.$inferSelect;
export type AssistantLog = typeof assistantLogs.$inferSelect;
export type HtmlProject = typeof htmlProjects.$inferSelect;
export type LovableMissionProgress = typeof lovableMissionProgress.$inferSelect;
export type LovableMissionChatHistory = typeof lovableMissionChatHistory.$inferSelect;
