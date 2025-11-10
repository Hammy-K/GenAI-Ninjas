export type Clip = {
  id: number;
  isProd: boolean;
  isFeatured: boolean;
  trackStudentEmail: string;
  title: string;
  clipUrl: string;
  createdAt: string;
  deletedAt: string | null;
  heartCount: number;
  laughCount: number;
};

export type ClipWithMeta = Clip & {
  studentName?: string | null;
  schoolName?: string | null;
  hasHeart?: boolean;
  hasLaugh?: boolean;
};

export type ClipListResponse = {
  ok: true;
  rows: ClipWithMeta[];
  count: number;
  limit: number;
  offset: number;
};

export type ClipVoteType = "heart" | "laugh";

export type ToggleVoteResponse = {
  ok: true;
  action: "added" | "removed";
  heartCount: number;
  laughCount: number;
};
