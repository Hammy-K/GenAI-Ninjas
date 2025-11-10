import { clipVotes, clipVoteType } from "./clip-votes.schema";

export type ClipVote = typeof clipVotes.$inferSelect;
export type NewClipVote = typeof clipVotes.$inferInsert;
export type ClipVoteType = (typeof clipVoteType.enumValues)[number];

export interface ToggleVoteInput {
  clipId: number;
  trackStudentEmail: string;
  type: ClipVoteType;
}

export interface ClipCounts {
  heartCount: number;
  laughCount: number;
}

export interface ToggleVoteResult extends ClipCounts {
  action: "added" | "removed";
}
