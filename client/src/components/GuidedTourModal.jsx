import React, { useState, useEffect } from 'react';
import sounds from '../utils/soundEngine';
import { 
  Compass, 
  ArrowRight, 
  ArrowLeft, 
  X, 
  CheckCircle2, 
  Send, 
  Zap, 
  Layers, 
  Database, 
  ShieldCheck, 
  Volume2, 
  VolumeX,
  Sparkles,
  Play
} from 'lucide-react';

const TOUR_STEPS = [
  {
    step: 1,
    tab: 'dispatch',
    title: 'Non-Blocking Ingestion Studio',
    subtitle: 'Step 1 of 5: The Ingestion Guarantee',
    icon: Send,
    iconColor: 'text-emerald-600 bg-emerald-50 border-emerald-200',
    description:
      'The ingestion endpoint (POST /api/webhooks/dispatch) validates payloads with Zod and responds with HTTP 202 Accepted in under 30 milliseconds. It pushes the job to Redis and never blocks on downstream customer response times.',
    underTheHood:
      'Zod Schema Validation -> WebhookJob.create({ status: "QUEUED" }) -> BullMQ.enqueueWebhook() -> HTTP 202.',
    interviewTip:
      'Emphasize that the caller thread is never tied to external network I/O. Even if customer servers take 10 seconds, our API remains lightning-fast.',
  },
  {
    step: 2,
    tab: 'dispatch',
    title: 'Idempotency Protection (eventId)',
    subtitle: 'Step 2 of 5: Deduplication Defense',
    icon: ShieldCheck,
    iconColor: 'text-blue-600 bg-blue-50 border-blue-200',
    description:
      'Network timeouts often cause upstream clients to retry ingestion. Our unique index on eventId ensures that if the same event arrives twice, the engine returns the existing jobId rather than queuing duplicate outbound webhooks.',
    underTheHood:
      'MongoDB Unique Index on eventId -> WebhookJob.findOne({ eventId }) check prior to enqueueing.',
    interviewTip:
      'Tell the interviewer this guarantees "At-Most-Once Enqueueing" and prevents customers from getting double-charged or receiving duplicate signup emails.',
  },
  {
    step: 3,
    tab: 'simulator',
    title: 'Exponential Backoff (2s -> 4s -> 8s)',
    subtitle: 'Step 3 of 5: Fault-Tolerant Retries',
    icon: Zap,
    iconColor: 'text-amber-600 bg-amber-50 border-amber-200',
    description:
      'Downstream servers often suffer transient hiccups. Instead of immediate retries that cause thundering-herd crashes, our worker schedules delayed retries using Redis Sorted Sets: waiting 2s after attempt 1, 4s after attempt 2, and 8s after attempt 3.',
    underTheHood:
      'BullMQ Delayed Set (ZSET) with score = Date.now() + 2^attempt * 1000ms. If 3 retries exhaust, job transitions to Dead Letter Queue (DLQ).',
    interviewTip:
      'Explain the difference between transient errors (5xx, 429, timeouts) which get retried, versus permanent errors (400, 401, 404) which fail fast without retrying.',
  },
  {
    step: 4,
    tab: 'simulator',
    title: 'Per-Destination Rate Limiter (Token Bucket)',
    subtitle: 'Step 4 of 5: Multi-Tenant Host Protection',
    icon: Layers,
    iconColor: 'text-cyan-600 bg-cyan-50 border-cyan-200',
    description:
      'If an internal system emits 500 events destined for a single customer endpoint, blasting them at once would DDoS the customer. Our Redis sliding-window token bucket enforces a 5 req/s limit per hostname while gracefully backpressuring the queue.',
    underTheHood:
      'Redis ZREMRANGEBYSCORE + ZCARD pipeline on key "ratelimit:domain:<hostname>". Excess jobs are delayed by 1000ms rather than dropped.',
    interviewTip:
      'Highlight that this is per-destination hostname, not global! Traffic to Client A never throttles or delays traffic destined for Client B.',
  },
  {
    step: 5,
    tab: 'deliveries',
    title: 'Immutable Audit Trail & Observability',
    subtitle: 'Step 5 of 5: Production Visibility',
    icon: Database,
    iconColor: 'text-purple-600 bg-purple-50 border-purple-200',
    description:
      'Every single delivery attempt records the roundtrip latency in milliseconds, HTTP response code, and error body in MongoDB Atlas. Clicking any job in the table opens an exact step-by-step timeline of all attempts and backoff waits.',
    underTheHood:
      'MongoDB delivery_attempts collection -> indexed by jobId and attemptedAt -> live polling & query APIs.',
    interviewTip:
      'Explain that in production webhook infrastructure (like Stripe or GitHub), delivery audit logs are crucial for customer debugging, SLAs, and compliance.',
  },
];

