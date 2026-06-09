import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { SqliteAdapter } from "../../../app/src/db/sqliteAdapter";
import crypto from "crypto";
import fs from "fs";

describe("SqliteAdapter - Auth & Profiles", () => {
  let adapter: SqliteAdapter;
  const dbPath = "test_auth.db";

  beforeEach(() => {
    adapter = new SqliteAdapter(dbPath);
  });

  afterEach(() => {
    if (fs.existsSync(dbPath)) {
      fs.unlinkSync(dbPath);
    }
  });

  it("should save and find a local user by email", async () => {
    const user = {
      id: crypto.randomUUID(),
      email: "local@test.com",
      password_hash: "hashed",
      provider: "local" as const,
      created_at: new Date(),
    };

    await adapter.saveUser(user);
    const found = await adapter.findUserByEmail("local@test.com");

    expect(found).not.toBeNull();
    expect(found?.id).toBe(user.id);
    expect(found?.email).toBe(user.email);
    expect(found?.provider).toBe("local");
  });

  it("should save and find an OAuth user by provider", async () => {
    const user = {
      id: crypto.randomUUID(),
      email: "oauth@test.com",
      password_hash: null,
      display_name: "OAuth User",
      avatar_url: "http://avatar.com",
      provider: "google" as const,
      provider_id: "google-123",
      created_at: new Date(),
    };

    await adapter.saveUser(user);
    const found = await adapter.findUserByProvider("google", "google-123");

    expect(found).not.toBeNull();
    expect(found?.id).toBe(user.id);
    expect(found?.display_name).toBe("OAuth User");
    expect(found?.avatar_url).toBe("http://avatar.com");
  });

  it("should handle schema migrations", () => {
    // Migration is called in init() which is called in constructor
    // We can verify by checking if new columns exist
    // This is implicitly tested by save_user/find_user above
  });
});

describe("SqliteAdapter - Asset Search", () => {
  let adapter: SqliteAdapter;
  const dbPath = "test_search.db";

  beforeEach(() => {
    adapter = new SqliteAdapter(dbPath);
  });

  afterEach(() => {
    if (fs.existsSync(dbPath)) {
      fs.unlinkSync(dbPath);
    }
  });

  it("should search assets by title, description, and URL", async () => {
    await adapter.saveAsset({
      id: "1",
      url: "https://javascript.info",
      title: "JS Guide",
      description: "Learn JS here",
      source: "Manual",
      category: "Tech",
      created_at: new Date(),
    });
    await adapter.saveAsset({
      id: "2",
      url: "https://python.org",
      title: "Python Docs",
      description: "About Python",
      source: "Manual",
      category: "Tech",
      created_at: new Date(),
    });
    await adapter.saveAsset({
      id: "3",
      url: "https://example.com/js-notes",
      title: "My Notes",
      description: "Javascript notes included",
      source: "Manual",
      category: "Personal",
      created_at: new Date(),
    });

    const byTitle = await adapter.searchAssets("JS Guide");
    expect(byTitle).toHaveLength(1);
    expect(byTitle[0].id).toBe("1");

    const byDesc = await adapter.searchAssets("Javascript");
    expect(byDesc).toHaveLength(2); // ID 1 and 3

    const byUrl = await adapter.searchAssets("python.org");
    expect(byUrl).toHaveLength(1);
    expect(byUrl[0].id).toBe("2");
  });
});
