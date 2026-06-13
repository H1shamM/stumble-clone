import { render, screen, setupFetchMocks } from "../test-utils";
import { describe, it, expect, beforeEach } from "vitest";
import App from "../App";

describe("Skip Link", () => {
  beforeEach(() => {
    setupFetchMocks();
  });

  it("has accessible skip-link as first focusable element", () => {
    render(<App />);
    const skipLink = screen.getByText("Skip to main content");

    // Check DOM order: it should be the first focusable element in the document
    // We get all focusable elements and check if the skip link is at index 0
    const focusable = screen
      .getAllByRole("link")
      .concat(screen.getAllByRole("button"));
    // Filter out hidden ones if necessary, but sr-only focus:not-sr-only should be focusable
    expect(focusable[0]).toBe(skipLink);

    // Verify target exists
    const mainContent = screen.getByRole("main");
    expect(mainContent).toHaveAttribute("id", "main-content");
    expect(mainContent).toHaveAttribute("tabindex", "-1");
  });
});
