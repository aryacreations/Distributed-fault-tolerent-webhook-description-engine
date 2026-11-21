import React, { useState } from 'react';
import { 
  Search, 
  RotateCw, 
  Clock, 
  ArrowRight, 
  Filter, 
  CheckCircle2, 
  AlertTriangle, 
  ExternalLink 
} from 'lucide-react';
import InteractiveHoverCard from '../components/InteractiveHoverCard';
import sounds from '../utils/soundEngine';

const STATUS_CONFIG = {
  SUCCESS: {
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    dot: 'bg-emerald-500',
    label: 'SUCCESS',
  },
  RETRYING: {
    badge: 'bg-amber-50 text-amber-700 border-amber-200 animate-pulse',
    dot: 'bg-amber-500',
    label: 'RETRYING',
  },
  FAILED: {
    badge: 'bg-rose-50 text-rose-700 border-rose-200',
    dot: 'bg-rose-500',
    label: 'FAILED (DLQ)',
  },
  PROCESSING: {
    badge: 'bg-blue-50 text-blue-700 border-blue-200',
    dot: 'bg-blue-500 animate-ping',
    label: 'PROCESSING',
  },
  QUEUED: {
    badge: 'bg-slate-100 text-slate-700 border-slate-200',
    dot: 'bg-slate-400',
    label: 'QUEUED',
  },
};

export default function LogsView({
  jobs,
  isLoading,
  currentStatus,
  onStatusChange,
  onSelectJob,
  pagination,
  onPageChange,
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const filterTabs = ['ALL', 'SUCCESS', 'RETRYING', 'FAILED', 'QUEUED'];

  const filteredJobs = jobs.filter((job) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      job.jobId.toLowerCase().includes(term) ||
      job.eventId.toLowerCase().includes(term) ||
      job.domain.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-5 max-w-7xl mx-auto" data-tour-target="delivery-table">
      {/* Control Bar: Filters & Search */}
      <div className="glass-card rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Status Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-100/80 p-1.5 rounded-xl border border-slate-200/60">
          {filterTabs.map((tab) => {
            const isActive = (currentStatus || 'ALL') === tab;
            return (
              <button
                key={tab}
                id={`filter-tab-${tab}`}
                data-testid={`filter-tab-${tab}`}
                onClick={() => {
                  sounds.playClick();
                  onStatusChange(tab === 'ALL' ? '' : tab);
                }}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  isActive
                    ? 'bg-white text-slate-900 shadow-sm border border-slate-200/80'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {tab}
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <div className="relative min-w-[240px] sm:min-w-[280px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            id="input-search-jobs"
            data-testid="input-search-jobs"
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by Job ID, Event ID, or Domain..."
            className="glass-input w-full rounded-xl pl-9 pr-3.5 py-2 text-xs font-mono text-slate-800 placeholder-slate-400"
          />
        </div>
      </div>

      {/* Main Table */}
      <div className="glass-card rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-200/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Job ID</th>
                <th className="py-3.5 px-4">Event ID</th>
                <th className="py-3.5 px-4">Destination Domain</th>
                <th className="py-3.5 px-4">Attempts</th>
                <th className="py-3.5 px-4">Last Response</th>
                <th className="py-3.5 px-4">Schedule / Timeline</th>
                <th className="py-3.5 px-4 text-right">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-slate-400 font-sans">
                    <div className="flex items-center justify-center gap-2">
                      <RotateCw className="w-4 h-4 animate-spin text-emerald-600" />
                      <span>Fetching jobs from MongoDB Atlas...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredJobs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-slate-400 font-sans">
                    No webhook jobs matched your filter. Dispatched events will stream in real-time.
                  </td>
                </tr>
              ) : (
                filteredJobs.map((job) => {
                  const statusInfo = STATUS_CONFIG[job.status] || STATUS_CONFIG.QUEUED;
                  const createdTime = new Date(job.createdAt).toLocaleTimeString();

                  return (
                    <tr
                      key={job.jobId}
                      id={`job-row-${job.jobId}`}
                      data-testid="job-row"
                      onMouseEnter={() => sounds.playHover()}
                      onClick={() => {
                        sounds.playClick();
                        onSelectJob(job.jobId);
                      }}
                      className="hover:bg-slate-50/90 cursor-pointer transition group"
                    >
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${statusInfo.badge}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${statusInfo.dot}`} />
                          {statusInfo.label}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 font-bold text-slate-900 group-hover:text-emerald-700 transition whitespace-nowrap">
                        {job.jobId}
                      </td>

                      <td className="py-3.5 px-4 text-slate-600 max-w-[150px] truncate" title={job.eventId}>
                        {job.eventId}
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="bg-slate-100 px-2 py-0.5 rounded-md text-[11px] font-bold text-slate-700 border border-slate-200/60">
                          {job.domain}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap text-slate-800">
                        <span className="font-extrabold">{job.currentAttempt}</span>
                        <span className="text-slate-400"> / {job.maxRetries}</span>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
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
                          <span className="text-slate-400 text-[11px]">Pending</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap text-slate-500 font-sans text-xs">
                        {job.status === 'RETRYING' && job.nextRetryAt ? (
                          <span className="text-amber-700 font-bold flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-amber-600" />
                            Retry in {Math.max(0, Math.round((new Date(job.nextRetryAt) - Date.now()) / 1000))}s
                          </span>
                        ) : (
                          <span>{createdTime}</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <button
                          id={`btn-inspect-${job.jobId}`}
                          data-testid="btn-inspect-job"
                          onClick={(e) => {
                            e.stopPropagation();
                            sounds.playClick();
                            onSelectJob(job.jobId);
                          }}
                          className="px-2.5 py-1 rounded-lg text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 text-xs font-semibold transition cursor-pointer"
                        >
                          View Details &rarr;
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {pagination && pagination.totalPages > 1 && (
          <div className="p-4 border-t border-slate-200/80 bg-slate-50/50 flex items-center justify-between text-xs text-slate-600">
            <div>
              Page <span className="font-bold text-slate-900">{pagination.page}</span> of{' '}
              <span className="font-bold text-slate-900">{pagination.totalPages}</span> ({pagination.total} total jobs recorded)
            </div>
            <div className="flex items-center gap-2">
              <button
                id="btn-page-prev"
                data-testid="btn-page-prev"
                disabled={pagination.page <= 1}
                onClick={() => {
                  sounds.playClick();
                  onPageChange(pagination.page - 1);
                }}
                className="px-3 py-1.5 bg-white hover:bg-slate-50 disabled:opacity-40 text-slate-700 font-semibold rounded-xl border border-slate-200 shadow-sm transition cursor-pointer"
              >
                Previous
              </button>
              <button
                id="btn-page-next"
                data-testid="btn-page-next"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => {
                  sounds.playClick();
                  onPageChange(pagination.page + 1);
                }}
                className="px-3 py-1.5 bg-white hover:bg-slate-50 disabled:opacity-40 text-slate-700 font-semibold rounded-xl border border-slate-200 shadow-sm transition cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
