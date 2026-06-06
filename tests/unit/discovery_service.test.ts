import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DiscoveryService } from '../../app/services/discovery_service.js';
import type { IStoragePort } from '../../app/db/storage_port.js';
import type { StumbleAsset } from '../../app/models/asset.js';
import type { ContentFetcher } from '../../app/sources/ContentFetcher.js';

describe('DiscoveryService', () => {
  let discovery_service: DiscoveryService;
  let mock_storage: any;
  let mock_source: ContentFetcher;

  const mock_asset: StumbleAsset = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    url: 'https://example.com',
    title: 'Example',
    category: 'science',
    source: 'Test',
    rating: 0,
    created_at: new Date()
  };

  beforeEach(() => {
    mock_storage = {
      get_asset_by_id: vi.fn(),
      get_random_asset_by_category: vi.fn(),
      save_asset: vi.fn().mockResolvedValue(undefined),
      update_rating: vi.fn().mockResolvedValue(undefined),
      get_all_categories: vi.fn(),
      save_rating: vi.fn().mockResolvedValue(undefined),
      get_history: vi.fn(),
      save_favorite: vi.fn().mockResolvedValue(undefined),
      remove_favorite: vi.fn().mockResolvedValue(undefined),
      get_favorites: vi.fn().mockResolvedValue([]),
      update_user_preference: vi.fn().mockResolvedValue(undefined)
    };
    
    mock_source = {
      fetchStumble: vi.fn().mockResolvedValue(mock_asset)
    };

    discovery_service = new DiscoveryService(mock_storage as IStoragePort, [mock_source]);
  });

  it('should update rating correctly', async () => {
    // Mock the asset lookup
    mock_storage.get_asset_by_id.mockResolvedValue(mock_asset);
    
    const assetId = mock_asset.id;
    const userId = 'user-123';

    await discovery_service.rate(assetId, true, userId);
    
    expect(mock_storage.get_asset_by_id).toHaveBeenCalledWith(assetId);
    expect(mock_storage.save_rating).toHaveBeenCalledWith(userId, assetId, 'like');
    expect(mock_storage.update_rating).toHaveBeenCalledWith(assetId, 1);
    expect(mock_storage.update_user_preference).toHaveBeenCalledWith(userId, 'category', 'science', 1);
    expect(mock_storage.update_user_preference).toHaveBeenCalledWith(userId, 'source', 'Test', 1);

    await discovery_service.rate(assetId, false, userId);
    expect(mock_storage.save_rating).toHaveBeenCalledWith(userId, assetId, 'dislike');
    expect(mock_storage.update_rating).toHaveBeenCalledWith(assetId, -1);
  });
});
