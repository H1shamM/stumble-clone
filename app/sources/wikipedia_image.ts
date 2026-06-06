/**
 * @fileoverview Wikipedia Featured Image content fetcher.
 */

import crypto from 'crypto';
import type { ContentFetcher } from './ContentFetcher.js';
import type { StumbleAsset } from '../models/asset.js';

/**
 * Wikipedia Featured Image API response interface.
 */
interface WikipediaFeaturedImageResponse {
  image: {
    source: {
      source: string;
    };
    title: string;
  };
}

/**
 * Wikipedia Featured Image content fetcher implementation.
 */
export class WikipediaImageSource implements ContentFetcher {
  private readonly BASE_URL = 'https://en.wikipedia.org/api/rest_v1/feed/featured';

  /**
   * Fetches a random featured image from Wikipedia.
   * @param {string} category - The requested category (unused).
   * @returns {Promise<StumbleAsset>}
   * @throws {Error} If API call fails.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async fetchStumble(category: string): Promise<StumbleAsset> {
    try {
      // Generate a random date within the last year
      const date = new Date(Date.now() - Math.floor(Math.random() * 365) * 24 * 60 * 60 * 1000);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      
      const url = `${this.BASE_URL}/${year}/${month}/${day}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Wikipedia Image API error: ${response.statusText}`);
      }
      
      const data = (await response.json()) as WikipediaFeaturedImageResponse;
      
      return {
        id: crypto.randomUUID(),
        url: data.image.source.source,
        title: data.image.title,
        description: 'Featured image of the day from Wikipedia.',
        source: 'Wikipedia Image',
        category: 'art',
        rating: 0,
        created_at: new Date(),
      };
    } catch (error) {
      console.error('Failed to fetch stumble from Wikipedia Image:', error);
      throw error;
    }
  }
}
