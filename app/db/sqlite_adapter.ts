/**
 * @fileoverview SQLite implementation of the storage port.
 */

import Database from 'better-sqlite3';
import crypto from 'crypto';
import type { IStoragePort, RatedItem } from './storage_port.js';
import type { StumbleAsset } from '../models/asset.js';
import type { User } from '../models/user.js';

/**
 * Adapter for SQLite storage.
 */
export class SqliteAdapter implements IStoragePort {
  private db: Database.Database;

  /**
   * @param {string} dbPath - Path to the SQLite database file.
   */
  constructor(dbPath: string = 'stumble.db') {
    this.db = new Database(dbPath);
    this.init();
  }

  /**
   * Initializes the database schema.
   */
  private init(): void {
    try {
      this.db.exec(`
        CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY,
          email TEXT UNIQUE NOT NULL,
          password_hash TEXT,
          display_name TEXT,
          avatar_url TEXT,
          provider TEXT DEFAULT 'local',
          provider_id TEXT,
          created_at TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS assets (
          id TEXT PRIMARY KEY,
          url TEXT NOT NULL,
          title TEXT NOT NULL,
          description TEXT,
          source TEXT NOT NULL,
          category TEXT NOT NULL,
          rating INTEGER DEFAULT 0,
          created_at TEXT NOT NULL,
          last_visited_at TEXT
        );
        CREATE TABLE IF NOT EXISTS ratings (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          asset_id TEXT NOT NULL,
          rating TEXT NOT NULL,
          note TEXT,
          created_at TEXT NOT NULL,
          FOREIGN KEY(user_id) REFERENCES users(id),
          FOREIGN KEY(asset_id) REFERENCES assets(id)
        );
        CREATE TABLE IF NOT EXISTS favorites (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          asset_id TEXT NOT NULL,
          created_at TEXT NOT NULL,
          FOREIGN KEY(user_id) REFERENCES users(id),
          FOREIGN KEY(asset_id) REFERENCES assets(id)
        );
        CREATE TABLE IF NOT EXISTS user_preferences (
          user_id TEXT NOT NULL,
          type TEXT NOT NULL,
          name TEXT NOT NULL,
          score INTEGER DEFAULT 0,
          PRIMARY KEY(user_id, type, name),
          FOREIGN KEY(user_id) REFERENCES users(id)
        )
      `);
      this.migrate();
    } catch (error) {
      console.error('Database initialization failed:', error);
      throw error;
    }
  }

  /**
   * @inheritdoc
   */
  async get_asset_by_id(id: string): Promise<StumbleAsset | null> {
    const row = this.db.prepare('SELECT * FROM assets WHERE id = ?').get(id) as StumbleAsset | undefined;
    return row ? this.map_row_to_asset(row) : null;
  }

