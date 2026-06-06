import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import express from 'express';
import { createDiscoveryRouter } from '../../app/api/v1/discovery_routes';
import { SqliteAdapter } from '../../app/db/sqlite_adapter';
import { DiscoveryService } from '../../app/services/discovery_service';
import fs from 'fs';

const DB_PATH = 'test_recs.db';

describe('POST /api/v1/recommendations', () => {
  let app: express.Express;
  let dbAdapter: SqliteAdapter;

  beforeAll(async () => {
    dbAdapter = new SqliteAdapter(DB_PATH);
    const service = new DiscoveryService(dbAdapter, []);
    app = express();
    app.use(express.json());
    // Mock user_id middleware
    app.use((req, res, next) => {
        (req as any).user_id = 'user1';
        next();
    });
    app.use('/api/v1', createDiscoveryRouter(service, dbAdapter));
  });

  afterAll(() => {
    if (fs.existsSync(DB_PATH)) fs.unlinkSync(DB_PATH);
  });

  it('should return recommended assets', async () => {
    // Seed user
    await dbAdapter.db.prepare('INSERT INTO users (id, email, password_hash, created_at) VALUES (?, ?, ?, ?)').run('user1', 'test@test.com', 'hash', new Date().toISOString());

    // Seed some assets and preferences
    await dbAdapter.save_asset({ id: 'a1', url: 'http://a1.com', title: 'A1', source: 's1', category: 'cat1', rating: 5, created_at: new Date() } as any);
    await dbAdapter.update_user_preference('user1', 'category', 'cat1', 10);
    
    const response = await request(app).get('/api/v1/recommendations');
    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(1);
    expect(response.body[0].id).toBe('a1');
  });
});
