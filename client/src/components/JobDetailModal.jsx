import React, { useEffect, useState } from 'react';
import { X, CheckCircle2, AlertTriangle, Clock, ArrowDown, Copy, Check, ExternalLink } from 'lucide-react';
import { fetchJobDetails } from '../services/api';

export default function JobDetailModal({ jobId, onClose }) {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!jobId) return;

    let isMounted = true;
    const loadDetails = async () => {
      try {
        setIsLoading(true);
        const result = await fetchJobDetails(jobId);
        if (isMounted) {
          setData(result);
          setError(null);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.response?.data?.message || err.message || 'Failed to load details');
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadDetails();
    return () => {
      isMounted = false;
    };
  }, [jobId]);

  const handleCopyPayload = () => {
    if (!data?.job?.payload) return;
    navigator.clipboard.writeText(JSON.stringify(data.job.payload, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!jobId) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white font-mono tracking-tight">
                {jobId}
              </h3>
              {data?.job && (
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider font-mono border ${
                    data.job.status === 'SUCCESS'
                      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                      : data.job.status === 'RETRYING'
                      ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                      : data.job.status === 'FAILED'
                      ? 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                      : 'bg-slate-700 text-slate-300 border-slate-600'
                  }`}
                >
                  {data.job.status}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Event ID: <span className="font-mono text-slate-300">{data?.job?.eventId}</span>
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 text-xs text-slate-300">
          {isLoading ? (
            <div className="py-16 text-center text-slate-400">
              Loading execution timeline...
            </div>
          ) : error ? (
            <div className="p-4 bg-rose-950/50 border border-rose-500/30 rounded-lg text-rose-300">
              {error}
            </div>
          ) : (
            <>
              {/* Job Metadata Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-950/60 p-4 rounded-xl border border-slate-800/80 font-mono text-[11px]">
                <div>
                  <span className="text-slate-500 block">Destination Endpoint:</span>
                  <span className="text-emerald-400 break-all">{data.job.destinationUrl}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Destination Domain (Rate Limit Scope):</span>
                  <span className="text-slate-200">{data.job.domain}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Created At:</span>
                  <span className="text-slate-200">
                    {new Date(data.job.createdAt).toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Completed / Last Updated:</span>
                  <span className="text-slate-200">
                    {data.job.completedAt
                      ? new Date(data.job.completedAt).toLocaleString()
                      : new Date(data.job.updatedAt).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Delivery Attempts Timeline */}
              <div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-emerald-400" />
                  Delivery Execution Timeline ({data.attempts?.length || 0} Attempts)
                </h4>

                {data.attempts?.length === 0 ? (
                  <p className="text-slate-500 italic">No delivery attempts recorded yet. Worker is processing.</p>
                ) : (
                  <div className="space-y-3 font-mono">
                    {data.attempts.map((att, idx) => {
                      const isSuccess = att.httpStatus >= 200 && att.httpStatus < 300;
                      const nextBackoffSec = Math.pow(2, att.attemptNumber);

                      return (
                        <div key={idx}>
                          <div
                            className={`p-3.5 rounded-xl border ${
                              isSuccess
                                ? 'bg-emerald-950/20 border-emerald-500/30'
                                : 'bg-slate-950 border-slate-800'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-white text-xs">
                                  Attempt #{att.attemptNumber}
                                </span>
                                <span
                                  className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                    isSuccess
                                      ? 'bg-emerald-500/20 text-emerald-300'
                                      : 'bg-rose-500/20 text-rose-300'
                                  }`}
                                >
                                  {att.httpStatus ? `HTTP ${att.httpStatus}` : 'TIMEOUT / NETWORK ERROR'}
                                </span>
                              </div>
                              <span className="text-[11px] text-slate-400">
                                {att.durationMs} ms latency
                              </span>
                            </div>

                            {att.errorMessage && (
                              <p className="text-[11px] text-rose-300 mt-1">
                                Error: {att.errorMessage}
                              </p>
                            )}

                            {att.responseBody && (
                              <div className="mt-2 text-[10px] bg-slate-900 p-2 rounded border border-slate-800 text-slate-400 break-all max-h-24 overflow-y-auto">
                                Response: {att.responseBody}
                              </div>
                            )}

                            <div className="text-[10px] text-slate-400 mt-2 font-sans">
                              Attempted: {new Date(att.attemptedAt).toLocaleTimeString()}
                            </div>
                          </div>

                          {/* Exponential Backoff Indicator between attempts */}
                          {idx < data.attempts.length - 1 && (
                            <div className="py-1 flex items-center justify-center gap-2 text-[10px] text-amber-400 font-sans">
                              <ArrowDown className="w-3 h-3" />
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
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                    Dispatched Payload (JSON)
                  </h4>
                  <button
                    onClick={handleCopyPayload}
                    className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-white transition"
                  >
                    {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copied ? 'Copied' : 'Copy Payload'}</span>
                  </button>
                </div>
                <pre className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-[11px] font-mono text-emerald-400/90 overflow-x-auto max-h-48">
                  {JSON.stringify(data.job.payload, null, 2)}
                </pre>
              </div>
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
