/**
 * @fileoverview Wiby content fetcher.
 */

import crypto from "crypto";
import type { ContentFetcher } from "./ContentFetcher.js";
import type { StumbleAsset } from "../models/asset.js";

/**
 * Wiby content fetcher implementation.
 */
export class WibySource implements ContentFetcher {
  private readonly baseUrl: string = "https://wiby.me/surprise/";

  /**
   * Fetches a random Wiby surprise URL.
   * @param {string} category - The requested category (unused).
   * @returns {Promise<StumbleAsset | null>}
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async fetchStumble(category: string): Promise<StumbleAsset | null> {
    try {
      const response = await fetch(this.baseUrl, {
        method: "GET",
        redirect: "manual", // Don't follow automatically if we need to inspect Location header
      });

      // Wiby surprise usually redirects to the actual page
      const url = response.headers.get("Location") || response.url;
      
      if (!url) return null;

      return {
        id: crypto.randomUUID(),
        url,
        title: "A Classic Indie Page",
        description: "An exploration of the classic, lightweight web.",
        source: "Wiby",
        category: "random",
        rating: 0,
        created_at: new Date(),
      };
    } catch (error) {
      console.error("Wiby fetch error:", error);
      return null;
    }
  }
}
