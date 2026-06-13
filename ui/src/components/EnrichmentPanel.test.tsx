import { render, screen, cleanup } from "@testing-library/react";
import { describe, it, expect, afterEach } from "vitest";
import { EnrichmentPanel } from "./EnrichmentPanel";
import type { EnrichmentResult } from "../hooks/useExplainer";

afterEach(cleanup);

const mockEnrichment: EnrichmentResult = {
  summary: "This is a summary.",
  keyPoints: ["Point 1", "Point 2"],
  scenes: [],
  image: "test.png",
  provenance: "AI Model",
  sourceUrl: "http://original.com",
};

describe("EnrichmentPanel", () => {
  it("renders all enrichment fields correctly", () => {
    render(<EnrichmentPanel enrichment={mockEnrichment} />);

    expect(screen.getByText("AI Summary")).toBeInTheDocument();
    expect(screen.getByText(mockEnrichment.summary)).toBeInTheDocument();
    expect(screen.getByText("Point 1")).toBeInTheDocument();
    expect(screen.getByText("Point 2")).toBeInTheDocument();
    expect(screen.getByRole("img")).toHaveAttribute(
      "src",
      mockEnrichment.image,
    );
    expect(screen.getByText(mockEnrichment.provenance)).toBeInTheDocument();

    const link = screen.getByRole("link", { name: /read the original/i });
    expect(link).toHaveAttribute("href", mockEnrichment.sourceUrl);
  });

  it("does not render image when image is null", () => {
    const noImageEnrichment = { ...mockEnrichment, image: null };
    render(<EnrichmentPanel enrichment={noImageEnrichment} />);

    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });
});
