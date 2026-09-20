import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { RecommendedEventCard } from "@/features/learn/components/RecommendedEventCard";

describe("RecommendedEventCard", () => {
  it("regression_recommended_event_card_links_to_competitions", () => {
    render(
      <MemoryRouter>
        <RecommendedEventCard name="Testing" eventDate={null} location={null} feeType="free" />
      </MemoryRouter>
    );

    const link = screen.getByRole("link", { name: /Testing/ });
    expect(link.getAttribute("href")).toBe("/competitions");
    expect(screen.getByText("View events →")).toBeTruthy();
  });
});
