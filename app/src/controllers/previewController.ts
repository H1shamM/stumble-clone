import type { Request, Response } from "express";
import { fetchHtml } from "../utils/fetchHtml.js";
import { assertPublicHttpUrl } from "../utils/urlGuard.js";
import { extractPreview } from "../services/previewService.js";
import { AppError } from "../middleware/errorHandler.js";

/**
 * Serves a preview card (og:image + metadata) for an external page as JSON, for
 * content that can't be embedded inline. Never 500s: if the page can't be
 * fetched, it returns a minimal card built from the URL so the UI still renders
 * a "preview + open" affordance.
 */
export class PreviewController {
  read = async (req: Request, res: Response): Promise<void> => {
    const targetUrl = req.query.url as string | undefined;
    if (!targetUrl) {
      throw new AppError("Missing url parameter", 400);
    }

    // SSRF guard (throws 400 on blocked/invalid hosts).
    assertPublicHttpUrl(targetUrl);

    try {
      const { html } = await fetchHtml(targetUrl);
      res.json(extractPreview(html, targetUrl));
    } catch {
      // Fetch failed (timeout, refused, etc.) — still return a usable card.
      const hostname = (() => {
        try {
          return new URL(targetUrl).hostname.replace(/^www\./, "");
        } catch {
          return targetUrl;
        }
      })();
      res.json({
        title: hostname,
        description: null,
        image: null,
        siteName: hostname,
        favicon: null,
      });
    }
  };
}
