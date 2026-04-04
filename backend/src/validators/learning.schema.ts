import { z } from 'zod';

export const createModuleSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().max(2000).optional(),
  video_url: z.string().url().optional(),
  category: z.string().max(100).optional(),
  duration_minutes: z.number().int().positive().optional(),
});

export const updateModuleSchema = createModuleSchema.partial();

export const updateProgressSchema = z.object({
  module_id: z.string().uuid(),
  completed: z.boolean(),
  quiz_score: z.number().min(0).max(100).optional(),
});

export type CreateModuleInput = z.infer<typeof createModuleSchema>;
export type UpdateModuleInput = z.infer<typeof updateModuleSchema>;
export type UpdateProgressInput = z.infer<typeof updateProgressSchema>;
