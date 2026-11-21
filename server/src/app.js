import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import apiRoutes from './routes/apiRoutes.js';
import { errorHandler } from './middlewares/errorHandler.js';

const app = express();

// Global Middlewares
app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(morgan('dev'));

// Root Landing Endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    name: 'Distributed Fault-Tolerant Webhook Dispatcher Engine API',
    status: 'online',
    version: '1.0.0',
    documentation: 'https://github.com/aryacreations/Distributed-fault-tolerent-webhook-description-engine',
    endpoints: {
      health: '/health',
      dispatch: 'POST /api/webhooks/dispatch',
      jobs: 'GET /api/webhooks/jobs',
      stats: 'GET /api/stats',
      mockReceiver: 'ALL /api/mock-receiver',
    },
    architecture: {
      ingestion: 'Non-blocking (202 Accepted in <30ms)',
      queue: 'Upstash Redis + BullMQ',
      database: 'MongoDB Atlas',
      retries: 'Exponential Backoff (2s, 4s, 8s)',
      rateLimiter: 'Token Bucket (5 req/s per domain)',
      security: 'HMAC-SHA256 (X-Webhook-Signature)',
    },
  });
});

// Health Check Endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api', apiRoutes);

// 404 Handler for undefined routes
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'NotFound',
    message: `Cannot ${req.method} ${req.originalUrl}`,
  });
});

// Centralized Error Handling
app.use(errorHandler);

export default app;
