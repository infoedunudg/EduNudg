import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { BrandCompetitionsPage } from "./BrandCompetitionsPage";

vi.mock("@/features/brand/hooks/useBrandScope", () => ({
  useBrandScope: () => ({ brandId: "brand-1", missingBrand: false }),
}));

vi.mock("@/hooks/useMembership", () => ({
  useMembership: () => ({ data: [{ role_key: "brand_owner" }] }),
}));

vi.mock("@/features/brand/competitions/BrandCompetitionsSection", () => ({
  BrandCompetitionsSection: () => <div>Events section</div>,
}));

vi.mock("@/features/brand/competitions/BrandCompetitionQuestionBankSection", () => ({
  BrandCompetitionQuestionBankSection: () => <div>Quiz bank</div>,
}));

vi.mock("@/features/brand/competitions/BrandCompetitionPapersSection", () => ({
  BrandCompetitionPapersSection: () => <div>Papers bank</div>,
}));

describe("BrandCompetitionsPage papers tab", () => {
  it("regression_competitions_page_has_question_papers_tab", () => {
    render(<BrandCompetitionsPage />);
    expect(screen.getByRole("tab", { name: /question papers/i })).toBeDefined();
    expect(screen.getByRole("tab", { name: /question bank/i })).toBeDefined();
  });
});
