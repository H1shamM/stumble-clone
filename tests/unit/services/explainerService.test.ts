import { describe, it, expect, vi } from "vitest";
import {
  ExplainerService,
  NotArticleError,
} from "../../../app/src/services/explainerService";
import type { ReaderResult } from "../../../app/src/services/readerService";
import type {
  EnrichmentDraft,
  ExplainerLLM,
} from "../../../app/src/services/enrichmentService";

const article: ReaderResult = {
  title: "Tardigrade",
  byline: null,
  siteName: "Wikipedia",
  excerpt: null,
  content:
    '<p>It survives.</p><img src="https://cdn.example.com/water-bear.jpg" />',
  textContent: "A tiny animal that survives almost anything.".repeat(20),
  length: 800,
};

const draft: EnrichmentDraft = {
  summary: "It refuses to die.",
  keyPoints: ["tiny", "tough"],
  scenes: [
    { heading: "The hook", body: "Boiled, frozen, irradiated.", emoji: "🐻" },
    { heading: "", body: "dropped — no heading" }, // filtered out
  ],
};

/** Deps that never touch the network: canned fetch + extract. */
const okDeps = (extract = () => article) => ({
  fetchHtml: vi.fn(async () => ({ html: "<html/>" })),
  extract: vi.fn(extract),
});

describe("ExplainerService.explain (#218)", () => {
  it("returns an enriched result for an article and builds image/provenance", async () => {
    const summarize = vi.fn(async () => draft);
    const llm: ExplainerLLM = { summarize };
    const svc = new ExplainerService(llm, okDeps());

    const result = await svc.explain(
      "https://en.wikipedia.org/wiki/Tardigrade",
    );

    expect(result.summary).toBe("It refuses to die.");
    expect(result.keyPoints).toEqual(["tiny", "tough"]);
    expect(result.scenes).toHaveLength(1); // malformed scene filtered
    expect(result.image).toBe("https://cdn.example.com/water-bear.jpg");
    expect(result.provenance).toBe("AI summary of Wikipedia");
    expect(result.sourceUrl).toBe("https://en.wikipedia.org/wiki/Tardigrade");
  });

  it("serves the second call from cache — the LLM is summarized once", async () => {
    const summarize = vi.fn(async () => draft);
    const svc = new ExplainerService({ summarize }, okDeps());
    const url = "https://en.wikipedia.org/wiki/Tardigrade";

    await svc.explain(url);
    const second = await svc.explain(url);

    expect(summarize).toHaveBeenCalledTimes(1);
    expect(second.summary).toBe("It refuses to die.");
  });

  it("throws NotArticleError when the page can't be extracted", async () => {
    const summarize = vi.fn(async () => draft);
    const svc = new ExplainerService(
      { summarize },
      okDeps(() => null), // extraction fails → not article-like
    );

    await expect(svc.explain("https://example.com/app")).rejects.toBeInstanceOf(
      NotArticleError,
    );
    expect(summarize).not.toHaveBeenCalled();
  });

  it("propagates the LLM error (does not swallow it to null)", async () => {
    const summarize = vi.fn(async () => {
      throw new Error("upstream LLM failed");
    });
    const svc = new ExplainerService({ summarize }, okDeps());

    await expect(
      svc.explain("https://en.wikipedia.org/wiki/Tardigrade"),
    ).rejects.toThrow(/upstream LLM failed/);
  });
});
