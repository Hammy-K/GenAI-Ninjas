import { db } from "../db";
import { and, or, ilike, eq, isNull, desc, asc, count, sql } from "drizzle-orm";
import { genaiSchoolTraining } from "server/schemas/genai_school_training.schema";
import {
  FindOptions,
  normalizeLimitOffset,
  PaginatedResult,
} from "server/types/common.types";

export type GenaiSchoolTraining = typeof genaiSchoolTraining.$inferSelect;
export type NewGenaiSchoolTraining = typeof genaiSchoolTraining.$inferInsert;

export interface GenaiSchoolTrainingWhere extends Record<string, unknown> {
  id?: number;
  schoolId?: number | null;
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string | null;
}

export type GenaiSchoolTrainingFindOptions =
  FindOptions<GenaiSchoolTrainingWhere> & {
    /** constrain by list of IDs */
    ids?: number[];
  };

function col(
  key:
    | keyof GenaiSchoolTrainingWhere
    | "createdAt"
    | "updatedAt"
    | "id"
    | "schoolId"
    | "contactName",
) {
  switch (key) {
    case "id":
      return genaiSchoolTraining.id;
    case "schoolId":
      return genaiSchoolTraining.schoolId;
    case "contactName":
      return genaiSchoolTraining.contactName;
    case "contactPhone":
      return genaiSchoolTraining.contactPhone;
    case "contactEmail":
      return genaiSchoolTraining.contactEmail;
    case "createdAt":
      return genaiSchoolTraining.createdAt;
    case "updatedAt":
      return genaiSchoolTraining.updatedAt;
    default:
      return genaiSchoolTraining.createdAt;
  }
}

function buildWhere(opts?: GenaiSchoolTrainingFindOptions) {
  const conditions: any[] = [];

  if (!opts?.withDeleted) {
    conditions.push(isNull(genaiSchoolTraining.deletedAt));
  }

  const w = opts?.where;

  if (w) {
    if (w.id !== undefined) conditions.push(eq(genaiSchoolTraining.id, w.id));

    if (w.schoolId !== undefined) {
      if (w.schoolId === null) {
        conditions.push(isNull(genaiSchoolTraining.schoolId));
      } else {
        conditions.push(eq(genaiSchoolTraining.schoolId, w.schoolId));
      }
    }

    if (w.contactName)
      conditions.push(
        ilike(genaiSchoolTraining.contactName, `%${w.contactName}%`),
      );

    if (w.contactPhone)
      conditions.push(
        ilike(genaiSchoolTraining.contactPhone, `%${w.contactPhone}%`),
      );

    if (w.contactEmail)
      conditions.push(
        ilike(genaiSchoolTraining.contactEmail, `%${w.contactEmail}%`),
      );
  }

  if (opts?.ids && opts.ids.length > 0) {
    conditions.push(sql`${genaiSchoolTraining.id} = ANY(${opts.ids})`);
  }

  const search = opts?.search?.trim();

  if (search) {
    const s = `%${search}%`;

    conditions.push(
      or(
        ilike(genaiSchoolTraining.contactName, s),
        ilike(genaiSchoolTraining.contactPhone, s),
        ilike(genaiSchoolTraining.contactEmail, s),
        ilike(genaiSchoolTraining.note, s),
      ),
    );
  }

  if (conditions.length === 0) return undefined;

  return and(...conditions);
}

export const GenaiSchoolTrainingModel = {
  async create(data: NewGenaiSchoolTraining): Promise<GenaiSchoolTraining> {
    const [row] = await db.insert(genaiSchoolTraining).values(data).returning();
    return row;
  },

  async update(
    id: number,
    data: Partial<NewGenaiSchoolTraining>,
  ): Promise<GenaiSchoolTraining | null> {
    const [row] = await db
      .update(genaiSchoolTraining)
      .set({ ...data, updatedAt: sql`now()` })
      .where(eq(genaiSchoolTraining.id, id))
      .returning();

    return row ?? null;
  },

  async delete(
    id: number,
    opts?: { hard?: boolean },
  ): Promise<{ success: boolean }> {
    if (opts?.hard) {
      await db
        .delete(genaiSchoolTraining)
        .where(eq(genaiSchoolTraining.id, id));

      return { success: true };
    }

    await db
      .update(genaiSchoolTraining)
      .set({ deletedAt: sql`now()`, updatedAt: sql`now()` })
      .where(eq(genaiSchoolTraining.id, id));

    return { success: true };
  },

  async findById(
    id: number,
    opts?: { withDeleted?: boolean },
  ): Promise<GenaiSchoolTraining | null> {
    const where = buildWhere({ where: { id }, withDeleted: opts?.withDeleted });
    const [row] = await db
      .select()
      .from(genaiSchoolTraining)
      .where(where)
      .limit(1);

    return row ?? null;
  },

  async find(
    options?: GenaiSchoolTrainingFindOptions,
  ): Promise<PaginatedResult<GenaiSchoolTraining>> {
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
      .from(genaiSchoolTraining)
      .where(where);

    const rows = await db
      .select()
      .from(genaiSchoolTraining)
      .where(where)
      .orderBy(orderDir)
      .offset(offset)
      .limit(limit);

    return { rows, count: total, limit, offset };
  },
};
