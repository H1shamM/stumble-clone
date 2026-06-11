import type { Database } from "better-sqlite3";
import type { EnrichmentResult } from "../services/enrichmentService.js";

export interface ExplainerRepo {
  get(url: string, version: string): Promise<EnrichmentResult | null>;
  put(url: string, version: string, draft: EnrichmentResult): Promise<void>;
}

export class SqliteExplainerRepo implements ExplainerRepo {
  constructor(private db: Database) {}

  async get(url: string, version: string): Promise<EnrichmentResult | null> {
    const row = this.db
      .prepare(
        "SELECT draft_json FROM explainer_cache WHERE url = ? AND prompt_version = ?",
      )
      .get(url, version) as { draft_json: string } | undefined;
    return row ? JSON.parse(row.draft_json) : null;
  }

  async put(url: string, version: string, draft: EnrichmentResult): Promise<void> {
    this.db
      .prepare(
        "INSERT OR REPLACE INTO explainer_cache (url, prompt_version, draft_json, created_at) VALUES (?, ?, ?, ?)",
      )
      .run(url, version, JSON.stringify(draft), Date.now());
  }
}
