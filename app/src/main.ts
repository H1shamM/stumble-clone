// app/src/main.ts
import { createApp } from './app.js';
import { settings } from './config/settings.js';
import { seedDefaultAssets } from './bootstrap.js';
import { logger } from './utils/logger.js';
import { ensureDevUser } from './bootstrap.js';
import bcrypt from 'bcrypt';
import crypto from 'crypto';

// Global error handlers
process.on('unhandledRejection', (reason, promise) => {
  logger.error({ reason, promise }, 'Unhandled Rejection');
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  logger.error(error, 'Uncaught Exception');
  process.exit(1);
});

process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});

async function bootstrap() {
  logger.info('Starting application...');
  
  const { app, storage, discoveryService } = await createApp();
  await ensureDevUser(storage);
  logger.info('App created, checking categories...');

  const categories = await discoveryService.getCategories();
  if (categories.length === 0) {
    logger.info('No categories found, seeding default assets...');
    await seedDefaultAssets(storage);
    logger.info('Seeding completed');
  }

  // Create dev user in development mode
  if (settings.env === 'development') {
    const devEmail = 'dev@stumble.local';
    const existingDevUser = await storage.findUserByEmail(devEmail);
    if (!existingDevUser) {
      logger.info('Creating dev user...');
      const hashedPassword = await bcrypt.hash('devpass', 10);
      const devUserId = crypto.randomUUID();
      await storage.saveUser({
        id: devUserId,
        email: devEmail,
        password_hash: hashedPassword,
        provider: 'local',
        created_at: new Date(),
      });
      logger.info(`Dev user created with id: ${devUserId}`);
    } else {
      logger.info('Dev user already exists');
    }
  }


  app.listen(settings.port, () => {
    logger.info(`Server running on port ${settings.port}`);
  });

  // Keep event loop alive (optional)
  setInterval(() => {
    logger.debug('Server heartbeat');
  }, 60000);
}

bootstrap().catch((err) => {
  logger.error(err, 'Fatal error during bootstrap');
  process.exit(1);
});