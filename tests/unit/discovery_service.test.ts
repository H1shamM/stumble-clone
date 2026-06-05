import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DiscoveryService } from '../../app/services/discovery_service.js';
import type { IStoragePort } from '../../app/db/storage_port.js';
import type { StumbleAsset } from '../../app/models/asset.js';

describe('DiscoveryService', () => {
  let discovery_service: DiscoveryService;
  let mock_storage: vi.Mocked<IStoragePort>;

  const mock_asset: StumbleAsset = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    url: 'https://example.com',
    title: 'Example',
    category: 'science',
    rating: 0,
    created_at: new Date()
  };

  beforeEach(() => {
    mock_storage = {
      get_asset_by_id: vi.fn(),
      get_random_asset_by_category: vi.fn(),
      save_asset: vi.fn().mockResolvedValue(undefined),
      update_rating: vi.fn().mockResolvedValue(undefined),
      get_all_categories: vi.fn()
    } as any;
    discovery_service = new DiscoveryService(mock_storage);
  });

  it('should return a random asset based on category', async () => {
    mock_storage.get_random_asset_by_category.mockResolvedValue(mock_asset);

    const result = await discovery_service.stumble('science', []);

    expect(result).toEqual(mock_asset);
    expect(mock_storage.get_random_asset_by_category).toHaveBeenCalledWith('science', []);
    expect(mock_storage.save_asset).toHaveBeenCalled();
  });

  it('should throw an error if no asset is found', async () => {
    mock_storage.get_random_asset_by_category.mockResolvedValue(null);

    await expect(discovery_service.stumble('science', []))
      .rejects.toThrow('No assets found for category: science');
  });

  it('should update rating correctly', async () => {
    await discovery_service.rate('1', true);
    expect(mock_storage.update_rating).toHaveBeenCalledWith('1', 1);

    await discovery_service.rate('1', false);
    expect(mock_storage.update_rating).toHaveBeenCalledWith('1', -1);
  });
});
