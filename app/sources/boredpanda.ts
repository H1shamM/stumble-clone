import type { ContentFetcher } from './ContentFetcher.js';
import type { StumbleAsset } from '../models/asset.js';
import crypto from 'crypto';

export class BoredPandaSource implements ContentFetcher {
  private readonly URL = 'https://www.boredpanda.com/';

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async fetchStumble(category: string): Promise<StumbleAsset> {
    const response = await fetch(this.URL);
    if (!response.ok) throw new Error('BoredPanda fetch failed');
    const html = await response.text();
    
    // Extract a random link
    const links = [...html.matchAll(/href="(https:\/\/www\.boredpanda\.com\/[^"]+)"/g)];
    if (links.length === 0) throw new Error('Could not find article');
    
    const randomLink = links[Math.floor(Math.random() * links.length)][1];
    
    return {
      id: crypto.randomUUID(),
      url: randomLink,
      title: 'Bored Panda Post',
      description: 'A fun and interesting read.',
      source: 'BoredPanda',
      category: 'art', // Fits well here
      rating: 0,
      created_at: new Date(),
    };
  }
}
