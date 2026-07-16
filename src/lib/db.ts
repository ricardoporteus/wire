/**
 * Drizzle client over Neon's WebSocket driver.
 *
 * We use the serverless *Pool* (WebSocket) driver rather than the HTTP driver
 * because the credit ledger and the pipelines rely on real interactive
 * transactions with row locks (`db.transaction(... .for("update") ...)`), which
 * the HTTP driver does not support. In Node 22+ a global `WebSocket` exists;
 * point Neon at it so no extra `ws` dependency is needed.
 */
import { drizzle } from "drizzle-orm/neon-serverless";
import { Pool, neonConfig } from "@neondatabase/serverless";
import * as schema from "@/db/schema";

if (typeof WebSocket !== "undefined") {
  neonConfig.webSocketConstructor = WebSocket;
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL! });
export const db = drizzle(pool, { schema });
