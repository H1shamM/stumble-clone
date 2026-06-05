import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RedditSource } from '../../../app/sources/reddit.js';

describe('RedditSource', () => {
  let source: RedditSource;

  beforeEach(() => {
    source = new RedditSource();
    vi.restoreAllMocks();
  });

  it('should fetch a random Reddit post and map it to StumbleAsset', async () => {
    const mockResponse = {
      data: {
        children: [
          {
            data: {
              permalink: '/r/art/comments/123/cool_painting/',
              title: 'Cool Painting',
              author: 'artist1',
              ups: 500,
              is_self: false,
              stickied: false
            }
          }
        ]
      }
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockResponse
    });

    const result = await source.fetchStumble('art');

    expect(result.title).toBe('Cool Painting');
    expect(result.url).toBe('https://www.reddit.com/r/art/comments/123/cool_painting/');
    expect(result.source).toBe('Reddit (r/art)');
    expect(result.category).toBe('art');
    expect(result.description).toContain('artist1');
    expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('r/art/hot.json'), expect.any(Object));
  });

  it('should throw error if API response is not ok', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      statusText: 'Too Many Requests'
    });

    await expect(source.fetchStumble('random')).rejects.toThrow('Reddit API error: Too Many Requests');
  });

  it('should throw error if no suitable posts found', async () => {
    const mockResponse = {
      data: {
        children: [
          {
            data: {
              is_self: true, // skip self posts
              stickied: false
            }
          }
        ]
      }
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockResponse
    });

    await expect(source.fetchStumble('tech')).rejects.toThrow('No suitable posts found in r/technology');
  });
});
