import {
  pgTable,
  text,
  serial,
  integer,
  boolean,
  jsonb,
  timestamp,
  varchar,
  json,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm"; // Added

// User schema for potential future authentication
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  firebaseUid: text("firebase_uid").unique(), // Add Firebase UID for anonymous auth integration
});

export const generatedImages = pgTable("generated_images", {
  id: serial("id").primaryKey(),
  email: text("email").notNull(), // Student email
  prompt: text("prompt").notNull(),
  imageDataUrl: text("image_data_url").notNull(), // Base64 data URL
  referenceImageUrl: text("reference_image_url"),
  size: text("size").default("1024x1024"),
  missionType: text("mission_type").default("pengy_redemption"), // For tracking which mission
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertGeneratedImageSchema = createInsertSchema(
  generatedImages,
).omit({
  id: true,
  createdAt: true,
});

export type GeneratedImage = typeof generatedImages.$inferSelect;
export type InsertGeneratedImage = z.infer<typeof insertGeneratedImageSchema>;

export const projectSubmissions = pgTable("project_submissions", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  userName: text("user_name").notNull(),
  missionId: text("mission_id").notNull(),
  projectId: text("project_id").notNull(),
  projectName: text("project_name").notNull(),
  url: text("url").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const projectSubmissionVotes = pgTable("project_submission_votes", {
  id: serial("id").primaryKey(),
  submissionId: integer("submission_id")
    .notNull()
    .references(() => projectSubmissions.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull(),
  voteType: text("vote_type").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertProjectSubmissionSchema = createInsertSchema(
  projectSubmissions,
).omit({
  id: true,
  createdAt: true,
});

export type ProjectSubmission = typeof projectSubmissions.$inferSelect;
export type InsertProjectSubmission = z.infer<
  typeof insertProjectSubmissionSchema
>;

// Quest progress schema to store user progress
export const quests = pgTable("quests", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .references(() => users.id)
    .notNull(),
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
  userId: integer("user_id")
    .references(() => users.id)
    .notNull(),
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
  userId: integer("user_id")
    .references(() => users.id)
    .notNull(),
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
  progressId: integer("progress_id")
    .references(() => appBuilderProgress.id)
    .notNull(),
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
  progressId: integer("progress_id")
    .references(() => appBuilderProgress.id)
    .notNull(),
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
  imageId: integer("image_id")
    .references(() => galleryImages.id)
    .notNull(),
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
  // Added fields for student information tracking
  studentName: text("student_name"),
  studentId: text("student_id"), // For noon code or any unique student identifier
});

// Schema to store HTML projects
export const htmlProjects = pgTable("html_projects", {
  id: serial("id").primaryKey(),
  projectId: text("project_id").notNull().unique(), // Preserve existing project IDs for URL compatibility
  html: text("html").notNull(), // Store the HTML content
  firebaseUid: text("firebase_uid"), // Optional link to user's Firebase ID
  userId: text("user_id").notNull().default("0"), // Made optional with default
  // Note: screenshotUrl removed as it doesn't exist in the current database
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  organization: text("organization").default("main"),
  isFeatured: boolean("is_featured").default(false),
});

// Ali's Addisions
// AI Poll Sessions Table
export const aiPollSessions = pgTable("ai_poll_sessions", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 6 }).notNull().unique(),
  title: varchar("title").notNull(),
  videoEmbed: text("video_embed").notNull(),
  correctAnswer: varchar("correct_answer").notNull(),
  status: varchar("status"),
  createdAt: timestamp("created_at"),
  updatedAt: timestamp("updated_at"),
});

// AI Poll Votes Table
export const aiPollVotes = pgTable("ai_poll_votes", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id"),
  studentName: varchar("student_name").notNull(),
  teacherName: varchar("teacher_name").notNull(),
  gender: varchar("gender").notNull(),
  selectedAnswer: varchar("selected_answer").notNull(),
  isCorrect: boolean("is_correct").notNull(),
  votedAt: timestamp("voted_at"),
});

// AI Poll Relations
export const aiPollSessionsRelations = relations(
  aiPollSessions,
  ({ many }) => ({
    votes: many(aiPollVotes),
  }),
);

export const aiPollVotesRelations = relations(aiPollVotes, ({ one }) => ({
  session: one(aiPollSessions, {
    fields: [aiPollVotes.sessionId],
    references: [aiPollSessions.id],
  }),
}));

export const videoLibrary = pgTable("video_library", {
  code: text("code").primaryKey(),
  title: text("title").notNull(),
  videos: json("videos").notNull(), // Array of {title, embedCode}
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Video Library Tables
export const videoLibrarySessions = pgTable("video_library_sessions", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  title: text("title").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const videoLibraryVideos = pgTable("video_library_videos", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id")
    .notNull()
    .references(() => videoLibrarySessions.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  embedCode: text("embed_code").notNull(),
  order: integer("order").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const textLibrary = pgTable("text_library", {
  code: text("code").primaryKey(),
  title: text("title").notNull(),
  texts: json("texts").notNull(), // Array of {title, content}
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertAiPollSessionSchema = createInsertSchema(
  aiPollSessions,
).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAiPollVoteSchema = createInsertSchema(aiPollVotes).omit({
  id: true,
  votedAt: true,
});

export type InsertAiPollSession = z.infer<typeof insertAiPollSessionSchema>;
export type InsertAiPollVote = z.infer<typeof insertAiPollVoteSchema>;

export type AiPollSession = typeof aiPollSessions.$inferSelect;
export type AiPollVote = typeof aiPollVotes.$inferSelect;

//------------------------------------------------------------------------------------------

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

export const insertAppBuilderStepSchema = createInsertSchema(
  appBuilderSteps,
).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAppBuilderProgressSchema = createInsertSchema(
  appBuilderProgress,
).omit({
  id: true,
  completedAt: true,
  startedAt: true,
  updatedAt: true,
});

export const insertAppBuilderSubmissionSchema = createInsertSchema(
  appBuilderSubmissions,
).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAppBuilderChatHistorySchema = createInsertSchema(
  appBuilderChatHistory,
).omit({
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

export const insertHtmlProjectSchema = createInsertSchema(htmlProjects)
  .omit({
    id: true,
  })
  .extend({
    // Make timestamps optional so they can be explicitly set during imports
    createdAt: z.date().optional(),
    updatedAt: z.date().optional(),
  });

// Define types
// Adding LovableMission types
export const lovableMissionProgress = pgTable("lovable_mission_progress", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id),
  firebaseUid: text("firebase_uid").notNull(),
  currentStep: integer("current_step").default(1),
  hasSubmitted: boolean("has_submitted").default(false),
  projectLink: text("project_link"),
  studentName: text("student_name"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Add dedicated table for Lovable submissions to track projects
export const lovableSubmissions = pgTable("lovable_submissions", {
  id: serial("id").primaryKey(),
  progressId: integer("progress_id").references(
    () => lovableMissionProgress.id,
  ),
  projectLink: text("project_link").notNull(),
  studentName: text("student_name").notNull(),
  studentId: text("student_id"), // Noon code or other student identifier
  projectName: text("project_name"), // Added project name field
  projectType: text("project_type").notNull(), // 'app' or 'game'
  firebaseUid: text("firebase_uid"), // May be null for anonymous submissions
  submissionDate: timestamp("submission_date").defaultNow(),
  finalPrompt: text("final_prompt"), // The finalized prompt used to build the project
  metadata: jsonb("metadata"), // Store any additional metadata about the submission
});

export const lovableMissionChatHistory = pgTable(
  "lovable_mission_chat_history",
  {
    id: serial("id").primaryKey(),
    progressId: integer("progress_id")
      .notNull()
      .references(() => lovableMissionProgress.id),
    role: text("role").notNull(),
    content: text("content").notNull(),
    createdAt: timestamp("created_at").defaultNow(),
  },
);

// Create insert schemas
export const insertLovableMissionProgressSchema = createInsertSchema(
  lovableMissionProgress,
  {
    id: z.number(),
    userId: z.number(),
    firebaseUid: z.string(),
    currentStep: z.number().optional(),
    hasSubmitted: z.boolean().optional(),
    projectLink: z.string().optional(),
    studentName: z.string().optional(),
    createdAt: z.date().optional(),
    updatedAt: z.date().optional(),
  },
).omit({ id: true, createdAt: true, updatedAt: true });

export const insertLovableMissionChatHistorySchema = createInsertSchema(
  lovableMissionChatHistory,
  {
    id: z.number(),
    progressId: z.number(),
    role: z.string(),
    content: z.string(),
    createdAt: z.date().optional(),
  },
).omit({ id: true, createdAt: true });

// Insert schema for LovableSubmissions
export const insertLovableSubmissionSchema = createInsertSchema(
  lovableSubmissions,
  {
    id: z.number(),
    progressId: z.number().optional(),
    projectLink: z.string(),
    studentName: z.string(),
    studentId: z.string().optional(), // Optional Noon code or other student ID
    projectName: z.string().optional(),
    projectType: z.string().refine((val) => ["app", "game"].includes(val), {
      message: "Project type must be either 'app' or 'game'",
    }),
    finalPrompt: z.string().optional(),
    firebaseUid: z.string().optional(),
    submissionDate: z.date().optional(),
    metadata: z.record(z.any()).optional(),
  },
).omit({ id: true, submissionDate: true });

// Video submissions table for student project submissions
export const videoSubmissions = pgTable("video_submissions", {
  id: serial("id").primaryKey(),
  email: text("email").notNull(),
  link: text("link").notNull(),
  projectName: text("project_name").notNull(),
  submittedAt: timestamp("submitted_at").defaultNow().notNull(),
});

// Video generation jobs table for reliable job tracking
export const videoJobs = pgTable("video_jobs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  firebaseUid: text("firebase_uid").notNull(), // For session-based tracking
  facilitatorId: integer("facilitator_id").references(() => facilitators.id),
  sceneNumber: integer("scene_number").notNull().default(1),
  requestHash: text("request_hash").notNull().unique(), // For idempotency
  prompt: text("prompt").notNull(),
  aspectRatio: text("aspect_ratio").notNull().default("16:9"),
  vertexOperation: text("vertex_operation"), // Google operation name
  status: text("status").notNull().default("queued"), // queued|processing|completed|failed|expired
  videoUrl: text("video_url"),
  errorCode: text("error_code"),
  errorMessage: text("error_message"),
  attemptCount: integer("attempt_count").notNull().default(0),
  maxAttempts: integer("max_attempts").notNull().default(10),
  nextCheckAt: timestamp("next_check_at"),
  lastCheckAt: timestamp("last_check_at"),
  completedAt: timestamp("completed_at"),
  expiredAt: timestamp("expired_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Facilitator credential management tables
export const facilitators = pgTable("facilitators", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(), // e.g., "Facilitator Ahmed", "Ms. Sarah"
  vertexProjectId: text("vertex_project_id").notNull(), // Encrypted
  vertexLocation: text("vertex_location").notNull().default("us-central1"), // Encrypted
  vertexServiceAccountJson: text("vertex_service_account_json").notNull(), // Encrypted
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const studentFacilitatorAssignments = pgTable(
  "student_facilitator_assignments",
  {
    studentEmail: text("student_email").primaryKey(), // Primary key - unique student emails
    facilitatorId: integer("facilitator_id")
      .references(() => facilitators.id)
      .notNull(),
    assignedAt: timestamp("assigned_at").defaultNow().notNull(),
    assignedBy: text("assigned_by"), // For audit trail
  },
);

// Insert schemas for facilitator management
export const insertFacilitatorSchema = createInsertSchema(facilitators).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertStudentFacilitatorAssignmentSchema = createInsertSchema(
  studentFacilitatorAssignments,
).omit({
  assignedAt: true,
});

export const insertVideoSubmissionSchema = createInsertSchema(
  videoSubmissions,
).omit({
  id: true,
  submittedAt: true,
});

export const insertVideoJobSchema = createInsertSchema(videoJobs, {
  status: z
    .enum(["queued", "processing", "completed", "failed", "expired"])
    .default("queued"),
  aspectRatio: z.string().default("16:9"),
  sceneNumber: z.number().default(1),
  attemptCount: z.number().default(0),
  maxAttempts: z.number().default(10),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertQuest = z.infer<typeof insertQuestSchema>;
export type InsertProjectIdea = z.infer<typeof insertProjectIdeaSchema>;
export type InsertAppBuilderStep = z.infer<typeof insertAppBuilderStepSchema>;
export type InsertAppBuilderProgress = z.infer<
  typeof insertAppBuilderProgressSchema
>;
export type InsertAppBuilderSubmission = z.infer<
  typeof insertAppBuilderSubmissionSchema
>;
export type InsertAppBuilderChatHistory = z.infer<
  typeof insertAppBuilderChatHistorySchema
>;
export type InsertGalleryImage = z.infer<typeof insertGalleryImageSchema>;
export type InsertGalleryLike = z.infer<typeof insertGalleryLikeSchema>;
export type InsertAssistantLog = z.infer<typeof insertAssistantLogSchema>;
export type InsertHtmlProject = z.infer<typeof insertHtmlProjectSchema>;
export type InsertLovableMissionProgress = z.infer<
  typeof insertLovableMissionProgressSchema
>;
export type InsertLovableMissionChatHistory = z.infer<
  typeof insertLovableMissionChatHistorySchema
>;
export type InsertLovableSubmission = z.infer<
  typeof insertLovableSubmissionSchema
>;
export type InsertFacilitator = z.infer<typeof insertFacilitatorSchema>;
export type InsertStudentFacilitatorAssignment = z.infer<
  typeof insertStudentFacilitatorAssignmentSchema
>;
export type InsertVideoSubmission = z.infer<typeof insertVideoSubmissionSchema>;
export type InsertVideoJob = z.infer<typeof insertVideoJobSchema>;

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
export type LovableMissionChatHistory =
  typeof lovableMissionChatHistory.$inferSelect;
export type LovableSubmission = typeof lovableSubmissions.$inferSelect;
export type Facilitator = typeof facilitators.$inferSelect;
export type StudentFacilitatorAssignment =
  typeof studentFacilitatorAssignments.$inferSelect;
export type VideoSubmission = typeof videoSubmissions.$inferSelect;
export type VideoJob = typeof videoJobs.$inferSelect;

// Tracks Students table for CSV data upload
export const tracksStudents = pgTable("tracks_students", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  studentName: text("student_name").notNull(),
  school: text("school").notNull(),
  gender: text("gender").notNull(),
  grade: text("grade").notNull(),
  supervisor: text("supervisor").notNull(),
  studentEmail: text("student_email").notNull(),
  phoneNumber: varchar("phone_number").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const lovableSubmissionsV2 = pgTable("lovable_submissions_v2", {
  id: serial("id").primaryKey(),
  studentName: text("student_name").notNull(),
  noonCode: text("noon_code"),
  projectTitle: text("project_title").notNull(),
  projectLink: text("project_link").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
  isFeatured: boolean("is_featured").notNull().default(false),
  email: text("email"),
});

export const insertLovableSubmissionV2Schema = createInsertSchema(
  lovableSubmissionsV2,
).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTracksStudentSchema = createInsertSchema(
  tracksStudents,
).omit({
  id: true,
  createdAt: true,
});

export type InsertTracksStudent = z.infer<typeof insertTracksStudentSchema>;
export type TracksStudent = typeof tracksStudents.$inferSelect;
export type LovableSubmissionV2 = typeof lovableSubmissionsV2.$inferSelect;
export type InsertLovableSubmissionV2 = z.infer<
  typeof insertLovableSubmissionV2Schema
>;
