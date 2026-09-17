#!/usr/bin/env node
/**
 * Cross-platform post-vite check (replaces Unix `test -f` / `ls` in apps/web build).
 */
import { existsSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const distDir = join(process.cwd(), "dist");
const indexHtml = join(distDir, "index.html");

if (!existsSync(indexHtml)) {
  console.error(`assert-web-dist: missing ${indexHtml}`);
  process.exit(1);
}

const entries = readdirSync(distDir).sort();
for (const name of entries.slice(0, 20)) {
  const full = join(distDir, name);
  const st = statSync(full);
  const size = st.isFile() ? ` ${st.size}` : "/";
  console.log(`${name}${size}`);
}
