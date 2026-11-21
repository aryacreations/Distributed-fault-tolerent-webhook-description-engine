import React, { useState, useEffect, useCallback } from 'react';
import Navbar from './components/Navbar';
import StatsOverview from './components/StatsOverview';
import DispatchForm from './components/DispatchForm';
import MockSimulator from './components/MockSimulator';
import JobsTable from './components/JobsTable';
import JobDetailModal from './components/JobDetailModal';
import { fetchJobs, fetchStats } from './services/api';

export default function App() {
  const [jobs, setJobs] = useState([]);
  const [stats, setStats] = useState(null);
  const [isLoadingJobs, setIsLoadingJobs] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState(null);
  const [currentStatus, setCurrentStatus] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, totalPages: 1 });

  const loadData = useCallback(async (showRefreshIndicator = false) => {
    if (showRefreshIndicator) setIsRefreshing(true);
    try {
      const [jobsRes, statsRes] = await Promise.all([
        fetchJobs({
          status: currentStatus,
          page: pagination.page,
          limit: pagination.limit,
        }),
        fetchStats(),
      ]);

      if (jobsRes.success) {
        setJobs(jobsRes.jobs);
        setPagination(jobsRes.pagination);
      }
      if (statsRes.success) {
        setStats(statsRes);
      }
    } catch (err) {
      console.error('[Dashboard Polling Error]', err);
    } finally {
      setIsLoadingJobs(false);
      if (showRefreshIndicator) setIsRefreshing(false);
    }
  }, [currentStatus, pagination.page, pagination.limit]);

  // Initial load and filter change
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Background polling every 3 seconds to reflect real-time queue transitions
  useEffect(() => {
    const timer = setInterval(() => {
      loadData(false);
    }, 3000);
    return () => clearInterval(timer);
  }, [loadData]);

  const handleStatusChange = (status) => {
    setCurrentStatus(status);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (newPage) => {
    setPagination((prev) => ({ ...prev, page: newPage }));
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Navbar onRefresh={() => loadData(true)} isRefreshing={isRefreshing} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Metric Overview Cards */}
        <StatsOverview stats={stats} />

        {/* Action Grid: Dispatch Form & Mock Test Suite */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5">
            <DispatchForm onJobCreated={() => loadData(false)} />
          </div>
          <div className="lg:col-span-7">
            <MockSimulator onTriggeredTest={() => loadData(false)} />
          </div>
        </div>

        {/* Live Jobs Table */}
        <JobsTable
          jobs={jobs}
          isLoading={isLoadingJobs}
          currentStatus={currentStatus}
          onStatusChange={handleStatusChange}
          onSelectJob={(jobId) => setSelectedJobId(jobId)}
          pagination={pagination}
          onPageChange={handlePageChange}
        />
      </main>

      {/* Inspect Modal */}
      {selectedJobId && (
        <JobDetailModal
          jobId={selectedJobId}
          onClose={() => setSelectedJobId(null)}
        />
      )}

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-4 text-center text-xs text-slate-500">
        Distributed Webhook Dispatcher Engine • Built with Node.js, Express, MongoDB Atlas, Redis BullMQ, & React
      </footer>
    </div>
  );
}
