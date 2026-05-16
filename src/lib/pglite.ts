import { PGlite } from "@electric-sql/pglite";
import { mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, "..", "data", "pglite");

let db: PGlite | null = null;

export async function initPGLite() {
  if (db) return db;

  mkdirSync(DATA_DIR, { recursive: true });

  console.log("[PGLite] Initializing embedded PostgreSQL...");
  db = new PGlite(DATA_DIR);

  console.log("[PGLite] Database ready at:", DATA_DIR);
  return db;
}

export async function closePGLite() {
  if (db) {
    console.log("[PGLite] Closing database...");
    await db.close();
    db = null;
  }
}

export function getPGLite() {
  if (!db) {
    throw new Error("PGLite not initialized. Call initPGLite() first.");
  }
  return db;
}
