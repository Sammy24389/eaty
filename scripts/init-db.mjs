import { PGlite } from "@electric-sql/pglite";
import { existsSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, "..");
const DATA_DIR = join(rootDir, "data", "pglite");

mkdirSync(DATA_DIR, { recursive: true });

async function init() {
  if (existsSync(join(DATA_DIR, "pgdata"))) {
    console.log("Database already initialized at:", DATA_DIR);
    console.log("To reset, run: npm run db:reset");
    return;
  }

  console.log("Initializing embedded PostgreSQL...");
  console.log("Data directory:", DATA_DIR);

  const db = new PGlite(DATA_DIR);

  console.log("PostgreSQL initialized successfully!");
  await db.close();
}

init().catch((e) => {
  console.error("Failed to initialize database:", e);
  process.exit(1);
});
