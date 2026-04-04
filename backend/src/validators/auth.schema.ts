import { z } from 'zod';

export const signupSchema = z.object({
  phone: z.string().min(10).max(15).regex(/^\+?[0-9]+$/, 'Invalid phone number'),
  email: z.string().email().optional(),
  name: z.string().min(2).max(255),
  password: z.string().min(8).max(128),
  role: z.enum(['caregiver', 'careseeker']),
  language: z.string().max(50).default('hindi'),
});

export const loginSchema = z.object({
  phone: z.string().min(10).max(15),
  password: z.string().min(1),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(1),
});

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RefreshInput = z.infer<typeof refreshSchema>;
