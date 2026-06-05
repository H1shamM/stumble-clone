import { Router } from 'express';
export function createHealthRouter(): Router {
  const router = Router();
  router.get('/health', (req, res) => res.json({ status: 'healthy' }));
  return router;
}