  /**
   * @inheritdoc
   */
  /**
   * @inheritdoc
   */
  async save_asset(asset: StumbleAsset): Promise<void> {
    this.db.prepare(`
      INSERT OR REPLACE INTO assets (id, url, title, description, source, category, rating, created_at, last_visited_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      asset.id,
      asset.url,
      asset.title,
      asset.description || null,
      asset.source,
      asset.category,
      asset.rating,
      asset.created_at.toISOString(),
      asset.last_visited_at?.toISOString() || null
    );
  }

  /**
   * @inheritdoc
   */
  async update_rating(id: string, delta: number): Promise<void> {
    this.db.prepare('UPDATE assets SET rating = rating + ? WHERE id = ?').run(delta, id);
  }

  /**
   * @inheritdoc
   */
  async get_all_assets(category: string): Promise<StumbleAsset[]> {
    let query = 'SELECT * FROM assets WHERE 1=1 ';
    const params: string[] = [];

    if (category !== 'all') {
      query += 'AND category = ? ';
      params.push(category);
    }

    const rows = this.db.prepare(query).all(...params) as StumbleAsset[];
    return rows.map(r => this.map_row_to_asset(r));
  }

  /**
   * @inheritdoc
   */
  async get_all_categories(): Promise<string[]> {
    const rows = this.db.prepare('SELECT DISTINCT category FROM assets').all() as { category: string }[];
    return rows.map(r => r.category);
  }

  /**
   * @inheritdoc
   */
  async get_all_interests(): Promise<string[]> {
    const rows = this.db.prepare('SELECT DISTINCT category FROM assets').all() as { category: string }[];
    return rows.map(r => r.category);
  }

  /**
   * @inheritdoc
   */
  async get_random_asset_by_interests(interests: string[], exclude_ids: string[]): Promise<StumbleAsset | null> {
    const placeholders = exclude_ids.map(() => '?').join(', ');
    let query = 'SELECT * FROM assets WHERE 1=1 ';
    const params: Array<string | number> = [];

    if (interests.length > 0) {
      const interestPlaceholders = interests.map(() => '?').join(', ');
      query += `AND category IN (${interestPlaceholders}) `;
      params.push(...interests);
    }

    if (exclude_ids.length > 0) {
      query += `AND id NOT IN (${placeholders}) `;
      params.push(...exclude_ids);
    }

    query += 'ORDER BY RANDOM() LIMIT 1';
    const row = this.db.prepare(query).get(...params) as StumbleAsset | undefined;
    return row ? this.map_row_to_asset(row) : null;
  }

  /**
   * @inheritdoc
   */
  async get_recommendations(user_id: string, limit: number): Promise<StumbleAsset[]> {
    const rows = this.db.prepare(`
      SELECT a.*
      FROM assets a
      LEFT JOIN ratings r ON a.id = r.asset_id AND r.user_id = ?
      LEFT JOIN user_preferences up ON a.category = up.name AND up.user_id = ? AND up.type = 'category'
      WHERE r.asset_id IS NULL
      ORDER BY COALESCE(up.score, 0) + a.rating DESC
      LIMIT ?
    `).all(user_id, user_id, limit) as StumbleAsset[];

    return rows.map(r => this.map_row_to_asset(r));
  }

  /**
   * @inheritdoc
   */
  async search_assets(query: string): Promise<StumbleAsset[]> {
    const rows = this.db.prepare(`
      SELECT * FROM assets
      WHERE title LIKE ? OR url LIKE ?
      LIMIT 20
    `).all(`%${query}%`, `%${query}%`) as StumbleAsset[];
    return rows.map(r => this.map_row_to_asset(r));
  }

  /**
   * @inheritdoc
   */
  async save_rating(user_id: string, asset_id: string, rating: 'like' | 'dislike'): Promise<void> {
    this.db.prepare(`
      INSERT INTO ratings (id, user_id, asset_id, rating, created_at)
      VALUES (?, ?, ?, ?, ?)
    `).run(crypto.randomUUID(), user_id, asset_id, rating, new Date().toISOString());
  }

  /**
   * @inheritdoc
   */
  async get_history(user_id: string, limit: number): Promise<RatedItem[]> {
    const rows = this.db.prepare(`
      SELECT a.*, r.rating as rating_val, r.created_at as timestamp 
      FROM ratings r
      JOIN assets a ON r.asset_id = a.id
      WHERE r.user_id = ?
      ORDER BY r.created_at DESC
      LIMIT ?
    `).all(user_id, limit) as (StumbleAsset & { rating_val: 'like' | 'dislike', timestamp: string })[];

    return rows.map(r => ({
      ...this.map_row_to_asset(r),
      rating_val: r.rating_val,
      timestamp: new Date(r.timestamp)
    }));
  }

  /**
   * @inheritdoc
   */
  async save_favorite(user_id: string, asset_id: string): Promise<void> {
    this.db.prepare(`
      INSERT INTO favorites (id, user_id, asset_id, created_at)
      VALUES (?, ?, ?, ?)
    `).run(crypto.randomUUID(), user_id, asset_id, new Date().toISOString());
  }

  /**
   * @inheritdoc
   */
  async remove_favorite(user_id: string, asset_id: string): Promise<void> {
    this.db.prepare('DELETE FROM favorites WHERE user_id = ? AND asset_id = ?').run(user_id, asset_id);
  }

  /**
   * @inheritdoc
   */
  async get_favorites(user_id: string): Promise<StumbleAsset[]> {
    const rows = this.db.prepare(`
      SELECT a.* 
      FROM favorites f
      JOIN assets a ON f.asset_id = a.id
      WHERE f.user_id = ?
    `).all(user_id) as StumbleAsset[];

    return rows.map(r => this.map_row_to_asset(r));
  }

  /**
   * @inheritdoc
   */
  async update_user_preference(user_id: string, type: 'category' | 'source', name: string, delta: number): Promise<void> {
    this.db.prepare(`
      INSERT INTO user_preferences (user_id, type, name, score)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(user_id, type, name) DO UPDATE SET score = score + ?
    `).run(user_id, type, name, delta, delta);
  }

  /**
   * @inheritdoc
   */
  async get_user_preferences(user_id: string): Promise<{ type: string; name: string; score: number }[]> {
    return this.db.prepare('SELECT * FROM user_preferences WHERE user_id = ?').all(user_id) as { type: string; name: string; score: number }[];
  }

  /**
   * Applies incremental schema migrations for legacy databases.
   */
  private migrate(): void {
    const userCols = (this.db.prepare('PRAGMA table_info(users)').all() as { name: string }[]).map(c => c.name);
    if (!userCols.includes('display_name')) {
      this.db.exec('ALTER TABLE users ADD COLUMN display_name TEXT');
    }
    if (!userCols.includes('avatar_url')) {
      this.db.exec('ALTER TABLE users ADD COLUMN avatar_url TEXT');
    }
    if (!userCols.includes('provider')) {
      this.db.exec("ALTER TABLE users ADD COLUMN provider TEXT DEFAULT 'local'");
    }
    if (!userCols.includes('provider_id')) {
      this.db.exec('ALTER TABLE users ADD COLUMN provider_id TEXT');
    }
  }

  /**
   * @inheritdoc
   */
  async find_user_by_email(email: string): Promise<User | null> {
    const row = this.db.prepare('SELECT * FROM users WHERE email = ?').get(email) as any;
    return row ? this.map_row_to_user(row) : null;
  }

  /**
   * @inheritdoc
   */
  async find_user_by_provider(provider: string, provider_id: string): Promise<User | null> {
    const row = this.db.prepare('SELECT * FROM users WHERE provider = ? AND provider_id = ?').get(provider, provider_id) as any;
    return row ? this.map_row_to_user(row) : null;
  }

  /**
   * @inheritdoc
   */
  async get_user_by_id(id: string): Promise<User | null> {
    const row = this.db.prepare('SELECT * FROM users WHERE id = ?').get(id) as any;
    return row ? this.map_row_to_user(row) : null;
  }

  /**
   * @inheritdoc
   */
  async save_user(user: User): Promise<void> {
    this.db.prepare(`
      INSERT OR REPLACE INTO users (id, email, password_hash, display_name, avatar_url, provider, provider_id, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      user.id,
      user.email,
      user.password_hash || null,
      user.display_name || null,
      user.avatar_url || null,
      user.provider,
      user.provider_id || null,
      user.created_at instanceof Date ? user.created_at.toISOString() : user.created_at
    );
  }

  /**
   * Maps a database row to a User object.
   * @param {any} row - The database row.
   * @returns {User}
   */
  private map_row_to_user(row: any): User {
    return {
      id: row.id,
      email: row.email,
      password_hash: row.password_hash || null,
      display_name: row.display_name || undefined,
      avatar_url: row.avatar_url || undefined,
      provider: row.provider as any,
      provider_id: row.provider_id || undefined,
      created_at: new Date(row.created_at)
    };
  }

  /**
   * Maps a database row to a StumbleAsset object.
   * @param {any} row - The database row.
   * @returns {StumbleAsset}
   */
  private map_row_to_asset(row: Record<string, unknown>): StumbleAsset {
    return {
      id: String(row.id),
      url: String(row.url),
      title: String(row.title),
      description: row.description ? String(row.description) : undefined,
      source: String(row.source),
      category: String(row.category),
      rating: Number(row.rating),
      created_at: new Date(String(row.created_at)),
      last_visited_at: row.last_visited_at ? new Date(String(row.last_visited_at)) : undefined
    };
  }
}
