import React, { useState, useEffect, useRef } from 'react';
import sounds from '../utils/soundEngine';
import { 
  Play, 
  Pause, 
  ArrowRight, 
  ArrowLeft, 
  X, 
  Sparkles, 
  Send, 
  Zap, 
  Layers, 
  Database, 
  ShieldCheck,
  MousePointer
} from 'lucide-react';

const TOUR_STOPS = [
  {
    step: 1,
    tab: 'overview',
    targetKey: 'overview-metrics',
    title: 'High-Throughput System Health',
    subtitle: 'Section 1/5: Overview & Metrics',
    targetSection: 'Metric Cards',
    icon: Layers,
    color: 'text-blue-600 bg-blue-50 border-blue-200',
    description:
      'Provides real-time visibility into overall ingestion throughput, active Redis queue pipelines, and delivery success rates.',
    howItWorks:
      'Polled from Express /api/stats -> aggregated from MongoDB collections and Redis queue counts.',
  },
  {
    step: 2,
    tab: 'dispatch',
    targetKey: 'dispatch-form',
    title: 'Sub-30ms Ingestion Studio',
    subtitle: 'Section 2/5: Non-Blocking Dispatch',
    targetSection: 'Dispatch Studio Form',
    icon: Send,
    color: 'text-emerald-600 bg-emerald-50 border-emerald-200',
    description:
      'The caller receives an immediate HTTP 202 Accepted response in under 30ms. Upstream threads are never tied to external destination latency.',
    howItWorks:
      'POST /api/webhooks/dispatch -> Zod Validation -> MongoDB insert -> BullMQ push -> 202 Accepted.',
  },
  {
    step: 3,
    tab: 'simulator',
    targetKey: 'simulator-scenarios',
    title: 'Automated Failure Recovery (2s, 4s, 8s)',
    subtitle: 'Section 3/5: Exponential Backoff Lab',
    targetSection: 'Testing Scenarios',
    icon: Zap,
    color: 'text-amber-600 bg-amber-50 border-amber-200',
    description:
      'Simulates real-world transient failures (HTTP 500, 429). The engine automatically spaces retries exponentially (2s, 4s, 8s) to prevent thundering-herd crashes.',
    howItWorks:
      'Worker catches transient error -> calculates 2^attempt * 1000ms -> BullMQ stores in Redis ZSET delayed set.',
  },
  {
    step: 4,
    tab: 'deliveries',
    targetKey: 'delivery-table',
    title: 'Immutable Delivery Audit Trail',
    subtitle: 'Section 4/5: Telemetry & Logs',
    targetSection: 'Jobs Table & Inspector',
    icon: Database,
    color: 'text-purple-600 bg-purple-50 border-purple-200',
    description:
      'Every single HTTP dispatch attempt records the duration in milliseconds, response code, and error body for debugging and compliance.',
    howItWorks:
      'MongoDB delivery_attempts collection -> indexed by jobId -> step-by-step visual execution modal.',
  },
  {
    step: 5,
    tab: 'architecture',
    targetKey: 'architecture-blueprint',
    title: '4-Layer Distributed Blueprint',
    subtitle: 'Section 5/5: Architecture & Design',
    targetSection: 'Architecture Specification',
    icon: ShieldCheck,
    color: 'text-cyan-600 bg-cyan-50 border-cyan-200',
    description:
      'Full technical breakdown of the Ingestion Layer, Redis Broker, Worker Pool with Per-Domain Rate Limiting (5 req/s), and MongoDB persistence.',
    howItWorks:
      'Microservice decoupling with Redis sliding-window token bucket and at-least-once delivery semantics.',
  },
];

