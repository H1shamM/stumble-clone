/**
 * @fileoverview Service for managing asset discovery, ratings, and recommendations.
 */

import type { IStoragePort, RatedItem } from '../db/storage_port.js';
import type { StumbleAsset } from '../models/asset.js';
import type { ContentFetcher } from '../sources/ContentFetcher.js';

/**
 * Service for asset discovery logic.
 */
export class DiscoveryService {
  /**
   * @param {IStoragePort} storage - The storage adapter instance.
   * @param {ContentFetcher[]} sources - Array of content fetchers.
   */
  constructor(
    private storage: IStoragePort,
    private sources: ContentFetcher[]
  ) {}

  /**
   * Retrieves recommended assets for a user.
   * @param {string} userId - The user ID.
   * @param {number} limit - The number of recommendations.
   * @returns {Promise<StumbleAsset[]>}
   */
  async get_recommendations(userId: string, limit: number): Promise<StumbleAsset[]> {
    try {
      return await this.storage.get_recommendations(userId, limit);
    } catch (error) {
      console.error(`Failed to get recommendations for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Stumbles upon a new asset.
   * @param {string} category - The category to stumble in.
   * @param {string[]} history - List of asset IDs already visited.
   * @param {string} userId - The user ID.
   * @returns {Promise<StumbleAsset>}
   */
  async stumble(category: string, history: string[], userId: string): Promise<StumbleAsset> {
    try {
      const preferences = await this.storage.get_user_preferences(userId);
      const assets = await this.storage.get_all_assets(category);
      
      // Filter out assets in history
      const availableAssets = assets.filter(a => !history.includes(a.id));
      if (availableAssets.length === 0) {
        throw new Error('No assets found');
      }

      // Weight assets based on preferences
      const weightedAssets = availableAssets.map(asset => {
        let weight = 1;
        const catPref = preferences.find((p) => p.type === 'category' && p.name === asset.category);
        const srcPref = preferences.find((p) => p.type === 'source' && p.name === asset.source);
        if (catPref) weight += catPref.score;
        if (srcPref) weight += srcPref.score;
        return { asset, weight: Math.max(0.1, weight) };
      });

      // Simple weighted random selection
      const totalWeight = weightedAssets.reduce((sum, item) => sum + item.weight, 0);
      let random = Math.random() * totalWeight;
      for (const item of weightedAssets) {
        random -= item.weight;
        if (random <= 0) return item.asset;
      }
      return weightedAssets[0].asset;
    } catch (error) {
      console.error('Stumble failed:', error);
      throw error;
    }
  }

  /**
   * Rates an asset.
   * @param {string} assetId - The asset ID.
   * @param {boolean} isPositive - Whether the rating is positive.
   * @param {string} userId - The user ID.
   * @returns {Promise<void>}
   */
  async rate(assetId: string, isPositive: boolean, userId: string): Promise<void> {
    try {
      const rating = isPositive ? 'like' : 'dislike';
      const asset = await this.storage.get_asset_by_id(assetId);
      if (!asset) throw new Error('Asset not found');

      await this.storage.save_rating(userId, assetId, rating);
      await this.storage.update_rating(assetId, isPositive ? 1 : -1);
      await this.storage.update_user_preference(userId, 'category', asset.category, isPositive ? 1 : -1);
      await this.storage.update_user_preference(userId, 'source', asset.source, isPositive ? 1 : -1);
    } catch (error) {
      console.error('Rating failed:', error);
      throw error;
    }
  }

  /**
   * Retrieves user's history of ratings.
   * @param {string} userId - The user ID.
   * @param {number} limit - Limit of results.
   * @returns {Promise<RatedItem[]>}
   */
  async get_history(userId: string, limit: number): Promise<RatedItem[]> {
    try {
      return await this.storage.get_history(userId, limit);
    } catch (error) {
      console.error('Failed to get history:', error);
      throw error;
    }
  }

  /**
   * Adds an asset to favorites.
   * @param {string} userId - The user ID.
   * @param {string} assetId - The asset ID.
   * @returns {Promise<void>}
   */
  async addFavorite(userId: string, assetId: string): Promise<void> {
    try {
      await this.storage.save_favorite(userId, assetId);
    } catch (error) {
      console.error('Failed to add favorite:', error);
      throw error;
    }
  }

  /**
   * Removes an asset from favorites.
   * @param {string} userId - The user ID.
   * @param {string} assetId - The asset ID.
   * @returns {Promise<void>}
   */
  async removeFavorite(userId: string, assetId: string): Promise<void> {
    try {
      await this.storage.remove_favorite(userId, assetId);
    } catch (error) {
      console.error('Failed to remove favorite:', error);
      throw error;
    }
  }

  /**
   * Retrieves user's favorites.
   * @param {string} userId - The user ID.
   * @returns {Promise<StumbleAsset[]>}
   */
  async getFavorites(userId: string): Promise<StumbleAsset[]> {
    try {
      return await this.storage.get_favorites(userId);
    } catch (error) {
      console.error('Failed to get favorites:', error);
      throw error;
    }
  }

  /**
   * Retrieves all unique categories.
   * @returns {Promise<string[]>}
   */
  async get_categories(): Promise<string[]> {
    try {
      return await this.storage.get_all_categories();
    } catch (error) {
      console.error('Failed to get categories:', error);
      throw error;
    }
  }
}
