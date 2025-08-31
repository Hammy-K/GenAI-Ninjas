import { db } from "../db";
import { students } from "../schemas/students";
import { and, or, ilike, eq, desc, asc, count, SQL, sql } from "drizzle-orm";
import type {
  NormalizedPaginationParams,
  PaginatedResponse,
} from "../types/pagination.types";
import { PaginationUtils } from "../utils/pagination.utils";
import { appDevFrontend } from "server/schemas/app_dev_frontend.schema";
import { createProjectId } from "server/utils/common.utils";

type MissionSlug =
  | "inputs-outputs"
  | "buttons-events"
  | "random-selection"
  | "conditional-logic"
  | "layout-design"
  | "dynamic-images";

export interface AppDevFrontendRowWithStudent {
  id: number;
  projectId: string;
  html: string;
  userId: string;
  organization: string;
  isFeatured: boolean;
  mission: MissionSlug;
  createdAt: Date;
  updatedAt: Date;
  student: {
    id: number | null;
    fullName: string | null;
    schoolName: string | null;
    phoneNumber: string | null;
    createdAt: Date | null;
  } | null;
}

export class AppDevFrontendModel {
  private static readonly VALID_SORT_FIELDS = [
    "id",
    "projectId",
    "mission",
    "createdAt",
    "updatedAt",
    "studentName",
  ] as const;

  async find(
    params: NormalizedPaginationParams,
  ): Promise<PaginatedResponse<AppDevFrontendRowWithStudent>> {
    const { page, limit, search, sortBy, sortOrder, filters } = params;

    const offset = (page - 1) * limit;
    const validatedSortBy = PaginationUtils.validateSortField(
      sortBy,
      AppDevFrontendModel.VALID_SORT_FIELDS as unknown as string[],
    );

    const conditions = this.buildWhereConditions(search, filters);
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
    const orderByClause = this.buildOrderByClause(validatedSortBy, sortOrder);

    const [data, totalResult] = await Promise.all([
      this.executeSelectQuery(whereClause, orderByClause, limit, offset),
      this.executeCountQuery(whereClause),
    ]);

    const total = totalResult[0]?.count ?? 0;
    const totalPages = Math.ceil(total / limit);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  }

  async findById(id: number): Promise<AppDevFrontendRowWithStudent | null> {
    const rows = await this.executeSelectQuery(
      eq(appDevFrontend.id, id),
      desc(appDevFrontend.createdAt),
      1,
      0,
    );

    return rows[0] ?? null;
  }

  async findByProjectId(
    projectId: string,
  ): Promise<AppDevFrontendRowWithStudent | null> {
    const rows = await this.executeSelectQuery(
      eq(appDevFrontend.projectId, projectId),
      desc(appDevFrontend.createdAt),
      1,
      0,
    );
    return rows[0] ?? null;
  }

  async create(payload: any): Promise<AppDevFrontendRowWithStudent> {
    const projectId = createProjectId();

    payload.projectId = projectId;

    const [row] = await db.insert(appDevFrontend).values(payload).returning();

    return { ...row, student: null } as AppDevFrontendRowWithStudent;
  }

  async update(
    id: number,
    payload: any,
  ): Promise<AppDevFrontendRowWithStudent | null> {
    const [row] = await db
      .update(appDevFrontend)
      .set({ ...payload, updatedAt: sql`now()` })
      .where(eq(appDevFrontend.id, id))
      .returning();
    return row
      ? ({ ...row, student: null } as AppDevFrontendRowWithStudent)
      : null;
  }

  async delete(id: number): Promise<{ success: boolean }> {
    await db.delete(appDevFrontend).where(eq(appDevFrontend.id, id));

    return { success: true };
  }

  // ----------- Helpers -----------

  private buildWhereConditions(
    search?: string,
    filters: Record<string, any> = [],
  ): SQL[] {
    const conditions: SQL[] = [];

    if (search) {
      const searchConditions: SQL[] = [];

      if (students.fullName) {
        searchConditions.push(ilike(students.fullName, `%${search}%`));
      }

      if (students.schoolName) {
        searchConditions.push(ilike(students.schoolName, `%${search}%`));
      }

      if (students.phoneNumber) {
        searchConditions.push(ilike(students.phoneNumber, `%${search}%`));
      }

      const orCondition =
        searchConditions.length > 0 ? or(...searchConditions) : undefined;

      if (orCondition) conditions.push(orCondition);
    }

    if (filters.userId)
      conditions.push(eq(appDevFrontend.userId, filters.userId));

    if (filters.organization)
      conditions.push(eq(appDevFrontend.organization, filters.organization));

    if (filters.mission)
      conditions.push(
        eq(appDevFrontend.mission, filters.mission as MissionSlug),
      );

    if (typeof filters.isFeatured === "boolean")
      conditions.push(eq(appDevFrontend.isFeatured, filters.isFeatured));

    if (filters.schoolName)
      conditions.push(ilike(students.schoolName, `%${filters.schoolName}%`));

    conditions.push(sql`${students.id} IS NOT NULL`);

    return conditions;
  }

  private buildOrderByClause(sortBy: string, sortOrder: "asc" | "desc") {
    const orderFn = sortOrder === "desc" ? desc : asc;

    switch (sortBy) {
      case "studentName":
        return orderFn(students.fullName);
      case "projectId":
        return orderFn(appDevFrontend.projectId);
      case "mission":
        return orderFn(appDevFrontend.mission);
      case "updatedAt":
        return orderFn(appDevFrontend.updatedAt);
      case "id":
        return orderFn(appDevFrontend.id);
      default:
        return orderFn(appDevFrontend.createdAt);
    }
  }

  private async executeSelectQuery(
    whereClause: SQL | undefined,
    orderByClause: any,
    limit: number,
    offset: number,
  ): Promise<AppDevFrontendRowWithStudent[]> {
    const result = await db
      .select({
        id: appDevFrontend.id,
        projectId: appDevFrontend.projectId,
        html: appDevFrontend.html,
        userId: appDevFrontend.userId,
        createdAt: appDevFrontend.createdAt,
        updatedAt: appDevFrontend.updatedAt,
        organization: appDevFrontend.organization,
        isFeatured: appDevFrontend.isFeatured,
        mission: appDevFrontend.mission,
        student: {
          id: students.id,
          fullName: students.fullName,
          schoolName: students.schoolName,
          phoneNumber: students.phoneNumber,
          createdAt: students.createdAt,
        },
      })
      .from(appDevFrontend)
      .leftJoin(
        students,
        eq(appDevFrontend.userId, sql`(${students.id})::text` as SQL),
      )
      .where(whereClause)
      .orderBy(orderByClause)
      .limit(limit)
      .offset(offset);

    return result as AppDevFrontendRowWithStudent[];
  }

  private async executeCountQuery(
    whereClause: SQL | undefined,
  ): Promise<{ count: number }[]> {
    return db
      .select({ count: count() })
      .from(appDevFrontend)
      .leftJoin(
        students,
        eq(appDevFrontend.userId, sql`(${students.id})::text` as SQL),
      )
      .where(whereClause);
  }
}
