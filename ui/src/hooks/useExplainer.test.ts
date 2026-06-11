import { renderHook, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { useExplainer } from "./useExplainer";
import { cleanup } from "@testing-library/react";

afterEach(cleanup);

describe("useExplainer", () => {
  it("returns null data and no error when url is null", async () => {
    const fetchMock = vi.fn();
    const { result } = renderHook(() => useExplainer(fetchMock, null));

    expect(result.current.data).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("calls the correct endpoint and returns data", async () => {
    const mockData = {
      summary: "Summary",
      keyPoints: ["Point 1"],
      image: "image.png",
      provenance: "AI",
      sourceUrl: "http://source.com",
    };
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockData,
    });
    const url = "http://target.com";

    const { result } = renderHook(() => useExplainer(fetchMock, url));

    expect(result.current.loading).toBe(true);

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(fetchMock).toHaveBeenCalledWith(`/explainer?url=${encodeURIComponent(url)}`);
    expect(result.current.data).toEqual(mockData);
    expect(result.current.error).toBeNull();
  });

  it("handles 422 as not available", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 422,
    });
    const url = "http://target.com";

    const { result } = renderHook(() => useExplainer(fetchMock, url));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.data).toBeNull();
    expect(result.current.error).toBeNull();
  });
});
