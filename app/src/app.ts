// app/src/app.ts
import express from "express";
import cors from "cors";
import passport from "passport";
import { settings } from "./config/settings.js";
import { SqliteAdapter } from "./db/sqliteAdapter.js";
import { DiscoveryService } from "./services/discoveryService.js";
import { AuthController } from "./controllers/authController.js";
import { DiscoveryController } from "./controllers/discoveryController.js";
import { SubmissionController } from "./controllers/submissionController.js";
import { ProxyController } from "./controllers/proxyController.js";
import { ReaderController } from "./controllers/readerController.js";
import { PreviewController } from "./controllers/previewController.js";
import { ExplainerController } from "./controllers/explainerController.js";
import { ClaudeExplainer } from "./adapters/claudeExplainer.js";
import type { ExplainerLLM } from "./services/enrichmentService.js";
import { healthCheck } from "./controllers/healthController.js";
import { authenticateJWT } from "./middleware/auth.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";
import { initPassport } from "./config/passport.js";
import { logger } from "./utils/logger.js";

// Sources
import { WikipediaSource } from "./sources/wikipedia.js";
import { HackerNewsSource } from "./sources/hn.js";
import { RedditSource } from "./sources/reddit.js";
import { DevToSource } from "./sources/devto.js";
import { UselessWebSource } from "./sources/uselessweb.js";
import { AtlasObscuraSource } from "./sources/atlasobscura.js";
import { BoredPandaSource } from "./sources/boredpanda.js";
import { NasaApodSource } from "./sources/nasa_apod.js";
import { ProductHuntSource } from "./sources/producthunt.js";
import { YoutubeSource } from "./sources/youtube.js";
import type { ContentFetcher } from "./sources/ContentFetcher.js";
import jwt from "jsonwebtoken";
import { GitHubTrendingSource } from "./sources/github_trending.js";
import { MediumSource } from "./sources/medium.js";
import { LobstersSource } from "./sources/lobsters.js";
import { XkcdSource } from "./sources/xkcd.js";
import { DesignGallerySource } from "./sources/designgallery.js";
import { ScienceWebSource } from "./sources/scienceweb.js";
import { WibySource } from "./sources/wiby.js";
import type { User } from "./models/user.js";

export async function createApp() {
  const app = express();

  // CORS
  app.use(
    cors({
      origin: [
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:3000",
      ],
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
    }),
  );

  // Body parsing
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Passport
  app.use(passport.initialize());

  // Request logging
  app.use((req, res, next) => {
    logger.info(
      { method: req.method, url: req.url, ip: req.ip },
      "Incoming request",
    );
    next();
  });

  // Dependency Injection
  const storage = new SqliteAdapter(settings.dbPath);
  initPassport(storage);

  const sources: ContentFetcher[] = [
    new WikipediaSource(),
    new HackerNewsSource(),
    new RedditSource(),
    new DevToSource(),
    new UselessWebSource(),
    new AtlasObscuraSource(),
    new BoredPandaSource(),
    // new WikipediaImageSource(),
    new NasaApodSource(),
    new ProductHuntSource(),
    new YoutubeSource(),
    new GitHubTrendingSource(),
    new MediumSource(),
    new LobstersSource(),
    new XkcdSource(),
    new DesignGallerySource(),
    new ScienceWebSource(),
    new WibySource(),
  ];
  const discoveryService = new DiscoveryService(storage, sources);

  // Controllers
  const authController = new AuthController(storage);
  const discoveryController = new DiscoveryController(
    discoveryService,
    storage,
  );
  const submissionController = new SubmissionController(storage);
  const proxyController = new ProxyController();
  const readerController = new ReaderController();
  const previewController = new PreviewController();
  // Reader enrichment is opt-in: only wired when an Anthropic key is present,
  // so the app runs (and tests pass) without one — the controller then 422s and
  // the UI falls back to the plain reader view.
  const explainer: ExplainerLLM | null = (() => {
    try {
      return process.env.ANTHROPIC_API_KEY ? new ClaudeExplainer() : null;
    } catch {
      return null;
    }
  })();
  const explainerController = new ExplainerController(explainer);
  // Routes
  const v1Router = express.Router();

  // Auth routes
  v1Router.post("/auth/register", authController.register);
  v1Router.post("/auth/login", authController.login);
  v1Router.get("/auth/me", authenticateJWT, authController.me);

  // OAuth routes
  if (settings.google) {
    v1Router.get(
      "/auth/google",
      passport.authenticate("google", { scope: ["profile", "email"] }),
    );
    v1Router.get(
      "/auth/google/callback",
      passport.authenticate("google", {
        failureRedirect: "/login",
        session: false,
      }),
      (req, res) => {
        const user = req.user as User;
        const token = jwt.sign({ id: user.id }, settings.jwtSecret);
        res.redirect(
          `${process.env.FRONTEND_URL || "http://localhost:5173"}?token=${token}`,
        );
      },
    );
  }
  if (settings.github) {
    v1Router.get(
      "/auth/github",
      passport.authenticate("github", { scope: ["user:email"] }),
    );
    v1Router.get(
      "/auth/github/callback",
      passport.authenticate("github", {
        failureRedirect: "/login",
        session: false,
      }),
      (req, res) => {
        const user = req.user as User;
        const token = jwt.sign({ id: user.id }, settings.jwtSecret);
        res.redirect(
          `${process.env.FRONTEND_URL || "http://localhost:5173"}?token=${token}`,
        );
      },
    );
  }

  // Discovery routes
  v1Router.get(
    "/recommendations",
    authenticateJWT,
    discoveryController.getRecommendations,
  );
  v1Router.get("/search", authenticateJWT, discoveryController.search);
  v1Router.get("/stumble", authenticateJWT, discoveryController.stumble);
  v1Router.post(
    "/preferences",
    authenticateJWT,
    discoveryController.updatePreferences,
  );
  v1Router.post("/rate", authenticateJWT, discoveryController.rate);
  v1Router.get("/history", authenticateJWT, discoveryController.getHistory);
  v1Router.post("/favorites", authenticateJWT, discoveryController.addFavorite);
  v1Router.get("/favorites", authenticateJWT, discoveryController.getFavorites);
  v1Router.delete(
    "/favorites/:id",
    authenticateJWT,
    discoveryController.removeFavorite,
  );
  v1Router.get("/categories", discoveryController.getCategories);
  v1Router.post("/seed", discoveryController.seed);
  v1Router.get("/proxy", authenticateJWT, proxyController.proxy);
  v1Router.get("/reader", authenticateJWT, readerController.read);
  v1Router.get("/explainer", authenticateJWT, explainerController.explain);
  v1Router.get("/preview", authenticateJWT, previewController.read);

  // Submission routes
  v1Router.post(
    "/submissions",
    authenticateJWT,
    submissionController.createSubmission,
  );
  v1Router.get(
    "/submissions",
    authenticateJWT,
    submissionController.getAllSubmissions,
  );

  // Health
  v1Router.get("/health", healthCheck);

  // Mount v1 router
  app.use("/api/v1", v1Router);

  // 404 handler
  app.use(notFoundHandler);

  // Global error handler (must be last)
  app.use(errorHandler);

  return { app, storage, discoveryService };
}
