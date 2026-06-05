import { z } from 'zod';

export const StumbleAssetSchema = z.object({
  id: z.string().uuid(),
  url: z.string().url(),
  title: z.string().min(1),
  description: z.string().optional(),
  source: z.string().min(1),
  category: z.string().min(1),
  rating: z.number().default(0),
  created_at: z.date().default(() => new Date()),
  last_visited_at: z.date().optional(),
});

export type StumbleAsset = z.infer<typeof StumbleAssetSchema>;

export const CreateAssetSchema = StumbleAssetSchema.omit({ 
  id: true, 
  created_at: true, 
  rating: true 
});

export type CreateAssetDto = z.infer<typeof CreateAssetSchema>;
