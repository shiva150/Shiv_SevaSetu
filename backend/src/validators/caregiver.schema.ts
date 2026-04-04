import { z } from 'zod';

export const createCaregiverSchema = z.object({
  skills: z.array(z.string().min(1)).min(1, 'At least one skill required'),
  languages: z.array(z.string().min(1)).min(1).default(['hindi']),
  location_lat: z.number().min(-90).max(90).optional(),
  location_lng: z.number().min(-180).max(180).optional(),
  location_address: z.string().max(500).optional(),
  id_proof_url: z.string().url().optional(),
  photo_url: z.string().url().optional(),
  hourly_rate: z.number().positive().optional(),
  bio: z.string().max(2000).optional(),
});

export const updateCaregiverSchema = z.object({
  skills: z.array(z.string().min(1)).min(1).optional(),
  languages: z.array(z.string().min(1)).min(1).optional(),
  availability: z.boolean().optional(),
  location_lat: z.number().min(-90).max(90).optional(),
  location_lng: z.number().min(-180).max(180).optional(),
  location_address: z.string().max(500).optional(),
  id_proof_url: z.string().url().optional(),
  photo_url: z.string().url().optional(),
  hourly_rate: z.number().positive().optional(),
  bio: z.string().max(2000).optional(),
});

export const listCaregiversSchema = z.object({
  skills: z.string().optional(),        // comma-separated
  verified: z.enum(['true', 'false']).optional(),
  available: z.enum(['true', 'false']).optional(),
  lat: z.coerce.number().min(-90).max(90).optional(),
  lng: z.coerce.number().min(-180).max(180).optional(),
  radius_km: z.coerce.number().positive().max(500).default(100),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export type CreateCaregiverInput = z.infer<typeof createCaregiverSchema>;
export type UpdateCaregiverInput = z.infer<typeof updateCaregiverSchema>;
export type ListCaregiversQuery = z.infer<typeof listCaregiversSchema>;
