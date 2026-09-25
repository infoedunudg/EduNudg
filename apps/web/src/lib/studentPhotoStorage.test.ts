import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  removeExistingStudentPhotos,
  studentPhotoObjectPath,
  uploadStudentPhoto,
} from "./studentPhotoStorage";

const listMock = vi.fn();
const removeMock = vi.fn();
const uploadMock = vi.fn();

vi.mock("@/lib/supabase", () => ({
  getSupabase: () => ({
    storage: {
      from: () => ({
        list: listMock,
        remove: removeMock,
        upload: uploadMock,
      }),
    },
  }),
}));

describe("studentPhotoStorage", () => {
  beforeEach(() => {
    listMock.mockReset();
    removeMock.mockReset();
    uploadMock.mockReset();
    listMock.mockResolvedValue({ data: [], error: null });
    removeMock.mockResolvedValue({ error: null });
    uploadMock.mockResolvedValue({ error: null });
  });

  it("studentPhotoObjectPath uses students folder under brand", () => {
    expect(studentPhotoObjectPath("brand-1", "student-1", "jpg")).toBe(
      "brand-1/students/student-1/photo.jpg"
    );
  });

  it("removeExistingStudentPhotos deletes photo files only", async () => {
    listMock.mockResolvedValue({
      data: [{ name: "photo.png" }, { name: "notes.txt" }],
      error: null,
    });
    await removeExistingStudentPhotos("brand-1", "student-1");
    expect(removeMock).toHaveBeenCalledWith(["brand-1/students/student-1/photo.png"]);
  });

  it("regression_uploadStudentPhoto_stores_private_ref_not_cdn_url", async () => {
    const file = new File(["x"], "student.png", { type: "image/png" });
    const ref = await uploadStudentPhoto("brand-1", "student-1", file);
    expect(ref).toBe("brand-private:brand-1/students/student-1/photo.png");
    expect(uploadMock).toHaveBeenCalledWith(
      "brand-1/students/student-1/photo.png",
      file,
      expect.objectContaining({ upsert: true })
    );
  });

  it("regression_uploadStudentPhoto_rejects_svg", async () => {
    const file = new File(["<svg/>"], "x.svg", { type: "image/svg+xml" });
    await expect(uploadStudentPhoto("brand-1", "student-1", file)).rejects.toThrow(/SVG/);
  });
});
