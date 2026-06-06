import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WikipediaImageSource } from '../../../app/sources/wikipedia_image';

describe('WikipediaImageSource', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  it('should fetch a featured image successfully', async () => {
    const mockResponse = {
      image: {
        source: { source: 'https://example.com/image.jpg' },
        title: 'Test Image',
      },
    };

    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    });

    const source = new WikipediaImageSource();
    const asset = await source.fetchStumble('art');

    expect(asset.url).toBe(mockResponse.image.source.source);
    expect(asset.title).toBe(mockResponse.image.title);
    expect(asset.source).toBe('Wikipedia Image');
    expect(global.fetch).toHaveBeenCalled();
  });

  it('should throw an error if the API request fails', async () => {
    (global.fetch as any).mockResolvedValue({
      ok: false,
      statusText: 'Not Found',
    });

    const source = new WikipediaImageSource();
    await expect(source.fetchStumble('art')).rejects.toThrow('Wikipedia Image API error: Not Found');
  });
});
