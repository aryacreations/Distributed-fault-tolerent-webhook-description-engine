import { z } from 'zod';

const dispatchSchema = z.object({
  destinationUrl: z
    .string({ required_error: 'destinationUrl is required' })
    .url('destinationUrl must be a valid HTTP or HTTPS URL')
    .refine((url) => url.startsWith('http://') || url.startsWith('https://'), {
      message: 'destinationUrl must use http or https protocol',
    }),
  eventId: z
    .string({ required_error: 'eventId is required' })
    .min(1, 'eventId cannot be empty'),
  payload: z
    .record(z.any(), { required_error: 'payload must be a valid JSON object' }),
});

/**
 * Middleware to validate webhook dispatch ingestion payload
 */
export function validateDispatchPayload(req, res, next) {
  const result = dispatchSchema.safeParse(req.body);
  if (!result.success) {
    const errors = result.error.errors.map((err) => ({
      field: err.path.join('.'),
      message: err.message,
    }));
    return res.status(400).json({
      error: 'Validation Failed',
      details: errors,
    });
  }
  req.validatedBody = result.data;
  next();
}
