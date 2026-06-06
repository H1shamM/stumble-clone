/**
 * @fileoverview Interface for storage operations.
 */

import type { StumbleAsset } from '../models/asset.js';

/**
 * Represents an item from a user's rating history.
 */
export interface RatedItem extends StumbleAsset {
  rating_val: 'like' | 'dislike';
  timestamp: Date;
}

/**
 * Interface for storage operations.
 */
export interface IStoragePort {
  /**
   * Retrieves an asset by its ID.
   * @param {string} id - The ID of the asset.
   * @returns {Promise<StumbleAsset | null>}
   */
  get_asset_by_id(id: string): Promise<StumbleAsset | null>;

  /**
   * Retrieves a random asset based on user interests.
   * @param {string[]} interests - User interests.
   * @param {string[]} exclude_ids - Asset IDs to exclude.
   * @returns {Promise<StumbleAsset | null>}
   */
  get_random_asset_by_interests(interests: string[], exclude_ids: string[]): Promise<StumbleAsset | null>;

  /**
   * Saves or updates an asset.
   * @param {StumbleAsset} asset - The asset to save.
   * @returns {Promise<void>}
   */
  save_asset(asset: StumbleAsset): Promise<void>;

  /**
   * Updates an asset's rating.
   * @param {string} id - The asset ID.
   * @param {number} delta - The rating change.
   * @returns {Promise<void>}
   */
  update_rating(id: string, delta: number): Promise<void>;

  /**
   * Retrieves all unique interests.
   * @returns {Promise<string[]>}
   */
  get_all_interests(): Promise<string[]>;

  /**
   * Retrieves all assets by category.
   * @param {string} category - Asset category to filter by.
   * @returns {Promise<StumbleAsset[]>}
   */
  get_all_assets(category: string): Promise<StumbleAsset[]>;

  /**
   * Retrieves all unique categories.
   * @returns {Promise<string[]>}
   */
  get_all_categories(): Promise<string[]>;

  /**
   * Retrieves recommended assets for a user.
   * @param {string} user_id - The user ID.
   * @param {number} limit - The number of recommendations to return.
   * @returns {Promise<StumbleAsset[]>}
   */
  get_recommendations(user_id: string, limit: number): Promise<StumbleAsset[]>;

  /**
   * Searches for assets by query string.
   * @param {string} query - The search query.
   * @returns {Promise<StumbleAsset[]>}
   */
  search_assets(query: string): Promise<StumbleAsset[]>;

  /**
   * Saves a rating for an asset by a user.
   * @param {string} user_id - The user ID.
   * @param {string} asset_id - The asset ID.
   * @param {'like' | 'dislike'} rating - The rating value.
   * @returns {Promise<void>}
   */
  save_rating(user_id: string, asset_id: string, rating: 'like' | 'dislike'): Promise<void>;

  /**
   * Retrieves user's history of ratings.
   * @param {string} user_id - The user ID.
   * @param {number} limit - Limit of results.
   * @returns {Promise<RatedItem[]>}
   */
  get_history(user_id: string, limit: number): Promise<RatedItem[]>;

  /**
   * Retrieves user preferences.
   * @param {string} user_id - The user ID.
   * @returns {Promise<{ type: string; name: string; score: number }[]>}
   */
  get_user_preferences(user_id: string): Promise<{ type: string; name: string; score: number }[]>;

  /**
   * Adds an asset to favorites.
   * @param {string} user_id - The user ID.
   * @param {string} asset_id - The asset ID.
   * @returns {Promise<void>}
   */
  save_favorite(user_id: string, asset_id: string): Promise<void>;

  /**
   * Removes an asset from favorites.
   * @param {string} user_id - The user ID.
   * @param {string} asset_id - The asset ID.
   * @returns {Promise<void>}
   */
  remove_favorite(user_id: string, asset_id: string): Promise<void>;

  /**
   * Retrieves user's favorites.
   * @param {string} user_id - The user ID.
   * @returns {Promise<StumbleAsset[]>}
   */
  get_favorites(user_id: string): Promise<StumbleAsset[]>;

  /**
   * Updates user preferences.
   * @param {string} user_id - The user ID.
   * @param {'category' | 'source'} type - The preference type.
   * @param {string} name - The preference name.
   * @param {number} delta - The score change.
   * @returns {Promise<void>}
   */
  update_user_preference(user_id: string, type: 'category' | 'source', name: string, delta: number): Promise<void>;
}
