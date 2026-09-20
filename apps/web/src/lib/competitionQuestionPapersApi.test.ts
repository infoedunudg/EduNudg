import { describe, expect, it, vi, beforeEach } from "vitest";
import {
  COMPETITION_PAPER_ACCEPT,
  competitionPaperObjectPath,
  isPdfMime,
  resolveCompetitionPaperMime,
  validateCompetitionPaperFile,
} from "./competitionQuestionPapersApi";

vi.mock("@/lib/supabase", () => ({
  getSupabase: () => ({
    storage: {
      from: () => ({
        upload: vi.fn(),
        getPublicUrl: vi.fn(),
      }),
    },
    rpc: vi.fn(),
  }),
}));

describe("competitionQuestionPapersApi", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("regression_competition_paper_accepts_pdf_excel_csv", () => {
    expect(COMPETITION_PAPER_ACCEPT).toMatch(/\.pdf/);
    expect(COMPETITION_PAPER_ACCEPT).toMatch(/\.xlsx/);
    expect(COMPETITION_PAPER_ACCEPT).toMatch(/\.csv/);

    const pdf = new File(["%PDF"], "paper.pdf", { type: "application/pdf" });
    const xlsx = new File(["x"], "paper.xlsx", {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const csv = new File(["a,b"], "paper.csv", { type: "text/csv" });
    expect(validateCompetitionPaperFile(pdf)).toBeNull();
    expect(validateCompetitionPaperFile(xlsx)).toBeNull();
    expect(validateCompetitionPaperFile(csv)).toBeNull();
    expect(isPdfMime(resolveCompetitionPaperMime(pdf))).toBe(true);
  });

  it("regression_competition_paper_rejects_unsupported_types", () => {
    const doc = new File(["x"], "paper.docx", {
      type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    });
    expect(validateCompetitionPaperFile(doc)).toMatch(/PDF, Excel/);
  });

  it("regression_competition_paper_storage_path_nests_under_brand", () => {
    expect(competitionPaperObjectPath("brand-1", "paper-1", "Level 1.pdf")).toMatch(
      /^brand-1\/competitions\/papers\/paper-1\/\d+-Level-1\.pdf$/
    );
  });
});
