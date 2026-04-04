import { z } from 'zod';

export const createRequestSchema = z.object({
  skills_required: z.array(z.string().min(1)).min(1),
  urgency: z.enum(['low', 'medium', 'high', 'emergency']).default('medium'),
  location_lat: z.number().min(-90).max(90).optional(),
  location_lng: z.number().min(-180).max(180).optional(),
  location_address: z.string().max(500).optional(),
  preferred_language: z.string().max(50).optional(),
  description: z.string().max(2000).optional(),
  hours_needed: z.number().positive().optional(),
  budget: z.number().positive().optional(),
});

export const updateRequestStatusSchema = z.object({
  status: z.enum(['open', 'matched', 'active', 'completed', 'cancelled']),
});

export const listRequestsSchema = z.object({
  status: z.enum(['open', 'matched', 'active', 'completed', 'cancelled']).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export type CreateRequestInput = z.infer<typeof createRequestSchema>;
export type UpdateRequestStatusInput = z.infer<typeof updateRequestStatusSchema>;
export type ListRequestsQuery = z.infer<typeof listRequestsSchema>;
