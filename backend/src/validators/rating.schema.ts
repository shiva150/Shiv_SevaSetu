import { z } from 'zod';

export const createRatingSchema = z.object({
  session_id: z.string().uuid(),
  score: z.number().min(1).max(5),
  feedback: z.string().max(2000).optional(),
});

export type CreateRatingInput = z.infer<typeof createRatingSchema>;
