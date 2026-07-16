import { loadEnvFile } from "node:process";
import { defineConfig } from "drizzle-kit";

// drizzle-kit's CLI does not auto-load .env.local (unlike Next.js), so load it here.
try {
  loadEnvFile(".env.local");
} catch {
  // no .env.local — rely on the ambient environment
}

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: { url: process.env.DATABASE_URL! },
});
