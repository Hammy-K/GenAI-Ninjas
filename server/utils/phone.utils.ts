import { sql } from "drizzle-orm";

/**
 * Produce a SQL expression that normalizes KSA numbers to a canonical shape.
 * Rules:
 *  - strip all non-digits
 *  - convert "05xxxxxxxx" -> "9665xxxxxxxx"
 *  - keep "9665xxxxxxxx" as-is
 *  - otherwise return digits-only fallback
 */
export const PhoneSql = {
  normalize(columnRef: string) {
    // Use SQL string to avoid identifier quoting issues in drizzle's sql template
    return sql.raw(`
      CASE
        WHEN regexp_replace(${columnRef}, '[^0-9]', '', 'g') ~ '^05[0-9]{8}$'
          THEN regexp_replace(regexp_replace(${columnRef}, '[^0-9]', '', 'g'), '^05', '9665')
        WHEN regexp_replace(${columnRef}, '[^0-9]', '', 'g') ~ '^9665[0-9]{8}$'
          THEN regexp_replace(${columnRef}, '[^0-9]', '', 'g')
        ELSE regexp_replace(${columnRef}, '[^0-9]', '', 'g')
      END
    `);
  },
};
