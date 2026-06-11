/**
 * @fileoverview Explainer service — composes reader extraction + the LLM port
 * into a single `explain(url)` orchestration (B3 of the Explainer epic, #215).
 *
 * Flow: fetch → extract (the reader extraction IS the article gate — a page that
 * won't extract is not article-like → `NotArticleError`) → look up the cached
 * draft by (url, PROMPT_VERSION) → summarize on a miss → build the result.
 *
 * The draft cache is an in-memory `Map` here; B2 (#217) swaps in the SQLite repo
 * via the injectable `ExplainerDraftCache`. The LLM's typed errors
 * (`ExplainerTruncatedError` / `ExplainerUnavailableError`) deliberately
 * propagate so the controller (B4) can map them to a 503 — this service does
 * NOT swallow them to null like the additive `enrichReader`.
 */

import { fetchHtml as realFetchHtml } from "../utils/fetchHtml.js";
import { extractReadable } from "./readerService.js";
import type { ReaderResult } from "./readerService.js";
import { PROMPT_VERSION } from "../prompts/explainerPrompt.js";
import {
  resolveHeroImage,
  type EnrichmentDraft,
  type EnrichmentResult,
  type ExplainerLLM,
} from "./enrichmentService.js";

/** The page could not be extracted as an article — not eligible for an explainer. */
export class NotArticleError extends Error {
  constructor(url: string) {
    super(`Not an extractable article: ${url}`);
    this.name = "NotArticleError";
  }
}

/** Persistence port for explainer drafts, keyed by (url, prompt_version). */
export interface ExplainerDraftCache {
  get(
    url: string,
    version: string,
  ): Promise<EnrichmentDraft | null> | EnrichmentDraft | null;
  put(
    url: string,
    version: string,
    draft: EnrichmentDraft,
  ): Promise<void> | void;
}

/** Default in-memory cache; B2 replaces it with the SQLite-backed repo. */
class MemoryDraftCache implements ExplainerDraftCache {
  private readonly map = new Map<string, EnrichmentDraft>();
  private readonly limit = 200;
  private key(url: string, version: string): string {
    return `${version}::${url}`;
  }
  get(url: string, version: string): EnrichmentDraft | null {
    return this.map.get(this.key(url, version)) ?? null;
  }
  put(url: string, version: string, draft: EnrichmentDraft): void {
    if (this.map.size >= this.limit) {
      const oldest = this.map.keys().next().value;
      if (oldest !== undefined) this.map.delete(oldest);
    }
    this.map.set(this.key(url, version), draft);
  }
}

function hostname(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

interface ExplainerDeps {
  fetchHtml?: (url: string) => Promise<{ html: string }>;
  extract?: (html: string, url: string) => ReaderResult | null;
  cache?: ExplainerDraftCache;
}

export class ExplainerService {
  private readonly fetchHtml: (url: string) => Promise<{ html: string }>;
  private readonly extract: (html: string, url: string) => ReaderResult | null;
  private readonly cache: ExplainerDraftCache;

  constructor(
    private readonly llm: ExplainerLLM,
    deps: ExplainerDeps = {},
  ) {
    this.fetchHtml = deps.fetchHtml ?? realFetchHtml;
    this.extract = deps.extract ?? extractReadable;
    this.cache = deps.cache ?? new MemoryDraftCache();
  }

  async explain(url: string): Promise<EnrichmentResult> {
    const { html } = await this.fetchHtml(url);
    const article = this.extract(html, url);
    if (!article) throw new NotArticleError(url);

    let draft = await this.cache.get(url, PROMPT_VERSION);
    if (!draft) {
      // Let the adapter's typed errors propagate (B4 maps them to 503).
      draft = await this.llm.summarize({
        title: article.title,
        text: article.textContent,
      });
      await this.cache.put(url, PROMPT_VERSION, draft);
    }

    return {
      summary: draft.summary.trim(),
      keyPoints: (draft.keyPoints ?? []).filter((p) => p?.trim()),
      scenes: (draft.scenes ?? []).filter(
        (s) => s?.heading?.trim() && s?.body?.trim(),
      ),
      image: resolveHeroImage(article.content, url, html),
      provenance: `AI summary of ${article.siteName || hostname(url)}`,
      sourceUrl: url,
    };
  }
}
