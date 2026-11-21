import React from 'react';
import { 
  Network, 
  Send, 
  Layers, 
  Cpu, 
  Database, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldCheck,
  Clock
} from 'lucide-react';

export default function ArchitectureView() {
  const tradeOffs = [
    {
      decision: 'Ingestion Protocol',
      choice: '202 Accepted (<30ms) + Asynchronous Worker',
      justification: 'Decouples client API latency from downstream target response times. Upstream caller never waits for external network.',
      rejected: 'Synchronous dispatch (caller waits for external server to respond).',
    },
    {
      decision: 'Message Broker',
      choice: 'Redis + BullMQ (Delayed Sorted Sets)',
      justification: 'O(log N) delayed execution for exponential backoff, at-least-once delivery, and worker crash recovery.',
      rejected: 'MongoDB Polling (polling intervals waste CPU, cause lock contention, and introduce high latency).',
    },
    {
      decision: 'State Persistence',
      choice: 'MongoDB Atlas (BSON Document Model)',
      justification: 'Polymorphic JSON payloads without schema migrations; atomic embedding of delivery attempts.',
      rejected: 'Strict Relational SQL (rigid schemas require clunky stringified JSON columns).',
    },
    {
      decision: 'Rate Limiting',
      choice: 'Per-Destination Domain Token Bucket (Redis)',
      justification: 'Throttles only the target domain (5 req/s) so one partner receiving heavy traffic does not block others.',
      rejected: 'Global rate limiting (throttles the whole system even when other domains are idle).',
    },
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto" data-tour-target="architecture-blueprint">
      {/* Header Banner */}
      <div className="glass-card rounded-2xl p-6 sm:p-7 border-l-4 border-l-emerald-500">
        <div className="flex items-center space-x-2 text-emerald-700 font-bold text-xs uppercase tracking-wider mb-1">
          <Network className="w-4 h-4" />
          <span>System Blueprint</span>
        </div>
        <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
          Distributed Webhook Dispatcher Architecture
        </h2>
        <p className="text-xs text-slate-600 mt-1 max-w-3xl leading-relaxed">
          High-throughput, resilient pipeline engineered for zero caller blocking, guaranteed at-least-once delivery, exponential backoff with jitter, and multi-tenant per-domain rate limiting.
        </p>
      </div>

      {/* 4 Architectural Layers */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Layer 1 */}
        <div className="glass-card rounded-2xl p-5 flex flex-col justify-between border-t-4 border-t-blue-500">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                Layer 1: Ingest
              </span>
              <Send className="w-4 h-4 text-blue-600" />
            </div>
            <h3 className="text-sm font-extrabold text-slate-900">
              Ingestion API (Express)
            </h3>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              Validates schema via Zod, verifies idempotency key (<span className="font-mono text-slate-800">eventId</span>), records initial status, and enqueues to Redis.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] font-bold text-blue-700">
            Returns 202 Accepted in &lt;30ms
          </div>
        </div>

        {/* Layer 2 */}
        <div className="glass-card rounded-2xl p-5 flex flex-col justify-between border-t-4 border-t-rose-500">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                Layer 2: Queue
              </span>
              <Layers className="w-4 h-4 text-rose-600" />
            </div>
            <h3 className="text-sm font-extrabold text-slate-900">
              Broker & Delayed Sets
            </h3>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              BullMQ over Upstash Redis. Uses Redis Sorted Sets (<span className="font-mono text-slate-800">ZSET</span>) with microsecond score lookups for backoff scheduling.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] font-bold text-rose-700">
            At-Least-Once Delivery Guarantee
          </div>
        </div>

        {/* Layer 3 */}
        <div className="glass-card rounded-2xl p-5 flex flex-col justify-between border-t-4 border-t-amber-500">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                Layer 3: Dispatch
              </span>
              <Cpu className="w-4 h-4 text-amber-600" />
            </div>
            <h3 className="text-sm font-extrabold text-slate-900">
              Worker & Rate Limiter
            </h3>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              Acquires domain token (Token Bucket: 5 req/s), executes HTTP POST with 5000ms hard timeout, and classifies transient vs permanent errors.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] font-bold text-amber-700">
            Per-Destination Protection
          </div>
        </div>

        {/* Layer 4 */}
        <div className="glass-card rounded-2xl p-5 flex flex-col justify-between border-t-4 border-t-emerald-500">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                Layer 4: Audit
              </span>
              <Database className="w-4 h-4 text-emerald-600" />
            </div>
            <h3 className="text-sm font-extrabold text-slate-900">
              MongoDB Atlas Audit
            </h3>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              Every attempt is appended to <span className="font-mono text-slate-800">delivery_attempts</span> with latency, response body preview, and HTTP code.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] font-bold text-emerald-700">
            Complete Delivery Telemetry
          </div>
        </div>
      </div>

      {/* Failure Matrix & Exponential Backoff */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Failure Classification */}
        <div className="glass-card rounded-2xl p-6 space-y-4">
          <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
            Failure Classification Matrix
          </h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            The dispatcher differentiates permanent client misconfigurations from transient network issues to avoid wasteful retries.
          </p>

          <div className="space-y-3 font-mono text-xs">
            <div className="p-3 bg-rose-50/70 border border-rose-200/80 rounded-xl space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-rose-800">Permanent Errors (No Retry)</span>
                <span className="text-[10px] bg-rose-200/80 text-rose-900 px-1.5 py-0.5 rounded">Fail Fast</span>
              </div>
              <p className="text-[11px] text-rose-700 font-sans">
                HTTP 400, 401, 403, 404, 422. The target rejected the payload or path. Retrying will never succeed and wastes system resources.
              </p>
            </div>

            <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-amber-800">Transient Errors (Retry with Backoff)</span>
                <span className="text-[10px] bg-amber-200/80 text-amber-900 px-1.5 py-0.5 rounded">Exponential</span>
              </div>
              <p className="text-[11px] text-amber-700 font-sans">
                HTTP 500, 502, 503, 504, 429 Rate-Limited, or Network Timeouts. The server is temporarily overloaded; backing off allows time to recover.
              </p>
            </div>
          </div>
        </div>

        {/* Exponential Backoff Formula */}
        <div className="glass-card rounded-2xl p-6 space-y-4">
          <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
            <Clock className="w-5 h-5 text-emerald-600" />
            Exponential Backoff Strategy
          </h3>
          <p className="text-xs text-slate-600 leading-relaxed font-sans">
            Formula: <span className="font-mono font-bold text-slate-900">Delay = BaseDelay &times; 2<sup>(attempt - 1)</sup></span>
          </p>

          <div className="space-y-2.5 font-mono text-xs">
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200/60">
              <span className="font-bold text-slate-800">Attempt 1 (Initial Dispatch)</span>
              <span className="text-emerald-700 font-bold font-sans text-xs">Immediate (0s delay)</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200/60">
              <span className="font-bold text-slate-800">Attempt 2 (First Retry)</span>
              <span className="text-amber-700 font-bold font-sans text-xs">2 Seconds delay</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200/60">
              <span className="font-bold text-slate-800">Attempt 3 (Second Retry)</span>
              <span className="text-amber-700 font-bold font-sans text-xs">4 Seconds delay</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-rose-50 rounded-xl border border-rose-200/70">
              <span className="font-bold text-rose-800">Exhausted (Dead-Letter Queue)</span>
              <span className="text-rose-700 font-bold font-sans text-xs">Marked as FAILED (DLQ)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Architectural Decisions & Trade-offs Table */}
      <div className="glass-card rounded-2xl p-6">
        <h3 className="text-base font-extrabold text-slate-900 mb-1">
          Architectural Decisions & Trade-offs
        </h3>
        <p className="text-xs text-slate-500 mb-4">
          Key system design decisions made during the planning phase
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                <th className="py-3 px-3">Decision</th>
                <th className="py-3 px-3">Chosen Architecture</th>
                <th className="py-3 px-3">Why This Approach?</th>
                <th className="py-3 px-3">Alternative Rejected</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {tradeOffs.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-50/80 transition">
                  <td className="py-3.5 px-3 font-bold text-slate-900 whitespace-nowrap">
                    {row.decision}
                  </td>
                  <td className="py-3.5 px-3 font-semibold text-emerald-800">
                    {row.choice}
                  </td>
                  <td className="py-3.5 px-3 leading-relaxed">
                    {row.justification}
                  </td>
                  <td className="py-3.5 px-3 text-slate-400 italic">
                    {row.rejected}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
