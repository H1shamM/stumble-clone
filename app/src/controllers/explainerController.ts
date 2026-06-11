import type { Request, Response } from "express";
import { assertPublicHttpUrl } from "../utils/urlGuard.js";
import { AppError } from "../middleware/errorHandler.js";
import type { AuthenticatedRequest } from "../middleware/auth.js";
import {
  ExplainerService,
  NotArticleError,
} from "../services/explainerService.js";
import { DiscoveryService } from "../services/discoveryService.js";
import {
  ExplainerTruncatedError,
  ExplainerUnavailableError,
} from "../adapters/claudeExplainer.js";

/**
 * GET /explainer?url=… — returns the AI explainer reel for an article. Mirrors
 * the readerController contract: 200 + the draft; **422** when the page isn't an
 * extractable article or the explainer isn't configured; **503** on an upstream
 * LLM failure; **never 500** (the UI falls back to the plain reader view).
 */
export class ExplainerController {
  constructor(
    private readonly service: ExplainerService | null,
    private readonly discoveryService: DiscoveryService,
  ) {}

  read = async (req: Request, res: Response): Promise<void> => {
    const targetUrl = req.query.url as string | undefined;
    if (!targetUrl) {
      throw new AppError("Missing url parameter", 400);
    }

    // SSRF guard (throws 400 on blocked/invalid hosts).
    assertPublicHttpUrl(targetUrl);

    if (!this.service) {
      throw new AppError("Explainer is not configured", 422);
    }

    try {
      const result = await this.service.explain(targetUrl);
      res.json(result);
    } catch (err) {
      if (err instanceof NotArticleError) {
        throw new AppError("Not an extractable article", 422);
      }
      if (
        err instanceof ExplainerTruncatedError ||
        err instanceof ExplainerUnavailableError
      ) {
        throw new AppError("Explainer temporarily unavailable", 503);
      }
      // Any other failure (network, extraction, parse) — surface as 503, never 500.
      throw new AppError("Explainer temporarily unavailable", 503);
    }
  };

  rate = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { assetId, isPositive } = req.body;
    const userId = req.user_id;
    if (!userId) throw new AppError("Unauthorized", 401);
    await this.discoveryService.rate(assetId, isPositive, userId);
    res.sendStatus(204);
  };
}
