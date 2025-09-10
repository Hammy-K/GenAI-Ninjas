import { db } from "server/db";
import { and, or, ilike, eq, isNull, desc, asc, count, sql } from "drizzle-orm";
import { lovableSubmissions } from "./lovable-submissions.schema";
import {
  FindOptions,
  normalizeLimitOffset,
  PaginatedResult,
} from "server/types/common.types";

export type LovableSubmission = typeof lovableSubmissions.$inferSelect;
export type NewLovableSubmission = typeof lovableSubmissions.$inferInsert;

export interface LovableSubmissionWhere {
  id?: number;
  studentName?: string;
  noonCode?: string;
  projectTitle?: string;
  projectLink?: string;
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
      return lovableSubmissions.id;
    case "studentName":
      return lovableSubmissions.studentName;
    case "noonCode":
      return lovableSubmissions.noonCode;
    case "projectTitle":
      return lovableSubmissions.projectTitle;
    case "projectLink":
      return lovableSubmissions.projectLink;
    case "createdAt":
      return lovableSubmissions.createdAt;
    case "updatedAt":
      return lovableSubmissions.updatedAt;
    default:
      return lovableSubmissions.createdAt;
  }
}

function buildWhere(opts?: LovableSubmissionFindOptions) {
  const conditions: any[] = [];

  if (!opts?.withDeleted) conditions.push(isNull(lovableSubmissions.deletedAt));

  const w = opts?.where;
  if (w) {
    if (w.id !== undefined) conditions.push(eq(lovableSubmissions.id, w.id));

    if (w.studentName)
      conditions.push(
        ilike(lovableSubmissions.studentName, `%${w.studentName}%`),
      );

    if (w.noonCode)
      conditions.push(eq(lovableSubmissions.noonCode, w.noonCode));

    if (w.projectTitle)
      conditions.push(
        ilike(lovableSubmissions.projectTitle, `%${w.projectTitle}%`),
      );

    if (w.projectLink)
      conditions.push(eq(lovableSubmissions.projectLink, w.projectLink));
  }

  if (opts?.ids && opts.ids.length > 0) {
    conditions.push(sql`${lovableSubmissions.id} = ANY(${opts.ids})`);
  }

  const search = opts?.search?.trim();

  if (search) {
    conditions.push(
      or(
        ilike(lovableSubmissions.studentName, `%${search}%`),
        ilike(lovableSubmissions.projectTitle, `%${search}%`),
      ),
    );
  }

  if (conditions.length === 0) return undefined;

  return and(...conditions);
}

export const LovableSubmissionsModel = {
  async create(data: NewLovableSubmission): Promise<LovableSubmission> {
    const [row] = await db.insert(lovableSubmissions).values(data).returning();
    return row;
  },

  async update(
    id: number,
    data: Partial<NewLovableSubmission>,
  ): Promise<LovableSubmission | null> {
    const [row] = await db
      .update(lovableSubmissions)
      .set({ ...data, updatedAt: sql`now()` })
      .where(eq(lovableSubmissions.id, id))
      .returning();

    return row ?? null;
  },

  async delete(
    id: number,
    opts?: { hard?: boolean },
  ): Promise<{ success: boolean }> {
    if (opts?.hard) {
      await db.delete(lovableSubmissions).where(eq(lovableSubmissions.id, id));

      return { success: true };
    }

    await db
      .update(lovableSubmissions)
      .set({ deletedAt: sql`now()`, updatedAt: sql`now()` })
      .where(eq(lovableSubmissions.id, id));

    return { success: true };
  },

  async findById(
    id: number,
    opts?: { withDeleted?: boolean },
  ): Promise<LovableSubmission | null> {
    const where = buildWhere({ where: { id }, withDeleted: opts?.withDeleted });

    const [row] = await db
      .select()
      .from(lovableSubmissions)
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
      .from(lovableSubmissions)
      .where(where);

    const rows = await db
      .select()
      .from(lovableSubmissions)
      .where(where)
      .orderBy(orderDir)
      .offset(offset)
      .limit(limit);

    return { rows, count: total, limit, offset };
  },
};
