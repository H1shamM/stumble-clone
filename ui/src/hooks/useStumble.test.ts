import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { useStumble } from "./useStumble";

describe("useStumble - Video Embed URL", () => {
  it("uses direct embed URL for video assets and proxy for article assets", async () => {
    const mockAssets = [
      {
        id: "v1",
        url: "https://youtube.com/embed/abc",
        type: "video",
        category: "test",
        source: "youtube",
      },
      {
        id: "a1",
        url: "https://example.com/article",
        type: "article",
        category: "test",
        source: "web",
      },
    ];

    let callCount = 0;
    const authenticatedFetch = vi.fn().mockImplementation(() => {
      const asset = mockAssets[callCount++];
      return Promise.resolve({
        ok: true,
        json: async () => asset,
      });
    });
    const { result } = renderHook(() => useStumble(authenticatedFetch, "test"));

    // Stumble 1: Video
    await act(async () => {
      await result.current.fetchStumble();
    });
    expect(result.current.current?.proxyUrl).toBe("https://youtube.com/embed/abc");
    expect(result.current.current?.proxyUrl).not.toContain("/proxy");

    // Stumble 2: Article
    await act(async () => {
      await result.current.fetchStumble();
    });
    expect(result.current.current?.proxyUrl).toContain("/proxy");
    expect(result.current.current?.proxyUrl).toContain(encodeURIComponent("https://example.com/article"));
  });
});
