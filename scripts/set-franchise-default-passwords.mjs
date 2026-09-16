#!/usr/bin/env node

/**
 * Backfill predictable brand-based passwords for existing franchise owners.
 *
 * Required environment:
 *   VITE_SUPABASE_URL (or SUPABASE_URL)
 *   VITE_SUPABASE_ANON_KEY (or SUPABASE_ANON_KEY)
 *   PLATFORM_ADMIN_EMAIL
 *   PLATFORM_ADMIN_PASSWORD
 *
 * Dry run:
 *   pnpm franchises:set-default-passwords
 *
 * Apply:
 *   pnpm franchises:set-default-passwords -- --apply
 */

import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

function loadWebEnv() {
  const path = resolve("apps/web/.env");
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!match || process.env[match[1]]) continue;
    let value = match[2];
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    process.env[match[1]] = value;
  }
}

function defaultPassword(brandName, brandSlug = "") {
  const name = brandName
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
  const slug = brandSlug.toLowerCase().replace(/[^a-z0-9]/g, "");
  return `${name || slug || "franchise"}@123`;
}

async function requestJson(url, init) {
  const response = await fetch(url, init);
  const text = await response.text();
  let payload = null;
  try {
    payload = text ? JSON.parse(text) : null;
  } catch {
    payload = { error: text || `HTTP ${response.status}` };
  }
  if (!response.ok) {
    throw new Error(payload?.error_description || payload?.msg || payload?.error || `HTTP ${response.status}`);
  }
  return payload;
}

loadWebEnv();

const apply = process.argv.includes("--apply");
const supabaseUrl = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "").replace(/\/$/, "");
const anonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || "";
const adminEmail = process.env.PLATFORM_ADMIN_EMAIL || "";
const adminPassword = process.env.PLATFORM_ADMIN_PASSWORD || "";

if (!supabaseUrl || !anonKey || !adminEmail || !adminPassword) {
  console.error(
    "Missing Supabase URL/anon key or PLATFORM_ADMIN_EMAIL/PLATFORM_ADMIN_PASSWORD. See this script's header."
  );
  process.exit(1);
}

const auth = await requestJson(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
  method: "POST",
  headers: { apikey: anonKey, "Content-Type": "application/json" },
  body: JSON.stringify({ email: adminEmail, password: adminPassword }),
});
const accessToken = auth?.access_token;
if (!accessToken) throw new Error("Platform admin sign-in returned no access token");

const headers = {
  apikey: anonKey,
  Authorization: `Bearer ${accessToken}`,
  "Content-Type": "application/json",
};
const brands = await requestJson(
  `${supabaseUrl}/rest/v1/brands?select=id,name,slug&deleted_at=is.null&order=name.asc`,
  { headers }
);
const centers = await requestJson(
  `${supabaseUrl}/rest/v1/franchise_centers?select=id,brand_id,name,owner_email,slug&deleted_at=is.null&order=brand_id.asc,name.asc`,
  { headers }
);

const brandById = new Map(brands.map((brand) => [brand.id, brand]));
const emailBrands = new Map();
for (const center of centers) {
  const email = center.owner_email?.trim().toLowerCase();
  if (!email) continue;
  const ids = emailBrands.get(email) || new Set();
  ids.add(center.brand_id);
  emailBrands.set(email, ids);
}

let configured = 0;
let skippedMissingEmail = 0;
let skippedCrossBrandEmail = 0;
let failed = 0;

console.log(apply ? "APPLYING franchise default passwords" : "DRY RUN — no passwords will be changed");

for (const center of centers) {
  const brand = brandById.get(center.brand_id);
  if (!brand) continue;
  const email = center.owner_email?.trim().toLowerCase();
  const password = defaultPassword(brand.name, brand.slug);
  const label = `${brand.name} / ${center.name} (${center.slug})`;

  if (!email) {
    skippedMissingEmail += 1;
    console.log(`SKIP ${label}: owner_email is blank`);
    continue;
  }
  if ((emailBrands.get(email)?.size || 0) > 1) {
    skippedCrossBrandEmail += 1;
    console.log(`SKIP ${label}: ${email} is shared across brands; one Auth user cannot have two brand passwords`);
    continue;
  }

  if (!apply) {
    console.log(`WOULD SET ${label}: ${email} → ${password}`);
    continue;
  }

  try {
    await requestJson(`${supabaseUrl}/functions/v1/center-owner-credentials`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        centerId: center.id,
        brandId: center.brand_id,
        email,
        password,
        fullName: center.name,
      }),
    });
    configured += 1;
    console.log(`SET ${label}: ${email} → ${password}`);
  } catch (error) {
    failed += 1;
    console.error(`FAILED ${label}: ${error instanceof Error ? error.message : String(error)}`);
  }
}

console.log(
  `Done: ${configured} configured, ${skippedMissingEmail} missing owner_email, ${skippedCrossBrandEmail} cross-brand email conflicts, ${failed} failed.`
);
if (!apply) {
  console.log("Review the dry run, then append -- --apply to make changes.");
}
if (failed > 0) process.exitCode = 1;
