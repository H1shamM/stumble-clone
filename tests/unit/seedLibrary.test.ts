import { describe, it, expect } from "vitest";
import { DEFAULT_SEED_ASSETS } from "../../app/src/bootstrap";

// Durable invariants on the curated library (#268). These guard every future
// addition — a duplicate id/url or a source exceeding the cap fails CI.
describe("DEFAULT_SEED_ASSETS — curated library invariants", () => {
  const VALID_TYPES = ["article", "image", "video", "interactive"];
  const VALID_CATEGORIES = ["tech", "art", "science", "random"];

  it("has no duplicate ids", () => {
    const ids = DEFAULT_SEED_ASSETS.map((a) => a.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("has no duplicate urls", () => {
    const urls = DEFAULT_SEED_ASSETS.map((a) => a.url);
    expect(new Set(urls).size).toBe(urls.length);
  });

  it("never lets a single source exceed the cap (≤2)", () => {
    const counts = new Map<string, number>();
    for (const a of DEFAULT_SEED_ASSETS) {
      counts.set(a.source, (counts.get(a.source) ?? 0) + 1);
    }
    const offenders = [...counts.entries()].filter(([, n]) => n > 2);
    expect(offenders).toEqual([]);
  });

  it("every entry has all required fields with valid values", () => {
    for (const a of DEFAULT_SEED_ASSETS) {
      expect(a.id, `id for ${a.url}`).toBeTruthy();
      expect(a.url, `url for ${a.id}`).toMatch(/^https?:\/\//);
      expect(a.title, `title for ${a.id}`).toBeTruthy();
      expect(a.description, `description for ${a.id}`).toBeTruthy();
      expect(a.source, `source for ${a.id}`).toBeTruthy();
      expect(VALID_CATEGORIES, `category for ${a.id}`).toContain(a.category);
      expect(a.rating, `rating for ${a.id}`).toBe(0);
      expect(VALID_TYPES, `type for ${a.id}`).toContain(a.type);
      expect(a.channel, `channel for ${a.id}`).toBeTruthy();
    }
  });

  it("includes the #268 expansion entries", () => {
    const ids = new Set(DEFAULT_SEED_ASSETS.map((a) => a.id));
    for (const id of [
      "v5",
      "v6",
      "v7",
      "v8",
      "ic13",
      "ic14",
      "ic15",
      "sci1",
      "sci2",
      "sci3",
    ]) {
      expect(ids.has(id), `expected seed id ${id}`).toBe(true);
    }
  });
});
