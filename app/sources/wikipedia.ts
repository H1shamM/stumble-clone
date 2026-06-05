import { ContentFetcher } from './ContentFetcher.js';
import type { StumbleAsset } from '../models/asset.js';
import crypto from 'crypto';

export class WikipediaSource implements ContentFetcher {
  private readonly API_URL = 'https://en.wikipedia.org/api/rest_v1/page/random/summary';

  async fetchStumble(category: string): Promise<StumbleAsset> {
    // Wikipedia source primarily maps to 'science' or 'random'
    // For now, we fetch a random article regardless of category input
    const response = await fetch(this.API_URL);
    
    if (!response.ok) {
      throw new Error(`Wikipedia API error: ${response.statusText}`);
    }

    const data = await response.json();

    return {
      id: crypto.randomUUID(),
      url: data.content_urls.desktop.page,
      title: data.title,
      description: data.extract,
      source: 'Wikipedia',
      category: category === 'all' ? 'science' : category,
      rating: 0,
      created_at: new Date(),
    };
  }
}
