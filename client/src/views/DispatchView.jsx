import React, { useState } from 'react';
import { Send, Zap, Check, AlertCircle, Copy, Sparkles, Clock, Globe } from 'lucide-react';
import { dispatchWebhook } from '../services/api';

const SAMPLE_PAYLOADS = {
  signup: {
    event: 'user.signup',
    userId: 'usr_' + Math.floor(1000 + Math.random() * 9000),
    email: 'alex.morgan@company.io',
    tier: 'enterprise',
    registeredAt: new Date().toISOString(),
  },
  payment: {
    event: 'payment.succeeded',
    invoiceId: 'inv_' + Math.floor(100000 + Math.random() * 900000),
    amount: 24900,
    currency: 'USD',
    customer: 'Acme Global Corp',
  },
  order: {
    event: 'order.shipped',
    orderId: 'ord_778899',
    carrier: 'DHL Express',
    trackingNumber: 'DHL-8921-EU',
  },
  subscription: {
    event: 'subscription.canceled',
    subscriptionId: 'sub_334455',
    reason: 'downgrade_to_free',
    effectiveDate: new Date().toISOString(),
  },
};

export default function DispatchView({ onJobCreated }) {
  const [destinationUrl, setDestinationUrl] = useState('http://localhost:5000/api/mock-receiver?status=200');
  const [eventId, setEventId] = useState('evt_' + Date.now());
  const [payloadText, setPayloadText] = useState(JSON.stringify(SAMPLE_PAYLOADS.signup, null, 2));
  const [isLoading, setIsLoading] = useState(false);
  const [responseInfo, setResponseInfo] = useState(null);
  const [error, setError] = useState(null);

  const handleApplyTemplate = (type) => {
    setPayloadText(JSON.stringify(SAMPLE_PAYLOADS[type], null, 2));
    setEventId('evt_' + Date.now());
  };

  const handleSetTarget = (targetType) => {
    if (targetType === 'mock200') {
      setDestinationUrl('http://localhost:5000/api/mock-receiver?status=200');
    } else if (targetType === 'mockFlaky') {
      setDestinationUrl(`http://localhost:5000/api/mock-receiver?failUntil=2&code=500&key=${eventId}`);
    } else if (targetType === 'httpbin') {
      setDestinationUrl('https://httpbin.org/post');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setResponseInfo(null);

    let parsedPayload;
    try {
      parsedPayload = JSON.parse(payloadText);
    } catch {
      setError('Invalid JSON syntax: please verify payload format');
      setIsLoading(false);
      return;
    }

    const startTime = performance.now();
    try {
      const result = await dispatchWebhook({
        destinationUrl,
        eventId,
        payload: parsedPayload,
      });
      const duration = Math.round(performance.now() - startTime);

      setResponseInfo({
        status: result.status,
        jobId: result.jobId,
        durationMs: duration,
        existing: result.existing,
        createdAt: result.createdAt || new Date().toISOString(),
      });

      setEventId('evt_' + Date.now());
      if (onJobCreated) onJobCreated();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Dispatch request failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-7xl mx-auto">
      {/* Left Form Studio: 7 cols */}
      <div className="lg:col-span-7 glass-card rounded-2xl p-6 sm:p-7 space-y-6">
        <div>
          <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
            <Send className="w-5 h-5 text-emerald-600" />
            Dispatch Studio
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Publish event notifications to external destinations. Ingestion returns <span className="text-emerald-700 font-mono font-bold">202 Accepted</span> in &lt;30ms.
          </p>
        </div>

        {/* Template Buttons */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Quick Payload Templates
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {Object.keys(SAMPLE_PAYLOADS).map((tpl) => (
              <button
                key={tpl}
                type="button"
                onClick={() => handleApplyTemplate(tpl)}
                className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/90 shadow-sm transition active:scale-95 flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                <span className="capitalize">{tpl}</span>
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Destination URL */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-700">
                Destination URL
              </label>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleSetTarget('mock200')}
                  className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition"
                >
                  Mock 200 OK
                </button>
                <button
                  type="button"
                  onClick={() => handleSetTarget('mockFlaky')}
                  className="text-[10px] font-semibold px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 transition"
                >
                  Mock Flaky (500)
                </button>
                <button
                  type="button"
                  onClick={() => handleSetTarget('httpbin')}
                  className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200 transition"
                >
                  httpbin.org
                </button>
              </div>
            </div>
            <input
              type="url"
              required
              value={destinationUrl}
              onChange={(e) => setDestinationUrl(e.target.value)}
              placeholder="https://customer-api.com/webhooks"
              className="glass-input w-full rounded-xl px-3.5 py-2.5 text-xs font-mono text-slate-800 placeholder-slate-400"
            />
          </div>

          {/* Event ID */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-700">
                Event ID (Idempotency Key)
              </label>
              <button
                type="button"
                onClick={() => setEventId('evt_' + Date.now())}
                className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 hover:underline"
              >
                Regenerate ID
              </button>
            </div>
            <input
              type="text"
              required
              value={eventId}
              onChange={(e) => setEventId(e.target.value)}
              className="glass-input w-full rounded-xl px-3.5 py-2.5 text-xs font-mono text-slate-800"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Guarantees at-most-once enqueueing. If repeated, returns the existing job ID without duplicate dispatch.
            </p>
          </div>

          {/* JSON Payload Editor */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              JSON Event Payload
            </label>
            <textarea
              rows={8}
              required
              value={payloadText}
              onChange={(e) => setPayloadText(e.target.value)}
              className="glass-input w-full rounded-xl p-3.5 text-xs font-mono text-slate-800 leading-relaxed"
            />
          </div>

          {/* Submit Action */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold py-3 px-5 rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/25 transition disabled:opacity-50"
          >
            {isLoading ? (
              <span>Validating & Enqueueing...</span>
            ) : (
              <>
                <Zap className="w-4 h-4 fill-white" />
                <span>Dispatch Webhook (Instant 202 Ingestion)</span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* Right Drawer: 5 cols (Live Ingestion Status) */}
      <div className="lg:col-span-5 space-y-5">
        <div className="glass-card rounded-2xl p-6 border-l-4 border-l-emerald-500">
          <h3 className="text-sm font-extrabold text-slate-900 mb-2">
            Non-Blocking Ingestion Guarantee
          </h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            The Ingestion Layer strictly decouples request acceptance from downstream execution. Even if the target server takes 10 seconds or fails, the caller receives an immediate <span className="font-bold text-slate-900 font-mono">202 Accepted</span> response in under 30 milliseconds.
          </p>
        </div>

        {/* Response Notification Banner */}
        {responseInfo && (
          <div className="glass-card rounded-2xl p-6 border border-emerald-300 bg-emerald-50/60 shadow-lg shadow-emerald-500/10 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-emerald-200/70">
              <div className="flex items-center gap-2">
                <Check className="w-5 h-5 text-emerald-600" />
                <span className="font-extrabold text-emerald-900 text-sm">
                  202 Accepted ({responseInfo.durationMs}ms)
                </span>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-600 text-white font-mono uppercase">
                {responseInfo.status}
              </span>
            </div>

            <div className="space-y-2 text-xs font-mono">
              <div>
                <span className="text-slate-500 block text-[11px] font-sans">Assigned Job ID:</span>
                <span className="font-bold text-slate-900 break-all">{responseInfo.jobId}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px] font-sans">Idempotency State:</span>
                <span className="text-slate-800">
                  {responseInfo.existing ? 'Recognized Existing Event (Idempotent)' : 'New Job Enqueued into BullMQ'}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px] font-sans">Queue Timestamp:</span>
                <span className="text-slate-700">{new Date(responseInfo.createdAt).toLocaleString()}</span>
              </div>
            </div>

            <div className="pt-2 text-[11px] text-emerald-800 font-medium">
              Job is now being processed asynchronously by the background worker pool!
            </div>
          </div>
        )}

        {/* Error Notification */}
        {error && (
          <div className="glass-card rounded-2xl p-6 border border-rose-300 bg-rose-50/60 shadow-lg shadow-rose-500/10 flex items-start gap-3 text-xs text-rose-800">
            <AlertCircle className="w-5 h-5 text-rose-600 mt-0.5 shrink-0" />
            <div>
              <span className="font-bold text-rose-950 block text-sm">Ingestion Error</span>
              <p className="mt-1 leading-relaxed">{error}</p>
            </div>
          </div>
        )}

        {/* Info Box */}
        <div className="glass-card rounded-2xl p-6 text-xs text-slate-500 space-y-3">
          <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">
            Dispatcher Specifications
          </h4>
          <ul className="space-y-2 list-disc list-inside text-slate-600">
            <li><strong>Hard Timeout:</strong> 5000ms client-side abort</li>
            <li><strong>Max Retries:</strong> Up to 3 attempts with exponential backoff</li>
            <li><strong>Backoff Intervals:</strong> 2s, 4s, 8s with jitter</li>
            <li><strong>Domain Rate Limit:</strong> Max 5 requests / second per host</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
