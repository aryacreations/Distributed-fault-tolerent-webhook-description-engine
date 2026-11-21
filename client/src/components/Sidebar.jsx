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
  Play
} from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab, onOpenExplainer }) {
  const menuItems = [
    {
      id: 'overview',
      label: 'System Overview',
      desc: 'Real-time metrics & health',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'dispatch',
      label: 'Dispatch Studio',
      desc: 'Ingest & test webhooks',
      icon: Send,
      badge: '202 Fast',
    },
    {
      id: 'simulator',
      label: 'Test Lab & Scenarios',
      desc: 'Backoff, DLQ & timeouts',
      icon: Zap,
      badge: 'Interactive',
    },
    {
      id: 'deliveries',
      label: 'Delivery Logs & Audit',
      desc: 'History & attempt timeline',
      icon: History,
      badge: null,
    },
    {
      id: 'architecture',
      label: 'System Architecture',
      desc: 'Specs, diagrams & trade-offs',
      icon: Network,
      badge: 'Docs',
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
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
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
            );
          })}
        </nav>
      </div>

      {/* Footer Info & Infrastructure Status */}
      <div className="space-y-4 pt-4 border-t border-slate-200/70">
        {/* Animated Explainer Trigger Card */}
        <button
          onClick={onOpenExplainer}
          className="w-full p-3 bg-gradient-to-r from-emerald-600 to-teal-500 rounded-2xl text-white text-left shadow-lg shadow-emerald-600/20 hover:from-emerald-500 hover:to-teal-400 transition active:scale-95 group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-100">
              Interactive Tour
            </span>
            <Play className="w-3.5 h-3.5 fill-current text-white group-hover:scale-110 transition" />
          </div>
          <p className="text-xs font-extrabold mt-0.5">Watch Video Explainer</p>
          <p className="text-[10px] text-emerald-100/90 mt-0.5">Voiceover & Animation</p>
        </button>

        <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-200/60 space-y-2">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-500 flex items-center gap-1.5 font-medium">
              <Database className="w-3.5 h-3.5 text-emerald-600" />
              MongoDB Atlas
            </span>
            <span className="text-emerald-700 font-bold text-[10px]">Connected</span>
          </div>
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-500 flex items-center gap-1.5 font-medium">
              <Radio className="w-3.5 h-3.5 text-rose-500" />
              Upstash Redis
            </span>
            <span className="text-emerald-700 font-bold text-[10px]">TLS Active</span>
          </div>
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-500 flex items-center gap-1.5 font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
              Rate Limiter
            </span>
            <span className="text-slate-700 font-bold text-[10px]">5 req/s / domain</span>
          </div>
        </div>

        <a
          href="https://github.com/aryacreations/Distributed-fault-tolerent-webhook-description-engine"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center space-x-2 w-full py-2 px-3 rounded-xl text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200/90 shadow-sm transition"
        >
          <Github className="w-4 h-4 text-slate-800" />
          <span>View GitHub Repo</span>
        </a>
      </div>
    </aside>
  );
}
