import { describe, it, expect, vi, afterEach } from "vitest";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  cleanup,
} from "@testing-library/react";
import { StumbleArea } from "./StumbleArea";

afterEach(cleanup);

const current = {
  id: "1",
  url: "https://example.com/article",
  title: "Example",
  category: "tech",
  source: "Test",
};

const readerResult = {
  title: "Reader Title",
  byline: null,
  siteName: "Test Site",
  excerpt: null,
  content: "<p>Reader body</p>",
  textContent: "Reader body",
  length: 11,
};

function makeFetch(ok = true) {
  return vi
    .fn()
    .mockResolvedValue(
      ok
        ? { ok: true, json: async () => readerResult }
        : { ok: false, status: 422 },
    );
}

const baseProps = {
  showIframe: true,
  loading: false,
  error: null,
  current,
  iframeError: false,
  onRetry: vi.fn(),
  onClose: vi.fn(),
  onIframeLoad: vi.fn(),
};

describe("StumbleArea reader-first hybrid", () => {
  it("shows the reader view by default", async () => {
    render(<StumbleArea {...baseProps} authenticatedFetch={makeFetch()} />);
    await waitFor(() =>
      expect(screen.getByText("Reader body")).toBeInTheDocument(),
    );
    expect(screen.getByText("Reader Title")).toBeInTheDocument();
  });

  it("switches to the live iframe when Live is clicked", async () => {
    render(<StumbleArea {...baseProps} authenticatedFetch={makeFetch()} />);
    await waitFor(() =>
      expect(screen.getByText("Reader body")).toBeInTheDocument(),
    );
    fireEvent.click(screen.getByRole("button", { name: /live/i }));
    expect(screen.getByTitle("Stumbled page")).toBeInTheDocument();
  });

  it("shows a fallback card (not a blank iframe) when reader extraction fails", async () => {
    render(
      <StumbleArea {...baseProps} authenticatedFetch={makeFetch(false)} />,
    );
    await waitFor(() =>
      expect(screen.getByText(/generate a reader view/i)).toBeInTheDocument(),
    );
    // No blank iframe is shown automatically.
    expect(screen.queryByTitle("Stumbled page")).not.toBeInTheDocument();
    // Explicitly choosing the live page loads the iframe.
    fireEvent.click(screen.getByRole("button", { name: /show live page/i }));
    expect(screen.getByTitle("Stumbled page")).toBeInTheDocument();
  });

  it("defaults video stumbles to the embedded live player", () => {
    const fetch = vi.fn();
    render(
      <StumbleArea
        {...baseProps}
        current={{
          ...current,
          proxyUrl: "https://www.youtube.com/embed/abc123",
        }}
        authenticatedFetch={fetch}
      />,
    );
    // Live player shown immediately; no reader extraction attempted.
    expect(screen.getByTitle("Stumbled page")).toBeInTheDocument();
    expect(fetch).not.toHaveBeenCalled();
  });

  it("defaults image stumbles to the live view (no reader extraction)", () => {
    const fetch = vi.fn();
    render(
      <StumbleArea
        {...baseProps}
        current={{ ...current, type: "image" }}
        authenticatedFetch={fetch}
      />,
    );
    expect(screen.getByTitle("Stumbled page")).toBeInTheDocument();
    expect(fetch).not.toHaveBeenCalled();
  });

  it("defaults interactive stumbles to the live view (no reader extraction)", () => {
    const fetch = vi.fn();
    render(
      <StumbleArea
        {...baseProps}
        current={{ ...current, type: "interactive" }}
        authenticatedFetch={fetch}
      />,
    );
    expect(screen.getByTitle("Stumbled page")).toBeInTheDocument();
    expect(fetch).not.toHaveBeenCalled();
  });

  it("still defaults article stumbles to the reader view", async () => {
    render(
      <StumbleArea
        {...baseProps}
        current={{ ...current, type: "article" }}
        authenticatedFetch={makeFetch()}
      />,
    );
    await waitFor(() =>
      expect(screen.getByText("Reader body")).toBeInTheDocument(),
    );
  });
});
