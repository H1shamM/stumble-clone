/**
 * @fileoverview Reader enrichment: turn a dense reference article into a short,
 * lively AI explainer — the "simplify the science so people enjoy learning it"
 * idea the user raised across three eval sessions (#184). Provider-agnostic: the
 * LLM is injected via the `ExplainerLLM` port, so the service is unit-testable
 * without a live API and the model can be swapped. Cached per-URL because
 * summaries are expensive, and it degrades gracefully (returns null) so a failed
 * enrichment never breaks plain reading.
 */

import { JSDOM } from "jsdom";
import type { ReaderResult } from "./readerService.js";
import { screenshotUrl, extractPreview } from "./previewService.js";

/** One slide of the explainer reel: a beat with a heading, body, and emoji. */
export interface ExplainerScene {
  heading: string;
  body: string;
  /**
   * A single emoji illustrating this beat (zero-cost visual). Optional — somber
   * subjects omit it rather than forcing a cheerful glyph.
   */
  emoji?: string;
}

export interface EnrichmentDraft {
  /** A short, engaging summary (a few sentences). */
  summary: string;
  /** 3–5 punchy "things to know" takeaways. */
  keyPoints: string[];
  /** 4–6 slides for the animated explainer reel (the "wow" view). */
  scenes: ExplainerScene[];
}

/** The LLM port. Implemented by `ClaudeExplainer`; mocked in tests. */
export interface ExplainerLLM {
  summarize(input: { title: string; text: string }): Promise<EnrichmentDraft>;
}

export interface EnrichmentResult extends EnrichmentDraft {
  /** A representative image pulled from the article, when present. */
  image: string | null;
  /** Honest provenance line, e.g. "AI summary of theatlantic.com". */
  provenance: string;
  /** The original page — always one click away. */
  sourceUrl: string;
}

const cache = new Map<string, EnrichmentResult>();
const CACHE_LIMIT = 200;

/**
 * Pull the first high-quality absolute <img src> out of sanitized reader HTML.
 * Junk-filters irrelevant small assets (logos, icons, spacers).
 */
export function firstImage(html: string): string | null {
  // Use JSDOM to properly parse attributes and junk-filter
  const dom = new JSDOM(html);
  const doc = dom.window.document;
  const imgs = Array.from(doc.querySelectorAll("img"));

  for (const img of imgs) {
    const src = img.getAttribute("src");
    if (!src || !src.startsWith("http")) continue;

    const lowerSrc = src.toLowerCase();
    const isJunkUrl = ["logo", "icon", "avatar", "spacer"].some((j) =>
      lowerSrc.includes(j),
    );
    if (isJunkUrl) continue;

    const widthStr = img.getAttribute("width");
    const heightStr = img.getAttribute("height");
    const width = widthStr ? parseInt(widthStr) : 999;
    const height = heightStr ? parseInt(heightStr) : 999;
    if (width <= 32 || height <= 32) continue;

    return src;
  }

  return null;
}

/**
 * Shared helper to pick the best hero image for an article.
 * Fallback order: article <img> → page og:image → screenshot backstop.
 */
export function resolveHeroImage(
  articleHtml: string,
  url: string,
  rawHtml?: string,
): string {
  const best = firstImage(articleHtml);
  if (best) return best;

  if (rawHtml) {
    // extractPreview handles og:image → twitter:image → screenshotUrl(url)
    return extractPreview(rawHtml, url).image || screenshotUrl(url);
  }

  return screenshotUrl(url);
}

function hostname(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

/**
 * Produce a cached, enriched explainer for an already-extracted article.
 * Returns null when enrichment is unavailable (LLM error, empty result) so the
 * caller falls back to the normal reader view — enrichment is additive, never a
 * gate on reading.
 */
export async function enrichReader(
  reader: ReaderResult,
  url: string,
  llm: ExplainerLLM,
): Promise<EnrichmentResult | null> {
  const cached = cache.get(url);
  if (cached) return cached;

  let draft: EnrichmentDraft;
  try {
    draft = await llm.summarize({
      title: reader.title,
      text: reader.textContent,
    });
  } catch {
    return null;
  }

  if (!draft?.summary?.trim()) return null;

  const result: EnrichmentResult = {
    summary: draft.summary.trim(),
    keyPoints: (draft.keyPoints ?? []).filter((p) => p?.trim()),
    scenes: (draft.scenes ?? []).filter(
      (s) => s?.heading?.trim() && s?.body?.trim(),
    ),
    image: resolveHeroImage(reader.content, url),
    provenance: `AI summary of ${reader.siteName || hostname(url)}`,
    sourceUrl: url,
  };

  // Bounded LRU-ish cache: drop the oldest entry when full.
  if (cache.size >= CACHE_LIMIT) {
    const oldest = cache.keys().next().value;
    if (oldest !== undefined) cache.delete(oldest);
  }
  cache.set(url, result);
  return result;
}

/** Test hook: clear the per-URL enrichment cache. */
export function _clearEnrichmentCache(): void {
  cache.clear();
}
