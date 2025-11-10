import {
  pgTable,
  serial,
  boolean,
  text,
  timestamp,
  index,
} from "drizzle-orm/pg-core";

export const clips = pgTable(
  "clips",
  {
    id: serial("id").primaryKey(),
    isProd: boolean("is_prod").notNull().default(false),
    trackStudentEmail: text("track_student_email").notNull(),
    title: text("title").notNull(),
    clipUrl: text("clip_url").notNull(),
    isFeatured: boolean("is_featured").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (t) => ({
    idxEnvCreated: index("idx_clips_env_created").on(t.isProd, t.createdAt),
    idxEnvEmail: index("idx_clips_env_email").on(t.isProd, t.trackStudentEmail),
  }),
);
