import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HackerNewsSource } from '../../../app/sources/hn.js';

describe('HackerNewsSource', () => {
  let source: HackerNewsSource;

  beforeEach(() => {
    source = new HackerNewsSource();
    vi.restoreAllMocks();
  });

  it('should fetch a random HN story and map it to StumbleAsset', async () => {
    const mockIds = [123, 456, 789];
    const mockStory = {
      id: 123,
      title: 'Awesome Tech',
      url: 'https://tech.example.com',
      by: 'user1',
      score: 100
    };

    global.fetch = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockIds
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockStory
      });

    const result = await source.fetchStumble('tech');

    expect(result.title).toBe('Awesome Tech');
    expect(result.url).toBe('https://tech.example.com');
    expect(result.source).toBe('Hacker News');
    expect(result.category).toBe('tech');
    expect(result.description).toContain('user1');
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it('should use HN link if story URL is missing', async () => {
    const mockIds = [123];
    const mockStory = {
      id: 123,
      title: 'Discussion only',
      by: 'user2',
      score: 50
    };

    global.fetch = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockIds
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockStory
      });

    const result = await source.fetchStumble('tech');
    expect(result.url).toBe('https://news.ycombinator.com/item?id=123');
  });

  it('should throw error if top stories fetch fails', async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: false,
      statusText: 'Forbidden'
    });

    await expect(source.fetchStumble('tech')).rejects.toThrow('HN API error: Forbidden');
  });
});
