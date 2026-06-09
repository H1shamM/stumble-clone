import { describe, it, expect, beforeEach } from "vitest";
import { SqliteAdapter } from "../../../app/src/db/sqliteAdapter.js";
import crypto from "crypto";

describe("assetDedup", () => {
  let adapter: SqliteAdapter;

  beforeEach(() => {
    // Use a fresh in-memory database for each test
    adapter = new SqliteAdapter(":memory:");
  });

  it("saveAsset is idempotent per url", async () => {
    const url = "https://example.com";
    const asset1 = {
      id: crypto.randomUUID(),
      url,
      title: "Title 1",
      source: "Source",
      category: "Category",
      rating: 0,
      created_at: new Date(),
    };
    const asset2 = {
      ...asset1,
      id: crypto.randomUUID(),
      title: "Title 2",
    };

    await adapter.saveAsset(asset1);
    await adapter.saveAsset(asset2);

    const assets = await adapter.getAllAssets("all");
    expect(assets.length).toBe(1);
    expect(assets[0].title).toBe("Title 2");
  });

  it("rating survives re-save of same url", async () => {
    const url = "https://example.com";
    const asset1 = {
      id: crypto.randomUUID(),
      url,
      title: "Title 1",
      source: "Source",
      category: "Category",
      rating: 3,
      created_at: new Date(),
    };
    const asset2 = {
      ...asset1,
      id: crypto.randomUUID(),
      title: "Title 2",
      rating: 99, // This should be ignored by ON CONFLICT
    };

    await adapter.saveAsset(asset1);
    await adapter.saveAsset(asset2);

    const assets = await adapter.getAllAssets("all");
    expect(assets.length).toBe(1);
    expect(assets[0].rating).toBe(3); // Original rating preserved
  });
});
