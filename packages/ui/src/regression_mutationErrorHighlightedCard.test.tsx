import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MutationError } from "./components";

describe("MutationError", () => {
  it("regression_mutation_error_uses_highlighted_danger_card", () => {
    const { container } = render(<MutationError message="Image must be 5 MB or smaller." />);
    const alert = screen.getByRole("alert");
    expect(alert.className).toContain("ed-mutation-error");
    expect(alert.textContent).toMatch(/5 MB or smaller/);
    expect(container.querySelector(".ed-mutation-error__message")).toBeTruthy();
  });

  it("renders nothing when message is null", () => {
    const { container } = render(<MutationError message={null} />);
    expect(container.querySelector(".ed-mutation-error")).toBeNull();
  });
});
