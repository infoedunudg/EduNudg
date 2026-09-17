import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../..");

/**
 * Regression: `pnpm build` used Unix `test -f` / `ls`, so `pnpm ci:local` failed on Windows
 * after a successful Vite build.
 */
describe("regression_webBuildAssertsDistCrossPlatform", () => {
  it("web build script uses node assert-web-dist (not Unix test/ls)", () => {
    const pkg = JSON.parse(
      readFileSync(path.join(repoRoot, "apps/web/package.json"), "utf8")
    ) as { scripts: Record<string, string> };
    expect(pkg.scripts.build).toMatch(/assert-web-dist/);
    expect(pkg.scripts.build).not.toMatch(/\btest -f\b/);
    expect(pkg.scripts.build).not.toMatch(/\bls -la\b/);
    expect(existsSync(path.join(repoRoot, "scripts/assert-web-dist.mjs"))).toBe(true);
  });
});
