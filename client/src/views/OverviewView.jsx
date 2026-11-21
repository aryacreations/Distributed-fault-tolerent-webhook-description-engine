import React from 'react';
import { 
  Send, 
  CheckCircle2, 
  RotateCw, 
  AlertTriangle, 
  Clock, 
  Layers, 
  ArrowRight, 
  Zap, 
  ShieldCheck, 
  Activity 
} from 'lucide-react';

export default function OverviewView({ stats, jobs, onNavigate, onSelectJob }) {
  const metrics = stats?.metrics || {
    totalJobs: 0,
    byStatus: { queued: 0, processing: 0, retrying: 0, success: 0, failed: 0 },
    totalAttempts: 0,
    avgLatencyMs: 0,
    queue: { waiting: 0, active: 0, delayed: 0 },
  };

  const successRate = metrics.totalJobs > 0
    ? Math.round((metrics.byStatus.success / metrics.totalJobs) * 100)
    : 100;

  const cards = [
    {
      title: 'Total Ingested',
      value: metrics.totalJobs,
      sub: `${metrics.totalAttempts} HTTP dispatch calls`,
      icon: Send,
      color: 'text-blue-600 bg-blue-50 border-blue-200/60',
      badge: '<30ms Ingestion',
    },
    {
      title: 'Delivered (2xx)',
      value: metrics.byStatus.success,
      sub: `${successRate}% overall success rate`,
      icon: CheckCircle2,
      color: 'text-emerald-600 bg-emerald-50 border-emerald-200/60',
      badge: 'Delivered',
    },
    {
      title: 'Retrying (In Backoff)',
      value: metrics.byStatus.retrying,
      sub: `${metrics.queue?.delayed || 0} jobs in Redis delay set`,
      icon: RotateCw,
      color: 'text-amber-600 bg-amber-50 border-amber-200/60',
      badge: '2s, 4s, 8s',
    },
    {
      title: 'Dead-Letter (DLQ)',
      value: metrics.byStatus.failed,
      sub: 'Exhausted 3 retries or 4xx error',
      icon: AlertTriangle,
      color: 'text-rose-600 bg-rose-50 border-rose-200/60',
      badge: 'Permanent',
    },
    {
      title: 'Avg Downstream Latency',
      value: `${metrics.avgLatencyMs} ms`,
      sub: 'HTTP roundtrip execution',
      icon: Clock,
      color: 'text-purple-600 bg-purple-50 border-purple-200/60',
      badge: 'Non-Blocking',
    },
    {
      title: 'Queue Pipeline',
      value: (metrics.byStatus.queued || 0) + (metrics.byStatus.processing || 0),
      sub: `${metrics.queue?.waiting || 0} waiting • ${metrics.queue?.active || 0} active`,
      icon: Layers,
      color: 'text-cyan-600 bg-cyan-50 border-cyan-200/60',
      badge: 'Redis FIFO',
    },
  ];

  const recentJobs = jobs.slice(0, 6);

  return (
    <div className="space-y-6">
      {/* 6 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {cards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              className="glass-card rounded-2xl p-5 flex flex-col justify-between transition-all duration-300"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    {card.title}
                  </span>
                  <div className={`p-2 rounded-xl border ${card.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                  {card.value}
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-medium">
                <span className="truncate">{card.sub}</span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-600 shrink-0">
                  {card.badge}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Action Prompts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="glass-card rounded-2xl p-6 border-l-4 border-l-emerald-500 flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-2 text-emerald-700 font-bold text-sm mb-1">
              <Send className="w-4 h-4" />
              <span>Dispatch Studio</span>
            </div>
            <h3 className="text-lg font-extrabold text-slate-900">
              Submit Custom Webhook Event
            </h3>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              Queue webhooks with custom JSON payloads and destination URLs. Experience sub-30ms non-blocking HTTP 202 Accepted responses.
            </p>
          </div>
          <button
            onClick={() => onNavigate('dispatch')}
            className="mt-5 w-fit flex items-center space-x-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 transition"
          >
            <span>Open Dispatch Studio</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="glass-card rounded-2xl p-6 border-l-4 border-l-amber-500 flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-2 text-amber-700 font-bold text-sm mb-1">
              <Zap className="w-4 h-4" />
              <span>Interview Test Lab</span>
            </div>
            <h3 className="text-lg font-extrabold text-slate-900">
              Simulate Failure Modes & Retries
            </h3>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              One-click triggers for self-healing servers, exponential backoff (2s, 4s, 8s), Dead-Letter Queues (DLQ), and rate-limit throttling.
            </p>
          </div>
          <button
            onClick={() => onNavigate('simulator')}
            className="mt-5 w-fit flex items-center space-x-2 px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold shadow-md shadow-amber-600/20 transition"
          >
            <span>Open Test Lab</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Recent Deliveries Glance */}
      <div className="glass-card rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-extrabold text-slate-900">
              Recent Webhook Activity
            </h3>
            <p className="text-xs text-slate-500">
              Latest delivery stream across all target domains
            </p>
          </div>
          <button
            onClick={() => onNavigate('deliveries')}
            className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center space-x-1"
          >
            <span>View All Logs ({metrics.totalJobs})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200/80 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Job ID</th>
                <th className="py-2.5 px-3">Event ID</th>
                <th className="py-2.5 px-3">Domain</th>
                <th className="py-2.5 px-3">Attempts</th>
                <th className="py-2.5 px-3">Last Code</th>
                <th className="py-2.5 px-3 text-right">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {recentJobs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400 font-sans">
                    No webhooks dispatched yet. Click "Open Dispatch Studio" above to send your first event!
                  </td>
                </tr>
              ) : (
                recentJobs.map((job) => (
                  <tr
                    key={job.jobId}
                    onClick={() => onSelectJob(job.jobId)}
                    className="hover:bg-slate-50/80 cursor-pointer transition group"
                  >
                    <td className="py-3 px-3">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          job.status === 'SUCCESS'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : job.status === 'RETRYING'
                            ? 'bg-amber-50 text-amber-700 border-amber-200 animate-pulse'
                            : job.status === 'FAILED'
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : 'bg-slate-100 text-slate-600 border-slate-200'
                        }`}
                      >
                        {job.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-semibold text-slate-800 group-hover:text-emerald-600 transition">
                      {job.jobId}
                    </td>
                    <td className="py-3 px-3 text-slate-500 max-w-[130px] truncate">
                      {job.eventId}
                    </td>
                    <td className="py-3 px-3 text-slate-600">
                      <span className="bg-slate-100 px-2 py-0.5 rounded-md text-[10px] font-bold text-slate-700">
                        {job.domain}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-700 font-semibold">
                      {job.currentAttempt} / {job.maxRetries}
                    </td>
                    <td className="py-3 px-3">
                      {job.lastStatusCode ? (
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            job.lastStatusCode >= 200 && job.lastStatusCode < 300
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          HTTP {job.lastStatusCode}
                        </span>
                      ) : (
                        <span className="text-slate-400">Pending</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button className="text-slate-400 group-hover:text-emerald-600 p-1">
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
