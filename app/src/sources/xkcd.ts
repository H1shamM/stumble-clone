/**
 * @fileoverview Xkcd comic content fetcher.
 */

import crypto from "crypto";
import type { ContentFetcher } from "./ContentFetcher.js";
import type { StumbleAsset } from "../models/asset.js";
import { fetchWithTimeout } from "./utils.js";

/**
 * Xkcd API response interface for a comic.
 */
interface XkcdComic {
  num: number;
  title: string;
  alt: string;
}

/**
 * Xkcd content fetcher implementation.
 */
export class XkcdSource implements ContentFetcher {
  /**
   * Fetches a random xkcd comic.
   * @param {string} _category - The requested category (unused).
   * @returns {Promise<StumbleAsset | null>}
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async fetchStumble(category: string): Promise<StumbleAsset | null> {
    try {
      // 1. Fetch the latest comic to get the max comic number
      const latestRes = await fetchWithTimeout(
        "https://xkcd.com/info.0.json",
        {},
        5000,
      );
      if (!latestRes.ok) {
        return null;
      }
      const latest: XkcdComic = await latestRes.json();

      // 2. Pick a random comic number
      const n = Math.floor(Math.random() * latest.num) + 1;

      // 3. Fetch the random comic
      const res = await fetchWithTimeout(
        `https://xkcd.com/${n}/info.0.json`,
        {},
        5000,
      );
      if (!res.ok) {
        return null;
      }
      const comic: XkcdComic = await res.json();

      // 4. Return the mapped asset
      return {
        id: crypto.randomUUID(),
        url: `https://xkcd.com/${comic.num}/`,
        title: `xkcd: ${comic.title}`,
        description: comic.alt ?? "",
        source: "xkcd",
        category: "random",
        rating: 0,
        created_at: new Date(),
      };
    } catch (error) {
      console.error("Failed to fetch stumble from xkcd:", error);
      return null;
    }
  }
}
