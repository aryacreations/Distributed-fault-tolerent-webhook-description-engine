import { WebhookJob } from '../models/WebhookJob.js';
import { DeliveryAttempt } from '../models/DeliveryAttempt.js';
import { webhookQueue } from '../queues/webhookQueue.js';

/**
 * GET /api/stats
 * Real-time system health and throughput metrics
 */
export async function getSystemStats(req, res, next) {
  try {
    const [
      totalJobs,
      queuedJobs,
      processingJobs,
      retryingJobs,
      successJobs,
      failedJobs,
      totalAttempts,
      queueJobCounts,
    ] = await Promise.all([
      WebhookJob.countDocuments(),
      WebhookJob.countDocuments({ status: 'QUEUED' }),
      WebhookJob.countDocuments({ status: 'PROCESSING' }),
      WebhookJob.countDocuments({ status: 'RETRYING' }),
      WebhookJob.countDocuments({ status: 'SUCCESS' }),
      WebhookJob.countDocuments({ status: 'FAILED' }),
      DeliveryAttempt.countDocuments(),
      webhookQueue.getJobCounts('waiting', 'active', 'delayed', 'completed', 'failed'),
    ]);

    // Average latency calculation from the last 100 attempts
    const recentAttempts = await DeliveryAttempt.find()
      .sort({ attemptedAt: -1 })
      .limit(100)
      .select('durationMs');

    const avgLatencyMs = recentAttempts.length > 0
      ? Math.round(
          recentAttempts.reduce((acc, curr) => acc + curr.durationMs, 0) / recentAttempts.length
        )
      : 0;

    return res.status(200).json({
      success: true,
      metrics: {
        totalJobs,
        byStatus: {
          queued: queuedJobs,
          processing: processingJobs,
          retrying: retryingJobs,
          success: successJobs,
          failed: failedJobs,
        },
        totalAttempts,
        avgLatencyMs,
        queue: queueJobCounts,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
}
