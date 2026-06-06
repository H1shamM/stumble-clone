/**
 * @fileoverview Reddit content fetcher.
 */

import crypto from 'crypto';
import type { ContentFetcher } from './ContentFetcher.js';
import type { StumbleAsset } from '../models/asset.js';

/**
 * Reddit API post interface.
 */
interface RedditPost {
  data: {
    title: string;
    permalink: string;
    author: string;
    is_self: boolean;
    stickied: boolean;
  };
}

/**
 * Reddit API response interface.
 */
interface RedditApiResponse {
  data: {
    children: RedditPost[];
  };
}

/**
 * Reddit content fetcher implementation.
 */
export class RedditSource implements ContentFetcher {
  private readonly CATEGORY_MAP: Record<string, string> = {
    science: 'science', tech: 'technology', art: 'art', random: 'interestingasfuck', all: 'interestingasfuck'
  };

  /**
   * Fetches a random Reddit post.
   * @param {string} category - The requested category.
   * @returns {Promise<StumbleAsset>}
   * @throws {Error} If API call fails.
   */
  async fetchStumble(category: string): Promise<StumbleAsset> {
    try {
      const subreddit = this.CATEGORY_MAP[category] || 'interestingasfuck';
      const response = await fetch(`https://www.reddit.com/r/${subreddit}/hot.json?limit=25`, { 
        headers: { 'User-Agent': 'stumble-clone:v1.0.0' } 
      });
      
      if (!response.ok) {
        throw new Error(`Reddit API error: ${response.statusText}`);
      }
      
      const data = (await response.json()) as RedditApiResponse;
      const posts = data.data.children.filter((p) => !p.data.is_self && !p.data.stickied);
      
      if (posts.length === 0) {
        throw new Error('No suitable posts found');
      }
      
      const randomPost = posts[Math.floor(Math.random() * posts.length)].data;
      
      return {
        id: crypto.randomUUID(),
        url: `https://www.reddit.com${randomPost.permalink}`,
        title: randomPost.title,
        description: `Reddit post from r/${subreddit} by ${randomPost.author}`,
        source: `Reddit (r/${subreddit})`,
        category: category === 'all' ? 'random' : category,
        rating: 0,
        created_at: new Date(),
      };
    } catch (error) {
      console.error(`Failed to fetch stumble from Reddit (r/${category}):`, error);
      throw error;
    }
  }
}
