import React from 'react';
import { 
  LayoutDashboard, 
  Send, 
  Zap, 
  History, 
  Network, 
  Github, 
  ShieldCheck, 
  Database, 
  Radio, 
  Play,
  Compass
} from 'lucide-react';
import sounds from '../utils/soundEngine';
import InteractiveHoverCard from './InteractiveHoverCard';

export default function Sidebar({ activeTab, setActiveTab, onOpenExplainer, onStartTour }) {
  const menuItems = [
    {
      id: 'overview',
      label: 'System Overview',
      desc: 'Real-time metrics & health',
      icon: LayoutDashboard,
      badge: null,
      tip: 'High-level dashboard overview showing throughput, active pipeline, and overall delivery rate.',
    },
    {
      id: 'dispatch',
      label: 'Dispatch Studio',
      desc: 'Ingest & test webhooks',
      icon: Send,
      badge: '202 Fast',
      tip: 'The core non-blocking ingestion entry point returning HTTP 202 in under 30 milliseconds.',
    },
    {
      id: 'simulator',
      label: 'Test Lab & Scenarios',
      desc: 'Backoff, DLQ & timeouts',
      icon: Zap,
      badge: 'Interactive',
      tip: '6 one-click edge-case simulations specifically built for live interview demos.',
    },
    {
      id: 'deliveries',
      label: 'Delivery Logs & Audit',
      desc: 'History & attempt timeline',
      icon: History,
      badge: null,
      tip: 'MongoDB-backed immutable audit trail with step-by-step latency and status inspect modal.',
    },
    {
      id: 'architecture',
      label: 'System Architecture',
      desc: 'Specs, diagrams & trade-offs',
      icon: Network,
      badge: 'Docs',
      tip: 'Full system blueprint, failure matrix, and architectural decisions defense table.',
    },
  ];

  return (
    <aside className="w-64 sm:w-72 glass-panel border-r border-slate-200/80 flex flex-col justify-between p-4 sm:p-5 shrink-0 z-30 min-h-screen">
      {/* Brand Header */}
      <div>
        <div className="flex items-center space-x-3 pb-6 border-b border-slate-200/70">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/20 text-white font-black text-lg">
            ⚡
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-sm font-bold text-slate-900 tracking-tight">Dispatcher Engine</h1>
            </div>
            <div className="flex items-center space-x-1.5 mt-0.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[11px] font-semibold text-emerald-700">Distributed & Active</span>
            </div>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="mt-6 space-y-1.5">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 mb-2">
            Navigation
          </p>
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <InteractiveHoverCard
                key={item.id}
                title={item.label}
                category="Navigation"
                description={item.desc}
                interviewTip={item.tip}
                position="right"
                className="w-full"
              >
                <button
                  onClick={() => {
                    sounds.playWhoosh();
                    setActiveTab(item.id);
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-left transition-all duration-200 ${
                    isActive
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/25 font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 font-medium'
                  }`}
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                    <div className="truncate">
                      <p className="text-xs truncate">{item.label}</p>
                      <p className={`text-[10px] truncate ${isActive ? 'text-emerald-100' : 'text-slate-400'}`}>
                        {item.desc}
                      </p>
                    </div>
                  </div>
                  {item.badge && (
                    <span
                      className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider shrink-0 ${
                        isActive
                          ? 'bg-emerald-700/60 text-emerald-100'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              </InteractiveHoverCard>
            );
          })}
        </nav>
      </div>

      {/* Footer Info & Interactive Tours */}
      <div className="space-y-3.5 pt-4 border-t border-slate-200/70">
        {/* Interactive Guided Tour Card */}
        <button
          onClick={() => {
            sounds.playClick();
            onStartTour();
          }}
          className="w-full p-3 bg-white hover:bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 text-left shadow-sm transition active:scale-95 group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">
              Interactive Guide
            </span>
            <Compass className="w-3.5 h-3.5 text-emerald-600 group-hover:rotate-45 transition duration-300" />
          </div>
          <p className="text-xs font-extrabold mt-0.5">Start Interactive Tour</p>
          <p className="text-[10px] text-slate-500">Live spotlight on dashboard</p>
        </button>

        {/* Infrastructure Status Indicator */}
        <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-200/60 space-y-2">
          <InteractiveHoverCard
            title="MongoDB Atlas Cluster"
            category="Database"
            description="Stores WebhookJobs and DeliveryAttempts with polymorphic BSON schemas."
            interviewTip="Connected via Mongoose with connection pooling and serverSelectionTimeout."
            position="right"
            className="w-full"
          >
            <div className="flex items-center justify-between text-[11px] cursor-help w-full">
              <span className="text-slate-500 flex items-center gap-1.5 font-medium">
                <Database className="w-3.5 h-3.5 text-emerald-600" />
                MongoDB Atlas
              </span>
              <span className="text-emerald-700 font-bold text-[10px]">Connected</span>
            </div>
          </InteractiveHoverCard>

          <InteractiveHoverCard
            title="Upstash Redis Cluster"
            category="Message Broker"
            description="Powers BullMQ with atomic Lua scripts and delayed sorted sets for backoff."
            interviewTip="Runs over TLS on port 6379 with maxRetriesPerRequest set to null."
            position="right"
            className="w-full"
          >
            <div className="flex items-center justify-between text-[11px] cursor-help w-full">
              <span className="text-slate-500 flex items-center gap-1.5 font-medium">
                <Radio className="w-3.5 h-3.5 text-rose-500" />
                Upstash Redis
              </span>
              <span className="text-emerald-700 font-bold text-[10px]">TLS Active</span>
            </div>
          </InteractiveHoverCard>

          <InteractiveHoverCard
            title="Sliding-Window Rate Limiter"
            category="Protection"
            description="Enforces maximum 5 requests per second per target destination domain."
            interviewTip="Prevents accidental DDoS against customer servers when bulk events occur."
            position="right"
            className="w-full"
          >
            <div className="flex items-center justify-between text-[11px] cursor-help w-full">
              <span className="text-slate-500 flex items-center gap-1.5 font-medium">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                Rate Limiter
              </span>
              <span className="text-slate-700 font-bold text-[10px]">5 req/s / domain</span>
            </div>
          </InteractiveHoverCard>
        </div>

        <a
          href="https://github.com/aryacreations/Distributed-fault-tolerent-webhook-description-engine"
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => sounds.playClick()}
          className="flex items-center justify-center space-x-2 w-full py-2 px-3 rounded-xl text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200/90 shadow-sm transition"
        >
          <Github className="w-4 h-4 text-slate-800" />
          <span>View GitHub Repo</span>
        </a>
      </div>
    </aside>
  );
}
