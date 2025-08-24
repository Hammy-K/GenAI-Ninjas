import { db } from "../db";
import { and, or, ilike, eq, isNull, desc, asc, count, sql } from "drizzle-orm";
import { schools } from "../schemas/schools";
import {
  FindOptions,
  normalizeLimitOffset,
  PaginatedResult,
} from "server/types/common.types";

export type School = typeof schools.$inferSelect;
export type NewSchool = typeof schools.$inferInsert;

export interface SchoolWhere {
  id: number;
  name: string;
  country: string; // ISO alpha-2
  category: string | null;
  curriculum: string | null;
  gender: string | null;
  city: string | null;
  district: string | null;
}

export type SchoolFindOptions = FindOptions<SchoolWhere> & {
  /** constrain by list of IDs */
  ids?: number[];
};

function col(key: keyof SchoolWhere | "createdAt" | "updatedAt" | "id") {
  switch (key) {
    case "id":
      return schools.id;
    case "name":
      return schools.name;
    case "country":
      return schools.country;
    case "category":
      return schools.category;
    case "curriculum":
      return schools.curriculum;
    case "gender":
      return schools.gender;
    case "city":
      return schools.city;
    case "district":
      return schools.district;
    case "createdAt":
      return schools.createdAt;
    case "updatedAt":
      return schools.updatedAt;
    default:
      return schools.createdAt;
  }
}

function buildWhere(opts?: SchoolFindOptions) {
  const conditions: any[] = [];

  if (!opts?.withDeleted) {
    conditions.push(isNull(schools.deletedAt));
  }

  const w = opts?.where;
  if (w) {
    if (w.id !== undefined) conditions.push(eq(schools.id, w.id));
    if (w.name) conditions.push(ilike(schools.name, `%${w.name}%`));
    if (w.country) conditions.push(eq(schools.country, w.country));
    if (w.category) conditions.push(eq(schools.category, w.category));
    if (w.curriculum) conditions.push(eq(schools.curriculum, w.curriculum));
    if (w.gender) conditions.push(eq(schools.gender, w.gender));
    if (w.city) conditions.push(eq(schools.city, w.city));
    if (w.district) conditions.push(eq(schools.district, w.district));
  }

  if (opts?.ids && opts.ids.length > 0) {
    conditions.push(sql`${schools.id} = ANY(${opts.ids})`);
  }

  const search = opts?.search?.trim();
  if (search) {
    conditions.push(
      or(
        ilike(schools.name, `%${search}%`),
        ilike(schools.city, `%${search}%`),
        ilike(schools.district, `%${search}%`),
        ilike(schools.category, `%${search}%`),
        ilike(schools.curriculum, `%${search}%`),
      ),
    );
  }

  if (conditions.length === 0) return undefined;
  return and(...conditions);
}

export const SchoolsModel = {
  async create(data: NewSchool): Promise<School> {
    const [row] = await db.insert(schools).values(data).returning();

    return row;
  },

  async update(id: number, data: Partial<NewSchool>): Promise<School | null> {
    const [row] = await db
      .update(schools)
      .set({ ...data, updatedAt: sql`now()` })
      .where(eq(schools.id, id))
      .returning();

    return row ?? null;
  },

  async delete(
    id: number,
    opts?: { hard?: boolean },
  ): Promise<{ success: boolean }> {
    if (opts?.hard) {
      await db.delete(schools).where(eq(schools.id, id));

      return { success: true };
    }

    await db
      .update(schools)
      .set({ deletedAt: sql`now()`, updatedAt: sql`now()` })
      .where(eq(schools.id, id));

    return { success: true };
  },

  async findById(
    id: number,
    opts?: { withDeleted?: boolean },
  ): Promise<School | null> {
    const where = buildWhere({ where: { id }, withDeleted: opts?.withDeleted });

    const [row] = await db.select().from(schools).where(where).limit(1);

    return row ?? null;
  },

  async find(options?: SchoolFindOptions): Promise<PaginatedResult<School>> {
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
      .from(schools)
      .where(where);

    const rows = await db
      .select()
      .from(schools)
      .where(where)
      .orderBy(orderDir)
      .offset(offset)
      .limit(limit);

    return { rows, count: total, limit, offset };
  },
};
