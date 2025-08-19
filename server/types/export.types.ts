export type HtmlProjectsExportFilters = {
  organization?: string; // undefined means "all"
  from?: string; // ISO string, inclusive
  to?: string; // ISO string, exclusive
  school?: string;
  name?: string;
  topNPerStudent?: number; // default 1
};

export type HtmlProjectsExportRow = {
  userId: string;
  phoneNumber: string;
  fullName: string;
  projectLink: string;
  projectCreatedAt: string; // timestamptz from DB
};
