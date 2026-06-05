import express from 'express';
import cors from 'cors';
import { settings } from './config/settings.js';
import { SqliteAdapter } from './db/sqlite_adapter.js';
import { DiscoveryService } from './services/discovery_service.js';
import { createDiscoveryRouter } from './api/v1/discovery_routes.js';

const app = express();

app.use(cors());
app.use(express.json());

// 1. Dependency Injection
const storage = new SqliteAdapter(settings.DB_PATH);
const discoveryService = new DiscoveryService(storage);

// 2. Routing Setup
app.use('/api/v1', createDiscoveryRouter(discoveryService, storage));

// 3. Health Check
app.get('/health', (_req, res) => res.json({ status: 'healthy', env: settings.ENV }));

// 4. Internal Seeding (Bootstrap)
async function seed_database() {
  const categories = await discoveryService.get_categories();
  if (categories.length === 0) {
    console.log('--- Bootstrap Seeding Initiated ---');
    const initial_assets = [
      {
        id: 'b1-0001',
        url: 'https://www.google.com/sky/',
        title: 'Google Sky',
        category: 'science',
        rating: 0,
        created_at: new Date()
      },
      {
        id: 'b1-0002',
        url: 'https://neave.com/strobe/',
        title: 'Strobe Illusion',
        category: 'art',
        rating: 0,
        created_at: new Date()
      }
    ];

    for (const asset of initial_assets) {
      await storage.save_asset(asset);
    }
    console.log('--- Bootstrap Seeding Complete ---');
  }
}

seed_database();

app.listen(settings.PORT, () => {
  console.log(`[StumbleApp] Professional Discovery Engine running on port ${settings.PORT}`);
});
