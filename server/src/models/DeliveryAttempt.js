import mongoose from 'mongoose';

const DeliveryAttemptSchema = new mongoose.Schema(
  {
    jobId: {
      type: String,
      required: true,
      index: true,
    },
    attemptNumber: {
      type: Number,
      required: true,
    },
    httpStatus: {
      type: Number,
      default: null, // null or 0 for network timeout / connection refused
    },
    durationMs: {
      type: Number,
      required: true,
    },
    requestHeaders: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    responseBody: {
      type: String,
      default: null,
    },
    errorMessage: {
      type: String,
      default: null,
    },
    attemptedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: false,
  }
);

export const DeliveryAttempt = mongoose.model('DeliveryAttempt', DeliveryAttemptSchema);
