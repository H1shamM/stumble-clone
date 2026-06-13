import { describe, it, expect, vi } from "vitest";
import { DiscoveryService } from "../../../app/src/services/discoveryService.js";
import type { IStoragePort } from "../../../app/src/db/storagePort.js";
import type { StumbleAsset } from "../../../app/src/models/asset.js";

describe("DiscoveryService Cooldown", () => {
  it("applies cooldown to recent sources", async () => {
    const assets: StumbleAsset[] = [
      {
        id: "1",
        url: "url1",
        title: "T1",
        source: "A",
        category: "C",
        rating: 0,
        created_at: new Date(),
      },
      {
        id: "2",
        url: "url2",
        title: "T2",
        source: "A",
        category: "C",
        rating: 0,
        created_at: new Date(),
      },
      {
        id: "3",
        url: "url3",
        title: "T3",
        source: "B",
        category: "C",
        rating: 0,
        created_at: new Date(),
      },
    ];
    const storage: IStoragePort = {
      getAllAssets: vi.fn().mockResolvedValue(assets),
      getUserPreferences: vi.fn().mockResolvedValue([]),
    } as any;
    const discoveryService = new DiscoveryService(storage, []);

    // History includes source A
    const history = ["1"]; // Source A

    // Run stumble many times to see if B is selected more often due to A cooldown
    let bCount = 0;
    const runs = 100;
    for (let i = 0; i < runs; i++) {
      const asset = await discoveryService.stumble("C", history, "user1");
      if (asset.source === "B") bCount++;
    }

    // A is heavily penalized (weight 0.05 vs B weight 1), so B should be picked most of the time
    expect(bCount).toBeGreaterThan(80);
  });

  it("serves asset even if all sources are cooled down", async () => {
    const assets: StumbleAsset[] = [
      {
        id: "1",
        url: "url1",
        title: "T1",
        source: "A",
        category: "C",
        rating: 0,
        created_at: new Date(),
      },
    ];
    const storage: IStoragePort = {
      getAllAssets: vi.fn().mockResolvedValue(assets),
      getUserPreferences: vi.fn().mockResolvedValue([]),
    } as any;
    const discoveryService = new DiscoveryService(storage, []);

    // History includes source A
    const history = ["1"]; // Source A

    const asset = await discoveryService.stumble("C", history, "user1");
    expect(asset.source).toBe("A");
  });
});
