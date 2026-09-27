import { describe, expect, it, vi, beforeEach } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { CenterPhotoUpload } from "./CenterPhotoUpload";

const uploadCenterPhoto = vi.fn();

vi.mock("@/lib/centerPhotoStorage", () => ({
  uploadCenterPhoto: (...args: unknown[]) => uploadCenterPhoto(...args),
}));

describe("CenterPhotoUpload", () => {
  beforeEach(() => {
    uploadCenterPhoto.mockReset();
  });

  it("regression_franchise_photo_error_shows_near_save_via_onError", async () => {
    uploadCenterPhoto.mockRejectedValue(new Error("Image must be 5 MB or smaller."));
    const onError = vi.fn();
    const onUploaded = vi.fn();

    const { container } = render(
      <CenterPhotoUpload
        brandId="brand-1"
        centerId="center-1"
        onUploaded={onUploaded}
        onError={onError}
      />
    );

    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File([new Uint8Array(8)], "big.png", { type: "image/png" });
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByRole("alert").textContent).toMatch(/5 MB or smaller/);
    });
    expect(onError).toHaveBeenCalledWith("Image must be 5 MB or smaller.");
    expect(onUploaded).not.toHaveBeenCalled();
  });
});
