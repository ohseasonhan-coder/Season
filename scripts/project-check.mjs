#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const required = [
  "package.json",
  "index.html",
  "src/main.jsx",
  "src/App.jsx",
  "src/styles.css",
  "src/core/engine.js",
  "src/core/api.js",
  "src/auth/supabaseClient.js",
  "src/features/Dashboard.jsx",
  "src/features/SplitInput.jsx",
  "src/features/Report.jsx",
  "src/features/Cloud.jsx",
  "src/features/Backup.jsx",
  "src/features/Ops.jsx",
  "src/features/Settings.jsx",
  "public/manifest.webmanifest",
  "public/sw.js",
  "supabase/sql/schema.sql",
];

const errors = [];
for (const file of required) {
  if (!fs.existsSync(path.join(process.cwd(), file))) errors.push(`누락 파일: ${file}`);
}

try {
  const pkg = JSON.parse(fs.readFileSync("package.json", "utf8"));
  if (!pkg.scripts?.build) errors.push("build script 누락");
} catch {
  errors.push("package.json 파싱 실패");
}

if (errors.length) {
  console.error("❌ Project check failed");
  errors.forEach((e) => console.error(" -", e));
  process.exit(1);
}

console.log("✅ Project check passed");
