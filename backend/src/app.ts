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

// ── CORS ──────────────────────────────────────────────────────
// Accept a comma-separated CORS_ORIGINS env var so the same backend
// can serve both local dev and the Vercel production frontend.
const allowedOrigins = env.CORS_ORIGINS
  .split(',')
  .map(o => o.trim())
  .filter(Boolean);

app.use(cors({
  origin(origin, callback) {
    // Allow non-browser requests (curl, Render health checks) and same-origin
    if (!origin) return callback(null, true);

    const allowed =
      allowedOrigins.includes(origin) ||
      // Wildcard: allow any *.vercel.app subdomain
      /^https:\/\/[a-z0-9-]+\.vercel\.app$/.test(origin) ||
      // Wildcard: allow any *.onrender.com subdomain (useful for preview deploys)
      /^https:\/\/[a-z0-9-]+\.onrender\.com$/.test(origin);

    if (allowed) return callback(null, true);
    callback(new Error(`CORS: origin '${origin}' not allowed`));
  },
  credentials: true,
}));

// ── Security & compression ────────────────────────────────────
app.use(helmet());

// Rate limiting
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { message: 'Too many requests', code: 'RATE_LIMITED' } },
}));

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

// Request logging — use 'combined' in production for structured logs
app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'short'));

// ── Health check ──────────────────────────────────────────────
app.get('/health', async (_req, res) => {
  const [firestore, redis] = await Promise.all([
    firestoreHealthCheck(),
    redisHealthCheck(),
  ]);
  const status = firestore ? 200 : 503;
  res.status(status).json({
    status: firestore ? 'healthy' : 'degraded',
    services: { firestore, redis },
    timestamp: new Date().toISOString(),
  });
});

// ── API routes ────────────────────────────────────────────────
app.use('/api', routes);

// ── Error handling ────────────────────────────────────────────
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
