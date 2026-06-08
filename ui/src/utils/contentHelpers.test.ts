import { describe, it, expect } from "vitest";
import { getFaviconUrl, estimateReadingTime, getDomainFromUrl } from "./contentHelpers";

describe("contentHelpers", () => {
  it("should return correct favicon URL for known sources", () => {
    expect(getFaviconUrl("Hacker News")).toBe(
      "https://news.ycombinator.com/favicon.ico",
    );
    expect(getFaviconUrl("Wikipedia")).toBe(
      "https://www.wikipedia.org/favicon.ico",
    );
  });

  it("should return fallback favicon for unknown source", () => {
    expect(getFaviconUrl("Unknown")).toBe(
      "https://www.google.com/s2/favicons?domain=example.com",
    );
  });

  it("should estimate reading time", () => {
    const text = "word ".repeat(100); // 100 words (0.5 min -> 1 min read)
    expect(estimateReadingTime(text)).toBe("1 min read");
  });

  it("should estimate reading time for 201 words", () => {
    const text = "word ".repeat(201); // 201 words (1.005 min -> 2 min read)
    expect(estimateReadingTime(text)).toBe("2 min read");
  });

  it("should return null for short text", () => {
    expect(estimateReadingTime("short")).toBeNull();
  });

  it("should extract domain from URL", () => {
    expect(getDomainFromUrl("https://www.google.com/search?q=test")).toBe("google.com");
    expect(getDomainFromUrl("https://github.com/H1shamM/stumble-clone")).toBe("github.com");
  });

  it("should return original string for invalid URL", () => {
    expect(getDomainFromUrl("not-a-url")).toBe("not-a-url");
  });
});
