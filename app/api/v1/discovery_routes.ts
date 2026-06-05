import { Router } from 'express';
import { DiscoveryService } from '../../services/discovery_service.js';
import type { IStoragePort } from '../../db/storage_port.js';

export function createDiscoveryRouter(discoveryService: DiscoveryService, storage: IStoragePort): Router {
  const router = Router();

  router.get('/stumble', async (req, res) => {
    try {
      const category = (req.query.category as string) || 'all';
      const history = (req.query.history as string)?.split(',') || [];
      
      const asset = await discoveryService.stumble(category, history);
      res.json(asset);
    } catch (error: any) {
      res.status(404).json({ error: error.message });
    }
  });

  router.post('/rate', async (req, res) => {
    try {
      const { assetId, isPositive } = req.body;
      await discoveryService.rate(assetId, isPositive);
      res.sendStatus(204);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  router.get('/categories', async (req, res) => {
    const categories = await discoveryService.get_categories();
    res.json(categories);
  });

  router.post('/seed', async (req, res) => {
    try {
      const mock_data = [
        // tech
        { id: 't1', url: 'https://news.ycombinator.com', title: 'Hacker News', category: 'tech' },
        { id: 't2', url: 'https://dev.to', title: 'DEV Community', category: 'tech' },
        // art
        { id: 'a1', url: 'https://www.thisiscolossal.com', title: 'Colossal', category: 'art' },
        { id: 'a2', url: 'https://www.artsy.net', title: 'Artsy', category: 'art' },
        // science
        { id: 's1', url: 'https://en.wikipedia.org/wiki/Special:Random', title: 'Wikipedia Random', category: 'science' },
        { id: 's2', url: 'https://www.nature.com', title: 'Nature', category: 'science' },
        // random
        { id: 'r1', url: 'https://www.producthunt.com', title: 'Product Hunt', category: 'random' },
        { id: 'r2', url: 'https://www.atlasobscura.com', title: 'Atlas Obscura', category: 'random' },
      ];

      for (const item of mock_data) {
        await storage.save_asset({
          ...item,
          rating: 0,
          created_at: new Date()
        });
      }
      res.json({ message: 'Seeding complete', count: mock_data.length });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  return router;
}
