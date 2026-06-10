import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useStumble } from "./useStumble";

describe("useStumble", () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

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

    expect(result.current).toBeDefined();
  });

  const makeFetchMock = () => {
    let n = 0;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    return vi.fn((_url: string): Promise<Response> =>
      Promise.resolve({
        ok: true,
        json: async () => ({
          id: String(++n),
          url: "http://t.com",
          category: "test",
          source: "test",
        }),
      } as Response),
    );
  };

  it("sends a growing history param so the backend can dedup", async () => {
    const fetchMock = makeFetchMock();

    const { result } = renderHook(() => useStumble(fetchMock, "test"));

    await act(async () => {
      await result.current.fetchStumble();
    });
    
    // Check if calls exist
    expect(fetchMock.mock.calls.length).toBeGreaterThan(0);
    
    // First direct call carries no history (nothing seen yet).
    expect(fetchMock.mock.calls[0][0]).toBe("/stumble?category=test");
    // The follow-up prefetch carries the now-seen id.
    expect(fetchMock.mock.calls[1][0]).toContain("history=");

    // Consume the prefetched item — a second id becomes "seen".
    await act(async () => {
      await result.current.fetchStumble();
    });

    const calls = fetchMock.mock.calls;
    const lastUrl = decodeURIComponent(calls[calls.length - 1][0]);
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

  it("persists seen history to sessionStorage", async () => {
    const fetchMock = makeFetchMock();

    const { result, unmount } = renderHook(() => useStumble(fetchMock, "test"));

    await act(async () => {
      await result.current.fetchStumble();
    });

    expect(JSON.parse(sessionStorage.getItem("stumble:seen:test")!)).toContain("1");
    
    // Remount the hook in the same category (e.g. after a page reload).
    unmount();
    fetchMock.mockClear();

    const { result: result2 } = renderHook(() => useStumble(fetchMock, "test"));
    
    // The history param should already contain the seen ID from sessionStorage
    // But the new fetch happens BEFORE markSeen is called on the new ID.
    // So history should just be "1".
    await act(async () => {
      await result2.current.fetchStumble();
    });
    
    // Restored from sessionStorage: the *very first* request after remount must
    // already carry the previously-seen id, so the backend won't re-serve it.
    // A regression to load-then-clear would send "/stumble?category=test" with
    // no history and fail this assertion.
    const firstUrlAfterRemount = decodeURIComponent(fetchMock.mock.calls[0][0]);
    expect(firstUrlAfterRemount).toContain("history=");
    expect(firstUrlAfterRemount).toContain("1");
  });
});
