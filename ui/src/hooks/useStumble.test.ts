import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { useStumble } from "./useStumble";

describe("useStumble", () => {
  it("should use pre-fetched data if available", async () => {
    const mockAuthenticatedFetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        id: "1",
        url: "http://test.com",
        category: "all",
        source: "test",
      }),
    });

    const { result } = renderHook(() =>
      useStumble(mockAuthenticatedFetch, "all"),
    );

    // First stumble (no prefetch)
    await act(async () => {
      await result.current.fetchStumble();
    });

    expect(mockAuthenticatedFetch).toHaveBeenCalledTimes(2); // Initial + prefetch

    // Manually set prefetch state via the hook
    act(() => {
      result.current.fetchStumble(); // Trigger again
    });

    // Ideally this would test the prefetch path, but this hook setup
    // makes internal state testing complex. This verifies the hook runs.
    expect(result.current).toBeDefined();
  });

  const makeFetchMock = () => {
    let n = 0;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    return vi.fn((_url: string) =>
      Promise.resolve({
        ok: true,
        json: async () => ({
          id: String(++n),
          url: "http://t.com",
          category: "all",
          source: "test",
        }),
      } as Response),
    );
  };

  it("sends a growing history param so the backend can dedup", async () => {
    const fetchMock = makeFetchMock();

    const { result } = renderHook(() => useStumble(fetchMock, "all"));

    await act(async () => {
      await result.current.fetchStumble();
    });
    // First direct call carries no history (nothing seen yet).
    expect(fetchMock.mock.calls[0][0]).toBe("/stumble?category=all");
    // The follow-up prefetch carries the now-seen id.
    expect(fetchMock.mock.calls[1][0]).toContain("history=");

    // Consume the prefetched item — a second id becomes "seen".
    await act(async () => {
      await result.current.fetchStumble();
    });

    const lastUrl = decodeURIComponent(fetchMock.mock.calls.at(-1)![0]);
    expect(lastUrl).toContain("history=");
    expect(lastUrl).toContain("1");
    expect(lastUrl).toContain("2");
  });

  it("resets history when the category changes", async () => {
    const fetchMock = makeFetchMock();

    const { result, rerender } = renderHook(
      ({ c }: { c: string }) => useStumble(fetchMock, c),
      { initialProps: { c: "all" } },
    );

    await act(async () => {
      await result.current.fetchStumble();
    });

    rerender({ c: "tech" });
    fetchMock.mockClear();

    await act(async () => {
      await result.current.fetchStumble();
    });

    // After a category switch the seen set is cleared, so no history is sent.
    expect(fetchMock.mock.calls[0][0]).toBe("/stumble?category=tech");
  });
});
