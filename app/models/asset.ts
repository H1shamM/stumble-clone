/**
 * @fileoverview Zod schema and TypeScript type for Stumble assets.
 */

import { z } from 'zod';

/**
 * Zod schema for a Stumble asset.
 */
export const StumbleAssetSchema = z.object({
  /** Unique identifier. */
  id: z.string().uuid(),
  /** The asset URL. */
  url: z.string().url(),
  /** Title of the asset. */
  title: z.string().min(1),
  /** Optional description. */
  description: z.string().optional(),
  /** The source of the content. */
  source: z.string().min(1),
  /** The asset category. */
  category: z.string().min(1),
  /** Rating score. */
  rating: z.number().default(0),
  /** Timestamp of creation. */
  created_at: z.date().default(() => new Date()),
  /** Optional timestamp of last visit. */
  last_visited_at: z.date().optional(),
});

/**
 * TypeScript type inferred from StumbleAssetSchema.
 */
export type StumbleAsset = z.infer<typeof StumbleAssetSchema>;
