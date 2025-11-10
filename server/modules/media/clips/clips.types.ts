import type { OrderDirection } from "../media.utils";
import { clips } from "./clips.schema";

export type Clip = typeof clips.$inferSelect;

export type NewClip = typeof clips.$inferInsert;

export interface CreateClipInput {
  trackStudentEmail: string;
  title: string;
  clipUrl: string;
  isFeatured?: boolean;
}

export interface ClipFindOptions {
  search?: string;
  limit?: number;
  offset?: number;
  orderBy?: "createdAt" | "title";
  orderDirection?: OrderDirection;
  withDeleted?: boolean;
  isFeatured?: boolean;
  viewerEmail?: string | null;
}

export type ClipListRow = Clip & {
  heartCount: number;
  laughCount: number;
  hasHeart: boolean;
  hasLaugh: boolean;
};

export interface ClipListResult {
  rows: ClipListRow[];
  count: number;
  limit: number;
  offset: number;
}

export interface ClipByEmailOptions {
  email: string;
  limit?: number;
  withDeleted?: boolean;
  orderBy?: "createdAt" | "title";
  orderDirection?: OrderDirection;
}
