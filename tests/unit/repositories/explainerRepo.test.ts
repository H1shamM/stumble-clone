import { describe, it, expect, beforeEach } from "vitest";
import Database from "better-sqlite3";
import { SqliteExplainerRepo } from "../../../app/src/repositories/explainerRepo";
import type { EnrichmentDraft } from "../../../app/src/services/enrichmentService";

const draft: EnrichmentDraft = {
  summary: "A short, engaging summary.",
  keyPoints: ["First takeaway", "Second takeaway"],
  scenes: [{ heading: "The hook", body: "Why this matters.", emoji: "💡" }],
};

describe("SqliteExplainerRepo", () => {
  let repo: SqliteExplainerRepo;

  beforeEach(() => {
    // The repo creates its own table — no manual schema setup needed.
    repo = new SqliteExplainerRepo(new Database(":memory:"));
  });

  it("returns a stored draft on a hit", () => {
    repo.put("https://example.com/a", "v1", draft);
    expect(repo.get("https://example.com/a", "v1")).toEqual(draft);
  });

  it("returns null on a miss", () => {
    expect(repo.get("https://example.com/missing", "v1")).toBeNull();
  });

  it("treats a different prompt_version as a miss", () => {
    repo.put("https://example.com/a", "v1", draft);
    expect(repo.get("https://example.com/a", "v2")).toBeNull();
  });

  it("upserts (no duplicate-key throw) when re-putting the same key", () => {
    repo.put("https://example.com/a", "v1", draft);
    const updated: EnrichmentDraft = { ...draft, summary: "Revised summary." };
    expect(() =>
      repo.put("https://example.com/a", "v1", updated),
    ).not.toThrow();
    expect(repo.get("https://example.com/a", "v1")?.summary).toBe(
      "Revised summary.",
    );
  });
});
