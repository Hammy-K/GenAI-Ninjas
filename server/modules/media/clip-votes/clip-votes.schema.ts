import {
  pgTable,
  serial,
  boolean,
  integer,
  text,
  timestamp,
  index,
  uniqueIndex,
  pgEnum,
} from "drizzle-orm/pg-core";
import { clips } from "../clips/clips.schema";

export const clipVoteType = pgEnum("clip_vote_type", ["heart", "laugh"]);

export const clipVotes = pgTable(
  "clip_votes",
  {
    id: serial("id").primaryKey(),
    isProd: boolean("is_prod").notNull().default(false),
    clipId: integer("clip_id")
      .notNull()
      .references(() => clips.id, { onDelete: "cascade" }),
    trackStudentEmail: text("track_student_email").notNull(),
    type: clipVoteType("type").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    uniqVote: uniqueIndex("uq_clip_vote").on(
      t.isProd,
      t.clipId,
      t.trackStudentEmail,
      t.type,
    ),
    idxClipType: index("idx_votes_clip_type").on(t.clipId, t.type),
    idxEnvEmail: index("idx_votes_env_email").on(t.isProd, t.trackStudentEmail),
  }),
);
