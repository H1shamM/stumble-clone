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

const authenticatedFetch = vi
  .fn()
  .mockResolvedValue({ ok: false, status: 422 } as Response);

const baseProps = {
  current,
  onNext: vi.fn(),
  onRate: vi.fn(),
  onToggleFavorite: vi.fn(),
  isFavorite: false,
  authenticatedFetch,
};

describe("LiveFeed", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("shows an install hint on the web (non-native)", () => {
    isNative.mockReturnValue(false);
    render(<LiveFeed {...baseProps} />);
    expect(screen.getByText(/runs in the android app/i)).toBeInTheDocument();
    expect(open).not.toHaveBeenCalled();
  });

  it("wires the actions on native (Next + Like)", () => {
    isNative.mockReturnValue(true);
    const onNext = vi.fn();
    const onRate = vi.fn();
    render(<LiveFeed {...baseProps} onNext={onNext} onRate={onRate} />);

    fireEvent.click(screen.getByRole("button", { name: /next stumble/i }));
    expect(onNext).toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: /^like$/i }));
    expect(onRate).toHaveBeenCalledWith("like");
  });

  it("enters immersive via the expand control", () => {
    isNative.mockReturnValue(true);
    const onToggleImmersive = vi.fn();
    render(<LiveFeed {...baseProps} onToggleImmersive={onToggleImmersive} />);

    fireEvent.click(
      screen.getByRole("button", { name: /expand to full screen/i }),
    );
    expect(onToggleImmersive).toHaveBeenCalled();
  });

  it("in immersive mode hides the action bar and shows a restore strip", () => {
    isNative.mockReturnValue(true);
    const onToggleImmersive = vi.fn();
    render(
      <LiveFeed
        {...baseProps}
        immersive
        onToggleImmersive={onToggleImmersive}
      />,
    );

    // The full action bar is gone in immersive mode…
    expect(
      screen.queryByRole("button", { name: /next stumble/i }),
    ).not.toBeInTheDocument();
    // …and the restore strip brings the chrome back.
    fireEvent.click(screen.getByRole("button", { name: /show controls/i }));
    expect(onToggleImmersive).toHaveBeenCalled();
  });

  it("shows the Reader toggle only for article stumbles", () => {
    isNative.mockReturnValue(true);
    // Non-article: no Reader control.
    const { unmount } = render(<LiveFeed {...baseProps} />);
    expect(
      screen.queryByRole("button", { name: /read article/i }),
    ).not.toBeInTheDocument();
    unmount();

    // Article: Reader control present.
    render(
      <LiveFeed {...baseProps} current={{ ...current, type: "article" }} />,
    );
    expect(
      screen.getByRole("button", { name: /read article/i }),
    ).toBeInTheDocument();
  });

  it("toggling Reader fetches the reader view for the article", () => {
    isNative.mockReturnValue(true);
    render(
      <LiveFeed {...baseProps} current={{ ...current, type: "article" }} />,
    );

    fireEvent.click(screen.getByRole("button", { name: /read article/i }));
    expect(authenticatedFetch).toHaveBeenCalledWith(
      expect.stringContaining("/reader?url="),
    );
  });
});
