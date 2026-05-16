import { spawn } from "child_process";
import { existsSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, "..");
const DATA_DIR = join(rootDir, "data", "pglite");

mkdirSync(DATA_DIR, { recursive: true });

console.log("Starting FoodAppi Next.js development server...");
console.log("[1/3] Checking database...");

if (!existsSync(join(DATA_DIR, "pgdata"))) {
  console.log("[1/3] Initializing embedded PostgreSQL (first run)...");
  console.log("      This may take a moment...");
} else {
  console.log("[1/3] Database found, skipping init");
}

console.log("[2/3] Starting Next.js dev server...");
console.log("[3/3] Ready!");
console.log("");
console.log("  App:     http://localhost:3000");
console.log("  Admin:   http://localhost:3000/admin/login");
console.log("  DB:      Embedded PGLite at ./data/pglite");
console.log("");

const next = spawn("next", ["dev", "--turbopack"], {
  stdio: "inherit",
  shell: true,
  cwd: rootDir,
  env: {
    ...process.env,
    DATABASE_URL: `file:${join(DATA_DIR)}`,
  },
});

next.on("close", (code) => {
  process.exit(code ?? 0);
});

process.on("SIGINT", () => {
  next.kill("SIGINT");
});

process.on("SIGTERM", () => {
  next.kill("SIGTERM");
});
