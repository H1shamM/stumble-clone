import crypto from "crypto";
import type { ContentFetcher } from "./ContentFetcher.js";
import type { StumbleAsset } from "../models/asset.js";
import { fetchWithTimeout } from "./utils.js";

export class LobstersSource implements ContentFetcher {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async fetchStumble(category: string): Promise<StumbleAsset | null> {
    try {
      const res = await fetchWithTimeout(
        "https://lobste.rs/hottest.json",
        {},
        5000,
      );
      if (!res.ok) return null;

      const stories = await res.json();
      if (!Array.isArray(stories) || stories.length === 0) return null;

      const story =
        stories[Math.floor(Math.random() * Math.min(stories.length, 25))];
      const url =
        story.url ||
        (story.short_id ? `https://lobste.rs/s/${story.short_id}` : null);

      if (!url) return null;

      return {
        id: crypto.randomUUID(),
        url,
        title: story.title,
        description: `Lobsters · ${story.score ?? 0} points`,
        source: "Lobsters",
        category: "tech",
        rating: 0,
        created_at: new Date(),
      };
    } catch (e) {
      console.error("Error fetching from Lobsters:", e);
      return null;
    }
  }
}
