/**
 * @fileoverview Helper utilities for bootstrapping and initial data seeding.
 */

import type { IStoragePort } from './db/storagePort.js';
import type { StumbleAsset } from './models/asset.js';
import type { User } from './models/user.js';
import bcrypt from 'bcrypt';
import { settings } from './config/settings.js';

export type SeedAsset = Omit<StumbleAsset, 'created_at' | 'last_visited_at'>;

export const DEFAULT_SEED_ASSETS: SeedAsset[] = [
  {
    id: 't1',
    url: 'https://news.ycombinator.com',
    title: 'Hacker News',
    description: 'Crowdsourced startup news and technology discussion.',
    source: 'HN',
    category: 'tech',
    rating: 0,
  },
  {
    id: 'a1',
    url: 'https://www.thisiscolossal.com',
    title: 'Colossal',
    description: 'A modern art publication for curious readers.',
    source: 'Colossal',
    category: 'art',
    rating: 0,
  },
  {
    id: 's1',
    url: 'https://apod.nasa.gov/apod/astropix.html',
    title: 'NASA Astronomy Picture of the Day',
    description: 'Daily science and space imagery from NASA.',
    source: 'NASA APOD',
    category: 'science',
    rating: 0,
  },
  {
    id: 'r1',
    url: 'https://www.reddit.com/r/todayilearned',
    title: 'Reddit TIL',
    description: 'Unexpected facts from the r/todayilearned community.',
    source: 'Reddit',
    category: 'random',
    rating: 0,
  },
];

export async function ensureDevUser(storage: IStoragePort): Promise<void> {
  const devUserId = settings.devUserId;
  const existingUser = await storage.getUserById(devUserId);
  if (!existingUser) {
    const devUser: User = {
      id: devUserId,
      email: 'dev@stumble.local',
      password_hash: await bcrypt.hash('devpass', 10),
      display_name: 'Dev User',
      provider: 'local',
      created_at: new Date(),
    };
    await storage.saveUser(devUser);
    console.log('Created dev user');
  }
}

export async function seedDefaultAssets(storage: IStoragePort): Promise<void> {
  for (const asset of DEFAULT_SEED_ASSETS) {
    await storage.saveAsset({
      ...asset,
      created_at: new Date(),
    });
  }
  await ensureDevUser(storage);
}