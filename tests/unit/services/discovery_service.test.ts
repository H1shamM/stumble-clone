import { describe, it, expect, vi } from 'vitest';
import { DiscoveryService } from '../../../app/services/discovery_service';
import { IStoragePort } from '../../../app/db/storage_port';
import { StumbleAsset } from '../../../app/models/asset';

const mockStorage: IStoragePort = {
  get_asset_by_id: vi.fn().mockResolvedValue({ id: '1', category: 'tech', source: 'test' } as StumbleAsset),
  get_random_asset_by_interests: vi.fn(),
  save_asset: vi.fn(),
  update_rating: vi.fn(),
  get_all_interests: vi.fn(),
  get_recommendations: vi.fn().mockResolvedValue([
    { id: '1', url: 'http://example.com', title: 'Test Asset', source: 'test', category: 'science', rating: 10 } as StumbleAsset
  ]),
} as any;

describe('DiscoveryService', () => {
  it('should return recommended assets from storage', async () => {
    const service = new DiscoveryService(mockStorage, []);
    const recommendations = await service.get_recommendations('user1', 5);
    expect(recommendations).toHaveLength(1);
    expect(recommendations[0].title).toBe('Test Asset');
    expect(mockStorage.get_recommendations).toHaveBeenCalledWith('user1', 5);
  });
});
