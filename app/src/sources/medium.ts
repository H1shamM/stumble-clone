/**
 * @fileoverview Medium content fetcher using RSS feeds.
 */

import crypto from "crypto";
import type { ContentFetcher } from "./ContentFetcher.js";
import type { StumbleAsset } from "../models/asset.js";
import { fetchWithTimeout, looksEnglish } from "./utils.js";

interface MediumItem {
  link: string;
  title: string;
  description: string;
}

export class MediumSource implements ContentFetcher {
  private readonly categoryTags: Record<string, string> = {
    tech: "technology",
    art: "art",
    science: "science",
    random: "story",
    all: "story",
  };

  async fetchStumble(category: string): Promise<StumbleAsset | null> {
    try {
      const tag = this.categoryTags[category] || "story";
      const rssUrl = `https://medium.com/feed/tag/${tag}`;
      const response = await fetchWithTimeout(rssUrl, {}, 8000);
      if (!response.ok)
        throw new Error(`Medium RSS error: ${response.statusText}`);

      const xml = await response.text();

      // Extract items with regex
      const itemRegex = /<item>([\s\S]*?)<\/item>/g;
      const candidates: MediumItem[] = [];
      let match;
      while ((match = itemRegex.exec(xml)) !== null && candidates.length < 20) {
        const itemXml = match[1];
        if (!itemXml) continue;
        const titleMatch = itemXml.match(
          /<title><!\[CDATA\[(.*?)\]\]><\/title>/,
        );
        const linkMatch = itemXml.match(/<link>(.*?)<\/link>/);
        const descMatch = itemXml.match(
          /<description><!\[CDATA\[(.*?)\]\]><\/description>/,
        );

        if (titleMatch?.[1] && linkMatch?.[1]) {
          const title = titleMatch[1];
          const description =
            descMatch?.[1]?.replace(/<[^>]*>/g, "").slice(0, 200) ||
            "Medium story";

          if (looksEnglish(`${title} ${description}`)) {
            candidates.push({
              title,
              link: linkMatch[1],
              description,
            });
          }
        }
      }

      if (candidates.length === 0) throw new Error("No English items found");

      const randomIndex = Math.floor(Math.random() * candidates.length);
      const randomItem = candidates[randomIndex];

      if (!randomItem) return null;

      return {
        id: crypto.randomUUID(),
        url: randomItem.link,
        title: randomItem.title,
        description: randomItem.description,
        source: "Medium",
        category: category === "all" ? "random" : category,
        rating: 0,
        created_at: new Date(),
      };
    } catch (error) {
      console.error("Failed to fetch from Medium:", error);
      return null;
    }
  }
}
