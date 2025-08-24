import {
  pgTable,
  serial,
  text,
  timestamp,
  doublePrecision,
} from "drizzle-orm/pg-core";

export const schools = pgTable("schools", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  country: text("country").notNull(), // ISO alpha-2 e.g. "SA"
  category: text("category"),
  curriculum: text("curriculum"),
  gender: text("gender"),
  city: text("city"),
  district: text("district"),
  lat: doublePrecision("lat"),
  lon: doublePrecision("lon"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
});
