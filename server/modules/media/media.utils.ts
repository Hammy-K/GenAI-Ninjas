export function getIsProd(): boolean {
  const appEnv = process.env.NODE_ENV || "development";

  return appEnv === "production";
}

export function normalizeLimitOffset(
  limit?: number,
  offset?: number,
  defaults: { limit?: number; maxLimit?: number } = {
    limit: 30,
    maxLimit: 100,
  },
) {
  const lim =
    typeof limit === "number" && limit > 0
      ? Math.min(limit, defaults.maxLimit ?? 100)
      : (defaults.limit ?? 30);

  const off = typeof offset === "number" && offset >= 0 ? offset : 0;

  return { limit: lim, offset: off };
}

export type OrderDirection = "asc" | "desc";

export function toOrderDir(input?: string): OrderDirection {
  return input === "asc" ? "asc" : "desc";
}
