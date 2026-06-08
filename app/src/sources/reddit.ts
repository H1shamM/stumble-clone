/**
 * @fileoverview Reddit content fetcher – improved to fetch hot posts from relevant subreddits.
 */

import crypto from "crypto";
import type { ContentFetcher } from "./ContentFetcher.js";
import type { StumbleAsset } from "../models/asset.js";
import { fetchWithTimeout } from "./utils.js";

interface RedditPost {
  data: {
    is_self: boolean;
    stickied: boolean;
    url: string;
    title: string;
    author: string;
  };
}

interface RedditResponse {
  data: {
    children: RedditPost[];
  };
}

/**
 * Reddit content fetcher implementation.
 */
export class RedditSource implements ContentFetcher {
  // Map app categories to subreddits
  private readonly categorySubreddits: Record<string, string[]> = {
    tech: ["technology", "programming", "webdev", "gadgets", "coding"],
    art: ["art", "pics", "illustration", "ArtPorn", "creepy"],
    science: ["science", "Physics", "space", "chemistry", "biology"],
    random: [
      "interestingasfuck",
      "Damnthatsinteresting",
      "Unexpected",
      "BeAmazed",
      "mildlyinteresting",
    ],
    all: [
      "interestingasfuck",
      "technology",
      "science",
      "art",
      "todayilearned",
      "Unexpected",
    ],
  };

  /**
   * Fetches a random Reddit post from relevant subreddits.
   * @param {string} category - The requested category.
   * @returns {Promise<StumbleAsset | null>}
   */
  async fetchStumble(category: string): Promise<StumbleAsset | null> {
    try {
      // Get subreddits for the category, fallback to 'all'
      const subreddits =
        this.categorySubreddits[category] || this.categorySubreddits.all;
      if (!subreddits || subreddits.length === 0)
        throw new Error("No subreddits defined");

      const randomSubreddit =
        subreddits[Math.floor(Math.random() * subreddits.length)];
      if (!randomSubreddit) return null;

      // Fetch hot posts from the chosen subreddit, limit 25
      const url = `https://www.reddit.com/r/${randomSubreddit}/hot.json?limit=25`;
      const response = await fetchWithTimeout(
        url,
        {
          headers: {
            "User-Agent": "StumbleClone/1.0 (by /u/stumblebot)",
          },
        },
        8000,
      );

      if (!response.ok) {
        throw new Error(`Reddit API error: ${response.statusText}`);
      }

      const data = (await response.json()) as RedditResponse;
      if (!data?.data?.children || data.data.children.length === 0) {
        throw new Error("No posts found");
      }

      // Filter out self-posts and stickied posts, keep only external links
      const posts = data.data.children.filter((child) => {
        const post = child.data;
        return (
          post &&
          !post.is_self &&
          !post.stickied &&
          post.url &&
          post.url.startsWith("https://")
        );
      });

      if (posts.length === 0) {
        // Fallback to any post (including self-posts) if no external links
        const anyPosts = data.data.children.filter(
          (child) => child.data.url,
        );
        if (anyPosts.length === 0) throw new Error("No suitable posts found");

        const randomAny = anyPosts[Math.floor(Math.random() * anyPosts.length)];
        const post = randomAny?.data;
        if (!post) return null;

        return {
          id: crypto.randomUUID(),
          url: post.url,
          title: post.title,
          description: `Reddit post from r/${randomSubreddit} by ${post.author}`,
          source: `Reddit (r/${randomSubreddit})`,
          category: category === "all" ? "random" : category,
          rating: 0,
          created_at: new Date(),
        };
      }

      const randomPost = posts[Math.floor(Math.random() * posts.length)]?.data;
      if (!randomPost) return null;

      return {
        id: crypto.randomUUID(),
        url: randomPost.url,
        title: randomPost.title,
        description: `Reddit post from r/${randomSubreddit} by ${randomPost.author}`,
        source: `Reddit (r/${randomSubreddit})`,
        category: category === "all" ? "random" : category,
        rating: 0,
        created_at: new Date(),
      };
    } catch (error) {
      console.error(
        `Failed to fetch stumble from Reddit (category ${category}), returning null:`,
        error,
      );
      return null;
    }
  }
}
