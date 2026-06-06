/**
 * @fileoverview Discovery router for StumbleClone.
 */

import { Router } from 'express';
import type { Request, Response } from 'express';
import { DiscoveryService } from '../../services/discovery_service.js';
import { seedDefaultAssets, DEFAULT_SEED_ASSETS } from '../../bootstrap.js';
import type { IStoragePort } from '../../db/storage_port.js';
import type { AuthenticatedRequest } from '../../middleware/auth.js';

/**
 * Creates the discovery router.
 * @param {DiscoveryService} discoveryService - The discovery service instance.
 * @param {IStoragePort} storage - The storage adapter instance.
 * @returns {Router} The configured discovery router.
 */
export function createDiscoveryRouter(discoveryService: DiscoveryService, storage: IStoragePort): Router {
  const router = Router();

  router.get('/recommendations', async (req: AuthenticatedRequest, res: Response) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const userId = req.user_id;
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });
      const recommendations = await discoveryService.get_recommendations(userId, limit);
      res.json(recommendations);
    } catch (error: unknown) {
      console.error('Error in /recommendations:', error);
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  router.get('/search', async (req: AuthenticatedRequest, res: Response) => {
    try {
      const queryParam = req.query.q as string | string[] | undefined;
      const query = typeof queryParam === 'string' ? queryParam : undefined;
      if (!query) return res.status(400).json({ error: 'Missing query parameter' });
      const results = await storage.search_assets(query);
      res.json(results);
    } catch (error: unknown) {
      console.error('Error in /search:', error);
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  router.get('/stumble', async (req: AuthenticatedRequest, res: Response) => {
    try {
      const category = typeof req.query.category === 'string' ? req.query.category : 'all';
      const historyParam = req.query.history as string | string[] | undefined;
      const history = typeof historyParam === 'string' ? historyParam.split(',') : [];
      const userId = req.user_id;
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });
      
      const asset = await discoveryService.stumble(category, history, userId);
      
      res.json({ ...asset, blocked: asset.source === 'ProductHunt' });
    } catch (error: unknown) {
      res.status(404).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  router.post('/preferences', async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { type, name, delta } = req.body;
      const userId = req.user_id;
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });
      await storage.update_user_preference(userId, type, name, delta);
      res.sendStatus(204);
    } catch (error: unknown) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  router.post('/rate', async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { assetId, isPositive } = req.body;
      const userId = req.user_id;
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });
      await discoveryService.rate(assetId, isPositive, userId);
      res.sendStatus(204);
    } catch (error: unknown) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  router.get('/history', async (req: AuthenticatedRequest, res: Response) => {
    try {
      const limit = parseInt(req.query.limit as string) || 20;
      const userId = req.user_id;
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });
      const history = await discoveryService.get_history(userId, limit);
      res.json(history);
    } catch (error: unknown) {
      console.error('Error in /history:', error);
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  router.post('/favorites', async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { assetId } = req.body;
      const userId = req.user_id;
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });
      await discoveryService.addFavorite(userId, assetId);
      res.sendStatus(201);
    } catch (error: unknown) {
      console.error('Error in POST /favorites:', error);
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  router.get('/favorites', async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user_id;
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });
      const favorites = await discoveryService.getFavorites(userId);
      res.json(favorites);
    } catch (error: unknown) {
      console.error('Error in GET /favorites:', error);
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  router.delete('/favorites/:id', async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user_id;
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });
      const assetId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      await discoveryService.removeFavorite(userId, assetId);
      res.sendStatus(204);
    } catch (error: unknown) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  router.get('/categories', async (_req: Request, res: Response) => {
    try {
      const categories = await discoveryService.get_categories();
      res.json(categories);
    } catch (error: unknown) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  router.post('/seed', async (_req: Request, res: Response) => {
    try {
      await seedDefaultAssets(storage);
      res.json({ message: 'Seeding complete', count: DEFAULT_SEED_ASSETS.length });
    } catch (error: unknown) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  return router;
}
