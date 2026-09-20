import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrandCompetitionPapersSection } from "./BrandCompetitionPapersSection";

vi.mock("@/lib/competitionQuestionPapersApi", () => ({
  COMPETITION_PAPER_ACCEPT: ".pdf,.csv,.xlsx,.xls",
  isPdfMime: () => true,
  listCompetitionQuestionPapers: vi.fn(async () => [
    {
      id: "p1",
      brand_id: "brand-1",
      program_id: "prog-1",
      level_id: "lvl-1",
      title: "DEMO-LEVEL1-2nd-ROUND.pdf",
      file_name: "DEMO-LEVEL1-2nd-ROUND.pdf",
      file_url: "https://example.com/paper.pdf",
      mime_type: "application/pdf",
      is_active: true,
      created_at: "",
      updated_at: "",
    },
  ]),
  createCompetitionQuestionPaperFromFile: vi.fn(),
  deleteCompetitionQuestionPaper: vi.fn(),
  upsertCompetitionQuestionPaper: vi.fn(),
}));

vi.mock("@/lib/curriculumApi", () => ({
  fetchPrograms: vi.fn(async () => [{ id: "prog-1", name: "Abacus" }]),
  fetchLevels: vi.fn(async () => [{ id: "lvl-1", name: "Level1" }]),
}));

describe("BrandCompetitionPapersSection attach next step", () => {
  it("regression_papers_bank_prompts_attach_on_events", async () => {
    const onGoToEvents = vi.fn();
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={qc}>
        <BrandCompetitionPapersSection brandId="brand-1" canEdit onGoToEvents={onGoToEvents} />
      </QueryClientProvider>
    );

    expect(await screen.findByText(/Next step:/i)).toBeDefined();
    expect(screen.getByText(/attach each paper to an event/i)).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: /go to events to attach/i }));
    expect(onGoToEvents).toHaveBeenCalled();
  });
});
