import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { env } from './config/env.js';
import routes from './routes/index.js';
import { notFoundHandler, errorHandler } from './middleware/error.middleware.js';
import { firestoreHealthCheck } from './config/firestore.js';
import { redisHealthCheck } from './config/redis.js';

const app = express();

// Security
app.use(helmet());
app.use(cors({
  origin: env.CORS_ORIGIN,
  credentials: true,
}));

// Rate limiting
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { message: 'Too many requests', code: 'RATE_LIMITED' } },
}));

// Stricter rate limit on auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: { message: 'Too many auth attempts', code: 'RATE_LIMITED' } },
});
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/signup', authLimiter);

// Body parsing
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: false }));
app.use(compression());

// Request logging
app.use(morgan('short'));

// Health check
app.get('/health', async (_req, res) => {
  const [firestore, redis] = await Promise.all([firestoreHealthCheck(), redisHealthCheck()]);
  const status = firestore ? 200 : 503;
  res.status(status).json({
    status: firestore ? 'healthy' : 'degraded',
    services: { firestore, redis },
    timestamp: new Date().toISOString(),
  });
});

// API routes
app.use('/api', routes);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
