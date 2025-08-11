import { db } from "../db";
import { htmlProjects } from "../../shared/schema";
import { students } from "../schemas/students";
import {
  and,
  or,
  ilike,
  eq,
  desc,
  asc,
  count,
  SQL,
  sql,
  inArray,
} from "drizzle-orm";
import type {
  NormalizedPaginationParams,
  PaginatedResponse,
} from "../types/pagination.types";
import {
  HtmlProject,
  HtmlProjectWithStudent,
} from "../types/htmlProject.types";
import { PaginationUtils } from "../utils/pagination.utils";

export class HtmlProjectRepository {
  private static readonly VALID_SORT_FIELDS = [
    "id",
    "projectId",
    "createdAt",
    "updatedAt",
    "studentName", // Virtual field for student name sorting
  ];

  async findAllProjectsWithPagination(
    params: NormalizedPaginationParams,
  ): Promise<PaginatedResponse<HtmlProjectWithStudent>> {
    const { page, limit, search, sortBy, sortOrder, filters } = params;

    const offset = (page - 1) * limit;

    const validatedSortBy = PaginationUtils.validateSortField(
      sortBy,
      HtmlProjectRepository.VALID_SORT_FIELDS,
    );

    const conditions = this.buildWhereConditions(search, filters);

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const orderByClause = this.buildOrderByClause(validatedSortBy, sortOrder);

    const [data, totalResult] = await Promise.all([
      this.executeSelectQuery(whereClause, orderByClause, limit, offset),
      this.executeCountQuery(whereClause),
    ]);

    const total = totalResult[0].count;

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

  private buildWhereConditions(
    search?: string,
    filters: Record<string, any> = [],
  ): SQL[] {
    const conditions: SQL[] = [];

    if (search) {
      const searchConditions = [];

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

      if (orCondition) {
        conditions.push(orCondition);
      }
    }

    if (filters.userId) {
      conditions.push(eq(htmlProjects.userId, filters.userId));
    }

    if (filters.firebaseUid) {
      conditions.push(eq(htmlProjects.firebaseUid, filters.firebaseUid));
    }

    if (filters.schoolName) {
      conditions.push(ilike(students.schoolName, `%${filters.schoolName}%`));
    }

    conditions.push(sql`${students.id} IS NOT NULL`);

    return conditions;
  }

  private buildOrderByClause(sortBy: string, sortOrder: "asc" | "desc") {
    const orderFunction = sortOrder === "desc" ? desc : asc;

    switch (sortBy) {
      case "studentName":
        return orderFunction(students.fullName);
      case "projectId":
        return orderFunction(htmlProjects.projectId);
      case "updatedAt":
        return orderFunction(htmlProjects.updatedAt);
      case "id":
        return orderFunction(htmlProjects.id);
      default:
        return orderFunction(htmlProjects.createdAt);
    }
  }

  private async executeSelectQuery(
    whereClause: SQL | undefined,
    orderByClause: any,
    limit: number,
    offset: number,
  ): Promise<HtmlProjectWithStudent[]> {
    const result = await db
      .select({
        // HTML Project fields
        id: htmlProjects.id,
        projectId: htmlProjects.projectId,
        html: htmlProjects.html,
        firebaseUid: htmlProjects.firebaseUid,
        userId: htmlProjects.userId,
        createdAt: htmlProjects.createdAt,
        updatedAt: htmlProjects.updatedAt,
        organization: htmlProjects.organization,
        // Student fields (nested object)
        student: {
          id: students.id,
          fullName: students.fullName,
          schoolName: students.schoolName,
          phoneNumber: students.phoneNumber,
          createdAt: students.createdAt,
        },
      })
      .from(htmlProjects)
      .leftJoin(
        students,
        eq(htmlProjects.userId, sql`(${students.id})::text` as SQL),
      )
      .where(whereClause)
      .orderBy(orderByClause)
      // .limit(limit)
      .limit(30)
      .offset(offset);

    return result as HtmlProjectWithStudent[];
  }

  private async executeCountQuery(
    whereClause: SQL | undefined,
  ): Promise<{ count: number }[]> {
    return db
      .select({ count: count() })
      .from(htmlProjects)
      .leftJoin(
        students,
        eq(htmlProjects.userId, sql`(${students.id})::text` as SQL),
      )
      .where(whereClause);
  }

  async findProjectsByIds(
    projectIds: string[],
  ): Promise<HtmlProjectWithStudent[]> {
    if (!projectIds || projectIds.length === 0) {
      return [];
    }

    const result = await db
      .select({
        // HTML Project fields
        id: htmlProjects.id,
        projectId: htmlProjects.projectId,
        html: htmlProjects.html,
        firebaseUid: htmlProjects.firebaseUid,
        userId: htmlProjects.userId,
        createdAt: htmlProjects.createdAt,
        updatedAt: htmlProjects.updatedAt,
        organization: htmlProjects.organization,
        // Student fields (nested object)
        student: {
          id: students.id,
          fullName: students.fullName,
          schoolName: students.schoolName,
          phoneNumber: students.phoneNumber,
          createdAt: students.createdAt,
        },
      })
      .from(htmlProjects)
      .leftJoin(
        students,
        eq(htmlProjects.userId, sql`(${students.id})::text` as SQL),
      )
      .where(
        and(
          inArray(htmlProjects.projectId, projectIds),
          sql`${students.id} IS NOT NULL`,
        ),
      )
      .orderBy(desc(htmlProjects.createdAt));

    return result as HtmlProjectWithStudent[];
  }

  // Keep existing method for backward compatibility
  async getAllHtmlProjects(): Promise<HtmlProject[]> {
    return db.select().from(htmlProjects).orderBy(desc(htmlProjects.createdAt));
  }
}
