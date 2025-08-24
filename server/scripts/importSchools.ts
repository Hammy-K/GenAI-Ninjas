import fs from "fs/promises";
import path from "path";
import { parse } from "csv-parse/sync";
import { sql } from "drizzle-orm";
import { db } from "server/db";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

type MapConfig = Partial<{
  name: string; // default "name"
  category: string; // default "category"
  curriculum: string; // default "curriculum"
  lat: string; // default "lat"
  lon: string; // default "lon"
  district: string; // default "district"
  gender: string; // default "gender"
  city: string; // default "city"
}>;

function toNullableText(v: unknown): string | null {
  if (v === undefined || v === null) return null;
  const s = String(v).trim();
  return s === "" ? null : s;
}

function toNullableNumber(v: unknown): number | null {
  if (v === undefined || v === null) return null;
  const s = String(v).trim();
  if (s === "") return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

export async function importSchools(opts?: { map?: MapConfig }) {
  const filePath = path.resolve(__dirname, "../data/schools.csv");

  if (!filePath) throw new Error("Missing required filePath");

  const map = {
    name: "name",
    category: "category",
    curriculum: "curriculum",
    lat: "lat",
    lon: "lon",
    district: "district",
    gender: "gender",
    city: "city",
    ...(opts?.map ?? {}),
  };

  const abs = path.resolve(filePath);
  const csv = await fs.readFile(abs, "utf8");

  const rows = parse(csv, {
    columns: true,
    skip_empty_lines: true,
    bom: true,
    relax_column_count: true,
    trim: true,
  }) as Record<string, string>[];

  if (!rows.length) throw new Error("CSV is empty.");

  const tuples = rows.map((r, i) => {
    const name = toNullableText(r[map.name]);
    if (!name) throw new Error(`Row ${i + 2}: missing required '${map.name}'`);

    const country = "SA"; // fixed

    const category = toNullableText(r[map.category]);
    const curriculum = toNullableText(r[map.curriculum]);
    const gender = toNullableText(r[map.gender]);
    const city = toNullableText(r[map.city]);
    const district = toNullableText(r[map.district]);

    // address intentionally ignored (dropped from schema)
    const lat = toNullableNumber(r[map.lat]);
    const lon = toNullableNumber(r[map.lon]);

    return sql`(
      ${name},
      ${country},
      ${category},
      ${curriculum},
      ${gender},
      ${city},
      ${district},
      ${lat},
      ${lon}
    )`;
  });

  const result = await db.transaction(async (tx) => {
    const res = await tx.execute(sql`
      INSERT INTO schools
        (name, country, category, curriculum, gender, city, district, lat, lon)
      VALUES ${sql.join(tuples, sql`, `)}
    `);
    return res as any;
  });

  const inserted = Number(result?.rowCount ?? rows.length);

  console.log("##############################");
  console.log(`Total rows: ${rows.length}`);
  console.log("##############################");

  return { inserted, total: rows.length };
}
