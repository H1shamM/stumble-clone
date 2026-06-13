import { describe, it, expect, vi } from "vitest";
import { useStumble } from "../../../ui/src/hooks/useStumble";
import { renderHook, act } from "@testing-library/react";

describe("useStumble - Video Embed URL", () => {
  it("uses direct embed URL for video assets", async () => {
    const mockAsset = {
      id: "v1",
      url: "https://youtube.com/embed/abc",
      type: "video",
      category: "test",
      source: "youtube",
    };
    const authenticatedFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockAsset,
    });
    const { result } = renderHook(() => useStumble(authenticatedFetch, "test"));

    await act(async () => {
      await result.current.fetchStumble();
    });

    expect(result.current.current?.proxyUrl).toBe(
      "https://youtube.com/embed/abc",
    );
    expect(result.current.current?.proxyUrl).not.toContain("/proxy");
  });

  it("uses proxy URL for article assets", async () => {
    const mockAsset = {
      id: "a1",
      url: "https://example.com/article",
      type: "article",
      category: "test",
      source: "web",
    };
    const authenticatedFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockAsset,
    });
    const { result } = renderHook(() => useStumble(authenticatedFetch, "test"));

    await act(async () => {
      await result.current.fetchStumble();
    });

    expect(result.current.current?.proxyUrl).toContain("/proxy");
    expect(result.current.current?.proxyUrl).toContain(
      encodeURIComponent("https://example.com/article"),
    );
  });
});
