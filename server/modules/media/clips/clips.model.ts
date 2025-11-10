import { db } from "server/db";
import { and, asc, desc, ilike, isNull, sql, eq, count } from "drizzle-orm";
import { clips } from "./clips.schema";
import { getIsProd, normalizeLimitOffset, toOrderDir } from "../media.utils";
import type {
  Clip,
  CreateClipInput,
  ClipFindOptions,
  ClipListResult,
  ClipByEmailOptions,
} from "./clips.types";
import { alias } from "drizzle-orm/pg-core";
import { tracksStudents } from "@shared/schema";

function col<T extends typeof clips>(t: T, key: "createdAt" | "title") {
  switch (key) {
    case "title":
      return t.title;
    case "createdAt":
    default:
      return t.createdAt;
  }
}

export const ClipsModel = {
  async create(input: CreateClipInput): Promise<Clip> {
    const isProd = getIsProd();

    const [row] = await db
      .insert(clips)
      .values({
        isProd,
        trackStudentEmail: input.trackStudentEmail,
        title: input.title,
        clipUrl: input.clipUrl,
        isFeatured: input.isFeatured ?? false,
      })
      .returning();

    return row;
  },

  async softDelete(id: number): Promise<{ success: boolean }> {
    const isProd = getIsProd();

    await db
      .update(clips)
      .set({ deletedAt: sql`now()` })
      .where(and(eq(clips.id, id), eq(clips.isProd, isProd)));

    return { success: true };
  },

  async hardDelete(id: number): Promise<{ success: boolean }> {
    const isProd = getIsProd();

    await db
      .delete(clips)
      .where(and(eq(clips.id, id), eq(clips.isProd, isProd)));

    return { success: true };
  },

  async findById(id: number, opts?: { viewerEmail?: string | null }) {
    const isProd = getIsProd();
    const viewerEmail = opts?.viewerEmail ?? null;

    const rowsRes = await db.execute(sql`
      SELECT
        c.id,
        c.is_prod                  AS "isProd",
        c.is_featured              AS "isFeatured",
        c.track_student_email      AS "trackStudentEmail",
        c.title,
        c.clip_url                 AS "clipUrl",
        c.created_at               AS "createdAt",
        c.deleted_at               AS "deletedAt",
        COALESCE(rc."heartCount", 0)::int  AS "heartCount",
        COALESCE(rc."laughCount", 0)::int  AS "laughCount",
        ${
          viewerEmail
            ? sql`
          EXISTS (
            SELECT 1 FROM clip_votes v
            WHERE v.is_prod = c.is_prod
              AND v.clip_id = c.id
              AND lower(v.track_student_email) = ${viewerEmail}
              AND v.type = 'heart'
          ) AS "hasHeart",
          EXISTS (
            SELECT 1 FROM clip_votes v
            WHERE v.is_prod = c.is_prod
              AND v.clip_id = c.id
              AND lower(v.track_student_email) = ${viewerEmail}
              AND v.type = 'laugh'
          ) AS "hasLaugh"
        `
            : sql`false AS "hasHeart", false AS "hasLaugh" `
        }
      FROM ${clips} AS c
      LEFT JOIN clip_reaction_counts rc
        ON rc."clipId" = c.id AND rc."isProd" = c.is_prod
      WHERE c.id = ${id}
        AND c.is_prod = ${isProd}
        AND ${isNull(clips.deletedAt)}
      LIMIT 1;
    `);

    return rowsRes.rows[0] ?? null;
  },

  async list(options?: ClipFindOptions): Promise<ClipListResult> {
    const isProd = getIsProd();
    const { limit, offset } = normalizeLimitOffset(
      options?.limit,
      options?.offset,
    );

    // Aliases
    const c = alias(clips, "c");
    const ts = alias(tracksStudents, "ts");

    const orderCol = options?.orderBy === "title" ? c.title : c.createdAt;
    const orderDir = toOrderDir(options?.orderDirection);
    const orderExpr = orderDir === "asc" ? asc(orderCol) : desc(orderCol);

    // WHERE
    const whereParts = [
      eq(c.isProd, isProd),
      options?.withDeleted ? sql`TRUE` : isNull(c.deletedAt),
    ];

    if (typeof options?.isFeatured === "boolean") {
      whereParts.push(eq(c.isFeatured, options.isFeatured));
    }

    if (options?.search?.trim()) {
      const q = `%${options.search.trim()}%`;

      whereParts.push(
        // OR across c.title, ts.student_name, ts.school
        sql`(${ilike(c.title, q)} OR ${ilike(ts.studentName, q)} OR ${ilike(ts.school, q)})`,
      );
    }

    const whereAnd = and(...whereParts);

    const countRes = await db.execute<{ total: number }>(sql`
      SELECT COUNT(*)::int AS total
      FROM ${clips} AS c
      LEFT JOIN ${tracksStudents} AS ts
        ON lower(ts.student_email) = lower(c.track_student_email)
      WHERE ${whereAnd};
    `);

    const total = countRes.rows[0]?.total ?? 0;

    const viewerEmail = options?.viewerEmail ?? null;

    const rowsRes = await db.execute(sql`
      SELECT
        c.id,
        c.is_prod                  AS "isProd",
        c.is_featured              AS "isFeatured",
        c.track_student_email      AS "trackStudentEmail",
        c.title,
        c.clip_url                 AS "clipUrl",
        c.created_at               AS "createdAt",
        c.deleted_at               AS "deletedAt",
        COALESCE(rc."heartCount", 0)::int  AS "heartCount",
        COALESCE(rc."laughCount", 0)::int  AS "laughCount",
        -- flags: has viewer reacted?
        ${
          viewerEmail
            ? sql`
          EXISTS (
            SELECT 1 FROM clip_votes v
            WHERE v.is_prod = c.is_prod
              AND v.clip_id = c.id
              AND lower(v.track_student_email) = ${viewerEmail}
              AND v.type = 'heart'
          ) AS "hasHeart",
          EXISTS (
            SELECT 1 FROM clip_votes v
            WHERE v.is_prod = c.is_prod
              AND v.clip_id = c.id
              AND lower(v.track_student_email) = ${viewerEmail}
              AND v.type = 'laugh'
          ) AS "hasLaugh"
        `
            : sql`false AS "hasHeart", false AS "hasLaugh" `
        },
        ts.student_name            AS "studentName",
        ts.school                  AS "schoolName"
      FROM ${clips} AS c
      LEFT JOIN clip_reaction_counts rc
        ON rc."clipId" = c.id AND rc."isProd" = c.is_prod
      LEFT JOIN ${tracksStudents} AS ts
        ON lower(ts.student_email) = lower(c.track_student_email)
      WHERE ${whereAnd}
      ORDER BY ${orderExpr}
      OFFSET ${offset}
      LIMIT ${limit};
    `);

    const rows = rowsRes.rows as any;

    return {
      rows: rows as any,
      count: total,
      limit,
      offset,
    };
  },
  async findByEmail(opts: ClipByEmailOptions): Promise<ClipListResult> {
    const isProd = getIsProd();
    const email = opts.email.trim().toLowerCase();
    const { limit, offset } = normalizeLimitOffset(opts.limit, 0);

    // Aliases
    const c = alias(clips, "c");
    const ts = alias(tracksStudents, "ts");

    const orderCol = opts?.orderBy === "title" ? c.title : c.createdAt;
    const orderDir = toOrderDir(opts?.orderDirection);
    const orderExpr = orderDir === "asc" ? asc(orderCol) : desc(orderCol);

    // WHERE: env + (optional not deleted) + email match
    const whereAnd = and(
      eq(c.isProd, isProd),
      opts?.withDeleted ? sql`TRUE` : isNull(c.deletedAt),
      sql`lower(${c.trackStudentEmail}) = ${email}`,
    );

    // COUNT
    const countRes = await db.execute<{ total: number }>(sql`
      SELECT COUNT(*)::int AS total
      FROM ${clips} AS c
      WHERE ${whereAnd};
    `);

    const total = countRes.rows[0]?.total ?? 0;

    // rows with counts and flags (viewer = same email)
    const rowsRes = await db.execute(sql`
      SELECT
        c.id,
        c.is_prod                  AS "isProd",
        c.is_featured              AS "isFeatured",
        c.track_student_email      AS "trackStudentEmail",
        c.title,
        c.clip_url                 AS "clipUrl",
        c.created_at               AS "createdAt",
        c.deleted_at               AS "deletedAt",
        COALESCE(rc."heartCount", 0)::int  AS "heartCount",
        COALESCE(rc."laughCount", 0)::int  AS "laughCount",
        -- pressed flags for this viewer (email)
        EXISTS (
          SELECT 1 FROM clip_votes v
          WHERE v.is_prod = c.is_prod
            AND v.clip_id = c.id
            AND lower(v.track_student_email) = ${email}
            AND v.type = 'heart'
        ) AS "hasHeart",
        EXISTS (
          SELECT 1 FROM clip_votes v
          WHERE v.is_prod = c.is_prod
            AND v.clip_id = c.id
            AND lower(v.track_student_email) = ${email}
            AND v.type = 'laugh'
        ) AS "hasLaugh",
        ts.student_name            AS "studentName",
        ts.school                  AS "schoolName"
      FROM ${clips} AS c
      LEFT JOIN clip_reaction_counts rc
        ON rc."clipId" = c.id AND rc."isProd" = c.is_prod
      LEFT JOIN ${tracksStudents} AS ts
        ON lower(ts.student_email) = lower(c.track_student_email)
      WHERE ${whereAnd}
      ORDER BY ${orderExpr}
      OFFSET ${offset}
      LIMIT ${limit};
    `);

    return {
      rows: rowsRes.rows as any,
      count: total,
      limit,
      offset,
    };
  },
};