export default function AutopilotTour({
  isActive,
  onClose,
  onNavigateTab,
}) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [progress, setProgress] = useState(0);
  const [cursorPos, setCursorPos] = useState({ x: 300, y: 250, visible: false });

  const timerRef = useRef(null);
  const STEP_DURATION_SEC = 7; // 7 seconds per stop

  // Update target element focus and calculate virtual cursor position
  useEffect(() => {
    if (!isActive) {
      setCursorPos((prev) => ({ ...prev, visible: false }));
      return;
    }

    const stop = TOUR_STOPS[currentStepIndex];
    if (stop && onNavigateTab) {
      sounds.playWhoosh();
      onNavigateTab(stop.tab);
    }
    setProgress(0);

    // Give view time to render DOM element, then position cursor and scroll
    const locateTimer = setTimeout(() => {
      const targetEl = document.querySelector(`[data-tour-target="${stop.targetKey}"]`);
      if (targetEl) {
        targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        const rect = targetEl.getBoundingClientRect();
        setCursorPos({
          x: Math.max(40, rect.left + rect.width / 2 - 20),
          y: Math.max(40, rect.top + Math.min(100, rect.height / 3)),
          visible: true,
        });
        targetEl.classList.add('tour-spotlight-active');
      } else {
        // Fallback position in center of workspace
        setCursorPos({
          x: window.innerWidth * 0.55,
          y: window.innerHeight * 0.35,
          visible: true,
        });
      }
    }, 250);

    return () => {
      clearTimeout(locateTimer);
      // Remove any leftover spotlight classes
      document.querySelectorAll('.tour-spotlight-active').forEach((el) => {
        el.classList.remove('tour-spotlight-active');
      });
    };
  }, [currentStepIndex, isActive, onNavigateTab]);

  // Autopilot progress timer
  useEffect(() => {
    if (!isActive || !isAutoPlaying) {
      clearInterval(timerRef.current);
      return;
    }

    const intervalMs = 100;
    const totalMs = STEP_DURATION_SEC * 1000;
    const stepPct = (intervalMs / totalMs) * 100;

    timerRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          // Advance to next stop
          if (currentStepIndex < TOUR_STOPS.length - 1) {
            setCurrentStepIndex((idx) => idx + 1);
            return 0;
          } else {
            // Tour finished
            sounds.playSuccess();
            onClose();
            return 100;
          }
        }
        return prev + stepPct;
      });
    }, intervalMs);

    return () => clearInterval(timerRef.current);
  }, [isActive, isAutoPlaying, currentStepIndex, onClose]);

  // Reset when opened or closed
  useEffect(() => {
    if (isActive) {
      setCurrentStepIndex(0);
      setProgress(0);
      setIsAutoPlaying(true);
    } else {
      clearInterval(timerRef.current);
      setCursorPos((prev) => ({ ...prev, visible: false }));
    }
  }, [isActive]);

  if (!isActive) return null;

  const currentStop = TOUR_STOPS[currentStepIndex];
  const Icon = currentStop.icon;

  const handleNext = () => {
    sounds.playClick();
    if (currentStepIndex < TOUR_STOPS.length - 1) {
      setCurrentStepIndex((prev) => prev + 1);
    } else {
      sounds.playSuccess();
      onClose();
    }
  };

  const handlePrev = () => {
    sounds.playClick();
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  };

  const handleToggleAutoPlay = () => {
    sounds.playClick();
    setIsAutoPlaying((prev) => !prev);
  };

  return (
    <>
      {/* 1. Autonomous Virtual Animated Cursor & Spotlight Pointer */}
      {cursorPos.visible && (
        <div
          className="fixed pointer-events-none z-50 transition-all duration-700 ease-out"
          style={{
            transform: `translate3d(${cursorPos.x}px, ${cursorPos.y}px, 0)`,
          }}
        >
          {/* Pulsing ring spotlight */}
          <div className="relative">
            <span className="absolute -inset-4 rounded-full bg-emerald-500/20 animate-ping" />
            <div className="relative flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-emerald-600/90 text-white flex items-center justify-center shadow-lg shadow-emerald-500/40 ring-2 ring-white">
                <MousePointer className="w-4 h-4 fill-white -rotate-12 translate-x-0.5" />
              </div>
              <div className="px-2.5 py-1 rounded-full bg-slate-900/90 text-white text-[10px] font-bold shadow-md tracking-wider flex items-center gap-1.5 whitespace-nowrap backdrop-blur-md border border-slate-700">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>Autopilot: {currentStop.targetSection}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. Sleek Floating Tour Explanation Card */}
      <div 
        id="tour-autopilot-panel"
        data-testid="tour-autopilot-panel"
        className="fixed inset-x-0 bottom-6 z-50 flex items-center justify-center px-4 pointer-events-none animate-slideUp"
      >
        <div className="pointer-events-auto bg-white/95 backdrop-blur-2xl border border-white/90 rounded-3xl p-5 sm:p-6 shadow-2xl shadow-slate-400/30 max-w-2xl w-full space-y-4 ring-1 ring-slate-900/5">
          {/* Top Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-xl border ${currentStop.color} shadow-sm`}>
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    {currentStop.subtitle}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                    Focus: {currentStop.targetSection}
                  </span>
                </div>
                <h3 className="text-base font-extrabold text-slate-900 tracking-tight mt-0.5">
                  {currentStop.title}
                </h3>
              </div>
            </div>

            <div className="flex items-center space-x-1.5">
              {/* Play/Pause Auto-Timer */}
              <button
                id="btn-tour-autoplay-toggle"
                data-testid="btn-tour-autoplay-toggle"
                onClick={handleToggleAutoPlay}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  isAutoPlaying
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
                title={isAutoPlaying ? 'Pause Autopilot timer' : 'Resume Autopilot timer'}
              >
                {isAutoPlaying ? (
                  <>
                    <Pause className="w-3 h-3 fill-current" />
                    <span>Autopilot: Playing</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3 h-3 fill-current" />
                    <span>Autopilot: Paused</span>
                  </>
                )}
              </button>

              <button
                id="btn-tour-close"
                data-testid="btn-tour-close"
                onClick={() => {
                  sounds.playClick();
                  onClose();
                }}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                title="Close Virtual Tour"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Content Description */}
          <p className="text-xs text-slate-600 leading-relaxed font-sans">
            {currentStop.description}
          </p>

          {/* How It Works Box */}
          <div className="p-3 bg-slate-50/90 rounded-2xl border border-slate-200/70 text-xs space-y-1">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block font-mono">
              How It Works (System Architecture):
            </span>
            <p className="text-[11px] font-mono text-slate-800 leading-snug">
              {currentStop.howItWorks}
            </p>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-emerald-500 h-full transition-all duration-100 ease-linear rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Footer Navigation */}
          <div className="flex items-center justify-between pt-1">
            {/* Step Dots */}
            <div className="flex items-center gap-1.5">
              {TOUR_STOPS.map((_, i) => (
                <button
                  key={i}
                  id={`btn-tour-dot-${i}`}
                  data-testid={`tour-step-dot-${i}`}
                  onClick={() => {
                    sounds.playClick();
                    setCurrentStepIndex(i);
                  }}
                  className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                    currentStepIndex === i ? 'w-6 bg-emerald-600' : 'w-2 bg-slate-200 hover:bg-slate-300'
                  }`}
                />
              ))}
            </div>

            <div className="flex items-center space-x-2">
              <button
                id="btn-tour-prev"
                data-testid="btn-tour-prev"
                disabled={currentStepIndex === 0}
                onClick={handlePrev}
                className="flex items-center space-x-1 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 disabled:opacity-40 transition cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Previous</span>
              </button>

              <button
                id="btn-tour-next"
                data-testid="btn-tour-next"
                onClick={handleNext}
                className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-600/20 active:scale-95 transition cursor-pointer"
              >
                <span>{currentStepIndex === TOUR_STOPS.length - 1 ? 'Finish Tour' : 'Next Stop'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}