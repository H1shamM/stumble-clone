import { describe, it, expect } from "vitest";
import { DesignGallerySource } from "../../../app/src/sources/designgallery.js";

describe("DesignGallerySource", () => {
  it("fetches a design site successfully", async () => {
    const source = new DesignGallerySource();
    const asset = await source.fetchStumble("art");

    expect(asset).not.toBeNull();
    expect(asset?.source).toBe("DesignGallery");
    expect(asset?.category).toBe("art");
    expect(asset?.url).toMatch(/^https:\/\//);
  });
});
