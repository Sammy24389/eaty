import { spawn } from "child_process";
import { existsSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, "..");
const DATA_DIR = join(rootDir, "data", "pglite");

mkdirSync(DATA_DIR, { recursive: true });

console.log("Starting FoodAppi Next.js production server...");
console.log("");
console.log("  App:     http://localhost:3000");
console.log("  Database:", process.env.DATABASE_URL?.startsWith("file:") ? "Embedded PGLite" : "External PostgreSQL");
console.log("");

const next = spawn("next", ["start"], {
  stdio: "inherit",
  shell: true,
  cwd: rootDir,
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
