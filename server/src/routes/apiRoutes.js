import express from 'express';
import { validateDispatchPayload } from '../middlewares/validator.js';
import {
  dispatchWebhook,
  getJobById,
  listJobs,
  retryJob,
} from '../controllers/dispatchController.js';
import {
  handleMockReceiver,
  resetMockReceiver,
} from '../controllers/mockReceiverController.js';
import { getSystemStats } from '../controllers/statsController.js';

const router = express.Router();

// 1. Ingestion & Job Queries
router.post('/webhooks/dispatch', validateDispatchPayload, dispatchWebhook);
router.get('/webhooks/jobs', listJobs);
router.get('/webhooks/jobs/:jobId', getJobById);
router.post('/webhooks/jobs/:jobId/retry', retryJob); // Manual Replay / DLQ Retry

// 2. Metrics & Telemetry
router.get('/stats', getSystemStats);

// 3. Built-in Mock Receiver Suite
router.all('/mock-receiver', handleMockReceiver);
router.post('/mock-receiver/reset', resetMockReceiver);

export default router;
