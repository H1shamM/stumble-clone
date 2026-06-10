interface AssetRow {
  id: string;
  url: string;
  title: string;
  description: string | null;
  source: string;
  category: string;
  rating: number;
  type: string | null;
  channel: string | null;
  created_at: string;
  last_visited_at: string | null;
}
import Database from "better-sqlite3";
import crypto from "crypto";
import type { IStoragePort, RatedItem } from "./storagePort.js";
import type { StumbleAsset } from "../models/asset.js";
import type { User } from "../models/user.js";
import type { Submission } from "../models/submission.js";

interface UserRow {
  id: string;
  email: string;
  password_hash: string | null;
  display_name: string | null;
  avatar_url: string | null;
  provider: "local" | "google" | "github";
  provider_id: string | null;
  created_at: string;
}

export class SqliteAdapter implements IStoragePort {
  private _db: Database.Database;

  public get db(): Database.Database {
    return this._db;
  }
  public set db(value: Database.Database) {
    this._db = value;
  }

  constructor(dbPath: string = "stumble.db") {
    this._db = new Database(dbPath);
    this.init();
  }

  private init(): void {
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
        url TEXT NOT NULL UNIQUE,
        title TEXT NOT NULL,
        description TEXT,
        source TEXT NOT NULL,
        category TEXT NOT NULL,
        rating INTEGER DEFAULT 0,
        type TEXT,
        channel TEXT,
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
      );
      CREATE TABLE IF NOT EXISTS submissions (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        url TEXT NOT NULL,
        title TEXT NOT NULL,
        status TEXT DEFAULT 'pending',
        created_at TEXT NOT NULL,
        FOREIGN KEY(user_id) REFERENCES users(id)
      );
    `);
    this.migrate();
  }

  private migrate(): void {
    const userCols = (
      this.db.prepare("PRAGMA table_info(users)").all() as { name: string }[]
    ).map((c) => c.name);
    if (!userCols.includes("display_name"))
      this.db.exec("ALTER TABLE users ADD COLUMN display_name TEXT");
    if (!userCols.includes("avatar_url"))
      this.db.exec("ALTER TABLE users ADD COLUMN avatar_url TEXT");
    if (!userCols.includes("provider"))
      this.db.exec(
        "ALTER TABLE users ADD COLUMN provider TEXT DEFAULT 'local'",
      );
    const ratingsCols = (
      this.db.prepare("PRAGMA table_info(ratings)").all() as { name: string }[]
    ).map((c) => c.name);
    if (!ratingsCols.includes("user_id"))
      this.db.exec("ALTER TABLE ratings ADD COLUMN user_id TEXT");

    const assetCols = (
      this.db.prepare("PRAGMA table_info(assets)").all() as { name: string }[]
    ).map((c) => c.name);
    if (!assetCols.includes("type"))
      this.db.exec("ALTER TABLE assets ADD COLUMN type TEXT");
    if (!assetCols.includes("channel"))
      this.db.exec("ALTER TABLE assets ADD COLUMN channel TEXT");

    // Dedup existing assets
    this.db.exec(`
      DELETE FROM assets WHERE id NOT IN (
        SELECT MIN(id) FROM assets GROUP BY url
      );
      CREATE UNIQUE INDEX IF NOT EXISTS idx_assets_url ON assets(url);
    `);
  }

  private mapRowToAsset(row: AssetRow): StumbleAsset {
    return {
      id: row.id,
      url: row.url,
      title: row.title,
      description: row.description || undefined,
      source: row.source,
      category: row.category,
      rating: row.rating,
      type: (row.type as StumbleAsset["type"]) || undefined,
      channel: row.channel || undefined,
      created_at: new Date(row.created_at),
      last_visited_at: row.last_visited_at
        ? new Date(row.last_visited_at)
        : undefined,
    };
  }

  private mapRowToUser(row: UserRow): User {
    return {
      id: row.id,
      email: row.email,
      password_hash: row.password_hash,
      display_name: row.display_name || undefined,
      avatar_url: row.avatar_url || undefined,
      provider: row.provider,
      provider_id: row.provider_id || undefined,
      created_at: new Date(row.created_at),
    };
  }

  // Asset methods
  async getAssetById(id: string): Promise<StumbleAsset | null> {
    const row = this.db.prepare("SELECT * FROM assets WHERE id = ?").get(id);
    return row ? this.mapRowToAsset(row as AssetRow) : null;
  }

  async saveAsset(asset: StumbleAsset): Promise<void> {
    this.db
      .prepare(
        `
      INSERT INTO assets (id, url, title, description, source, category, rating, type, channel, created_at, last_visited_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(url) DO UPDATE SET
        title=excluded.title,
        description=excluded.description,
        source=excluded.source,
        category=excluded.category,
        type=excluded.type,
        channel=excluded.channel,
        last_visited_at=excluded.last_visited_at
    `,
      )
      .run(
        asset.id,
        asset.url,
        asset.title,
        asset.description || null,
        asset.source,
        asset.category,
        asset.rating,
        asset.type || null,
        asset.channel || null,
        asset.created_at.toISOString(),
        asset.last_visited_at?.toISOString() || null,
      );
  }

  async updateRating(id: string, delta: number): Promise<void> {
    this.db
      .prepare("UPDATE assets SET rating = rating + ? WHERE id = ?")
      .run(delta, id);
  }

  async getAllAssets(category: string): Promise<StumbleAsset[]> {
    let query = "SELECT * FROM assets WHERE 1=1 ";
    const params: string[] = [];
    if (category !== "all") {
      query += "AND category = ? ";
      params.push(category);
    }
    const rows = this.db.prepare(query).all(...params);
    return rows.map((r) => this.mapRowToAsset(r as AssetRow));
  }

  async getAllCategories(): Promise<string[]> {
    const rows = this.db
      .prepare("SELECT DISTINCT category FROM assets")
      .all() as { category: string }[];
    return rows.map((r) => r.category);
  }

  async searchAssets(query: string): Promise<StumbleAsset[]> {
    const q = `%${query.toLowerCase()}%`;
    const rows = this.db
      .prepare(
        `
      SELECT * FROM assets 
      WHERE LOWER(title) LIKE ? OR LOWER(description) LIKE ? OR LOWER(url) LIKE ? 
      LIMIT 20
    `,
      )
      .all(q, q, q);
    return rows.map((r) => this.mapRowToAsset(r as AssetRow));
  }

  // Rating & History
  async saveRating(
    user_id: string,
    asset_id: string,
    rating: "like" | "dislike",
  ): Promise<void> {
    this.db
      .prepare(
        `
      INSERT INTO ratings (id, user_id, asset_id, rating, created_at)
      VALUES (?, ?, ?, ?, ?)
    `,
      )
      .run(
        crypto.randomUUID(),
        user_id,
        asset_id,
        rating,
        new Date().toISOString(),
      );
  }

  async getHistory(user_id: string, limit: number): Promise<RatedItem[]> {
    const rows = this.db
      .prepare(
        `
      SELECT a.*, r.rating as rating_val, r.created_at as timestamp
      FROM ratings r JOIN assets a ON r.asset_id = a.id
      WHERE r.user_id = ? ORDER BY r.created_at DESC LIMIT ?
    `,
      )
      .all(user_id, limit);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return rows.map((r: any) => ({
      ...this.mapRowToAsset(r),
      rating_val: r.rating_val,
      timestamp: new Date(r.timestamp),
    }));
  }

  // Favorites
  async saveFavorite(user_id: string, asset_id: string): Promise<void> {
    this.db
      .prepare(
        `
      INSERT INTO favorites (id, user_id, asset_id, created_at)
      VALUES (?, ?, ?, ?)
    `,
      )
      .run(crypto.randomUUID(), user_id, asset_id, new Date().toISOString());
  }

  async removeFavorite(user_id: string, asset_id: string): Promise<void> {
    this.db
      .prepare("DELETE FROM favorites WHERE user_id = ? AND asset_id = ?")
      .run(user_id, asset_id);
  }

  async getFavorites(user_id: string): Promise<StumbleAsset[]> {
    const rows = this.db
      .prepare(
        `
      SELECT a.* FROM favorites f JOIN assets a ON f.asset_id = a.id WHERE f.user_id = ?
    `,
      )
      .all(user_id);
    return rows.map((r) => this.mapRowToAsset(r as AssetRow));
  }

  // User preferences
  async updateUserPreference(
    user_id: string,
    type: "category" | "source",
    name: string,
    delta: number,
  ): Promise<void> {
    this.db
      .prepare(
        `
      INSERT INTO user_preferences (user_id, type, name, score)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(user_id, type, name) DO UPDATE SET score = score + ?
    `,
      )
      .run(user_id, type, name, delta, delta);
  }

  async getUserPreferences(
    user_id: string,
  ): Promise<{ type: string; name: string; score: number }[]> {
    return this.db
      .prepare("SELECT * FROM user_preferences WHERE user_id = ?")
      .all(user_id) as { type: string; name: string; score: number }[];
  }

  // User auth
  async findUserByEmail(email: string): Promise<User | null> {
    const row = this.db
      .prepare("SELECT * FROM users WHERE email = ?")
      .get(email) as UserRow | undefined;
    return row ? this.mapRowToUser(row) : null;
  }

  async findUserByProvider(
    provider: string,
    provider_id: string,
  ): Promise<User | null> {
    const row = this.db
      .prepare("SELECT * FROM users WHERE provider = ? AND provider_id = ?")
      .get(provider, provider_id) as UserRow | undefined;
    return row ? this.mapRowToUser(row) : null;
  }

  async getUserById(id: string): Promise<User | null> {
    const row = this.db.prepare("SELECT * FROM users WHERE id = ?").get(id) as
      | UserRow
      | undefined;
    return row ? this.mapRowToUser(row) : null;
  }

  async saveUser(user: User): Promise<void> {
    this.db
      .prepare(
        `
      INSERT OR REPLACE INTO users (id, email, password_hash, display_name, avatar_url, provider, provider_id, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `,
      )
      .run(
        user.id,
        user.email,
        user.password_hash || null,
        user.display_name || null,
        user.avatar_url || null,
        user.provider,
        user.provider_id || null,
        user.created_at.toISOString(),
      );
  }

  // Submissions
  async saveSubmission(submission: Submission): Promise<void> {
    this.db
      .prepare(
        `
      INSERT INTO submissions (id, user_id, url, title, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `,
      )
      .run(
        submission.id,
        submission.user_id,
        submission.url,
        submission.title,
        submission.status,
        submission.created_at.toISOString(),
      );
  }

  async getAllSubmissions(): Promise<Submission[]> {
    const rows = this.db
      .prepare("SELECT * FROM submissions ORDER BY created_at DESC")
      .all();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return rows.map((r: any) => ({ ...r, created_at: new Date(r.created_at) }));
  }

  async updateSubmissionStatus(
    id: string,
    status: "approved" | "rejected",
  ): Promise<void> {
    this.db
      .prepare("UPDATE submissions SET status = ? WHERE id = ?")
      .run(status, id);
  }

  // Recommendations
  async getRecommendations(
    user_id: string,
    limit: number,
  ): Promise<StumbleAsset[]> {
    const rows = this.db
      .prepare(
        `
      SELECT a.*
      FROM assets a
      LEFT JOIN ratings r ON a.id = r.asset_id AND r.user_id = ?
      LEFT JOIN user_preferences up ON a.category = up.name AND up.user_id = ? AND up.type = 'category'
      WHERE r.asset_id IS NULL
      ORDER BY COALESCE(up.score, 0) + a.rating DESC
      LIMIT ?
    `,
      )
      .all(user_id, user_id, limit);
    return rows.map((r) => this.mapRowToAsset(r as AssetRow));
  }

  async getRandomAssetByInterests(
    interests: string[],
    exclude_ids: string[],
  ): Promise<StumbleAsset | null> {
    let query = "SELECT * FROM assets WHERE 1=1 ";
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const params: any[] = [];
    if (interests.length) {
      query += `AND category IN (${interests.map(() => "?").join(",")}) `;
      params.push(...interests);
    }
    if (exclude_ids.length) {
      query += `AND id NOT IN (${exclude_ids.map(() => "?").join(",")}) `;
      params.push(...exclude_ids);
    }
    query += "ORDER BY RANDOM() LIMIT 1";
    const row = this.db.prepare(query).get(...params);
    return row ? this.mapRowToAsset(row as AssetRow) : null;
  }

  async getAllInterests(): Promise<string[]> {
    const rows = this.db
      .prepare("SELECT DISTINCT category FROM assets")
      .all() as { category: string }[];
    return rows.map((r) => r.category);
  }
}
