/**
 * @fileoverview Interface for content fetchers.
 */

import type { StumbleAsset } from '../models/asset.js';

/**
 * Interface for components that fetch content from external sources.
 */
export interface ContentFetcher {
  /**
   * Fetches a new asset from the source.
   * @param {string} category - The category to fetch.
   * @returns {Promise<StumbleAsset>}
   */
  fetchStumble(category: string): Promise<StumbleAsset>;
}
