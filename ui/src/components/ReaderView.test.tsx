import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { ReaderView } from "./ReaderView";

describe("ReaderView", () => {
  afterEach(cleanup);

  it("shows the title", () => {
    render(<ReaderView title="Test Title" content="<p>Content</p>" />);
    expect(screen.getByText("Test Title")).toBeInTheDocument();
  });

  it("shows the siteName", () => {
    render(
      <ReaderView
        title="Test Title"
        siteName="Test Site"
        content="<p>Content</p>"
      />,
    );
    expect(screen.getByText("Test Site")).toBeInTheDocument();
  });

  it("renders injected content HTML", () => {
    render(<ReaderView title="Test Title" content="<p>Hello world</p>" />);
    expect(screen.getByText("Hello world")).toBeInTheDocument();
  });
});
