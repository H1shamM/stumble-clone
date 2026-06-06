/**
 * @fileoverview User model definition.
 */

import { z } from 'zod';

/**
 * Zod schema for User.
 */
export const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  password_hash: z.string().nullable(),
  display_name: z.string().optional(),
  avatar_url: z.string().url().optional(),
  provider: z.enum(['local', 'google', 'github']).default('local'),
  provider_id: z.string().optional(),
  created_at: z.date(),
});

/**
 * Type inferred from UserSchema.
 */
export type User = z.infer<typeof UserSchema>;
