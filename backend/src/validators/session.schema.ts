import { z } from 'zod';

export const startSessionSchema = z.object({
  match_id: z.string().uuid(),
  notes: z.string().max(2000).optional(),
});

export const endSessionSchema = z.object({
  notes: z.string().max(2000).optional(),
});

export const listSessionsSchema = z.object({
  status: z.enum(['scheduled', 'active', 'completed', 'cancelled']).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export type StartSessionInput = z.infer<typeof startSessionSchema>;
export type EndSessionInput = z.infer<typeof endSessionSchema>;
export type ListSessionsQuery = z.infer<typeof listSessionsSchema>;
