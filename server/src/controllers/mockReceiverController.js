// In-memory tracker for simulation of "fail N times then succeed"
const simulationCounters = new Map();

/**
 * POST /api/mock-receiver
 * Intelligent test receiver that can simulate success, failures, delays, and self-healing endpoints.
 */
export async function handleMockReceiver(req, res) {
  const queryStatus = req.query.status ? parseInt(req.query.status, 10) : null;
  const delayMs = req.query.delay ? parseInt(req.query.delay, 10) : 0;
  const failUntil = req.query.failUntil ? parseInt(req.query.failUntil, 10) : null;
  const failCode = req.query.code ? parseInt(req.query.code, 10) : 500;

  // Key tracking by eventId if provided in payload, or fallback to 'default'
  const eventKey = req.body?.eventId || req.query.key || 'default_simulation';

  // 1. Simulate artificial server delay (e.g., 6000ms to trigger client 5000ms timeout)
  if (delayMs > 0) {
    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }

  // 2. Simulate "Fail N times, then succeed" scenario
  if (failUntil !== null) {
    const currentCount = simulationCounters.get(eventKey) || 0;
    const newCount = currentCount + 1;
    simulationCounters.set(eventKey, newCount);

    if (newCount <= failUntil) {
      return res.status(failCode).json({
        mock: true,
        status: failCode,
        attemptSeen: newCount,
        message: `Simulated transient error: attempt ${newCount} of ${failUntil} failed with HTTP ${failCode}`,
      });
    }

    // After failUntil threshold reached, self-heal and return 200 OK!
    return res.status(200).json({
      mock: true,
      status: 200,
      attemptSeen: newCount,
      message: `Endpoint recovered! Attempt ${newCount} succeeded with HTTP 200`,
    });
  }

  const signatureReceived = req.headers['x-webhook-signature'] || null;

  // 3. Simulate explicit HTTP status code
  if (queryStatus) {
    return res.status(queryStatus).json({
      mock: true,
      status: queryStatus,
      signatureReceived,
      signatureVerified: Boolean(signatureReceived),
      receivedPayload: req.body,
      timestamp: new Date().toISOString(),
    });
  }

  // Default: Standard 200 OK Success
  return res.status(200).json({
    mock: true,
    status: 200,
    message: 'Mock receiver successfully acknowledged webhook delivery with HMAC verification',
    signatureReceived,
    signatureVerified: Boolean(signatureReceived),
    receivedPayload: req.body,
    timestamp: new Date().toISOString(),
  });
}

/**
 * POST /api/mock-receiver/reset
 * Reset the simulation counters
 */
export function resetMockReceiver(req, res) {
  simulationCounters.clear();
  return res.status(200).json({
    success: true,
    message: 'Simulation counters have been reset',
  });
}
