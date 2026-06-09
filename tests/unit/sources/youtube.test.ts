import { describe, it, expect } from "vitest";
import { YoutubeSource } from "../../../app/src/sources/youtube.js";

describe("YoutubeSource", () => {
  it("fetches a youtube asset with correct watch and embed URLs", async () => {
    const source = new YoutubeSource();
    const asset = await source.fetchStumble("random");

    expect(asset).not.toBeNull();
    expect(asset?.source).toBe("YouTube");
    expect(asset?.url).toMatch(/^https:\/\/www\.youtube\.com\/watch\?v=/);
    expect(asset?.proxyUrl).toMatch(/^https:\/\/www\.youtube\.com\/embed\//);
    
    // Check that the ID in watch URL matches embed URL
    const watchId = asset?.url.split("v=")[1];
    const embedId = asset?.proxyUrl?.split("/embed/")[1];
    expect(watchId).toBe(embedId);
  });
});
