import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { uploadMarketingMedia } from "@/lib/marketingMediaStorage";
import { MarketingMediaField } from "@/features/marketing/MarketingMediaField";

vi.mock("@/lib/marketingMediaStorage", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/marketingMediaStorage")>();
  return {
    ...actual,
    uploadMarketingMedia: vi.fn(),
  };
});

describe("MarketingMediaField upload errors", () => {
  it("regression_marketing_media_bubbles_oversized_error_to_parent", async () => {
    vi.mocked(uploadMarketingMedia).mockRejectedValue(new Error("Image must be 5 MB or smaller."));
    const onError = vi.fn();

    const { container } = render(
      <MarketingMediaField
        label="Course Banner (Thumbnail)"
        value="https://cdn.example/old.png"
        onChange={() => undefined}
        onError={onError}
        showInlineError={false}
        mediaType="image"
        uploadSubdir="program-marketing/course-1"
        uploadScope={{ kind: "brand", brandId: "brand-1" }}
      />
    );

    const input = container.querySelector<HTMLInputElement>('input[type="file"]')!;
    fireEvent.change(input, {
      target: { files: [new File([new Uint8Array(8)], "big.png", { type: "image/png" })] },
    });

    await waitFor(() => {
      expect(onError).toHaveBeenCalledWith("Image must be 5 MB or smaller.");
    });
    expect(screen.queryByRole("alert")).toBeNull();
  });
});
