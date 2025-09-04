export type Video = {
  id: string;
  slug: string;
  title: string;
  description?: string;
  duration?: string; // "12:45" (optional, purely display)
  author?: string;
  tags?: string[];
  publishedAt?: string; // ISO or "YYYY-MM-DD"
};

export type Category = {
  /** URL-safe slug used in routes & tab keys (unique) */
  slug: string;
  /** Friendly name shown in tabs/cards */
  title: string;
  description?: string;
  /** For ordering tabs; lower comes first */
  order?: number;
  /** Optional: you can later use to auto-populate from playlist */
  playlistId?: string;
  videos: Video[];
};
