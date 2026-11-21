import { v4 as uuidv4 } from 'uuid';
import { WebhookJob } from '../models/WebhookJob.js';
import { DeliveryAttempt } from '../models/DeliveryAttempt.js';
import { enqueueWebhook } from '../queues/webhookQueue.js';

/**
 * Extract clean hostname/domain from a URL string
 */
function extractDomain(urlStr) {
  try {
    const parsed = new URL(urlStr);
    return parsed.hostname.toLowerCase();
  } catch {
    return 'unknown';
  }
}

/**
 * POST /api/webhooks/dispatch
 * Ingestion Endpoint: Validates, queues job, and returns 202 Accepted immediately (<30ms)
 */
export async function dispatchWebhook(req, res, next) {
  try {
    const { destinationUrl, eventId, payload } = req.validatedBody;
    const domain = extractDomain(destinationUrl);

    // 1. Idempotency Check
    const existingJob = await WebhookJob.findOne({ eventId });
    if (existingJob) {
      return res.status(200).json({
        status: existingJob.status.toLowerCase(),
        jobId: existingJob.jobId,
        eventId: existingJob.eventId,
        message: 'Job with this eventId already exists (Idempotent response)',
        existing: true,
      });
    }

    // 2. Generate Unique Internal Job ID
    const jobId = `wh_job_${uuidv4().replace(/-/g, '').slice(0, 16)}`;

    // 3. Persist initial record in MongoDB
    const jobDoc = await WebhookJob.create({
      jobId,
      eventId,
      destinationUrl,
      domain,
      payload,
      status: 'QUEUED',
      currentAttempt: 0,
      maxRetries: parseInt(process.env.MAX_RETRIES || '3', 10),
    });

    // 4. Push job to Redis BullMQ Queue
    await enqueueWebhook({
      jobId,
      eventId,
      destinationUrl,
      domain,
      payload,
    });

    // 5. Respond immediately with 202 Accepted
    return res.status(202).json({
      status: 'queued',
      jobId,
      eventId,
      message: 'Webhook queued for asynchronous background delivery',
      createdAt: jobDoc.createdAt,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/webhooks/jobs/:jobId
 * Retrieve detailed status and full audit history of attempts
 */
export async function getJobById(req, res, next) {
  try {
    const { jobId } = req.params;
    const job = await WebhookJob.findOne({ jobId });

    if (!job) {
      return res.status(404).json({
        error: 'NotFound',
        message: `Webhook job with ID '${jobId}' does not exist`,
      });
    }

    const attempts = await DeliveryAttempt.find({ jobId }).sort({ attemptNumber: 1 });

    return res.status(200).json({
      success: true,
      job,
      attempts,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/webhooks/jobs
 * List recent jobs with optional status filter, search query, and pagination
 */
export async function listJobs(req, res, next) {
  try {
    const page = Math.max(1, parseInt(req.query.page || '1', 10));
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit || '20', 10)));
    const status = req.query.status;
    const search = req.query.search;

    const filter = {};
    if (status && ['QUEUED', 'PROCESSING', 'RETRYING', 'SUCCESS', 'FAILED'].includes(status.toUpperCase())) {
      filter.status = status.toUpperCase();
    }

    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      filter.$or = [
        { jobId: searchRegex },
        { eventId: searchRegex },
        { domain: searchRegex },
        { destinationUrl: searchRegex },
      ];
    }

    const [jobs, total] = await Promise.all([
      WebhookJob.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      WebhookJob.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      jobs,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/webhooks/jobs/:jobId/retry
 * Manual Replay Endpoint: Re-queues a failed/DLQ webhook job for immediate background re-delivery
 */
export async function retryJob(req, res, next) {
  try {
    const { jobId } = req.params;
    const job = await WebhookJob.findOne({ jobId });

    if (!job) {
      return res.status(404).json({
        error: 'NotFound',
        message: `Webhook job '${jobId}' does not exist`,
      });
    }

    // Reset job state in database
    job.status = 'QUEUED';
    job.currentAttempt = 0;
    job.lastError = null;
    job.nextRetryAt = null;
    await job.save();

    // Re-push job to BullMQ queue
    await enqueueWebhook({
      jobId: job.jobId,
      eventId: job.eventId,
      destinationUrl: job.destinationUrl,
      domain: job.domain,
      payload: job.payload,
    });

    console.log(`[Manual Replay] Job ${jobId} re-queued by user for re-dispatch.`);

    return res.status(200).json({
      success: true,
      message: `Webhook job ${jobId} successfully re-queued for delivery`,
      job,
    });
  } catch (error) {
    next(error);
  }
}
