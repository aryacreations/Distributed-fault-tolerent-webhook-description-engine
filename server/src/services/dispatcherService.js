import axios from 'axios';

const DEFAULT_TIMEOUT_MS = parseInt(process.env.DISPATCH_TIMEOUT_MS || '5000', 10);

/**
 * Execute HTTP POST dispatch call with timeout and classification
 * 
 * @param {string} destinationUrl - The target endpoint
 * @param {object} payload - The event payload
 * @param {object} headers - Additional custom headers
 * @returns {Promise<{
 *   success: boolean,
 *   httpStatus: number|null,
 *   durationMs: number,
 *   responseBody: string|null,
 *   errorMessage: string|null,
 *   isTransient: boolean
 * }>}
 */
export async function executeWebhookDispatch(destinationUrl, payload, headers = {}) {
  const startTime = Date.now();
  const requestHeaders = {
    'Content-Type': 'application/json',
    'User-Agent': 'Distributed-Webhook-Dispatcher/1.0',
    ...headers,
  };

  try {
    const response = await axios.post(destinationUrl, payload, {
      headers: requestHeaders,
      timeout: DEFAULT_TIMEOUT_MS,
      validateStatus: () => true, // Don't throw on non-2xx status codes
    });

    const durationMs = Date.now() - startTime;
    const httpStatus = response.status;
    const responseBodyStr = typeof response.data === 'string'
      ? response.data
      : JSON.stringify(response.data);

    // Truncate response body to prevent MongoDB document bloating
    const truncatedBody = responseBodyStr ? responseBodyStr.slice(0, 1000) : null;

    if (httpStatus >= 200 && httpStatus < 300) {
      return {
        success: true,
        httpStatus,
        durationMs,
        responseBody: truncatedBody,
        errorMessage: null,
        isTransient: false,
      };
    }

    // Classify non-2xx response
    const isTransient = httpStatus === 429 || httpStatus >= 500;
    const errorMessage = `Target server responded with HTTP ${httpStatus}`;

    return {
      success: false,
      httpStatus,
      durationMs,
      responseBody: truncatedBody,
      errorMessage,
      isTransient,
    };
  } catch (error) {
    const durationMs = Date.now() - startTime;
    let errorMessage = error.message;
    let isTransient = true;

    if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      errorMessage = `Connection timed out after ${DEFAULT_TIMEOUT_MS}ms`;
      isTransient = true;
    } else if (error.code === 'ECONNREFUSED') {
      errorMessage = 'Connection refused by target host';
      isTransient = true;
    } else if (error.code === 'ENOTFOUND') {
      errorMessage = 'DNS lookup failed: Target host could not be resolved';
      isTransient = false; // Invalid domain usually won't recover
    }

    return {
      success: false,
      httpStatus: null,
      durationMs,
      responseBody: null,
      errorMessage,
      isTransient,
    };
  }
}
