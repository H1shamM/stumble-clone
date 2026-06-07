/**
 * @fileoverview Hacker News content fetcher.
 */

import crypto from 'crypto';
import type { ContentFetcher } from './ContentFetcher.js';
import type { StumbleAsset } from '../models/asset.js';
import { fetchWithTimeout } from './utils.js';

/**
 * Hacker News API response interface for a story.
 */
interface HackerNewsStory {
  id: number;
  url?: string;
  title: string;
  by: string;
  score: number;
}

/**
 * Hacker News content fetcher implementation.
 */
export class HackerNewsSource implements ContentFetcher {
  private readonly TOP_STORIES_URL = 'https://hacker-news.firebaseio.com/v0/topstories.json';
  private readonly ITEM_URL_BASE = 'https://hacker-news.firebaseio.com/v0/item/';

  /**
   * Fetches a random Hacker News top story.
   * @param {string} _category - The requested category (unused).
   * @returns {Promise<StumbleAsset | null>}
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async fetchStumble(category: string): Promise<StumbleAsset> {
    try {
      const topStoriesRes = await fetchWithTimeout(this.TOP_STORIES_URL, {}, 5000);
      if (!topStoriesRes.ok) {
        throw new Error(`HN Top Stories API error: ${topStoriesRes.statusText}`);
      }
      const storyIds: number[] = await topStoriesRes.json();
      const randomId = storyIds[Math.floor(Math.random() * Math.min(storyIds.length, 50))];

      const itemRes = await fetchWithTimeout(`${this.ITEM_URL_BASE}${randomId}.json`, {}, 5000);
      if (!itemRes.ok) {
        throw new Error(`HN Item API error: ${itemRes.statusText}`);
      }
      const story: HackerNewsStory = await itemRes.json();

      return {
        id: crypto.randomUUID(),
        url: story.url || `https://news.ycombinator.com/item?id=${story.id}`,
        title: story.title,
        description: `Hacker News story by ${story.by}. Score: ${story.score}`,
        source: 'Hacker News',
        category: 'tech',
        rating: 0,
        created_at: new Date(),
      };
    } catch (error) {
      console.error('Failed to fetch stumble from Hacker News:', error);
      throw error;
    }
  }
}
