import { describe, expect, it } from "vitest";
import { sanitizeLegalHtml } from "./sanitizeLegalHtml";

describe("sanitizeLegalHtml", () => {
  it("regression_legal_html_strips_script_and_event_handlers", () => {
    const dirty =
      '<p>Hello</p><script>alert(1)</script><img src=x onerror="alert(2)"><a href="javascript:alert(3)">x</a>';
    const clean = sanitizeLegalHtml(dirty);
    expect(clean).toContain("Hello");
    expect(clean.toLowerCase()).not.toContain("<script");
    expect(clean.toLowerCase()).not.toContain("onerror");
    expect(clean.toLowerCase()).not.toContain("javascript:");
  });

  it("returns empty string for blank input", () => {
    expect(sanitizeLegalHtml("")).toBe("");
    expect(sanitizeLegalHtml(null)).toBe("");
    expect(sanitizeLegalHtml(undefined)).toBe("");
  });

  it("keeps ordinary legal markup", () => {
    const html = "<h1>Terms</h1><p>You agree to <strong>these terms</strong>.</p><ul><li>One</li></ul>";
    const clean = sanitizeLegalHtml(html);
    expect(clean).toContain("<h1>");
    expect(clean).toContain("<strong>");
    expect(clean).toContain("<li>");
  });
});
