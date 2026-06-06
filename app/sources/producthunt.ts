/**
 * @fileoverview ProductHunt content fetcher.
 */

import crypto from 'crypto';
import type { ContentFetcher } from './ContentFetcher.js';
import type { StumbleAsset } from '../models/asset.js';

/**
 * ProductHunt content fetcher implementation.
 */
export class ProductHuntSource implements ContentFetcher {
  /**
   * Fetches a ProductHunt asset.
   * @param {string} _category - The requested category (unused).
   * @returns {Promise<StumbleAsset>}
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async fetchStumble(category: string): Promise<StumbleAsset> {
    return {
      id: crypto.randomUUID(),
      url: 'https://www.producthunt.com/',
      title: 'Product Hunt',
      description: 'Trending products.',
      source: 'ProductHunt',
      category: 'tech',
      rating: 0,
      created_at: new Date(),
    };
  }
}
