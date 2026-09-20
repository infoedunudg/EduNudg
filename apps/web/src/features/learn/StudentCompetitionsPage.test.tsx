import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "@edunudg/ui";
import { StudentCompetitionsPage } from "@/features/learn/StudentCompetitionsPage";
import {
  fetchStudentCompetitions,
  registerForCompetition,
} from "@/lib/studentCompetitionsApi";

vi.mock("@/bootstrap/TenantProvider", () => ({
  useTenant: () => ({
    brandId: "brand-1",
    brandSlug: "vihaan-abacas-pune",
    portalType: "learn",
  }),
}));

vi.mock("@/lib/studentCompetitionsApi", () => ({
  fetchStudentCompetitions: vi.fn(),
  registerForCompetition: vi.fn(),
  withdrawCompetitionRegistration: vi.fn(),
}));

vi.mock("@/features/learn/components/StudentCompetitionQuizPanel", () => ({
  StudentCompetitionQuizPanel: () => null,
}));

vi.mock("@/features/learn/components/StudentCompetitionPapersPanel", () => ({
  StudentCompetitionPapersPanel: ({ competitionId }: { competitionId: string }) => (
    <div role="dialog" aria-label="Competition question papers">
      Papers for {competitionId}
    </div>
  ),
}));

const upcomingCard = {
  id: "comp-1",
  name: "Testing",
  event_date: "2026-09-20",
  location: null,
  registration_opens_at: null,
  registration_closes_at: null,
  fee_type: "free" as const,
  fee_amount: null,
  fee_currency: null,
  registration_status: "open",
  my_registration_status: "none",
  can_enroll: true,
  enroll_blocked_reason: null,
  has_papers: true,
  can_view_papers: false,
};

function renderPage() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <ThemeProvider>
          <StudentCompetitionsPage />
        </ThemeProvider>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe("StudentCompetitionsPage papers after enroll", () => {
  beforeEach(() => {
    vi.mocked(fetchStudentCompetitions).mockImplementation(async (_brandId, filter) => {
      if (filter === "upcoming") return [upcomingCard];
      if (filter === "registered") {
        return [
          {
            registration_id: "reg-1",
            competition_id: "comp-1",
            name: "Testing",
            event_date: "2026-09-20",
            location: null,
            status: "registered",
            fee_type: "free",
            fee_amount: null,
            has_papers: true,
            can_view_papers: true,
          },
        ];
      }
      return [];
    });
    vi.mocked(registerForCompetition).mockResolvedValue("reg-1");
  });

  it("regression_competition_card_omits_papers_on_upcoming_enroll_ui", async () => {
    renderPage();
    expect(await screen.findByRole("button", { name: /enroll now/i })).toBeDefined();
    expect(screen.queryByRole("button", { name: /view papers/i })).toBeNull();
  });

  it("regression_enroll_opens_my_registrations_and_papers_when_attached", async () => {
    renderPage();
    fireEvent.click(await screen.findByRole("button", { name: /enroll now/i }));

    await waitFor(() => {
      expect(screen.getByRole("tab", { name: /my registrations/i }).getAttribute("aria-selected")).toBe(
        "true"
      );
    });
    expect(await screen.findByRole("dialog", { name: /competition question papers/i })).toBeDefined();
    expect(screen.getByText(/Papers for comp-1/i)).toBeDefined();
  });
});
