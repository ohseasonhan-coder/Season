import fs from "node:fs";

const required = [
  "src/App.jsx",
  "src/main.jsx",
  "index.html",
  "package.json",
  "supabase/schema.sql"
];

let ok = true;
for (const file of required) {
  if (!fs.existsSync(file)) {
    console.error(`Missing required file: ${file}`);
    ok = false;
  }
}

const app = fs.readFileSync("src/App.jsx", "utf8");
for (const needle of ["SUPABASE_URL", "validate", "backup", "ISA", "비상금"]) {
  if (!app.includes(needle)) {
    console.warn(`Check warning: App.jsx does not include keyword '${needle}'`);
  }
}

if (!ok) process.exit(1);
console.log("Basic commercial package check passed.");
