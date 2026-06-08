import type { Request, Response } from "express";
import { fetchHtml } from "../utils/fetchHtml.js";
import { assertPublicHttpUrl } from "../utils/urlGuard.js";
import { extractReadable } from "../services/readerService.js";
import { AppError } from "../middleware/errorHandler.js";

/**
 * Serves reader-mode extraction of an external page as JSON.
 */
export class ReaderController {
  /**
   * GET /reader?url=… — fetch the page, extract and sanitize the article, and
   * return it as JSON. Responds 422 when the page has no extractable content.
   */
  read = async (req: Request, res: Response): Promise<void> => {
    const targetUrl = req.query.url as string | undefined;
    if (!targetUrl) {
      throw new AppError("Missing url parameter", 400);
    }

    assertPublicHttpUrl(targetUrl);

    const { html } = await fetchHtml(targetUrl);
    const article = extractReadable(html, targetUrl);
    if (!article) {
      throw new AppError("Could not extract readable content", 422);
    }

    res.json(article);
  };
}
