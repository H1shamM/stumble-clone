/**
 * @fileoverview AtlasObscura content fetcher.
 */

import crypto from 'crypto';
import type { ContentFetcher } from './ContentFetcher.js';
import type { StumbleAsset } from '../models/asset.js';

/**
 * AtlasObscura content fetcher implementation.
 */
export class AtlasObscuraSource implements ContentFetcher {
  private readonly BASE_URL = 'https://www.atlasobscura.com/articles?page=';

  /**
   * Fetches a random AtlasObscura article URL.
   * @param {string} category - The requested category (unused).
   * @returns {Promise<StumbleAsset>}
   * @throws {Error} If API call fails.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async fetchStumble(category: string): Promise<StumbleAsset> {

    try {
      const page = Math.floor(Math.random() * 10) + 1;
      const response = await fetch(`${this.BASE_URL}${page}`);
      
      if (!response.ok) {
        throw new Error(`AtlasObscura API error: ${response.statusText}`);
      }
      
      const html = await response.text();
      
      // Simplistic extraction: find an article link
      const linkMatch = html.match(/href="\/articles\/([^"]+)"/);
      if (!linkMatch) {
        throw new Error('Could not find article');
      }
      
      return {
        id: crypto.randomUUID(),
        url: `https://www.atlasobscura.com/articles/${linkMatch[1]}`,
        title: 'Atlas Obscura Article',
        description: 'Explore the hidden wonders of the world.',
        source: 'AtlasObscura',
        category: 'art', // Atlas Obscura fits well here
        rating: 0,
        created_at: new Date(),
      };
    } catch (error) {
      console.error('Failed to fetch stumble from AtlasObscura:', error);
      throw error;
    }
  }
}
