CREATE TABLE "app_builder_chat_history" (
	"id" serial PRIMARY KEY NOT NULL,
	"progress_id" integer NOT NULL,
	"step_number" integer NOT NULL,
	"role" text NOT NULL,
	"content" text NOT NULL,
	"timestamp" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "app_builder_progress" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"firebase_uid" text NOT NULL,
	"current_step" integer DEFAULT 1 NOT NULL,
	"is_completed" boolean DEFAULT false NOT NULL,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "app_builder_steps" (
	"id" serial PRIMARY KEY NOT NULL,
	"step_number" integer NOT NULL,
	"title" text NOT NULL,
	"subtitle" text,
	"content" text NOT NULL,
	"submission_type" text NOT NULL,
	"required_for_progress" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "app_builder_steps_step_number_unique" UNIQUE("step_number")
);
--> statement-breakpoint
CREATE TABLE "app_builder_submissions" (
	"id" serial PRIMARY KEY NOT NULL,
	"progress_id" integer NOT NULL,
	"step_number" integer NOT NULL,
	"submission_content" text NOT NULL,
	"submission_data" jsonb,
	"version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "assistant_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"timestamp" timestamp DEFAULT now() NOT NULL,
	"user_id" integer,
	"firebase_uid" text,
	"device_id" text,
	"user_name" text,
	"session_id" text NOT NULL,
	"thread_id" text NOT NULL,
	"assistant_id" text NOT NULL,
	"model" text NOT NULL,
	"prompt_content" jsonb NOT NULL,
	"response_content" jsonb NOT NULL,
	"tokens" jsonb,
	"error_message" text,
	"student_name" text,
	"student_id" text
);
--> statement-breakpoint
CREATE TABLE "facilitators" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"vertex_project_id" text NOT NULL,
	"vertex_location" text DEFAULT 'us-central1' NOT NULL,
	"vertex_service_account_json" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "gallery_images" (
	"id" serial PRIMARY KEY NOT NULL,
	"image_url" text NOT NULL,
	"student_name" text NOT NULL,
	"mission_number" integer NOT NULL,
	"likes" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"session_id" text,
	"firebase_uid" text
);
--> statement-breakpoint
CREATE TABLE "gallery_likes" (
	"id" serial PRIMARY KEY NOT NULL,
	"image_id" integer NOT NULL,
	"session_id" text NOT NULL,
	"firebase_uid" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "generated_images" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"prompt" text NOT NULL,
	"image_data_url" text NOT NULL,
	"reference_image_url" text,
	"size" text DEFAULT '1024x1024',
	"mission_type" text DEFAULT 'pengy_redemption',
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "html_projects" (
	"id" serial PRIMARY KEY NOT NULL,
	"project_id" text NOT NULL,
	"html" text NOT NULL,
	"firebase_uid" text,
	"user_id" text DEFAULT '0' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"organization" text DEFAULT 'main',
	"is_featured" boolean DEFAULT false,
	CONSTRAINT "html_projects_project_id_unique" UNIQUE("project_id")
);
--> statement-breakpoint
CREATE TABLE "lovable_mission_chat_history" (
	"id" serial PRIMARY KEY NOT NULL,
	"progress_id" integer NOT NULL,
	"role" text NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "lovable_mission_progress" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"firebase_uid" text NOT NULL,
	"current_step" integer DEFAULT 1,
	"has_submitted" boolean DEFAULT false,
	"project_link" text,
	"student_name" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "lovable_submissions" (
	"id" serial PRIMARY KEY NOT NULL,
	"progress_id" integer,
	"project_link" text NOT NULL,
	"student_name" text NOT NULL,
	"student_id" text,
	"project_name" text,
	"project_type" text NOT NULL,
	"firebase_uid" text,
	"submission_date" timestamp DEFAULT now(),
	"final_prompt" text,
	"metadata" jsonb
);
--> statement-breakpoint
CREATE TABLE "lovable_submissions_v2" (
	"id" serial PRIMARY KEY NOT NULL,
	"student_name" text NOT NULL,
	"noon_code" text,
	"project_title" text NOT NULL,
	"project_link" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"is_featured" boolean DEFAULT false NOT NULL,
	"email" text
);
--> statement-breakpoint
CREATE TABLE "project_ideas" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"steps" jsonb NOT NULL,
	"tools" jsonb NOT NULL,
	"difficulty" text NOT NULL,
	"created_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "quests" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"current_stage" integer DEFAULT 1 NOT NULL,
	"xp" integer DEFAULT 0 NOT NULL,
	"unlocked_badges" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"completed_at" text,
	"created_at" text NOT NULL,
	"updated_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "student_facilitator_assignments" (
	"student_email" text PRIMARY KEY NOT NULL,
	"facilitator_id" integer NOT NULL,
	"assigned_at" timestamp DEFAULT now() NOT NULL,
	"assigned_by" text
);
--> statement-breakpoint
CREATE TABLE "tracks_students" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"student_name" text NOT NULL,
	"school" text NOT NULL,
	"gender" text NOT NULL,
	"grade" text NOT NULL,
	"supervisor" text NOT NULL,
	"student_email" text NOT NULL,
	"phone_number" varchar NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"password" text NOT NULL,
	"firebase_uid" text,
	CONSTRAINT "users_username_unique" UNIQUE("username"),
	CONSTRAINT "users_firebase_uid_unique" UNIQUE("firebase_uid")
);
--> statement-breakpoint
CREATE TABLE "video_jobs" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"firebase_uid" text NOT NULL,
	"facilitator_id" integer,
	"scene_number" integer DEFAULT 1 NOT NULL,
	"request_hash" text NOT NULL,
	"prompt" text NOT NULL,
	"aspect_ratio" text DEFAULT '16:9' NOT NULL,
	"vertex_operation" text,
	"status" text DEFAULT 'queued' NOT NULL,
	"video_url" text,
	"error_code" text,
	"error_message" text,
	"attempt_count" integer DEFAULT 0 NOT NULL,
	"max_attempts" integer DEFAULT 10 NOT NULL,
	"next_check_at" timestamp,
	"last_check_at" timestamp,
	"completed_at" timestamp,
	"expired_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "video_jobs_request_hash_unique" UNIQUE("request_hash")
);
--> statement-breakpoint
CREATE TABLE "video_submissions" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"link" text NOT NULL,
	"project_name" text NOT NULL,
	"submitted_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "app_builder_chat_history" ADD CONSTRAINT "app_builder_chat_history_progress_id_app_builder_progress_id_fk" FOREIGN KEY ("progress_id") REFERENCES "public"."app_builder_progress"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app_builder_progress" ADD CONSTRAINT "app_builder_progress_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app_builder_submissions" ADD CONSTRAINT "app_builder_submissions_progress_id_app_builder_progress_id_fk" FOREIGN KEY ("progress_id") REFERENCES "public"."app_builder_progress"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assistant_logs" ADD CONSTRAINT "assistant_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gallery_likes" ADD CONSTRAINT "gallery_likes_image_id_gallery_images_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."gallery_images"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lovable_mission_chat_history" ADD CONSTRAINT "lovable_mission_chat_history_progress_id_lovable_mission_progress_id_fk" FOREIGN KEY ("progress_id") REFERENCES "public"."lovable_mission_progress"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lovable_mission_progress" ADD CONSTRAINT "lovable_mission_progress_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lovable_submissions" ADD CONSTRAINT "lovable_submissions_progress_id_lovable_mission_progress_id_fk" FOREIGN KEY ("progress_id") REFERENCES "public"."lovable_mission_progress"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_ideas" ADD CONSTRAINT "project_ideas_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quests" ADD CONSTRAINT "quests_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_facilitator_assignments" ADD CONSTRAINT "student_facilitator_assignments_facilitator_id_facilitators_id_fk" FOREIGN KEY ("facilitator_id") REFERENCES "public"."facilitators"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "video_jobs" ADD CONSTRAINT "video_jobs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "video_jobs" ADD CONSTRAINT "video_jobs_facilitator_id_facilitators_id_fk" FOREIGN KEY ("facilitator_id") REFERENCES "public"."facilitators"("id") ON DELETE no action ON UPDATE no action;