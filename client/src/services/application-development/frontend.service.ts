export type FrontendSubMission =
  | "inputs-outputs"
  | "buttons-events"
  | "random-selection"
  | "conditional-logic"
  | "layout-design"
  | "dynamic-images";

export type FrontendSortBy =
  | "id"
  | "projectId"
  | "mission"
  | "createdAt"
  | "updatedAt"
  | "studentName";

export type SortOrder = "asc" | "desc";

export interface StudentMeta {
  id: number | null;
  fullName: string | null;
  schoolName: string | null;
  phoneNumber: string | null;
  createdAt: string | null;
}

export interface FrontendProject {
  id: number;
  projectId: string;
  userId: string;
  organization: string;
  isFeatured: boolean;
  mission: FrontendSubMission;
  html: string;
  createdAt: string;
  updatedAt: string;
  student: StudentMeta | null;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface Paginated<T> {
  data: T[];
  pagination: PaginationMeta;
}

export interface FrontendListParams {
  organization: string;
  page?: number;
  limit?: number;
  search?: string;
  mission: FrontendSubMission;
  isFeatured?: boolean;
  sortBy?: FrontendSortBy;
  sortOrder?: SortOrder;
}

function toQuery(params: Record<string, any>): string {
  const entries = Object.entries(params).filter(
    ([, v]) => v !== undefined && v !== null && v !== "",
  );

  if (!entries.length) return "";

  const qs = entries
    .map(
      ([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`,
    )
    .join("&");

  return `?${qs}`;
}

async function httpGet<T>(url: string): Promise<T> {
  const res = await fetch(url, { method: "GET" });

  if (!res.ok) {
    const text = await res.text().catch(() => "");

    throw new Error(text || `Request failed: ${res.status}`);
  }

  return res.json() as Promise<T>;
}

export async function listFrontendProjects(
  args: FrontendListParams,
): Promise<Paginated<FrontendProject>> {
  const {
    organization,
    page = 1,
    limit = 30,
    search,
    mission,
    isFeatured,
    sortBy,
    sortOrder,
  } = args;

  const q = toQuery({
    page,
    limit,
    sortBy: sortBy ?? "createdAt",
    sortOrder: sortOrder ?? "desc",
    search,
    // filters:
    organization,
    mission,
    isFeatured,
  });

  return httpGet<Paginated<FrontendProject>>(`/api/app-dev/frontend${q}`);
}

export async function listFeaturedFrontendProjects(
  args: Omit<FrontendListParams, "isFeatured">,
) {
  return listFrontendProjects({ ...args, isFeatured: true });
}
