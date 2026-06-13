import { describe, it, expect, vi, afterEach } from "vitest";
import { renderHook, waitFor, cleanup } from "@testing-library/react";
import { useReader } from "./useReader";

describe("useReader", () => {
  afterEach(() => {
    cleanup();
    mockAuthenticatedFetch.mockReset();
  });

  const mockAuthenticatedFetch = vi.fn();

  it("populates data and sets loading false on success", async () => {
    const mockResult = {
      title: "Test Article",
      byline: "Author",
      siteName: "Site",
      excerpt: "Excerpt",
      content: "<p>Content</p>",
      textContent: "Content",
      length: 7,
    };
    mockAuthenticatedFetch.mockResolvedValue({
      ok: true,
      json: async () => mockResult,
    });

    const { result } = renderHook(() =>
      useReader(mockAuthenticatedFetch, "https://example.com"),
    );

    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data).toEqual(mockResult);
    expect(result.current.error).toBeNull();
  });

  it("sets error when fetch fails", async () => {
    mockAuthenticatedFetch.mockResolvedValue({
      ok: false,
      status: 422,
    });

    const { result } = renderHook(() =>
      useReader(mockAuthenticatedFetch, "https://example.com"),
    );

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe("Could not load reader view");
    expect(result.current.data).toBeNull();
  });

  it("does not fetch when url is null", async () => {
    renderHook(() => useReader(mockAuthenticatedFetch, null));
    expect(mockAuthenticatedFetch).not.toHaveBeenCalled();
  });
});
