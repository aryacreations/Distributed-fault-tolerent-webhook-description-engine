import React, { useState } from 'react';
import { RefreshCw, Play, Volume2, VolumeX, Compass, Sparkles } from 'lucide-react';
import sounds from '../utils/soundEngine';

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

export default function Header({ 
  activeTab, 
  onRefresh, 
  isRefreshing, 
  stats, 
  onOpenExplainer, 
  onStartTour 
}) {
  const [isAudioMuted, setIsAudioMuted] = useState(sounds.isMuted);
  const current = TAB_TITLES[activeTab] || TAB_TITLES.overview;
  const metrics = stats?.metrics;

  const handleToggleSound = () => {
    const muted = sounds.toggleMute();
    setIsAudioMuted(muted);
    if (!muted) sounds.playHover();
  };

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

      <div className="flex items-center space-x-2.5">
        {/* Interactive Guided Spotlight Tour Button */}
        <button
          onClick={() => {
            sounds.playClick();
            onStartTour();
          }}
          className="flex items-center space-x-2 px-3.5 py-1.5 rounded-xl text-xs font-bold text-slate-800 bg-white hover:bg-slate-50 border border-slate-200 shadow-sm transition active:scale-95"
          title="Start Interactive Guided Walkthrough on Dashboard"
        >
          <Compass className="w-3.5 h-3.5 text-emerald-600" />
          <span>Interactive Tour</span>
        </button>

        {/* Watch Animated Video Explainer Button */}
        <button
          onClick={() => {
            sounds.playClick();
            onOpenExplainer();
          }}
          className="flex items-center space-x-2 px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 shadow-md shadow-emerald-500/20 transition active:scale-95"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          <span>Video Explainer</span>
        </button>

        {/* Global Sound Effects Toggle */}
        <button
          onClick={handleToggleSound}
          title={isAudioMuted ? 'Unmute Sound Effects' : 'Mute Sound Effects'}
          className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition"
        >
          {isAudioMuted ? (
            <VolumeX className="w-4 h-4 text-rose-500" />
          ) : (
            <Volume2 className="w-4 h-4 text-emerald-600" />
          )}
        </button>

        {/* Refresh Button */}
        <button
          onClick={() => {
            sounds.playClick();
            onRefresh();
          }}
          disabled={isRefreshing}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 shadow-sm transition active:scale-95 disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-slate-600 ${isRefreshing ? 'animate-spin text-emerald-600' : ''}`} />
          <span className="hidden sm:inline">{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
        </button>
      </div>
    </header>
  );
}
