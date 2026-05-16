#!/usr/bin/env node

const { execSync } = require("child_process");
const path = require("path");

console.log("🚀 Starting production database migration...");

try {
  console.log("📦 Generating Prisma Client...");
  execSync("npx prisma generate", { stdio: "inherit" });

  console.log("🔄 Running migrations...");
  execSync("npx prisma migrate deploy", { stdio: "inherit" });

  console.log("🌱 Seeding database...");
  execSync("npx prisma db seed", { stdio: "inherit" });

  console.log("✅ Database migration completed successfully!");
} catch (error) {
  console.error("❌ Migration failed:", error.message);
  process.exit(1);
}
