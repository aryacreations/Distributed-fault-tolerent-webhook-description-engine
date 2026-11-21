import React, { useState } from 'react';
import { Send, Zap, Check, AlertCircle } from 'lucide-react';
import { dispatchWebhook } from '../services/api';

const SAMPLE_PAYLOADS = {
  signup: {
    event: 'user.signup',
    userId: 'usr_' + Math.floor(1000 + Math.random() * 9000),
    email: 'alex.morgan@company.io',
    plan: 'enterprise',
    registeredAt: new Date().toISOString(),
  },
  payment: {
    event: 'payment.succeeded',
    invoiceId: 'inv_' + Math.floor(100000 + Math.random() * 900000),
    amount: 14999,
    currency: 'USD',
    customer: 'Stripe, Inc.',
  },
  order: {
    event: 'order.shipped',
    orderId: 'ord_987654',
    trackingNumber: 'TRK-9921-US',
    carrier: 'FedEx Express',
  },
};

export default function DispatchForm({ onJobCreated }) {
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setResponseInfo(null);

    let parsedPayload;
    try {
      parsedPayload = JSON.parse(payloadText);
    } catch {
      setError('Payload must be valid JSON syntax');
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
      });

      // Generate a fresh eventId for the next submission
      setEventId('evt_' + Date.now());
      if (onJobCreated) onJobCreated();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Dispatch request failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base font-semibold text-white flex items-center gap-2">
            <Send className="w-4 h-4 text-emerald-400" />
            Dispatch Webhook
          </h2>
          <p className="text-xs text-slate-400">
            Submit an event payload. The engine responds with <span className="text-emerald-400 font-mono">202 Accepted</span> in &lt;30ms.
          </p>
        </div>

        {/* Template Buttons */}
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] text-slate-400 mr-1 hidden sm:inline">Templates:</span>
          {['signup', 'payment', 'order'].map((tpl) => (
            <button
              key={tpl}
              type="button"
              onClick={() => handleApplyTemplate(tpl)}
              className="text-[11px] font-medium px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 transition"
            >
              {tpl}
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">
            Destination URL
          </label>
          <input
            type="url"
            required
            value={destinationUrl}
            onChange={(e) => setDestinationUrl(e.target.value)}
            placeholder="https://client-server.com/webhook"
            className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-lg px-3 py-2 text-xs font-mono text-slate-200 placeholder-slate-600 transition"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-xs font-medium text-slate-300">
              Event ID (Idempotency Key)
            </label>
            <button
              type="button"
              onClick={() => setEventId('evt_' + Date.now())}
              className="text-[11px] text-emerald-400 hover:underline"
            >
              Regenerate
            </button>
          </div>
          <input
            type="text"
            required
            value={eventId}
            onChange={(e) => setEventId(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-lg px-3 py-2 text-xs font-mono text-slate-200 transition"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">
            JSON Payload
          </label>
          <textarea
            rows={5}
            required
            value={payloadText}
            onChange={(e) => setPayloadText(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-lg px-3 py-2 text-xs font-mono text-slate-200 transition"
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-medium py-2.5 px-4 rounded-lg text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 disabled:opacity-50 transition"
        >
          {isLoading ? (
            <span>Ingesting...</span>
          ) : (
            <>
              <Zap className="w-4 h-4 fill-white" />
              <span>Queue Webhook (Instant 202 Ingestion)</span>
            </>
          )}
        </button>
      </form>

      {/* Success Notification */}
      {responseInfo && (
        <div className="mt-4 p-3 bg-emerald-950/40 border border-emerald-500/30 rounded-lg flex items-start gap-2.5 text-xs text-emerald-300">
          <Check className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
          <div className="w-full">
            <div className="flex items-center justify-between font-semibold text-emerald-200">
              <span>202 Accepted ({responseInfo.durationMs}ms roundtrip)</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 font-mono">
                {responseInfo.status.toUpperCase()}
              </span>
            </div>
            <p className="mt-0.5 text-emerald-400/90 font-mono text-[11px] truncate">
              Job ID: {responseInfo.jobId}
            </p>
          </div>
        </div>
      )}

      {/* Error Notification */}
      {error && (
        <div className="mt-4 p-3 bg-rose-950/40 border border-rose-500/30 rounded-lg flex items-start gap-2.5 text-xs text-rose-300">
          <AlertCircle className="w-4 h-4 text-rose-400 mt-0.5 shrink-0" />
          <div>
            <span className="font-semibold text-rose-200">Error</span>
            <p className="mt-0.5">{error}</p>
          </div>
        </div>
      )}
    </div>
  );
}
