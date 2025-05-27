export class PaginationUtils {
  private static readonly DEFAULT_PAGE = 1;
  private static readonly DEFAULT_LIMIT = 10;
  private static readonly MAX_LIMIT = 100;
  private static readonly DEFAULT_SORT_BY = "createdAt";
  private static readonly DEFAULT_SORT_ORDER = "desc" as const;

  static normalizePaginationParams(
    params: PaginationQueryParams,
  ): NormalizedPaginationParams {
    const {
      page = this.DEFAULT_PAGE,
      limit = this.DEFAULT_LIMIT,
      search,
      sortBy = this.DEFAULT_SORT_BY,
      sortOrder = this.DEFAULT_SORT_ORDER,
      ...otherFilters
    } = params;

    // Build filters object, only including defined values
    const filters: Record<string, any> = {};
    
    Object.keys(otherFilters).forEach((key) => {
      if (
        otherFilters[key] !== undefined &&
        otherFilters[key] !== null &&
        otherFilters[key] !== ""
      ) {
        filters[key] = otherFilters[key];
      }
    });

    return {
      page: Math.max(1, page),
      limit: Math.min(Math.max(1, limit), this.MAX_LIMIT),
      search: search?.trim() || undefined,
      sortBy,
      sortOrder,
      filters,
    };
  }

  static validateSortField(sortBy: string, validFields: string[]): string {
    return validFields.includes(sortBy) ? sortBy : this.DEFAULT_SORT_BY;
  }
}
