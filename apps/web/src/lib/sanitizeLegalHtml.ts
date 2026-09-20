import DOMPurify from "dompurify";
import type { Config } from "dompurify";

/** Allowlist for brand/platform legal documents converted from Word/HTML. */
const LEGAL_HTML_CONFIG: Config = {
  USE_PROFILES: { html: true },
  FORBID_TAGS: ["script", "iframe", "object", "embed", "form", "input", "button", "link", "meta", "base"],
  FORBID_ATTR: ["style"],
  ALLOW_DATA_ATTR: false,
};

/**
 * Strip executable markup from legal-page HTML before inject or storage.
 * Safe for empty / non-string input.
 */
export function sanitizeLegalHtml(html: string | null | undefined): string {
  if (typeof html !== "string" || !html.trim()) return "";
  return DOMPurify.sanitize(html, LEGAL_HTML_CONFIG);
}
