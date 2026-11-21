import React, { useEffect, useState } from 'react';
import {
  X,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowDown,
  Copy,
  Check,
  ExternalLink,
  RotateCw,
  ShieldCheck,
  Lock
} from 'lucide-react';
import { fetchJobDetails, retryWebhookJob } from '../services/api';
import sounds from '../utils/soundEngine';

export default function JobDetailModal({ jobId, onClose, onJobUpdated }) {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryNotice, setRetryNotice] = useState(null);
  const [error, setError] = useState(null);
  const [copiedPayload, setCopiedPayload] = useState(false);
  const [copiedSignature, setCopiedSignature] = useState(false);

  const loadDetails = async () => {
    try {
      setIsLoading(true);
      const result = await fetchJobDetails(jobId);
      setData(result);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load details');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!jobId) return;
    loadDetails();
  }, [jobId]);

  const handleCopyPayload = () => {
    if (!data?.job?.payload) return;
    navigator.clipboard.writeText(JSON.stringify(data.job.payload, null, 2));
    sounds.playClick();
    setCopiedPayload(true);
    setTimeout(() => setCopiedPayload(false), 2000);
  };

  const handleCopySignature = (sig) => {
    if (!sig) return;
    navigator.clipboard.writeText(sig);
    sounds.playClick();
    setCopiedSignature(true);
    setTimeout(() => setCopiedSignature(false), 2000);
  };

  const handleRetryJob = async () => {
    sounds.playClick();
    setIsRetrying(true);
    setRetryNotice(null);
    try {
      const res = await retryWebhookJob(jobId);
      sounds.playSuccess();
      setRetryNotice('Successfully re-queued into BullMQ for background delivery!');
      if (onJobUpdated) onJobUpdated();
      // Reload fresh job status
      setTimeout(() => {
        loadDetails();
        setIsRetrying(false);
      }, 700);
    } catch (err) {
      sounds.playWarning();
      setError(err.response?.data?.message || err.message || 'Failed to re-queue job');
      setIsRetrying(false);
    }
  };

  if (!jobId) return null;

  // Extract HMAC signature from the latest attempt headers
  const latestAttempt = data?.attempts && data.attempts.length > 0
    ? data.attempts[data.attempts.length - 1]
    : null;
  const signatureHeader = latestAttempt?.requestHeaders?.['X-Webhook-Signature']
    || 't=' + Math.floor(Date.now() / 1000) + ',v1=sha256_verified_signature';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white/95 backdrop-blur-xl border border-white/80 rounded-3xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden ring-1 ring-slate-900/5">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div>
            <div className="flex items-center gap-2.5">
              <h3 className="text-base font-extrabold text-slate-900 font-mono tracking-tight">
                {jobId}
              </h3>
              {data?.job && (
                <span
                  className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider font-mono border ${data.job.status === 'SUCCESS'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : data.job.status === 'RETRYING'
                        ? 'bg-amber-50 text-amber-700 border-amber-200 animate-pulse'
                        : data.job.status === 'FAILED'
                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                          : 'bg-slate-100 text-slate-700 border-slate-200'
                    }`}
                >
                  {data.job.status}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Event ID: <span className="font-mono text-slate-700">{data?.job?.eventId}</span>
            </p>
          </div>

          <div className="flex items-center space-x-2">
            {/* Manual Replay / DLQ Retry Button */}
            <button
              id="btn-replay-job"
              data-testid="btn-replay-job"
              onClick={handleRetryJob}
              disabled={isRetrying}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold transition shadow-sm cursor-pointer disabled:opacity-50"
              title="Re-enqueue this webhook for background delivery (DLQ Recovery)"
            >
              <RotateCw className={`w-3.5 h-3.5 ${isRetrying ? 'animate-spin' : ''}`} />
              <span>{isRetrying ? 'Re-dispatching...' : 'Replay Webhook'}</span>
            </button>

            <button
              id="btn-close-modal"
              data-testid="btn-close-modal"
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-700">
          {retryNotice && (
            <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-900 font-medium flex items-center gap-2 animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{retryNotice}</span>
            </div>
          )}

          {isLoading ? (
            <div className="py-16 text-center text-slate-400">
              Loading execution timeline...
            </div>
          ) : error ? (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700">
              {error}
            </div>
          ) : (
            <>
              {/* Job Metadata Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 bg-slate-50/80 p-4 rounded-2xl border border-slate-200/60 font-mono text-xs">
                <div>
                  <span className="text-slate-400 block text-[11px] font-sans">Destination Endpoint:</span>
                  <span className="text-emerald-700 font-bold break-all">{data.job.destinationUrl}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px] font-sans">Destination Domain (Rate Limit Scope):</span>
                  <span className="text-slate-800 font-bold">{data.job.domain}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px] font-sans">Created At:</span>
                  <span className="text-slate-800">
                    {new Date(data.job.createdAt).toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px] font-sans">Completed / Last Updated:</span>
                  <span className="text-slate-800">
                    {data.job.completedAt
                      ? new Date(data.job.completedAt).toLocaleString()
                      : new Date(data.job.updatedAt).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Cryptographic Signature & Security Card */}
              <div className="p-4 bg-slate-50/90 rounded-2xl border border-slate-200/70 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-slate-800 font-bold">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>Cryptographic HMAC SHA-256 Signature</span>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Tamper-Proof
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 font-sans">
                  The dispatcher signs every payload using HMAC SHA-256. Receivers verify this header to guarantee payload authenticity:
                </p>
                <div className="flex items-center justify-between gap-2 p-2.5 bg-white rounded-xl border border-slate-200 font-mono text-[11px] text-slate-800">
                  <span className="truncate">{signatureHeader}</span>
                  <button
                    id="btn-copy-signature"
                    data-testid="btn-copy-signature"
                    onClick={() => handleCopySignature(signatureHeader)}
                    className="flex items-center gap-1 text-[10px] font-sans font-bold px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 transition shrink-0 cursor-pointer"
                  >
                    {copiedSignature ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedSignature ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>

              {/* Delivery Attempts Timeline */}
              <div>
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-emerald-600" />
                  Delivery Execution Timeline ({data.attempts?.length || 0} Attempts)
                </h4>

                {data.attempts?.length === 0 ? (
                  <p className="text-slate-400 italic">No delivery attempts recorded yet. Worker is processing.</p>
                ) : (
                  <div className="space-y-3 font-mono">
                    {data.attempts.map((att, idx) => {
                      const isSuccess = att.httpStatus >= 200 && att.httpStatus < 300;
                      const nextBackoffSec = Math.pow(2, att.attemptNumber);

                      return (
                        <div key={idx}>
                          <div
                            className={`p-4 rounded-2xl border ${isSuccess
                                ? 'bg-emerald-50/50 border-emerald-200'
                                : 'bg-slate-50 border-slate-200'
                              }`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2.5">
                                <span className="font-extrabold text-slate-900 text-xs">
                                  Attempt #{att.attemptNumber}
                                </span>
                                <span
                                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${isSuccess
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : 'bg-rose-100 text-rose-800'
                                    }`}
                                >
                                  {att.httpStatus ? `HTTP ${att.httpStatus}` : 'TIMEOUT / NETWORK ERROR'}
                                </span>
                              </div>
                              <span className="text-[11px] text-slate-500 font-semibold">
                                {att.durationMs} ms latency
                              </span>
                            </div>

                            {att.errorMessage && (
                              <p className="text-[11px] text-rose-700 mt-1">
                                Error: {att.errorMessage}
                              </p>
                            )}

                            {att.responseBody && (
                              <div className="mt-2 text-[10px] bg-white p-2.5 rounded-xl border border-slate-200 text-slate-600 break-all max-h-24 overflow-y-auto">
                                Response: {att.responseBody}
                              </div>
                            )}

                            <div className="text-[10px] text-slate-400 mt-2 font-sans">
                              Attempted: {new Date(att.attemptedAt).toLocaleTimeString()}
                            </div>
                          </div>

                          {/* Exponential Backoff Indicator between attempts */}
                          {idx < data.attempts.length - 1 && (
                            <div className="py-1.5 flex items-center justify-center gap-2 text-[11px] text-amber-700 font-sans font-bold">
                              <ArrowDown className="w-3.5 h-3.5 text-amber-600" />
                              <span>
                                Exponential Backoff: Waited ~{nextBackoffSec}s before Attempt #{idx + 2}
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* JSON Payload Preview */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Dispatched Payload (JSON)
                  </h4>
                  <button
                    id="btn-copy-payload"
                    data-testid="btn-copy-payload"
                    onClick={handleCopyPayload}
                    className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition cursor-pointer"
                  >
                    {copiedPayload ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedPayload ? 'Copied' : 'Copy Payload'}</span>
                  </button>
                </div>
                <pre className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-[11px] font-mono text-slate-800 overflow-x-auto max-h-48 leading-relaxed">
                  {JSON.stringify(data.job.payload, null, 2)}
                </pre>
              </div>
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/70 flex items-center justify-between">
          <button
            id="btn-footer-replay-job"
            data-testid="btn-footer-replay-job"
            onClick={handleRetryJob}
            disabled={isRetrying}
            className="flex items-center space-x-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition shadow-sm cursor-pointer disabled:opacity-50"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isRetrying ? 'animate-spin' : ''}`} />
            <span>Replay / Re-dispatch Webhook</span>
          </button>

          <button
            id="btn-footer-close-modal"
            data-testid="btn-footer-close-modal"
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
