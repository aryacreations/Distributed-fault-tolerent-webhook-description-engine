import 'dotenv/config';
import app from './app.js';
import { connectDB } from './config/db.js';
import { startWebhookWorker } from './workers/webhookWorker.js';
import { redisClient } from './config/redis.js';

const PORT = process.env.PORT || 5000;

async function bootstrap() {
  try {
    console.log('[Bootstrap] Initializing Distributed Webhook Dispatcher Engine...');

    // 1. Connect to Database (MongoDB Atlas)
    await connectDB();

    // 2. Start Background Worker
    const worker = startWebhookWorker();

    // 3. Start Express HTTP Server
    const server = app.listen(PORT, () => {
      console.log(`[Bootstrap] HTTP Server listening on port ${PORT}`);
      console.log(`[Bootstrap] Environment: ${process.env.NODE_ENV || 'development'}`);
    });

    // 4. Graceful Shutdown
    const shutdown = async (signal) => {
      console.log(`[Shutdown] Received ${signal}. Gracefully stopping worker and server...`);
      server.close(async () => {
        try {
          await worker.close();
          await redisClient.quit();
          console.log('[Shutdown] Closed all background connections successfully.');
          process.exit(0);
        } catch (err) {
          console.error('[Shutdown Error]', err);
          process.exit(1);
        }
      });
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
  } catch (error) {
    console.error('[Fatal Bootstrap Error]', error);
    process.exit(1);
  }
}

bootstrap();
