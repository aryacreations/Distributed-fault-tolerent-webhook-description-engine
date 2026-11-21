import React from 'react';
import { Send, CheckCircle2, RotateCw, AlertTriangle, Clock, Layers } from 'lucide-react';

export default function StatsOverview({ stats }) {
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
      sub: `${metrics.totalAttempts} HTTP attempts executed`,
      icon: Send,
      color: 'from-blue-500 to-indigo-600',
      textColor: 'text-blue-400',
    },
    {
      title: 'Delivered (2xx)',
      value: metrics.byStatus.success,
      sub: `${successRate}% overall success rate`,
      icon: CheckCircle2,
      color: 'from-emerald-500 to-teal-600',
      textColor: 'text-emerald-400',
    },
    {
      title: 'Retrying (Backoff)',
      value: metrics.byStatus.retrying,
      sub: `${metrics.queue?.delayed || 0} jobs waiting in Redis delayed set`,
      icon: RotateCw,
      color: 'from-amber-500 to-orange-600',
      textColor: 'text-amber-400',
    },
    {
      title: 'Dead-Letter (Failed)',
      value: metrics.byStatus.failed,
      sub: 'Exhausted 3 retries or 4xx permanent',
      icon: AlertTriangle,
      color: 'from-rose-500 to-red-600',
      textColor: 'text-rose-400',
    },
    {
      title: 'Avg Latency',
      value: `${metrics.avgLatencyMs} ms`,
      sub: 'Downstream HTTP roundtrip',
      icon: Clock,
      color: 'from-purple-500 to-pink-600',
      textColor: 'text-purple-400',
    },
    {
      title: 'Queue Pipeline',
      value: (metrics.byStatus.queued || 0) + (metrics.byStatus.processing || 0),
      sub: `${metrics.queue?.waiting || 0} waiting • ${metrics.queue?.active || 0} active`,
      icon: Layers,
      color: 'from-cyan-500 to-blue-600',
      textColor: 'text-cyan-400',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div
            key={idx}
            className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 sm:p-4 shadow-sm hover:border-slate-700 transition"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-slate-400">{card.title}</span>
              <div className={`p-1.5 rounded-lg bg-slate-800 ${card.textColor}`}>
                <Icon className="w-4 h-4" />
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              {card.value}
            </div>
            <div className="text-[11px] text-slate-400 mt-1 truncate">
              {card.sub}
            </div>
          </div>
        );
      })}
    </div>
  );
}
