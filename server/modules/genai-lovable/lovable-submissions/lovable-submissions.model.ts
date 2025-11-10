import { db } from "server/db";
import { and, or, ilike, eq, isNull, desc, asc, count, sql } from "drizzle-orm";
import { lovableSubmissionsV2 } from "./lovable-submissions.schema";
import {
  FindOptions,
  normalizeLimitOffset,
  PaginatedResult,
} from "server/types/common.types";

export type LovableSubmission = typeof lovableSubmissionsV2.$inferSelect;
export type NewLovableSubmission = typeof lovableSubmissionsV2.$inferInsert;

export interface LovableSubmissionWhere extends Record<string, unknown> {
  id?: number;
  search?: string;
  studentName?: string;
  schoolName?: string;
  noonCode?: string;
  email?: string;
  projectTitle?: string;
  projectLink?: string;
  isFeatured?: boolean;
}

export type LovableSubmissionFindOptions =
  FindOptions<LovableSubmissionWhere> & {
    ids?: number[];
  };

function col(
  key: keyof LovableSubmissionWhere | "createdAt" | "updatedAt" | "id",
) {
  switch (key) {
    case "id":
      return lovableSubmissionsV2.id;
    case "studentName":
      return lovableSubmissionsV2.studentName;
    case "schoolName":
      return lovableSubmissionsV2.studentName;
    case "noonCode":
      return lovableSubmissionsV2.noonCode;
    case "projectTitle":
      return lovableSubmissionsV2.projectTitle;
    case "projectLink":
      return lovableSubmissionsV2.projectLink;
    case "email":
      return lovableSubmissionsV2.email;
    case "isFeatured":
      return lovableSubmissionsV2.isFeatured;
    case "createdAt":
      return lovableSubmissionsV2.createdAt;
    case "updatedAt":
      return lovableSubmissionsV2.updatedAt;
    default:
      return lovableSubmissionsV2.createdAt;
  }
}

function buildWhere(opts?: LovableSubmissionFindOptions) {
  const conditions: any[] = [];

  if (!opts?.withDeleted)
    conditions.push(isNull(lovableSubmissionsV2.deletedAt));

  if (opts) {
    // if (opts?.ids !== undefined) conditions.push(eq(lovableSubmissionsV2.id, w.id));

    if (opts.isFeatured !== undefined) {
      conditions.push(eq(lovableSubmissionsV2.isFeatured, opts.isFeatured));
    }
  }

  if (opts?.ids && opts.ids.length > 0) {
    conditions.push(sql`${lovableSubmissionsV2.id} = ANY(${opts.ids})`);
  }

  const search = opts?.search?.trim();

  if (search) {
    conditions.push(
      or(
        ilike(lovableSubmissionsV2.studentName, `%${search}%`),
        ilike(lovableSubmissionsV2.schoolName, `%${search}%`),
        ilike(lovableSubmissionsV2.projectTitle, `%${search}%`),
        ilike(lovableSubmissionsV2.noonCode, `%${search}%`),
        ilike(lovableSubmissionsV2.email, `%${search}%`),
      ),
    );
  }

  conditions.push(
    or(
      isNull(lovableSubmissionsV2.studentName),
      sql`lower(${lovableSubmissionsV2.studentName}) NOT LIKE 'noon%'`,
      sql`lower(${lovableSubmissionsV2.schoolName}) NOT LIKE 'noon%'`,
    ),
  );

  if (conditions.length === 0) return undefined;

  return and(...conditions);
}

export const LovableSubmissionsModel = {
  async create(data: NewLovableSubmission): Promise<LovableSubmission> {
    const [row] = await db
      .insert(lovableSubmissionsV2)
      .values(data)
      .returning();
    return row;
  },

  async update(
    id: number,
    data: Partial<NewLovableSubmission>,
  ): Promise<LovableSubmission | null> {
    const [row] = await db
      .update(lovableSubmissionsV2)
      .set({ ...data, updatedAt: sql`now()` })
      .where(eq(lovableSubmissionsV2.id, id))
      .returning();

    return row ?? null;
  },

  async delete(
    id: number,
    opts?: { hard?: boolean },
  ): Promise<{ success: boolean }> {
    if (opts?.hard) {
      await db
        .delete(lovableSubmissionsV2)
        .where(eq(lovableSubmissionsV2.id, id));

      return { success: true };
    }

    await db
      .update(lovableSubmissionsV2)
      .set({ deletedAt: sql`now()`, updatedAt: sql`now()` })
      .where(eq(lovableSubmissionsV2.id, id));

    return { success: true };
  },

  async findById(
    id: number,
    opts?: { withDeleted?: boolean },
  ): Promise<LovableSubmission | null> {
    const where = buildWhere({ where: { id }, withDeleted: opts?.withDeleted });

    const [row] = await db
      .select()
      .from(lovableSubmissionsV2)
      .where(where)
      .limit(1);

    return row ?? null;
  },

  async find(
    options?: LovableSubmissionFindOptions,
  ): Promise<PaginatedResult<LovableSubmission>> {
    const { limit, offset } = normalizeLimitOffset(
      options?.limit,
      options?.offset,
    );

    const where = buildWhere(options);

    const orderCol = col((options?.orderBy as any) ?? "createdAt");

    const orderDir =
      (options?.orderDirection ?? "desc") === "asc"
        ? asc(orderCol)
        : desc(orderCol);

    const [{ total }] = await db
      .select({ total: count() })
      .from(lovableSubmissionsV2)
      .where(where);

    const rows = await db
      .select()
      .from(lovableSubmissionsV2)
      .where(where)
      .orderBy(orderDir)
      .offset(offset)
      .limit(limit);

    return { rows, count: total, limit, offset };
  },
};
