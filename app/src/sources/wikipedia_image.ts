/**
 * @fileoverview Wikipedia Featured Image content fetcher – simplified.
 */

import crypto from 'crypto';
import type { ContentFetcher } from './ContentFetcher.js';
import type { StumbleAsset } from '../models/asset.js';

export class WikipediaImageSource implements ContentFetcher {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async fetchStumble(_category: string): Promise<StumbleAsset | null> {
    try {
      // Use a static random image from Wikimedia Commons
      return {
        id: crypto.randomUUID(),
        url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7a/Random_example.jpg/800px-Random_example.jpg',
        title: 'Random Wikimedia Image',
        description: 'Random image from Wikimedia Commons',
        source: 'Wikipedia Image',
        category: 'art',
        rating: 0,
        created_at: new Date(),
      };
    } catch (error) {
      console.error('Failed to fetch stumble from Wikipedia Image, returning null:', error);
      return null;
    }
  }
}