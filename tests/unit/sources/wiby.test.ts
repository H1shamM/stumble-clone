import { describe, it, expect, vi, beforeEach } from "vitest";
import { WibySource } from "../../../app/src/sources/wiby.js";

describe("WibySource", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  it("fetches a Wiby surprise URL successfully", async () => {
    const mockUrl = "https://wiby.me/classic-web-page";
    (global.fetch as any).mockResolvedValue({
      ok: true,
      url: mockUrl,
      headers: {
        get: (header: string) => (header === "Location" ? null : null),
      },
    });

    const source = new WibySource();
    const asset = await source.fetchStumble("random");

    expect(asset).not.toBeNull();
    expect(asset?.url).toBe(mockUrl);
    expect(asset?.source).toBe("Wiby");
  });

  it("handles fetch failure gracefully", async () => {
    (global.fetch as any).mockRejectedValue(new Error("Network error"));

    const source = new WibySource();
    const asset = await source.fetchStumble("random");

    expect(asset).toBeNull();
  });
});
