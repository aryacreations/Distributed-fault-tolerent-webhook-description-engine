import React, { useState } from 'react';
import { 
  Search, 
  RotateCw, 
  Clock, 
  ArrowRight, 
  Filter, 
  CheckCircle2, 
  AlertTriangle, 
  ExternalLink,
  Download,
  FileText,
  RotateCcw
} from 'lucide-react';
import InteractiveHoverCard from '../components/InteractiveHoverCard';
import sounds from '../utils/soundEngine';
import { retryWebhookJob } from '../services/api';

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
  onRefresh,
  pagination,
  onPageChange,
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [replayingJobId, setReplayingJobId] = useState(null);
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

  const handleExportCSV = () => {
    sounds.playClick();
    if (filteredJobs.length === 0) return;

    const headers = ['Job ID', 'Event ID', 'Domain', 'Destination URL', 'Status', 'Current Attempt', 'Max Retries', 'Last HTTP Code', 'Last Error', 'Created At'];
    const rows = filteredJobs.map((j) => [
      `"${j.jobId}"`,
      `"${j.eventId}"`,
      `"${j.domain}"`,
      `"${j.destinationUrl}"`,
      `"${j.status}"`,
      j.currentAttempt,
      j.maxRetries,
      j.lastStatusCode || '',
      `"${(j.lastError || '').replace(/"/g, '""')}"`,
      `"${new Date(j.createdAt).toISOString()}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `webhook_audit_export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    sounds.playSuccess();
  };

  const handleExportJSON = () => {
    sounds.playClick();
    if (filteredJobs.length === 0) return;

    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(filteredJobs, null, 2))}`;
    const link = document.createElement('a');
    link.setAttribute('href', jsonString);
    link.setAttribute('download', `webhook_audit_export_${Date.now()}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    sounds.playSuccess();
  };

  const handleQuickReplay = async (e, jobId) => {
    e.stopPropagation();
    sounds.playClick();
    setReplayingJobId(jobId);
    try {
      await retryWebhookJob(jobId);
      sounds.playSuccess();
      if (onRefresh) onRefresh();
    } catch (err) {
      sounds.playWarning();
      alert('Could not replay job: ' + (err.response?.data?.message || err.message));
    } finally {
      setTimeout(() => setReplayingJobId(null), 800);
    }
  };

  return (
    <div className="space-y-5 max-w-7xl mx-auto" data-tour-target="delivery-table">
      {/* Control Bar: Filters, Search & Compliance Export */}
      <div className="glass-card rounded-2xl p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
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

        {/* Right Action Cluster: Search & Export */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
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

          {/* Export CSV Button */}
          <button
            id="btn-export-csv"
            data-testid="btn-export-csv"
            onClick={handleExportCSV}
            title="Download audit logs as CSV spreadsheet"
            className="flex items-center justify-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200/90 shadow-sm transition active:scale-95 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-emerald-600" />
            <span>Export CSV</span>
          </button>

          {/* Export JSON Button */}
          <button
            id="btn-export-json"
            data-testid="btn-export-json"
            onClick={handleExportJSON}
            title="Download full audit payloads as JSON"
            className="flex items-center justify-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200/90 shadow-sm transition active:scale-95 cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5 text-blue-600" />
            <span>Export JSON</span>
          </button>
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
                <th className="py-3.5 px-4 text-right">Actions</th>
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
                  const isFailed = job.status === 'FAILED';
                  const isCurrentlyReplaying = replayingJobId === job.jobId;

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
                      className="glass-table-row cursor-pointer transition group"
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
                        {(!job.domain || job.domain === 'localhost' || job.domain === '127.0.0.1' || job.domain.includes('onrender.com')) ? (
                          <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200/80 px-2 py-0.5 rounded-md text-[10px] font-bold" title="Engine Internal Mock Receiver">
                            mock-receiver.internal
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 border border-blue-200/80 px-2 py-0.5 rounded-md text-[10px] font-bold">
                            {job.domain}
                          </span>
                        )}
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
                        <div className="flex items-center justify-end space-x-1.5">
                          {/* Quick DLQ Replay Button */}
                          {isFailed && (
                            <button
                              id={`btn-replay-${job.jobId}`}
                              data-testid="btn-quick-replay"
                              onClick={(e) => handleQuickReplay(e, job.jobId)}
                              disabled={isCurrentlyReplaying}
                              className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-lg text-[11px] font-bold transition flex items-center gap-1 cursor-pointer disabled:opacity-50"
                              title="Replay / Re-queue this dead-letter job"
                            >
                              <RotateCcw className={`w-3 h-3 ${isCurrentlyReplaying ? 'animate-spin' : ''}`} />
                              <span>{isCurrentlyReplaying ? 'Re-queueing...' : 'Replay'}</span>
                            </button>
                          )}

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
                        </div>
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
