import { describe, it, expect } from "vitest";
import { extractReadable } from "../../../app/src/services/readerService.js";

describe("extractReadable", () => {
  it("returns null for malformed HTML (no throw)", () => {
    const result = extractReadable("<not real html", "https://x.com");
    expect(result).toBeNull();
  });

  it("returns null for thin extractions (under 400 chars)", () => {
    const html =
      "<html><body><article><h1>Small</h1><p>Not enough content here.</p></article></body></html>";
    const result = extractReadable(html, "https://example.com");
    expect(result).toBeNull();
  });

  it("returns result object for valid article HTML (over 400 chars)", () => {
    const longText = "word ".repeat(100);
    const html = `<html><head><title>Long</title></head><body><article><h1>Long</h1><p>${longText}</p></article></body></html>`;
    const result = extractReadable(html, "https://example.com");
    expect(result).not.toBeNull();
    expect(result?.title).toBe("Long");
  });

  it("caches results and returns cached value on subsequent calls", () => {
    const longText = "word ".repeat(100);
    const html = `<html><head><title>Cached</title></head><body><article><h1>Cached</h1><p>${longText}</p></article></body></html>`;
    const url = "https://cached.com";

    const result1 = extractReadable(html, url);
    const result2 = extractReadable("completely different html", url);

    expect(result1).not.toBeNull();
    expect(result2).toBe(result1);
    expect(result2?.title).toBe("Cached");
  });
});
