import { describe, expect, it } from "vitest";
import { isSafeMarketingHref, sanitizeMarketingHref } from "./sanitizeMarketingHref";

describe("sanitizeMarketingHref", () => {
  it("regression_marketing_href_blocks_javascript_protocol", () => {
    expect(sanitizeMarketingHref("javascript:alert(1)")).toBe("#");
    expect(isSafeMarketingHref("javascript:alert(1)")).toBe(false);
  });

  it("regression_marketing_href_allows_relative_hash_and_https", () => {
    expect(sanitizeMarketingHref("/about")).toBe("/about");
    expect(sanitizeMarketingHref("#events")).toBe("#events");
    expect(sanitizeMarketingHref("https://example.com/x")).toBe("https://example.com/x");
    expect(sanitizeMarketingHref("mailto:a@b.com")).toBe("mailto:a@b.com");
  });
});
