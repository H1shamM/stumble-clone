/**
 * @fileoverview Dev.to content fetcher.
 */

import crypto from 'crypto';
import type { ContentFetcher } from './ContentFetcher.js';
import type { StumbleAsset } from '../models/asset.js';

/**
 * Dev.to API article interface.
 */
interface DevToArticle {
  url: string;
  title: string;
  user: { name: string };
}

/**
 * Dev.to content fetcher implementation.
 */
export class DevToSource implements ContentFetcher {
  private readonly API_URL = 'https://dev.to/api/articles?top=7';

  /**
   * Fetches a random Dev.to article.
   * @param {string} _category - The requested category (unused).
   * @returns {Promise<StumbleAsset>}
   * @throws {Error} If API call fails.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async fetchStumble(category: string): Promise<StumbleAsset> {
    try {
      const response = await fetch(this.API_URL);
      if (!response.ok) {
        throw new Error(`Dev.to API error: ${response.statusText}`);
      }
      const articles = (await response.json()) as DevToArticle[];
      if (articles.length === 0) {
        throw new Error('No articles found on Dev.to');
      }
      
      const randomArticle = articles[Math.floor(Math.random() * articles.length)];
      
      return {
        id: crypto.randomUUID(),
        url: randomArticle.url,
        title: randomArticle.title,
        description: `Dev.to article by ${randomArticle.user.name}`,
        source: 'Dev.to',
        category: 'tech',
        rating: 0,
        created_at: new Date(),
      };
    } catch (error) {
      console.error('Failed to fetch stumble from Dev.to:', error);
      throw error;
    }
  }
}
