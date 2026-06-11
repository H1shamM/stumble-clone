import { describe, it, expect, beforeEach } from "vitest";
import Database from "better-sqlite3";
import { SqliteExplainerRepo } from "../../../app/src/repositories/explainerRepo.js";
import { EnrichmentResult } from "../../../app/src/services/enrichmentService.js";

describe("SqliteExplainerRepo", () => {
  let db: Database.Database;
  let repo: SqliteExplainerRepo;

  beforeEach(() => {
    db = new Database(":memory:");
    db.exec(`
      CREATE TABLE IF NOT EXISTS explainer_cache (
        url TEXT,
        prompt_version TEXT,
        draft_json TEXT,
        created_at INTEGER,
        PRIMARY KEY(url, prompt_version)
      )
    `);
    repo = new SqliteExplainerRepo(db);
  });

  it("should cache and retrieve draft", async () => {
    const url = "http://test.com";
    const version = "v1";
    const draft: EnrichmentResult = {
      summary: "Summary",
      keyPoints: ["Point 1"],
      image: "image.png",
      provenance: "AI",
      sourceUrl: url,
      scenes: [],
    };

    await repo.put(url, version, draft);
    const retrieved = await repo.get(url, version);
    expect(retrieved).toEqual(draft);
  });

  it("should return null for miss", async () => {
    const retrieved = await repo.get("http://notfound.com", "v1");
    expect(retrieved).toBeNull();
  });

  it("should return null for different prompt version", async () => {
    const url = "http://test.com";
    const draft: EnrichmentResult = {
      summary: "Summary",
      keyPoints: ["Point 1"],
      image: "image.png",
      provenance: "AI",
      sourceUrl: url,
      scenes: [],
    };

    await repo.put(url, "v1", draft);
    const retrieved = await repo.get(url, "v2");
    expect(retrieved).toBeNull();
  });
});
