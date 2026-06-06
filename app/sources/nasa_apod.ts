/**
 * @fileoverview NASA APOD content fetcher.
 */

import crypto from 'crypto';
import type { ContentFetcher } from './ContentFetcher.js';
import type { StumbleAsset } from '../models/asset.js';

/**
 * NASA APOD content fetcher implementation.
 */
export class NasaApodSource implements ContentFetcher {
  /**
   * Fetches the NASA APOD asset.
   * @param {string} _category - The requested category (unused).
   * @returns {Promise<StumbleAsset>}
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async fetchStumble(category: string): Promise<StumbleAsset> {
    // NASA APOD API needs a key. Using a public RSS or similar would be better.
    // For now, hardcode/simplistic.
    return {
      id: crypto.randomUUID(),
      url: 'https://apod.nasa.gov/apod/astropix.html',
      title: 'NASA Image of the Day',
      description: 'Explore the cosmos.',
      source: 'NasaApod',
      category: 'science',
      rating: 0,
      created_at: new Date(),
    };
  }
}
