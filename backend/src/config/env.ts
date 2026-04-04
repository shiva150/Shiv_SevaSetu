import dotenv from 'dotenv';
import path from 'path';
import { z } from 'zod';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const envSchema = z.object({
  PORT: z.coerce.number().default(3001),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  // Firebase Admin SDK
  FIREBASE_PROJECT_ID: z.string().min(1),
  FIREBASE_CLIENT_EMAIL: z.string().email(),
  FIREBASE_PRIVATE_KEY: z.string().min(1),
  FIRESTORE_DATABASE_ID: z.string().min(1),

  // Redis
  REDIS_URL: z.string().default('redis://localhost:6379'),

  // JWT
  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),

  // CORS
  CORS_ORIGIN: z.string().default('http://localhost:3000'),

  // Logging
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'http', 'debug']).default('info'),

  // Blockchain
  BLOCKCHAIN_RPC_URL: z.string().url().default('https://rpc-mumbai.maticvigil.com'),
  ESCROW_CONTRACT_ADDRESS: z.string().default('0x0000000000000000000000000000000000000000'),
  NFT_CONTRACT_ADDRESS: z.string().default('0x0000000000000000000000000000000000000000'),
  PLATFORM_WALLET_PRIVATE_KEY: z.string().min(1),

  // Python AI microservice
  AI_SERVICE_URL: z.string().url().default('http://localhost:8000'),

  // Pinata IPFS
  PINATA_API_KEY: z.string().default(''),
  PINATA_SECRET_KEY: z.string().default(''),

  // Gemini AI
  GEMINI_API_KEY: z.string().default(''),

  // Demo / onboarding
  AUTO_APPROVE_CAREGIVERS: z.enum(['true', 'false']).default('false'),
  ADMIN_PHONE: z.string().default('9999999999'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:');
  console.error(parsed.error.format());
  process.exit(1);
}

export const env = parsed.data;
