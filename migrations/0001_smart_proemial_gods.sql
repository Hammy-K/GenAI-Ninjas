CREATE TABLE "ai_poll_sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" varchar(6) NOT NULL,
	"title" varchar NOT NULL,
	"video_embed" text NOT NULL,
	"correct_answer" varchar NOT NULL,
	"status" varchar,
	"created_at" timestamp,
	"updated_at" timestamp,
	CONSTRAINT "ai_poll_sessions_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "ai_poll_votes" (
	"id" serial PRIMARY KEY NOT NULL,
	"session_id" integer,
	"student_name" varchar NOT NULL,
	"teacher_name" varchar NOT NULL,
	"gender" varchar NOT NULL,
	"selected_answer" varchar NOT NULL,
	"is_correct" boolean NOT NULL,
	"voted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "project_submission_votes" (
	"id" serial PRIMARY KEY NOT NULL,
	"submission_id" integer NOT NULL,
	"user_id" text NOT NULL,
	"vote_type" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "project_submissions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"user_name" text NOT NULL,
	"mission_id" text NOT NULL,
	"project_id" text NOT NULL,
	"project_name" text NOT NULL,
	"url" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "prompt_challenge_scores" (
	"id" serial PRIMARY KEY NOT NULL,
	"student_name" text NOT NULL,
	"score" integer NOT NULL,
	"prompt" text,
	"session_code" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "text_library" (
	"code" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"texts" json NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "video_library" (
	"code" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"videos" json NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "video_library_sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"title" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "video_library_sessions_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "video_library_videos" (
	"id" serial PRIMARY KEY NOT NULL,
	"session_id" integer NOT NULL,
	"title" text NOT NULL,
	"embed_code" text NOT NULL,
	"order" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "project_submission_votes" ADD CONSTRAINT "project_submission_votes_submission_id_project_submissions_id_fk" FOREIGN KEY ("submission_id") REFERENCES "public"."project_submissions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "video_library_videos" ADD CONSTRAINT "video_library_videos_session_id_video_library_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."video_library_sessions"("id") ON DELETE cascade ON UPDATE no action;