import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";
import * as schema from "@shared/schema";
import { CONFIG } from "./config";

neonConfig.webSocketConstructor = ws;

export const pool = new Pool({ connectionString: CONFIG.database.url });
export const db = drizzle({ client: pool, schema, logger: true });
