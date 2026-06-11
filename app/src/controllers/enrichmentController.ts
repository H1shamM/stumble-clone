import type { Request, Response } from "express";
import { fetchHtml } from "../utils/fetchHtml.js";
import { assertPublicHttpUrl } from "../utils/urlGuard.js";
import { extractReadable } from "../services/readerService.js";
import { enrichReader, type ExplainerLLM } from "../services/enrichmentService.js";
import { AppError } from "../middleware/errorHandler.js";

/**
 * Serves an AI-enriched explainer for a reference page as JSON.
 *
 * GET /reader/enrich?url=… — fetch the page, extract the article, and return a
 * short AI explainer (summary + key points + a representative image) with honest
 * provenance and the original one click away. Never 500s: when enrichment is not
 * configured, the page isn't extractable, or the LLM fails, it responds 422 so
 * the UI gracefully falls back to the normal reader view.
 */
export class EnrichmentController {
  constructor(private readonly llm: ExplainerLLM | null) {}

  read = async (req: Request, res: Response): Promise<void> => {
    const targetUrl = req.query.url as string | undefined;
    if (!targetUrl) {
      throw new AppError("Missing url parameter", 400);
    }

    assertPublicHttpUrl(targetUrl);

    if (!this.llm) {
      throw new AppError("Reader enrichment is not configured", 422);
    }

    const { html } = await fetchHtml(targetUrl);
    const article = extractReadable(html, targetUrl);
    if (!article) {
      throw new AppError("Could not extract readable content", 422);
    }

    const enriched = await enrichReader(article, targetUrl, this.llm);
    if (!enriched) {
      throw new AppError("Enrichment unavailable", 422);
    }

    res.json(enriched);
  };
}
