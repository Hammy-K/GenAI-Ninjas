export type OrderDirection = "asc" | "desc";

export interface LimitOffset {
  limit?: number; // default applied if undefined
  offset?: number; // default = 0
}

export interface PaginatedResult<T> {
  rows: T[];
  count: number;
  limit: number;
  offset: number;
}

export interface FindOptions<
  F extends Record<string, unknown> = Record<string, unknown>,
> {
  /** structured filters mapped 1:1 to columns */
  where?: Partial<F>;
  /** free-text search */
  search?: string;
  /** order by a known field */
  orderBy?: keyof F | "createdAt" | "updatedAt" | "id";
  orderDirection?: OrderDirection;
  /** limit/offset style pagination */
  limit?: number;
  offset?: number;
  /** include soft-deleted rows */
  withDeleted?: boolean;
  isFeatured?: boolean;
}

export function normalizeLimitOffset(
  limit?: number,
  offset?: number,
): { limit: number; offset: number } {
  return {
    limit: Math.min(500, Math.max(1, Number(limit ?? 25))),
    offset: Math.max(0, Number(offset ?? 0)),
  };
}
