import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { BrandLegalPageContent } from "./BrandLegalPageContent";

describe("BrandLegalPageContent", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        text: async () => "<p>Privacy policy body</p>",
      }))
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("regression_renders_word_html_inline_after_fetch", async () => {
    render(
      <BrandLegalPageContent
        title="Privacy Policy"
        doc={{
          fileName: "privacy.docx",
          fileUrl: "https://cdn.example/privacy.docx",
          mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          htmlUrl: "https://cdn.example/privacy.html",
          uploadedAt: "2026-01-01T00:00:00.000Z",
        }}
      />
    );

    await waitFor(() => {
      expect(screen.getByText("Privacy policy body")).toBeDefined();
    });
    expect(document.querySelector(".marketing-legal-page__body")).toBeDefined();
  });

  it("regression_legal_page_strips_script_tags_before_inject", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        text: async () => '<p>Safe</p><script>window.__xss=1</script><img src=x onerror="window.__xss=2">',
      }))
    );

    render(
      <BrandLegalPageContent
        title="Privacy Policy"
        doc={{
          fileName: "privacy.docx",
          fileUrl: "https://cdn.example/privacy.docx",
          mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          htmlUrl: "https://cdn.example/privacy.html",
          uploadedAt: "2026-01-01T00:00:00.000Z",
        }}
      />
    );

    await waitFor(() => {
      expect(screen.getByText("Safe")).toBeDefined();
    });
    const body = document.querySelector(".marketing-legal-page__body");
    expect(body?.innerHTML.toLowerCase()).not.toContain("<script");
    expect(body?.innerHTML.toLowerCase()).not.toContain("onerror");
    expect((window as unknown as { __xss?: number }).__xss).toBeUndefined();
  });
});
