import { z } from 'zod';

export const createSosSchema = z.object({
  session_id: z.string().uuid().optional(),
  location_lat: z.number().min(-90).max(90),
  location_lng: z.number().min(-180).max(180),
  address: z.string().max(500).optional(),
});

export const updateSosSchema = z.object({
  status: z.enum(['acknowledged', 'resolved']),
});

export type CreateSosInput = z.infer<typeof createSosSchema>;
export type UpdateSosInput = z.infer<typeof updateSosSchema>;
