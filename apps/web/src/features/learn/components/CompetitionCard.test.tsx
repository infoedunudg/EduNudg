import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { CompetitionCard } from "./CompetitionCard";

describe("CompetitionCard papers action", () => {
  it("regression_competition_card_omits_papers_on_upcoming_enroll_ui", () => {
    render(
      <CompetitionCard
        name="Level 1 Exam"
        eventDate="2026-09-20"
        location="Center"
        feeType="free"
        canEnroll
        onEnroll={() => undefined}
      />
    );
    expect(screen.queryByRole("button", { name: /view papers/i })).toBeNull();
    expect(screen.getByRole("button", { name: /enroll now/i })).toBeDefined();
  });

  it("regression_competition_card_shows_view_papers_when_enrolled", () => {
    const onPapers = vi.fn();
    render(
      <CompetitionCard
        name="Level 1 Exam"
        eventDate="2026-09-20"
        location="Center"
        feeType="free"
        statusTag="registered"
        papersActionLabel="View papers"
        onPapersAction={onPapers}
      />
    );
    expect(screen.getByRole("button", { name: /view papers/i })).toBeDefined();
  });
});
