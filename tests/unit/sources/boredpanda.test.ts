import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BoredPandaSource } from '../../../app/sources/boredpanda.js';

describe('BoredPandaSource', () => {
  let source: BoredPandaSource;
  beforeEach(() => {
    source = new BoredPandaSource();
    vi.restoreAllMocks();
  });

  it('should fetch and map BoredPanda data', async () => {
    const mockHtml = '<html><body><a href="https://www.boredpanda.com/test-article">Test</a></body></html>';
    global.fetch = vi.fn().mockResolvedValue({ ok: true, text: async () => mockHtml });
    const result = await source.fetchStumble('art');
    expect(result.url).toBe('https://www.boredpanda.com/test-article');
  });

  it('should return null when fetch fails', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: false });
    const result = await source.fetchStumble('art');
    expect(result).toBeNull();
  });
});
