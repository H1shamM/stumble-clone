import { SqliteAdapter } from '../src/db/sqliteAdapter.js';
import { WikipediaSource } from '../src/sources/wikipedia.js';
import { HackerNewsSource } from '../src/sources/hn.js';
import { RedditSource } from '../src/sources/reddit.js';
import { DevToSource } from '../src/sources/devto.js';
import { UselessWebSource } from '../src/sources/uselessweb.js';
import { AtlasObscuraSource } from '../src/sources/atlasobscura.js';
import { BoredPandaSource } from '../src/sources/boredpanda.js';
import { WikipediaImageSource } from '../src/sources/wikipedia_image.js';
import { YoutubeSource } from '../src/sources/youtube.js';
import type { ContentFetcher } from '../src/sources/ContentFetcher.js';

const sources: ContentFetcher[] = [
  new WikipediaSource(),
  new HackerNewsSource(),
  new RedditSource(),
  new DevToSource(),
  new UselessWebSource(),
  new AtlasObscuraSource(),
  new BoredPandaSource(),
  new WikipediaImageSource(),
  new YoutubeSource(),
];

async function seed() {
  const storage = new SqliteAdapter('stumble.db');
  const categories = ['all', 'tech', 'art', 'science', 'random'];
  let totalAdded = 0;

  for (const source of sources) {
    for (const category of categories) {
      for (let i = 0; i < 3; i++) { // try 3 times per category
        try {
          const asset = await source.fetchStumble(category);
          if (asset && asset.url && asset.title) {
            // Avoid duplicates by URL
            const existing = await storage.searchAssets(asset.url);
            if (existing.length === 0) {
              await storage.saveAsset(asset);
              totalAdded++;
              console.log(`Added: ${asset.title} (${asset.source})`);
            }
          }
        } catch {
          // ignore
        }
        // small delay to avoid rate limiting
        await new Promise(r => setTimeout(r, 500));
      }
    }
  }
  console.log(`Seeding complete. Added ${totalAdded} new assets.`);
}

seed().catch(console.error);