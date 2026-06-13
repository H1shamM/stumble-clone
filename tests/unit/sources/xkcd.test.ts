import { describe, it, expect, vi, beforeEach } from "vitest";
import { XkcdSource } from "../../../app/src/sources/xkcd.js";

describe("XkcdSource", () => {
  let source: XkcdSource;

  beforeEach(() => {
    source = new XkcdSource();
    vi.restoreAllMocks();
  });

  it("should fetch and map xkcd data successfully", async () => {
    // Mock the two sequential fetch calls
    global.fetch = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ num: 100 }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          num: 42,
          title: "Test",
          alt: "alt text",
        }),
      });

    const result = await source.fetchStumble("random");

    expect(result).not.toBeNull();
    if (result) {
      expect(result.url).toBe("https://xkcd.com/42/");
      expect(result.title).toBe("xkcd: Test");
      expect(result.description).toBe("alt text");
      expect(result.source).toBe("xkcd");
      expect(result.category).toBe("random");
    }
  });

  it("should return null when the first fetch (latest) fails", async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: false,
    });

    const result = await source.fetchStumble("random");
    expect(result).toBeNull();
  });

  it("should return null when the second fetch (comic) fails", async () => {
    global.fetch = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ num: 100 }),
      })
      .mockResolvedValueOnce({
        ok: false,
      });

    const result = await source.fetchStumble("random");
    expect(result).toBeNull();
  });

  it("should return null and log error when an exception occurs", async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error("Network error"));
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const result = await source.fetchStumble("random");
    expect(result).toBeNull();
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});
