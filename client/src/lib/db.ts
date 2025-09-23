import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import * as schema from "@shared/schema";

// Configure Neon for client-side usage
neonConfig.fetchConnectionCache = true;

// Get database URL from environment
const databaseUrl = import.meta.env.VITE_DATABASE_URL || import.meta.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error(
    "Database URL not found. Please set VITE_DATABASE_URL or DATABASE_URL environment variable.",
  );
}

// Create client-side database connection
export const pool = new Pool({ connectionString: databaseUrl });
export const db = drizzle({ client: pool, schema });