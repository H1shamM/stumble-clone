import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WikipediaSource } from '../../../app/sources/wikipedia.js';

describe('WikipediaSource', () => {
  let source: WikipediaSource;

  beforeEach(() => {
    source = new WikipediaSource();
    vi.restoreAllMocks();
  });

  it('should fetch a random Wikipedia summary and map it to StumbleAsset', async () => {
    const mockResponse = {
      title: 'Test Article',
      extract: 'This is a test article.',
      content_urls: {
        desktop: {
          page: 'https://en.wikipedia.org/wiki/Test_Article'
        }
      }
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockResponse
    });

    const result = await source.fetchStumble('science');

    expect(result.title).toBe('Test Article');
    expect(result.description).toBe('This is a test article.');
    expect(result.url).toBe('https://en.wikipedia.org/wiki/Test_Article');
    expect(result.source).toBe('Wikipedia');
    expect(result.category).toBe('science');
    expect(result.id).toBeDefined();
    expect(global.fetch).toHaveBeenCalledWith('https://en.wikipedia.org/api/rest_v1/page/random/summary');
  });

  it('should throw an error if the API response is not ok', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      statusText: 'Internal Server Error'
    });

    await expect(source.fetchStumble('science')).rejects.toThrow('Wikipedia API error: Internal Server Error');
  });
});
