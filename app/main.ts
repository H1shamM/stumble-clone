/**
 * @fileoverview Main entry point for the StumbleClone backend server.
 * Configures the Express app, dependency injection, and routes.
 */

import express from 'express';
import type { Express } from 'express';
import cors from 'cors';
import { settings } from './config/settings.js';
import { SqliteAdapter } from './db/sqlite_adapter.js';
import { DiscoveryService } from './services/discovery_service.js';
import { createDiscoveryRouter } from './api/v1/discovery_routes.js';
import { createAuthRouter } from './api/v1/auth_routes.js';
import { createHealthRouter } from './api/v1/health.js';
import { authenticateJWT } from './middleware/auth.js';
import { seedDefaultAssets } from './bootstrap.js';
import passport from 'passport';
import { initPassport } from './config/passport.js';

// Sources
import { WikipediaSource } from './sources/wikipedia.js';
import { HackerNewsSource } from './sources/hn.js';
import { RedditSource } from './sources/reddit.js';
import { DevToSource } from './sources/devto.js';
import { UselessWebSource } from './sources/uselessweb.js';
import { AtlasObscuraSource } from './sources/atlasobscura.js';
import { BoredPandaSource } from './sources/boredpanda.js';
import { WikipediaImageSource } from './sources/wikipedia_image.js';
import { NasaApodSource } from './sources/nasa_apod.js';
import { ProductHuntSource } from './sources/producthunt.js';
import { YoutubeSource } from './sources/youtube.js';
import type { ContentFetcher } from './sources/ContentFetcher.js';

const app: Express = express();

app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());
app.use(passport.initialize());

// 1. Dependency Injection
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
  new WikipediaImageSource(),
  new NasaApodSource(),
  new ProductHuntSource(),
  new YoutubeSource(),
];
const discoveryService = new DiscoveryService(storage, sources);

// 2. Routing Setup
app.use('/api/v1/auth', createAuthRouter(storage));
app.use('/api/v1', createHealthRouter());
app.use('/api/v1', authenticateJWT, createDiscoveryRouter(discoveryService, storage));

/**
 * Bootstraps the application by initializing data if necessary.
 * @returns {Promise<void>}
 */
async function bootstrap(): Promise<void> {
  try {
    const categories = await discoveryService.get_categories();
    if (categories.length === 0) {
      console.log('--- Bootstrap Seeding ---');
      await seedDefaultAssets(storage);
    }
  } catch (error) {
    console.error('Bootstrap failed:', error);
  }
}

bootstrap();

app.listen(settings.port, () => {
  console.log(`[StumbleApp] running on port ${settings.port}`);
});
