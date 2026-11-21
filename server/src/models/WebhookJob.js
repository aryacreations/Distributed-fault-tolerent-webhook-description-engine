import mongoose from 'mongoose';

const WebhookJobSchema = new mongoose.Schema(
  {
    jobId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    eventId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    destinationUrl: {
      type: String,
      required: true,
    },
    domain: {
      type: String,
      required: true,
      index: true,
    },
    payload: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    status: {
      type: String,
      enum: ['QUEUED', 'PROCESSING', 'RETRYING', 'SUCCESS', 'FAILED'],
      default: 'QUEUED',
      index: true,
    },
    currentAttempt: {
      type: Number,
      default: 0,
    },
    maxRetries: {
      type: Number,
      default: 3,
    },
    lastStatusCode: {
      type: Number,
      default: null,
    },
    lastError: {
      type: String,
      default: null,
    },
    nextRetryAt: {
      type: Date,
      default: null,
    },
    completedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

export const WebhookJob = mongoose.model('WebhookJob', WebhookJobSchema);
