import { Request, Response, NextFunction } from "express";
import { ExplainerService, NotArticleError } from "../services/explainerService.js";
import { assertPublicHttpUrl } from "../utils/urlGuard.js";
import { AppError } from "../middleware/errorHandler.js";

/**
 * Serves an AI-enriched explainer for a reference page as JSON.
 *
 * GET /explainer?url=…
 */
export class ExplainerController {
  constructor(private explainerService: ExplainerService) {}

  async explain(req: Request, res: Response, next: NextFunction) {
    try {
      const targetUrl = req.query.url as string | undefined;
      if (!targetUrl) {
        throw new AppError("Missing url parameter", 400);
      }

      assertPublicHttpUrl(targetUrl);

      const result = await this.explainerService.explain(targetUrl);
      res.status(200).json(result);
    } catch (error) {
      if (error instanceof NotArticleError) {
        res.status(422).json({ error: error.message, statusCode: 422 });
      } else {
        next(error); // Passes to error handler for 503/500
      }
    }
  }
}
