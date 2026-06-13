// @vitest-environment jsdom
import { describe, it, expect, afterEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useAnyOverlayOpen } from "./useAnyOverlayOpen";

let mockCallback: () => void;

class MockMutationObserver {
  constructor(callback: () => void) {
    mockCallback = callback;
  }
  observe = vi.fn();
  disconnect = vi.fn();
}

vi.stubGlobal("MutationObserver", MockMutationObserver);

describe("useAnyOverlayOpen", () => {
  afterEach(() => {
    const overlays = document.querySelectorAll(
      '[role="dialog"], [role="alertdialog"], [role="menu"], [role="listbox"]',
    );
    overlays.forEach((el) => el.remove());
    vi.clearAllMocks();
  });

  it("returns false when no overlay is present", () => {
    const { result } = renderHook(() => useAnyOverlayOpen());
    expect(result.current).toBe(false);
  });

  it("becomes true after appending an overlay element", async () => {
    const { result } = renderHook(() => useAnyOverlayOpen());
    expect(result.current).toBe(false);

    act(() => {
      const overlay = document.createElement("div");
      overlay.setAttribute("role", "dialog");
      document.body.appendChild(overlay);
      mockCallback(); // Manually trigger observer
    });

    expect(result.current).toBe(true);
  });

  it("returns to false after removing the overlay element", async () => {
    const overlay = document.createElement("div");
    overlay.setAttribute("role", "dialog");
    document.body.appendChild(overlay);

    const { result } = renderHook(() => useAnyOverlayOpen());

    // Initial state true (hook calls check() on mount)
    mockCallback();
    expect(result.current).toBe(true);

    act(() => {
      overlay.remove();
      mockCallback(); // Manually trigger observer
    });

    expect(result.current).toBe(false);
  });
});
