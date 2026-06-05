import Database from 'better-sqlite3';
import type { IStoragePort } from './storage_port.js';
import type { StumbleAsset } from '../models/asset.js';

export class SqliteAdapter implements IStoragePort {
  private db: Database.Database;

  constructor(dbPath: string = 'stumble.db') {
    this.db = new Database(dbPath);
    this.init();
  }

  private init(): void {
    // Basic migration: check if 'interest' column exists and rename it or just recreate
    // For simplicity in this dev phase, we'll ensure the correct schema
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS assets (
        id TEXT PRIMARY KEY,
        url TEXT NOT NULL,
        title TEXT NOT NULL,
        category TEXT NOT NULL,
        rating INTEGER DEFAULT 0,
        created_at TEXT NOT NULL,
        last_visited_at TEXT
      )
    `);
    
    // Check if we need to migrate from 'interest' to 'category'
    const tableInfo = this.db.prepare("PRAGMA table_info(assets)").all() as any[];
    const hasInterest = tableInfo.some(col => col.name === 'interest');
    if (hasInterest) {
      console.log('Migrating assets table: renaming interest to category');
      this.db.exec('ALTER TABLE assets RENAME COLUMN interest TO category');
    }
  }

  async get_asset_by_id(id: string): Promise<StumbleAsset | null> {
    const row = this.db.prepare('SELECT * FROM assets WHERE id = ?').get(id) as any;
    if (!row) return null;
    return this.map_row_to_asset(row);
  }

  async get_random_asset_by_category(category: string, exclude_ids: string[]): Promise<StumbleAsset | null> {
    let query = 'SELECT * FROM assets WHERE 1=1 ';
    const params: any[] = [];

    if (category !== 'all') {
      query += 'AND category = ? ';
      params.push(category);
    }

    if (exclude_ids.length > 0) {
      query += `AND id NOT IN (${exclude_ids.map(() => '?').join(',')}) `;
      params.push(...exclude_ids);
    }

    query += 'ORDER BY RANDOM() LIMIT 1';

    const row = this.db.prepare(query).get(...params) as any;
    
    if (!row) return null;
    return this.map_row_to_asset(row);
  }

  async save_asset(asset: StumbleAsset): Promise<void> {
    this.db.prepare(`
      INSERT OR REPLACE INTO assets (id, url, title, category, rating, created_at, last_visited_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      asset.id,
      asset.url,
      asset.title,
      asset.category,
      asset.rating,
      asset.created_at.toISOString(),
      asset.last_visited_at?.toISOString() || null
    );
  }

  async update_rating(id: string, delta: number): Promise<void> {
    this.db.prepare('UPDATE assets SET rating = rating + ? WHERE id = ?').run(delta, id);
  }

  async get_all_categories(): Promise<string[]> {
    const rows = this.db.prepare('SELECT DISTINCT category FROM assets').all() as { category: string }[];
    return rows.map(r => r.category);
  }

  private map_row_to_asset(row: any): StumbleAsset {
    return {
      id: row.id,
      url: row.url,
      title: row.title,
      category: row.category,
      rating: row.rating,
      created_at: new Date(row.created_at),
      last_visited_at: row.last_visited_at ? new Date(row.last_visited_at) : undefined
    };
  }
}
