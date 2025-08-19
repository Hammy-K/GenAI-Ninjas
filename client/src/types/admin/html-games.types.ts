export interface HtmlGamesExportParams {
  organization?: string;
  from?: string;
  to?: string;
  school?: string;
  name?: string;
  n?: number;
}

export type HtmlGamesExportFormData = {
  organization: "all" | "main" | "ffm";
  from: string;
  to: string;
  school: string;
  name: string;
  n: string;
};
