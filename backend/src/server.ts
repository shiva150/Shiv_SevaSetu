import app from './app.js';
import { env } from './config/env.js';
import { logger } from './utils/logger.js';

const server = app.listen(env.PORT, () => {
  logger.info(`SevaSetu API running on port ${env.PORT} [${env.NODE_ENV}]`);
});

// Graceful shutdown
const shutdown = (signal: string) => {
  logger.info(`${signal} received — shutting down`);
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
  // Force close after 10s
  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
