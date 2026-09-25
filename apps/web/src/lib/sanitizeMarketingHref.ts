/**
 * Allow only safe marketing / footer / CTA hrefs.
 * Rejects javascript:, data:, vbscript:, and protocol-relative //evil.
 */
export function sanitizeMarketingHref(href: string | null | undefined): string {
  const raw = (href ?? "").trim();
  if (!raw) return "#";

  if (raw.startsWith("#")) return raw;
  if (raw.startsWith("/") && !raw.startsWith("//")) return raw;

  try {
    const parsed = new URL(raw, "https://example.invalid");
    const protocol = parsed.protocol.toLowerCase();
    if (protocol === "https:" || protocol === "http:") {
      // Absolute http(s) only — keep original absolute form when present.
      if (/^https?:\/\//i.test(raw)) return raw;
      return raw.startsWith("/") ? raw : "#";
    }
    if (protocol === "mailto:" || protocol === "tel:") return raw;
  } catch {
    return "#";
  }

  return "#";
}

export function isSafeMarketingHref(href: string | null | undefined): boolean {
  const sanitized = sanitizeMarketingHref(href);
  const raw = (href ?? "").trim();
  if (!raw) return true;
  return sanitized === raw || (raw.startsWith("#") && sanitized === raw);
}
