import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { SqliteAdapter } from '../../app/db/sqlite_adapter.js';
import { DiscoveryService } from '../../app/services/discovery_service.js';
import { createDiscoveryRouter } from '../../app/api/v1/discovery_routes.js';
import express from 'express';
import request from 'supertest';
import fs from 'fs';

describe('Discovery Integration', () => {
  const TEST_DB = 'test_stumble.db';
  let storage: SqliteAdapter;
  let service: DiscoveryService;
  let app: express.Application;

  const initApp = () => {
    storage = new SqliteAdapter(TEST_DB);
    service = new DiscoveryService(storage);
    app = express();
    app.use(express.json());
    app.use('/api/v1', createDiscoveryRouter(service, storage));
  };

  beforeEach(async () => {
    if (fs.existsSync(TEST_DB)) {
        // We can't easily close better-sqlite3 without a close method, 
        // so we'll just try to ensure it's fresh.
        fs.unlinkSync(TEST_DB);
    }
    initApp();

    // Seed test data
    await storage.save_asset({
      id: 'uuid-1',
      url: 'https://example.com/tech',
      title: 'Tech Site',
      category: 'tech',
      rating: 0,
      created_at: new Date()
    });
    await storage.save_asset({
      id: 'uuid-2',
      url: 'https://example.com/science',
      title: 'Science Site',
      category: 'science',
      rating: 0,
      created_at: new Date()
    });
  });

  afterEach(() => {
    // In a real scenario we'd call storage.close()
    if (fs.existsSync(TEST_DB)) {
        try {
            fs.unlinkSync(TEST_DB);
        } catch (e) {
            // ignore busy errors
        }
    }
  });

  it('GET /api/v1/stumble returns random asset', async () => {
    const res = await request(app).get('/api/v1/stumble?category=all');
    expect(res.status).toBe(200);
    expect(res.body.url).toMatch(/example.com/);
  });

  it('GET /api/v1/stumble with category filters correctly', async () => {
    const res = await request(app).get('/api/v1/stumble?category=science');
    expect(res.status).toBe(200);
    expect(res.body.category).toBe('science');
    expect(res.body.title).toBe('Science Site');
  });

  it('POST /api/v1/seed populates the database', async () => {
    // Don't unlink here, just let the endpoint do its work.
    // The endpoint uses INSERT OR REPLACE so it's fine.
    const res = await request(app).post('/api/v1/seed');
    
    if (res.status !== 200) {
        console.error('Seed failed:', res.body);
    }
    
    expect(res.status).toBe(200);
    expect(res.body.count).toBeGreaterThan(0);

    const categories = await service.get_categories();
    expect(categories).toContain('tech');
    expect(categories).toContain('science');
    expect(categories).toContain('random');
  });
});
