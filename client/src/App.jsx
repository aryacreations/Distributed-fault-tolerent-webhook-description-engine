import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import OverviewView from './views/OverviewView';
import DispatchView from './views/DispatchView';
import SimulatorView from './views/SimulatorView';
import LogsView from './views/LogsView';
import ArchitectureView from './views/ArchitectureView';
import JobDetailModal from './components/JobDetailModal';
import { fetchJobs, fetchStats } from './services/api';

export default function App() {
  const [activeTab, setActiveTab] = useState('overview');
  const [jobs, setJobs] = useState([]);
  const [stats, setStats] = useState(null);
  const [isLoadingJobs, setIsLoadingJobs] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState(null);
  const [currentStatus, setCurrentStatus] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });

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

  // Initial load & filter change
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Background polling every 3 seconds
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
    <div className="min-h-screen flex bg-slate-50 text-slate-800 font-sans selection:bg-emerald-500 selection:text-white">
      {/* 1. Left Sleek Sidebar */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* 2. Main Fluid Work Area */}
      <div className="flex-1 min-w-0 flex flex-col min-h-screen overflow-x-hidden">
        {/* Top Header */}
        <Header
          activeTab={activeTab}
          onRefresh={() => loadData(true)}
          isRefreshing={isRefreshing}
          stats={stats}
        />

        {/* Dynamic Section Dashboard View */}
        <main className="flex-1 p-5 sm:p-7 lg:p-8 space-y-6">
          {activeTab === 'overview' && (
            <OverviewView
              stats={stats}
              jobs={jobs}
              onNavigate={(tab) => setActiveTab(tab)}
              onSelectJob={(id) => setSelectedJobId(id)}
            />
          )}

          {activeTab === 'dispatch' && (
            <DispatchView
              onJobCreated={() => {
                loadData(false);
              }}
            />
          )}

          {activeTab === 'simulator' && (
            <SimulatorView
              onTriggeredTest={() => loadData(false)}
              onNavigate={(tab) => setActiveTab(tab)}
            />
          )}

          {activeTab === 'deliveries' && (
            <LogsView
              jobs={jobs}
              isLoading={isLoadingJobs}
              currentStatus={currentStatus}
              onStatusChange={handleStatusChange}
              onSelectJob={(id) => setSelectedJobId(id)}
              pagination={pagination}
              onPageChange={handlePageChange}
            />
          )}

          {activeTab === 'architecture' && <ArchitectureView />}
        </main>
      </div>

      {/* 3. Job Detail Modal */}
      {selectedJobId && (
        <JobDetailModal
          jobId={selectedJobId}
          onClose={() => setSelectedJobId(null)}
        />
      )}
    </div>
  );
}
