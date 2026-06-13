import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";

const isNative = vi.fn();
vi.mock("@capacitor/core", () => ({
  Capacitor: { isNativePlatform: () => isNative() },
}));

const openInWebView = vi.fn();
vi.mock("@capacitor/inappbrowser", () => ({
  InAppBrowser: {
    openInWebView: (...args: unknown[]) => openInWebView(...args),
  },
  DefaultWebViewOptions: { showURL: false, android: {}, iOS: {} },
}));

import { useBrowse } from "./useBrowse";

describe("useBrowse", () => {
  beforeEach(() => {
    isNative.mockReset();
    openInWebView.mockReset();
  });

  it("opens a new tab on the web", async () => {
    isNative.mockReturnValue(false);
    const winOpen = vi.spyOn(window, "open").mockReturnValue(null);
    const { result } = renderHook(() => useBrowse());

    await result.current.open("https://example.com");

    expect(winOpen).toHaveBeenCalledWith(
      "https://example.com",
      "_blank",
      "noopener,noreferrer",
    );
    expect(openInWebView).not.toHaveBeenCalled();
    winOpen.mockRestore();
  });

  it("opens the native in-app WebView on a native platform", async () => {
    isNative.mockReturnValue(true);
    const { result } = renderHook(() => useBrowse());

    await result.current.open("https://example.com");

    expect(openInWebView).toHaveBeenCalledWith(
      expect.objectContaining({ url: "https://example.com" }),
    );
  });
});
