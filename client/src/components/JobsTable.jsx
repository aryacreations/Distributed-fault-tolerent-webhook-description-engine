import React from 'react';
import { ExternalLink, Clock, RotateCw, CheckCircle, AlertOctagon, ArrowRight } from 'lucide-react';

const STATUS_CONFIG = {
  SUCCESS: {
    badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    dot: 'bg-emerald-400',
    label: 'SUCCESS',
  },
  RETRYING: {
    badge: 'bg-amber-500/10 text-amber-400 border-amber-500/30 animate-pulse',
    dot: 'bg-amber-400',
    label: 'RETRYING',
  },
  FAILED: {
    badge: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
    dot: 'bg-rose-400',
    label: 'FAILED (DLQ)',
  },
  PROCESSING: {
    badge: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
    dot: 'bg-blue-400 animate-ping',
    label: 'PROCESSING',
  },
  QUEUED: {
    badge: 'bg-slate-500/10 text-slate-400 border-slate-500/30',
    dot: 'bg-slate-400',
    label: 'QUEUED',
  },
};

export default function JobsTable({
  jobs,
  isLoading,
  currentStatus,
  onStatusChange,
  onSelectJob,
  pagination,
  onPageChange,
}) {
  const filterTabs = ['ALL', 'SUCCESS', 'RETRYING', 'FAILED', 'QUEUED'];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-sm overflow-hidden">
      {/* Table Header & Filter Tabs */}
      <div className="p-4 sm:p-5 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-white">Dispatched Webhook Jobs</h2>
          <p className="text-xs text-slate-400">
            Real-time audit log of all queued, executing, retrying, and completed deliveries.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
          {filterTabs.map((tab) => {
            const isActive = (currentStatus || 'ALL') === tab;
            return (
              <button
                key={tab}
                onClick={() => onStatusChange(tab === 'ALL' ? '' : tab)}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition ${
                  isActive
                    ? 'bg-slate-800 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {tab}
              </button>
            );
          })}
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-950/70 border-b border-slate-800 text-slate-400 uppercase font-mono tracking-wider text-[11px]">
            <tr>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">Job ID</th>
              <th className="py-3 px-4">Event ID</th>
              <th className="py-3 px-4">Destination Domain</th>
              <th className="py-3 px-4">Attempts</th>
              <th className="py-3 px-4">Last Response</th>
              <th className="py-3 px-4">Timeline</th>
              <th className="py-3 px-4 text-right">Inspect</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-mono">
            {isLoading ? (
              <tr>
                <td colSpan={8} className="py-10 text-center text-slate-400 font-sans">
                  <div className="flex items-center justify-center gap-2">
                    <RotateCw className="w-4 h-4 animate-spin text-emerald-400" />
                    <span>Loading jobs from MongoDB...</span>
                  </div>
                </td>
              </tr>
            ) : jobs.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-10 text-center text-slate-400 font-sans">
                  No webhook jobs found for this filter. Use the form above to dispatch an event!
                </td>
              </tr>
            ) : (
              jobs.map((job) => {
                const statusInfo = STATUS_CONFIG[job.status] || STATUS_CONFIG.QUEUED;
                const createdTime = new Date(job.createdAt).toLocaleTimeString();

                return (
                  <tr
                    key={job.jobId}
                    onClick={() => onSelectJob(job.jobId)}
                    className="hover:bg-slate-800/40 cursor-pointer transition group"
                  >
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${statusInfo.badge}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${statusInfo.dot}`} />
                        {statusInfo.label}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-200 font-semibold group-hover:text-emerald-400 transition whitespace-nowrap">
                      {job.jobId}
                    </td>
                    <td className="py-3 px-4 text-slate-400 max-w-[140px] truncate" title={job.eventId}>
                      {job.eventId}
                    </td>
                    <td className="py-3 px-4 text-slate-300 whitespace-nowrap">
                      <span className="bg-slate-800 px-1.5 py-0.5 rounded text-[11px] text-slate-300 border border-slate-700">
                        {job.domain}
                      </span>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap text-slate-300">
                      <span className="font-bold">{job.currentAttempt}</span>
                      <span className="text-slate-500"> / {job.maxRetries} retries</span>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      {job.lastStatusCode ? (
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            job.lastStatusCode >= 200 && job.lastStatusCode < 300
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : 'bg-rose-500/20 text-rose-300'
                          }`}
                        >
                          HTTP {job.lastStatusCode}
                        </span>
                      ) : (
                        <span className="text-slate-500 text-[11px]">Pending</span>
                      )}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap text-slate-400 text-[11px] font-sans">
                      {job.status === 'RETRYING' && job.nextRetryAt ? (
                        <span className="text-amber-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Retry in {Math.max(0, Math.round((new Date(job.nextRetryAt) - Date.now()) / 1000))}s
                        </span>
                      ) : (
                        <span>{createdTime}</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectJob(job.jobId);
                        }}
                        className="text-slate-400 hover:text-emerald-400 p-1 rounded hover:bg-slate-800 transition"
                      >
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {pagination && pagination.totalPages > 1 && (
        <div className="p-3 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between text-xs text-slate-400">
          <div>
            Showing Page <span className="font-semibold text-slate-200">{pagination.page}</span> of{' '}
            <span className="font-semibold text-slate-200">{pagination.totalPages}</span> ({pagination.total} total jobs)
          </div>
          <div className="flex items-center gap-2">
            <button
              disabled={pagination.page <= 1}
              onClick={() => onPageChange(pagination.page - 1)}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 rounded border border-slate-700 transition"
            >
              Previous
            </button>
            <button
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => onPageChange(pagination.page + 1)}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 rounded border border-slate-700 transition"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
