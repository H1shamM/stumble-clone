import { describe, it, expect, afterEach } from 'vitest';
import { SqliteAdapter } from '../../app/db/sqlite_adapter';
import { seedDefaultAssets, DEFAULT_SEED_ASSETS } from '../../app/bootstrap';
import fs from 'fs';

const DB_PATH = 'test_bootstrap.db';

afterEach(() => {
  if (fs.existsSync(DB_PATH)) fs.unlinkSync(DB_PATH);
});

describe('bootstrap data seeding', () => {
  it('seeds default assets when called against an empty database', async () => {
    const storage = new SqliteAdapter(DB_PATH);
    await seedDefaultAssets(storage);

    const categories = await storage.get_all_categories();
    expect(categories).toEqual(expect.arrayContaining(DEFAULT_SEED_ASSETS.map((asset) => asset.category)));

    const seededAsset = await storage.get_asset_by_id(DEFAULT_SEED_ASSETS[0].id);
    expect(seededAsset).not.toBeNull();
    expect(seededAsset?.title).toBe(DEFAULT_SEED_ASSETS[0].title);
  });

  it('is idempotent when seeding the same data multiple times', async () => {
    const storage = new SqliteAdapter(DB_PATH);
    await seedDefaultAssets(storage);
    await seedDefaultAssets(storage);

    const categories = await storage.get_all_categories();
    expect(categories).toHaveLength(new Set(DEFAULT_SEED_ASSETS.map((asset) => asset.category)).size);

    const seededAsset = await storage.get_asset_by_id(DEFAULT_SEED_ASSETS[1].id);
    expect(seededAsset).not.toBeNull();
    expect(seededAsset?.source).toBe(DEFAULT_SEED_ASSETS[1].source);
  });
});
