import React from 'react';
import { RefreshCw, Activity, Zap, CheckCircle2 } from 'lucide-react';

const TAB_TITLES = {
  overview: {
    title: 'System Health & Metrics',
    subtitle: 'Live throughput, execution pipeline, and distributed queue status',
  },
  dispatch: {
    title: 'Webhook Dispatch Studio',
    subtitle: 'Submit event payloads with instant non-blocking 202 Accepted response',
  },
  simulator: {
    title: 'Interview Test Lab & Scenarios',
    subtitle: 'Simulate flaky targets, exponential backoff, rate limits, and timeouts',
  },
  deliveries: {
    title: 'Delivery Logs & Audit Trail',
    subtitle: 'Immutable attempt history, duration telemetry, and payload inspector',
  },
  architecture: {
    title: 'Distributed System Architecture',
    subtitle: 'End-to-end design specifications, state machines, and interview cheat sheet',
  },
};

export default function Header({ activeTab, onRefresh, isRefreshing, stats }) {
  const current = TAB_TITLES[activeTab] || TAB_TITLES.overview;
  const metrics = stats?.metrics;

  return (
    <header className="glass-panel border-b border-slate-200/80 sticky top-0 z-20 px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
          {current.title}
        </h1>
        <p className="text-xs text-slate-500 mt-0.5 font-medium">
          {current.subtitle}
        </p>
      </div>

      <div className="flex items-center space-x-3">
        {/* Metric Pill */}
        {metrics && (
          <div className="hidden md:flex items-center space-x-2 bg-emerald-50 text-emerald-800 border border-emerald-200/80 px-3 py-1.5 rounded-xl text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span>{metrics.totalJobs} Jobs Processed</span>
            <span className="text-emerald-300">|</span>
            <span>{metrics.avgLatencyMs}ms Avg Latency</span>
          </div>
        )}

        {/* Refresh Button */}
        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 shadow-sm transition active:scale-95 disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-slate-600 ${isRefreshing ? 'animate-spin text-emerald-600' : ''}`} />
          <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
        </button>
      </div>
    </header>
  );
}
