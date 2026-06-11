import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { ExplainerSkeleton, ExplainerUnavailableCard } from "./ExplainerState";

describe("ExplainerState", () => {
  it("renders ExplainerSkeleton", () => {
    render(<ExplainerSkeleton />);
    // Check for skeleton elements
    const skeletons = screen.getAllByRole("status");
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it("renders ExplainerUnavailableCard", () => {
    const onRetry = vi.fn();
    render(<ExplainerUnavailableCard onRetry={onRetry} />);

    expect(screen.getByText("Explainer unavailable")).toBeInTheDocument();
    const button = screen.getByRole("button", { name: /try again/i });
    fireEvent.click(button);
    expect(onRetry).toHaveBeenCalled();
  });
});
