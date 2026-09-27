import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  centerPhotoObjectPath,
  removeExistingCenterPhotos,
  uploadCenterPhoto,
} from "./centerPhotoStorage";

const listMock = vi.fn();
const removeMock = vi.fn();
const uploadMock = vi.fn();
const getPublicUrlMock = vi.fn();

vi.mock("@/lib/supabase", () => ({
  getSupabase: () => ({
    storage: {
      from: () => ({
        list: listMock,
        remove: removeMock,
        upload: uploadMock,
        getPublicUrl: getPublicUrlMock,
      }),
    },
  }),
}));

vi.mock("@/lib/brandLogoCache", () => ({
  withLogoCacheBust: (url: string) => `${url}?v=1`,
}));

describe("centerPhotoStorage", () => {
  beforeEach(() => {
    listMock.mockReset();
    removeMock.mockReset();
    uploadMock.mockReset();
    getPublicUrlMock.mockReset();
    listMock.mockResolvedValue({ data: [], error: null });
    removeMock.mockResolvedValue({ error: null });
    uploadMock.mockResolvedValue({ error: null });
    getPublicUrlMock.mockReturnValue({ data: { publicUrl: "https://cdn/center.jpg" } });
  });

  it("centerPhotoObjectPath uses brand-assets centers folder", () => {
    expect(centerPhotoObjectPath("brand-1", "center-1", "jpg")).toBe(
      "brand-1/centers/center-1/photo.jpg"
    );
  });

  it("removeExistingCenterPhotos deletes photo files only", async () => {
    listMock.mockResolvedValue({
      data: [{ name: "photo.png" }, { name: "notes.txt" }],
      error: null,
    });
    await removeExistingCenterPhotos("brand-1", "center-1");
    expect(removeMock).toHaveBeenCalledWith(["brand-1/centers/center-1/photo.png"]);
  });

  it("regression_uploadCenterPhoto_replaces_prior_photo", async () => {
    const file = new File(["x"], "center.png", { type: "image/png" });
    const url = await uploadCenterPhoto("brand-1", "center-1", file);
    expect(url).toBe("https://cdn/center.jpg?v=1");
    expect(uploadMock).toHaveBeenCalledWith(
      "brand-1/centers/center-1/photo.png",
      file,
      expect.objectContaining({ upsert: true })
    );
  });

  it("regression_center_photo_rejects_images_over_5mb", async () => {
    const oversized = new File([new Uint8Array(5 * 1024 * 1024 + 1)], "big.png", {
      type: "image/png",
    });
    await expect(uploadCenterPhoto("brand-1", "center-1", oversized)).rejects.toThrow(
      /5 MB or smaller/
    );
    expect(uploadMock).not.toHaveBeenCalled();
  });
});
