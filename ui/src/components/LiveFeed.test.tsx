import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";

const isNative = vi.fn();
vi.mock("@capacitor/core", () => ({
  Capacitor: { isNativePlatform: () => isNative() },
}));

const open = vi.fn().mockResolvedValue(undefined);
const loadUrl = vi.fn().mockResolvedValue(undefined);
const close = vi.fn().mockResolvedValue(undefined);
vi.mock("@teamhive/capacitor-webview-overlay", () => ({
  WebviewOverlay: { open, loadUrl, close },
}));

import { LiveFeed } from "./LiveFeed";

const current = {
  id: "1",
  url: "https://example.com",
  title: "Example",
  category: "tech",
  source: "Test",
};

const baseProps = {
  current,
  onNext: vi.fn(),
  onExit: vi.fn(),
  onRate: vi.fn(),
  onToggleFavorite: vi.fn(),
  isFavorite: false,
};

describe("LiveFeed", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("shows an install hint on the web (non-native)", () => {
    isNative.mockReturnValue(false);
    render(<LiveFeed {...baseProps} />);
    expect(screen.getByText(/runs in the app/i)).toBeInTheDocument();
    expect(open).not.toHaveBeenCalled();
  });

  it("renders chrome and wires the actions on native", () => {
    isNative.mockReturnValue(true);
    const onNext = vi.fn();
    const onExit = vi.fn();
    const onRate = vi.fn();
    render(
      <LiveFeed {...baseProps} onNext={onNext} onExit={onExit} onRate={onRate} />,
    );

    fireEvent.click(screen.getByRole("button", { name: /next stumble/i }));
    expect(onNext).toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: /exit live feed/i }));
    expect(onExit).toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: /^like$/i }));
    expect(onRate).toHaveBeenCalledWith("like");
  });
});
