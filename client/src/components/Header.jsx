import React, { useState } from 'react';
import { RefreshCw, Play, Pause, Volume2, VolumeX, Compass, Sparkles } from 'lucide-react';
import { useTour } from '../context/TourContext';
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
    title: 'Testing Lab & Scenarios',
    subtitle: 'Simulate flaky targets, exponential backoff, rate limits, and timeouts',
  },
  deliveries: {
    title: 'Delivery Logs & Audit Trail',
    subtitle: 'Immutable attempt history, duration telemetry, and payload inspector',
  },
  architecture: {
    title: 'Distributed System Architecture',
    subtitle: 'End-to-end design specifications, state machines, and system decisions',
  },
};

export default function Header({ 
  activeTab, 
  onRefresh, 
  isRefreshing, 
  stats, 
  onStartWalkthrough 
}) {
  const { isTourActive, toggleTour } = useTour();
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
        {/* Interactive Tour Play / Pause Toggle Button */}
        <button
          id="btn-header-tour-toggle"
          data-testid="btn-header-tour-toggle"
          onClick={toggleTour}
          className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition shadow-sm active:scale-95 cursor-pointer ${
            isTourActive
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-300 ring-2 ring-emerald-500/20'
              : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200'
          }`}
          title={isTourActive ? 'Click to Pause Tour & Hover Inspection' : 'Click to Activate Tour & Hover Inspection'}
        >
          {isTourActive ? (
            <>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <Pause className="w-3.5 h-3.5 text-emerald-700 fill-current" />
              <span>Tour Active (Hover On)</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 text-emerald-600 fill-current" />
              <span>Start Interactive Tour</span>
            </>
          )}
        </button>

        {/* Step-by-Step Guided Walkthrough Button */}
        <button
          id="btn-walkthrough-guide"
          data-testid="btn-walkthrough-guide"
          onClick={() => {
            sounds.playClick();
            onStartWalkthrough();
          }}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 shadow-sm transition active:scale-95 cursor-pointer"
          title="Open Step-by-Step Guided Walkthrough"
        >
          <Compass className="w-3.5 h-3.5 text-slate-500" />
          <span>Walkthrough Guide</span>
        </button>

        {/* Global Sound Effects Toggle */}
        <button
          id="btn-sound-toggle"
          data-testid="btn-sound-toggle"
          onClick={handleToggleSound}
          title={isAudioMuted ? 'Unmute Sound Effects' : 'Mute Sound Effects'}
          className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition cursor-pointer"
        >
          {isAudioMuted ? (
            <VolumeX className="w-4 h-4 text-rose-500" />
          ) : (
            <Volume2 className="w-4 h-4 text-emerald-600" />
          )}
        </button>

        {/* Refresh Button */}
        <button
          id="btn-refresh"
          data-testid="btn-refresh"
          onClick={() => {
            sounds.playClick();
            onRefresh();
          }}
          disabled={isRefreshing}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 shadow-sm transition active:scale-95 disabled:opacity-50 cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-slate-600 ${isRefreshing ? 'animate-spin text-emerald-600' : ''}`} />
          <span className="hidden sm:inline">{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
        </button>
      </div>
    </header>
  );
}