export default function GuidedTourModal({ isOpen, onClose, onNavigateTab }) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setCurrentStepIndex(0);
      sounds.playSuccess();
      const firstTab = TOUR_STEPS[0].tab;
      if (onNavigateTab) onNavigateTab(firstTab);
    }
  }, [isOpen, onNavigateTab]);

  if (!isOpen) return null;

  const currentStep = TOUR_STEPS[currentStepIndex];
  const Icon = currentStep.icon;

  const handleNext = () => {
    if (currentStepIndex < TOUR_STEPS.length - 1) {
      const nextIdx = currentStepIndex + 1;
      sounds.playWhoosh();
      setCurrentStepIndex(nextIdx);
      if (onNavigateTab) onNavigateTab(TOUR_STEPS[nextIdx].tab);
    } else {
      sounds.playSuccess();
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      const prevIdx = currentStepIndex - 1;
      sounds.playClick();
      setCurrentStepIndex(prevIdx);
      if (onNavigateTab) onNavigateTab(TOUR_STEPS[prevIdx].tab);
    }
  };

  return (
    <div className="fixed inset-x-0 bottom-6 z-50 flex items-center justify-center px-4 pointer-events-none">
      <div className="pointer-events-auto bg-white/95 backdrop-blur-2xl border border-white/90 rounded-3xl p-5 sm:p-6 shadow-2xl max-w-2xl w-full space-y-4 animate-slideUp ring-1 ring-slate-900/10">
        {/* Step Progress & Controls */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center space-x-2.5">
            <div className={`p-2 rounded-xl border ${currentStep.iconColor}`}>
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-600 block">
                {currentStep.subtitle}
              </span>
              <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
                {currentStep.title}
              </h3>
            </div>
          </div>

          <button
            onClick={() => {
              sounds.playClick();
              onClose();
            }}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Description */}
        <p className="text-xs text-slate-600 leading-relaxed font-sans">
          {currentStep.description}
        </p>

        {/* Under the Hood & Interview Tip Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/70 text-xs space-y-1">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block font-mono">
              Under The Hood:
            </span>
            <p className="text-[11px] font-mono text-slate-800 leading-snug">
              {currentStep.underTheHood}
            </p>
          </div>

          <div className="p-3 bg-emerald-50/70 rounded-2xl border border-emerald-200/70 text-xs space-y-1">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-700 block font-sans">
              Interview Defense Tip:
            </span>
            <p className="text-[11px] text-emerald-950 italic leading-snug font-sans">
              "{currentStep.interviewTip}"
            </p>
          </div>
        </div>

        {/* Footer Navigation */}
        <div className="flex items-center justify-between pt-2">
          {/* Step Dots */}
          <div className="flex items-center gap-1.5">
            {TOUR_STEPS.map((_, i) => (
              <span
                key={i}
                className={`h-2 rounded-full transition-all duration-300 ${
                  currentStepIndex === i ? 'w-6 bg-emerald-600' : 'w-2 bg-slate-200'
                }`}
              />
            ))}
          </div>

          <div className="flex items-center space-x-2">
            <button
              disabled={currentStepIndex === 0}
              onClick={handlePrev}
              className="flex items-center space-x-1 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 disabled:opacity-40 transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Previous</span>
            </button>

            <button
              onClick={handleNext}
              className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-600/20 active:scale-95 transition"
            >
              <span>{currentStepIndex === TOUR_STEPS.length - 1 ? 'Finish Tour' : 'Next Step'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
