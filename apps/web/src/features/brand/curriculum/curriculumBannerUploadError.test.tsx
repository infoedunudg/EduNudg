import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MutationError, ThemeProvider } from "@edunudg/ui";
import { MarketingMediaField } from "@/features/marketing/MarketingMediaField";
import { uploadMarketingMedia } from "@/lib/marketingMediaStorage";

vi.mock("@/lib/marketingMediaStorage", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/marketingMediaStorage")>();
  return {
    ...actual,
    uploadMarketingMedia: vi.fn(),
  };
});

function CurriculumBannerUploadHarness() {
  const [bannerError, setBannerError] = useState<string | null>(null);
  return (
    <ThemeProvider>
      <div>
        <button type="button">Replace image</button>
        <MutationError message={bannerError} />
        <div className="ed-curriculum-brand__hidden-media" style={{ display: "none" }}>
          <MarketingMediaField
            label="Course Banner (Thumbnail)"
            value="https://cdn.example/old.png"
            onChange={() => undefined}
            onError={setBannerError}
            showInlineError={false}
            mediaType="image"
            uploadSubdir="program-marketing/course-1"
            uploadScope={{ kind: "brand", brandId: "brand-1" }}
          />
        </div>
      </div>
    </ThemeProvider>
  );
}

describe("curriculum banner visible upload error", () => {
  it("regression_curriculum_banner_oversized_error_shows_under_dropzone", async () => {
    vi.mocked(uploadMarketingMedia).mockRejectedValue(new Error("Image must be 5 MB or smaller."));

    const { container } = render(<CurriculumBannerUploadHarness />);
    const input = container.querySelector<HTMLInputElement>('input[type="file"]')!;
    fireEvent.change(input, {
      target: { files: [new File([new Uint8Array(8)], "big.png", { type: "image/png" })] },
    });

    await waitFor(() => {
      expect(screen.getByRole("alert").textContent).toMatch(/5 MB or smaller/);
    });
    expect(screen.getByRole("alert").className).toContain("ed-mutation-error");
  });
});
