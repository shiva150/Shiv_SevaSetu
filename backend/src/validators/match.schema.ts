import { z } from 'zod';

export const triggerMatchSchema = z.object({
  request_id: z.string().uuid(),
  limit: z.number().int().positive().max(50).default(10),
});

export const respondMatchSchema = z.object({
  status: z.enum(['accepted', 'rejected']),
});

export type TriggerMatchInput = z.infer<typeof triggerMatchSchema>;
export type RespondMatchInput = z.infer<typeof respondMatchSchema>;
