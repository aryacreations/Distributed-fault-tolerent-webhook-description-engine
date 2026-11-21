import { Queue } from 'bullmq';
import { redisConnectionOptions } from '../config/redis.js';

export const QUEUE_NAME = 'webhook-dispatch-queue';

/**
 * BullMQ Queue for scheduling and dispatching webhooks
 */
export const webhookQueue = new Queue(QUEUE_NAME, {
  connection: redisConnectionOptions,
  defaultJobOptions: {
    attempts: 4, // 1 initial attempt + 3 retries
    backoff: {
      type: 'exponential',
      delay: 2000, // 2s -> 4s -> 8s
    },
    removeOnComplete: {
      age: 3600, // Keep completed jobs for 1 hour in Redis for audit
      count: 1000,
    },
    removeOnFail: {
      age: 86400, // Keep failed jobs for 24 hours
      count: 2000,
    },
  },
});

/**
 * Add a new webhook job to the queue
 * @param {object} jobData
 * @param {object} [options]
 */
export async function enqueueWebhook(jobData, options = {}) {
  return await webhookQueue.add('dispatch', jobData, {
    jobId: jobData.jobId,
    ...options,
  });
}
