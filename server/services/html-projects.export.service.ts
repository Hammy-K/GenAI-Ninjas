import { db } from "../db";
import { sql } from "drizzle-orm";
import {
  HtmlProjectsExportFilters,
  HtmlProjectsExportRow,
} from "../types/export.types";
import { PhoneSql } from "../utils/phone.utils";

/**
 * Runs a single window-function query:
 * - joins html_projects -> students
 * - normalizes phone
 * - partitions by normalized phone
 * - orders by project created_at DESC
 * - picks rn <= topNPerStudent (default 1)
 * - applies filters: organization, date range, school, name
 */
export class HtmlProjectsExportService {
  static async fetchExportRows(
    filters: HtmlProjectsExportFilters,
  ): Promise<HtmlProjectsExportRow[]> {
    const {
      organization,
      from,
      to,
      school,
      name,
      topNPerStudent = 1,
    } = filters;

    const whereFragments = sql.join(
      [
        sql`si.user_id IS NOT NULL`,
        organization ? sql`fp.organization = ${organization}` : undefined,
        from ? sql`fp.created_at >= ${from}::timestamptz` : undefined,
        to ? sql`fp.created_at <  ${to}::timestamptz` : undefined,
        school ? sql`si.school_name ILIKE ${"%" + school + "%"}` : undefined,
        name ? sql`si.full_name  ILIKE ${"%" + name + "%"}` : undefined,
      ].filter(Boolean) as any[],
      sql` AND `,
    );

    // ${PhoneSql.normalize("st.phone_number")} AS phone_norm,

    const q = sql<HtmlProjectsExportRow[]>`
      WITH student_info AS (
        SELECT
          st.id AS user_id,
          st.full_name,
          st.school_name,
          st.phone_number AS phone_norm
        FROM students st
        WHERE st.phone_number IS NOT NULL
          AND trim(st.phone_number) <> ''
          AND phone_number != ''
          and phone_number != '0536391122'
          -- Optional: data hygiene exclusions (keep if you need them)
          AND lower(st.full_name) NOT LIKE '%test%'
          AND lower(st.full_name) NOT LIKE '%shoeb%'
          AND lower(st.school_name) NOT LIKE '%test%'
          AND lower(st.full_name) NOT LIKE '%noon%'
          AND lower(st.full_name) NOT LIKE '%hamza%'
          AND lower(st.school_name) NOT LIKE '%noon%'
          AND lower(st.school_name) NOT LIKE '%hamza%'
      ),
      filtered_projects AS (
        SELECT
          hp.id,
          hp.project_id,
          hp.user_id,
          hp.created_at,
          hp.organization
        FROM html_projects hp
        -- WHERE fragments are applied in the final join WHERE to keep this CTE generic
      ),
      ranked AS (
        SELECT
          si.user_id,
          si.phone_norm,
          si.full_name,
          si.school_name,
          fp.project_id,
          fp.created_at,
          ROW_NUMBER() OVER (PARTITION BY si.phone_norm ORDER BY fp.created_at DESC) AS rn
        FROM filtered_projects fp
        JOIN student_info si
          ON (fp.user_id)::text = (si.user_id)::text
        WHERE ${whereFragments}
      )
      SELECT
        ranked.school_name   AS "schoolName",
        ranked.user_id        AS "userId",
        ranked.phone_norm     AS "phoneNumber",
        ranked.full_name      AS "fullName",
        ${sql.raw(
          `('https://noongenai.replit.app/project/' || ranked.project_id)`,
        )}                    AS "projectLink",
        ranked.created_at     AS "projectCreatedAt"
      FROM ranked
      WHERE ranked.rn <= ${topNPerStudent}
      ORDER BY ranked.created_at DESC;
    `;

    const rows = await db.execute(q);

    return rows as unknown as HtmlProjectsExportRow[];
  }
}
