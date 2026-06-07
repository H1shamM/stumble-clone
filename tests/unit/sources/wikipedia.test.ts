import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WikipediaSource } from '../../../app/sources/wikipedia.js';
describe('WikipediaSource', () => {
  let source: WikipediaSource;
  beforeEach(() => { source = new WikipediaSource(); vi.restoreAllMocks(); });
  it('should fetch and map Wikipedia data', async () => {
    const mockResponse = { title: 'Test', extract: 'Desc', content_urls: { desktop: { page: 'https://test.com' } } };
    global.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => mockResponse });
    const result = await source.fetchStumble('science');
    expect(result.title).toBe('Test');
    expect(result.url).toBe('https://test.com');
  });
  it('should return null on failure', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: false });
    const result = await source.fetchStumble('science');
    expect(result).toBeNull();
  });
});
