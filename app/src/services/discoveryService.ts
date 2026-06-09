import type { IStoragePort, RatedItem } from "../db/storagePort.js";
import { AppError } from "../middleware/errorHandler.js";
import type { StumbleAsset } from "../models/asset.js";
import type { ContentFetcher } from "../sources/ContentFetcher.js";
import { isServableAsset } from "./assetGate.js";

/** Below this, block to guarantee the user has something to stumble to. */
const MIN_POOL = 5;
/** Up to this, top the pool up in the background so the corpus keeps growing. */
const TARGET_POOL = 20;

export class DiscoveryService {
  constructor(
    private storage: IStoragePort,
    private sources: ContentFetcher[],
  ) {}

  async getRecommendations(
    userId: string,
    limit: number,
  ): Promise<StumbleAsset[]> {
    return this.storage.getRecommendations(userId, limit);
  }

  async stumble(
    category: string,
    history: string[],
    userId: string,
  ): Promise<StumbleAsset> {
    const preferences = await this.storage.getUserPreferences(userId);
    let assets = await this.storage.getAllAssets(category);

    if (assets.length < MIN_POOL) {
      // Cold start: block once so the user always has something to stumble to.
      const newAsset = await this.fetchFromLiveSources(category);
      if (newAsset) {
        await this.storage.saveAsset(newAsset);
        assets = await this.storage.getAllAssets(category);
      }
    } else if (assets.length < TARGET_POOL) {
      // Warm pool: grow the corpus in the background without blocking the serve.
      void this.backgroundTopUp(category);
    }

    let availableAssets = assets.filter(
      (a: StumbleAsset) => !history.includes(a.id),
    );

    // Session pool exhausted: the user has already seen everything. Try to grow
    // the corpus once, then fall back to the full pool — never a hard error.
    if (availableAssets.length === 0) {
      const fresh = await this.fetchFromLiveSources(category);
      if (fresh) {
        await this.storage.saveAsset(fresh);
        assets = await this.storage.getAllAssets(category);
        availableAssets = assets.filter(
          (a: StumbleAsset) => !history.includes(a.id),
        );
      }
      // Still nothing unseen: reset to the full pool rather than throwing.
      if (availableAssets.length === 0) availableAssets = assets;
    }

    // Only truly empty when the corpus has no assets at all and live fetch failed.
    if (availableAssets.length === 0)
      throw new AppError("No content available right now", 503);

    const weightedAssets = availableAssets.map((asset: StumbleAsset) => {
      let weight = 1;
      const catPref = preferences.find(
        (p) => p.type === "category" && p.name === asset.category,
      );
      const srcPref = preferences.find(
        (p) => p.type === "source" && p.name === asset.source,
      );
      if (catPref) weight += catPref.score;
      if (srcPref) weight += srcPref.score;
      return { asset, weight: Math.max(0.1, weight) };
    });
    const totalWeight = weightedAssets.reduce(
      (sum: number, item: { weight: number }) => sum + item.weight,
      0,
    );
    let random = Math.random() * totalWeight;
    for (const item of weightedAssets) {
      random -= item.weight;
      if (random <= 0) return item.asset;
    }
    if (weightedAssets[0]) return weightedAssets[0].asset;
    throw new Error("No assets available to stumble");
  }

  private async fetchFromLiveSources(
    category: string,
  ): Promise<StumbleAsset | null> {
    // Shuffle sources to try random ones
    const shuffled = [...this.sources];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const temp = shuffled[i];
      if (temp !== undefined && shuffled[j] !== undefined) {
        shuffled[i] = shuffled[j];
        shuffled[j] = temp;
      }
    }

    for (const source of shuffled) {
      if (!source) continue;
      try {
        const asset = await source.fetchStumble(category);
        // Quality gate: only accept videos or pages the reader can extract, so
        // homepages / embed-hostile pages never enter rotation as blank cards.
        if (
          asset &&
          asset.url &&
          asset.title &&
          (await isServableAsset(asset))
        ) {
          return asset;
        }
      } catch (error) {
        console.error(`Failed to fetch from source:`, error);
      }
    }
    return null;
  }

  /**
   * Best-effort background fetch to grow the corpus toward TARGET_POOL. Never
   * throws into the serve path — failures are swallowed.
   */
  private async backgroundTopUp(category: string): Promise<void> {
    try {
      const asset = await this.fetchFromLiveSources(category);
      if (asset) await this.storage.saveAsset(asset);
    } catch (error) {
      console.error("Background top-up failed:", error);
    }
  }

  async rate(
    assetId: string,
    isPositive: boolean,
    userId: string,
  ): Promise<void> {
    const rating = isPositive ? "like" : "dislike";
    const asset = await this.storage.getAssetById(assetId);
    if (!asset) throw new AppError("Asset not found", 404);
    await this.storage.saveRating(userId, assetId, rating);
    await this.storage.updateRating(assetId, isPositive ? 1 : -1);
    await this.storage.updateUserPreference(
      userId,
      "category",
      asset.category,
      isPositive ? 1 : -1,
    );
    await this.storage.updateUserPreference(
      userId,
      "source",
      asset.source,
      isPositive ? 1 : -1,
    );
  }

  async getHistory(userId: string, limit: number): Promise<RatedItem[]> {
    return this.storage.getHistory(userId, limit);
  }

  async addFavorite(userId: string, assetId: string): Promise<void> {
    await this.storage.saveFavorite(userId, assetId);
  }

  async removeFavorite(userId: string, assetId: string): Promise<void> {
    await this.storage.removeFavorite(userId, assetId);
  }

  async getFavorites(userId: string): Promise<StumbleAsset[]> {
    return this.storage.getFavorites(userId);
  }

  async getCategories(): Promise<string[]> {
    return this.storage.getAllCategories();
  }
}
