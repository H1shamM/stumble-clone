import { describe, it, expect } from "vitest";
import { ScienceWebSource } from "../../../app/src/sources/scienceweb.js";

describe("ScienceWebSource", () => {
  it("fetches a science site successfully", async () => {
    const source = new ScienceWebSource();
    const asset = await source.fetchStumble("science");

    expect(asset).not.toBeNull();
    expect(asset?.source).toBe("ScienceWeb");
    expect(asset?.category).toBe("science");
    expect(asset?.url).toMatch(/^https:\/\//);
  });
});
