import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  enrichReader,
  firstImage,
  _clearEnrichmentCache,
  type ExplainerLLM,
} from "../../../app/src/services/enrichmentService";
import type { ReaderResult } from "../../../app/src/services/readerService";

const reader = (over: Partial<ReaderResult> = {}): ReaderResult => ({
  title: "How Volcanoes Work",
  byline: null,
  siteName: "earth.example",
  excerpt: null,
  content:
    '<p>Intro</p><img src="https://cdn.example.com/lava.jpg" alt="lava" /><p>More</p>',
  textContent: "A long article about magma and pressure.".repeat(20),
  length: 800,
  ...over,
});

const draft = {
  summary: "Magma rises, pressure wins.",
  keyPoints: ["a", "b"],
  scenes: [
    {
      heading: "Pressure builds",
      body: "Gas and magma stack up.",
      emoji: "🌋",
    },
    { heading: "It blows", body: "The cap fails.", emoji: "💥" },
  ],
};

describe("enrichReader", () => {
  beforeEach(() => _clearEnrichmentCache());

  it("returns an explainer with scenes, image, provenance and source url", async () => {
    const llm: ExplainerLLM = { summarize: vi.fn().mockResolvedValue(draft) };
    const result = await enrichReader(
      reader(),
      "https://earth.example/volcanoes",
      llm,
    );

    expect(result).not.toBeNull();
    expect(result!.summary).toBe("Magma rises, pressure wins.");
    expect(result!.keyPoints).toEqual(["a", "b"]);
    expect(result!.scenes).toHaveLength(2);
    expect(result!.scenes[0]).toEqual({
      heading: "Pressure builds",
      body: "Gas and magma stack up.",
      emoji: "🌋",
    });
    expect(result!.image).toBe("https://cdn.example.com/lava.jpg");
    expect(result!.provenance).toBe("AI summary of earth.example");
    expect(result!.sourceUrl).toBe("https://earth.example/volcanoes");
  });

  it("drops malformed scenes (missing heading/body)", async () => {
    const llm: ExplainerLLM = {
      summarize: vi.fn().mockResolvedValue({
        ...draft,
        scenes: [
          { heading: "Good", body: "Keep me.", emoji: "✅" },
          { heading: "", body: "No heading.", emoji: "❌" },
          { heading: "No body", body: "  ", emoji: "❌" },
        ],
      }),
    };
    const result = await enrichReader(reader(), "https://earth.example/x", llm);
    expect(result!.scenes).toHaveLength(1);
    expect(result!.scenes[0].heading).toBe("Good");
  });

  it("falls back to the hostname for provenance when siteName is absent", async () => {
    const llm: ExplainerLLM = { summarize: vi.fn().mockResolvedValue(draft) };
    const result = await enrichReader(
      reader({ siteName: null }),
      "https://www.foo.test/x",
      llm,
    );
    expect(result!.provenance).toBe("AI summary of foo.test");
  });

  it("caches per URL so the LLM is called once", async () => {
    const summarize = vi.fn().mockResolvedValue(draft);
    const llm: ExplainerLLM = { summarize };
    const url = "https://earth.example/cache";

    await enrichReader(reader(), url, llm);
    await enrichReader(reader(), url, llm);

    expect(summarize).toHaveBeenCalledTimes(1);
  });

  it("returns null when the LLM throws (graceful fallback to plain reader)", async () => {
    const llm: ExplainerLLM = {
      summarize: vi.fn().mockRejectedValue(new Error("rate limited")),
    };
    const result = await enrichReader(
      reader(),
      "https://earth.example/fail",
      llm,
    );
    expect(result).toBeNull();
  });

  it("returns null on an empty summary", async () => {
    const llm: ExplainerLLM = {
      summarize: vi
        .fn()
        .mockResolvedValue({ summary: "   ", keyPoints: [], scenes: [] }),
    };
    const result = await enrichReader(
      reader(),
      "https://earth.example/empty",
      llm,
    );
    expect(result).toBeNull();
  });
});

describe("firstImage", () => {
  it("extracts the first absolute image src", () => {
    expect(
      firstImage(
        '<p>x</p><img src="https://x.test/a.png" /><img src="https://x.test/b.png" />',
      ),
    ).toBe("https://x.test/a.png");
  });

  it("ignores relative or missing images", () => {
    expect(firstImage('<img src="/relative.png" />')).toBeNull();
    expect(firstImage("<p>no images here</p>")).toBeNull();
  });
});
