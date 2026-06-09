import { describe, it, expect, vi, beforeEach } from "vitest";
import type { StumbleAsset } from "../../../app/src/models/asset";
import type { IStoragePort } from "../../../app/src/db/storagePort";
import type { ContentFetcher } from "../../../app/src/sources/ContentFetcher";

vi.mock("../../../app/src/services/assetGate.js", () => ({
  isServableAsset: vi.fn(),
}));

import { DiscoveryService } from "../../../app/src/services/discoveryService";
import { isServableAsset } from "../../../app/src/services/assetGate.js";

const asset = (id: string): StumbleAsset => ({
  id,
  url: `https://example.com/${id}`,
  title: `Asset ${id}`,
  source: "Test",
  category: "tech",
  rating: 0,
  created_at: new Date(),
});

describe("DiscoveryService session dedup / graceful exhaustion", () => {
  let storage: any;
  let source: ContentFetcher;
  // A saturated pool so the cold-start / background-topup branches don't fire.
  const pool = Array.from({ length: 20 }, (_, i) => asset(`p${i}`));
  const fullHistory = pool.map((a) => a.id);

  beforeEach(() => {
    vi.mocked(isServableAsset).mockReset();
    storage = {
      getAllAssets: vi.fn(),
      getUserPreferences: vi.fn().mockResolvedValue([]),
      saveAsset: vi.fn().mockResolvedValue(undefined),
    };
    source = { fetchStumble: vi.fn() };
  });

  const build = () => new DiscoveryService(storage as IStoragePort, [source]);

  it("when everything is seen, fetches a fresh asset and serves it", async () => {
    const fresh = asset("fresh");
    storage.getAllAssets
      .mockResolvedValueOnce(pool) // initial read
      .mockResolvedValueOnce([...pool, fresh]); // after the fallback fetch+save
    vi.mocked(source.fetchStumble).mockResolvedValue(fresh);
    vi.mocked(isServableAsset).mockResolvedValue(true);

    const result = await build().stumble("tech", fullHistory, "user1");

    expect(storage.saveAsset).toHaveBeenCalledWith(fresh);
    expect(result.id).toBe("fresh"); // the only asset not in history
  });

  it("when seen and no fresh content, falls back to the full pool (no throw)", async () => {
    storage.getAllAssets.mockResolvedValue(pool);
    vi.mocked(source.fetchStumble).mockResolvedValue(null); // live fetch yields nothing

    const result = await build().stumble("tech", fullHistory, "user1");

    expect(result).toBeDefined();
    expect(fullHistory).toContain(result.id); // a repeat, but never an error
  });

  it("only throws when the corpus is genuinely empty", async () => {
    storage.getAllAssets.mockResolvedValue([]);
    vi.mocked(source.fetchStumble).mockResolvedValue(null);

    await expect(build().stumble("tech", [], "user1")).rejects.toThrow();
  });
});
