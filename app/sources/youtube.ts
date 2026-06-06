/**
 * @fileoverview YouTube content fetcher.
 */

import crypto from 'crypto';
import type { ContentFetcher } from './ContentFetcher.js';
import type { StumbleAsset } from '../models/asset.js';

/**
 * YouTube content fetcher implementation.
 */
export class YoutubeSource implements ContentFetcher {
  private readonly videoIds: string[] = ['dQw4w9WgXcQ', 'jNQXAC9IVRw', '9bZkp7q19f0']; // Example IDs

  /**
   * Fetches a random YouTube asset.
   * @param {string} _category - The requested category (unused).
   * @returns {Promise<StumbleAsset>}
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async fetchStumble(category: string): Promise<StumbleAsset> {
    const id = this.videoIds[Math.floor(Math.random() * this.videoIds.length)];
    return {
      id: crypto.randomUUID(),
      url: `https://www.youtube.com/embed/${id}`,
      title: 'YouTube Video',
      description: 'A random video.',
      source: 'YouTube',
      category: 'random',
      rating: 0,
      created_at: new Date(),
    };
  }
}
