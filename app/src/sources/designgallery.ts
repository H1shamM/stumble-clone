import crypto from "crypto";
import type { ContentFetcher } from "./ContentFetcher.js";
import type { StumbleAsset } from "../models/asset.js";

export class DesignGallerySource implements ContentFetcher {
  private urls = [
    "https://www.awwwards.com/",
    "https://dribbble.com/",
    "https://www.behance.net/",
    "https://www.designspiration.com/",
    "https://www.siteinspire.com/",
    "https://www.typewolf.com/",
    "https://www.thisiscolossal.com/",
    "https://www.itsnicethat.com/",
  ];

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async fetchStumble(category: string): Promise<StumbleAsset | null> {
    if (this.urls.length === 0) return null;
    const url = this.urls[Math.floor(Math.random() * this.urls.length)]!;

    return {
      id: crypto.randomUUID(),
      url,
      title: new URL(url).hostname.replace("www.", ""),
      description: "A hand-picked design and visual-inspiration site.",
      source: "DesignGallery",
      category: "art",
      rating: 0,
      created_at: new Date(),
    };
  }
}
