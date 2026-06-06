/**
 * @fileoverview UselessWeb content fetcher.
 */

import crypto from 'crypto';
import type { ContentFetcher } from './ContentFetcher.js';
import type { StumbleAsset } from '../models/asset.js';

/**
 * UselessWeb content fetcher implementation.
 */
export class UselessWebSource implements ContentFetcher {
  private readonly urls: string[] = [
    'https://theuselessweb.com/',
    'https://corgiorgi.com/',
    'https://beesbeesbees.com/',
    'https://www.eelslap.com/',
    'https://staggeringbeauty.com/',
    'https://burymewithmymoney.com/',
    'https://zoomquilt.org/',
    'https://pointerpointer.com/',
    'https://www.papertoilet.com/',
    'https://longdogechallenge.com/'
  ];

  /**
   * Fetches a random UselessWeb URL.
   * @param {string} category - The requested category (unused).
   * @returns {Promise<StumbleAsset>}
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async fetchStumble(category: string): Promise<StumbleAsset> {
    const url = this.urls[Math.floor(Math.random() * this.urls.length)];
    return {
      id: crypto.randomUUID(),
      url,
      title: 'A Useless Website',
      description: 'Something quirky and fun.',
      source: 'UselessWeb',
      category: 'random',
      rating: 0,
      created_at: new Date(),
    };
  }
}
