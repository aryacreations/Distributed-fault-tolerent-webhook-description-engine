import { Worker } from 'bullmq';
import { redisConnectionOptions } from '../config/redis.js';
import { QUEUE_NAME, webhookQueue } from '../queues/webhookQueue.js';
import { WebhookJob } from '../models/WebhookJob.js';
import { DeliveryAttempt } from '../models/DeliveryAttempt.js';
import { checkDomainRateLimit } from '../services/rateLimiterService.js';
import { executeWebhookDispatch } from '../services/dispatcherService.js';

const MAX_RETRIES = parseInt(process.env.MAX_RETRIES || '3', 10);

/**
 * Background worker processor function
 */
async function processWebhookJob(job) {
  const { jobId, destinationUrl, domain, payload } = job.data;
  const attemptNumber = job.attemptsMade + 1; // 1-indexed

  console.log(`[Worker] Processing Job ${jobId} (Attempt ${attemptNumber}) -> ${destinationUrl}`);

  // 1. Check Per-Domain Rate Limiter
  const rateLimitResult = await checkDomainRateLimit(domain);
  if (!rateLimitResult.allowed) {
    console.warn(`[Worker Rate-Limited] Domain ${domain} exceeded rate limit. Rescheduling in 1s.`);
    // Re-schedule this job with delay so it does not count as a failed attempt
    await job.moveToDelayed(Date.now() + 1000, job.token);
    throw new Error(`Delayed due to domain rate limit: ${domain}`);
  }

  // 2. Update DB state to PROCESSING
  await WebhookJob.findOneAndUpdate(
    { jobId },
    {
      status: 'PROCESSING',
      currentAttempt: attemptNumber,
    }
  );

  // 3. Execute HTTP Dispatch
  const dispatchResult = await executeWebhookDispatch(destinationUrl, payload, { jobId, eventId });

  // 4. Record Audit Log in MongoDB
  await DeliveryAttempt.create({
    jobId,
    attemptNumber,
    httpStatus: dispatchResult.httpStatus,
    durationMs: dispatchResult.durationMs,
    requestHeaders: dispatchResult.requestHeaders,
    responseBody: dispatchResult.responseBody,
    errorMessage: dispatchResult.errorMessage,
    attemptedAt: new Date(),
  });

  // 5. Success Path (HTTP 2xx)
  if (dispatchResult.success) {
    console.log(`[Worker Success] Job ${jobId} delivered successfully on attempt ${attemptNumber}`);
    await WebhookJob.findOneAndUpdate(
      { jobId },
      {
        status: 'SUCCESS',
        lastStatusCode: dispatchResult.httpStatus,
        lastError: null,
        nextRetryAt: null,
        completedAt: new Date(),
      }
    );
    return { success: true, attempts: attemptNumber };
  }

  // 6. Permanent Failure (4xx Client Error - No Retry)
  if (!dispatchResult.isTransient) {
    console.warn(`[Worker Permanent Failure] Job ${jobId} failed with non-retryable error: ${dispatchResult.errorMessage}`);
    await WebhookJob.findOneAndUpdate(
      { jobId },
      {
        status: 'FAILED',
        lastStatusCode: dispatchResult.httpStatus,
        lastError: dispatchResult.errorMessage,
        nextRetryAt: null,
        completedAt: new Date(),
      }
    );
    // Don't throw error to avoid BullMQ retrying this permanent failure
    return { success: false, nonRetryable: true };
  }

  // 7. Transient Failure (5xx, 429, Timeout)
  const isFinalAttempt = attemptNumber >= (MAX_RETRIES + 1);

  if (isFinalAttempt) {
    console.error(`[Worker Dead-Letter] Job ${jobId} exhausted all ${MAX_RETRIES} retries. Marking FAILED.`);
    await WebhookJob.findOneAndUpdate(
      { jobId },
      {
        status: 'FAILED',
        lastStatusCode: dispatchResult.httpStatus,
        lastError: `Max retries (${MAX_RETRIES}) exhausted. Last error: ${dispatchResult.errorMessage}`,
        nextRetryAt: null,
        completedAt: new Date(),
      }
    );
    throw new Error(dispatchResult.errorMessage);
  } else {
    // Calculate next backoff timestamp (2s, 4s, 8s)
    const backoffDelayMs = Math.pow(2, attemptNumber) * 1000;
    const nextRetryDate = new Date(Date.now() + backoffDelayMs);

    console.warn(
      `[Worker Transient Failure] Job ${jobId} failed attempt ${attemptNumber}. Retrying in ${backoffDelayMs / 1000}s at ${nextRetryDate.toISOString()}`
    );

    await WebhookJob.findOneAndUpdate(
      { jobId },
      {
        status: 'RETRYING',
        lastStatusCode: dispatchResult.httpStatus,
        lastError: dispatchResult.errorMessage,
        nextRetryAt: nextRetryDate,
      }
    );

    // Throwing error signals BullMQ to apply its exponential backoff delay
    throw new Error(dispatchResult.errorMessage);
  }
}

/**
 * Initialize and start the BullMQ Worker
 */
export function startWebhookWorker() {
  const worker = new Worker(QUEUE_NAME, processWebhookJob, {
    connection: redisConnectionOptions,
    concurrency: 5,
    settings: {
      backoffStrategy(attemptsMade) {
        // Explicit Exponential Backoff: 2s (attempt 1), 4s (attempt 2), 8s (attempt 3)
        return Math.pow(2, attemptsMade) * 1000;
      },
    },
  });

  worker.on('ready', () => {
    console.log('[Worker] Background dispatch worker is ready and listening for jobs');
  });

  worker.on('error', (err) => {
    console.error('[Worker Error]', err.message);
  });

  return worker;
}
