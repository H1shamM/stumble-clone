import crypto from "crypto";
import type { ContentFetcher } from "./ContentFetcher.js";
import type { StumbleAsset } from "../models/asset.js";

export class ScienceWebSource implements ContentFetcher {
  private urls = [
    "https://apod.nasa.gov/apod/",
    "https://www.quantamagazine.org/",
    "https://www.sciencealert.com/",
    "https://www.livescience.com/",
    "https://phys.org/",
    "https://www.smithsonianmag.com/science-nature/",
    "https://www.newscientist.com/",
    "https://earthobservatory.nasa.gov/",
  ];

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async fetchStumble(category: string): Promise<StumbleAsset | null> {
    if (this.urls.length === 0) return null;
    const url = this.urls[Math.floor(Math.random() * this.urls.length)]!;

    return {
      id: crypto.randomUUID(),
      url,
      title: new URL(url).hostname.replace("www.", ""),
      description: "A hand-picked science and space site.",
      source: "ScienceWeb",
      category: "science",
      rating: 0,
      created_at: new Date(),
    };
  }
}
