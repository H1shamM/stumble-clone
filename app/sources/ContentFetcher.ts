import type { StumbleAsset } from '../models/asset.js';

export interface ContentFetcher {
  fetchStumble(category: string): Promise<StumbleAsset>;
}
