import { ContentFetcher } from './ContentFetcher.js';
import type { StumbleAsset } from '../models/asset.js';
import crypto from 'crypto';

export class RedditSource implements ContentFetcher {
  private readonly CATEGORY_MAP: Record<string, string> = {
    science: 'science',
    tech: 'technology',
    art: 'art',
    random: 'interestingasfuck',
    all: 'interestingasfuck'
  };

  async fetchStumble(category: string): Promise<StumbleAsset> {
    const subreddit = this.CATEGORY_MAP[category] || 'interestingasfuck';
    const url = `https://www.reddit.com/r/${subreddit}/hot.json?limit=25`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'stumble-clone:v1.0.0 (by /u/H1shamM)'
      }
    });

    if (!response.ok) {
      throw new Error(`Reddit API error: ${response.statusText}`);
    }

    const data = await response.json();
    const posts = data.data.children.filter((post: any) => !post.data.is_self && !post.data.stickied);

    if (posts.length === 0) {
      throw new Error(`No suitable posts found in r/${subreddit}`);
    }

    const randomPost = posts[Math.floor(Math.random() * posts.length)].data;

    return {
      id: crypto.randomUUID(),
      url: `https://www.reddit.com${randomPost.permalink}`,
      title: randomPost.title,
      description: `Reddit post from r/${subreddit} by ${randomPost.author}. Upvotes: ${randomPost.ups}`,
      source: `Reddit (r/${subreddit})`,
      category: category === 'all' ? 'random' : category,
      rating: 0,
      created_at: new Date(),
    };
  }
}
