import React, { useState } from 'react';
import { 
  Play, 
  RotateCcw, 
  CheckCircle2, 
  Zap, 
  Clock, 
  AlertTriangle, 
  ShieldAlert, 
  Timer,
  Layers,
  ArrowRight
} from 'lucide-react';
import { dispatchWebhook, resetMockReceiver } from '../services/api';
import InteractiveHoverCard from '../components/InteractiveHoverCard';
import sounds from '../utils/soundEngine';

export default function SimulatorView({ onTriggeredTest, onNavigate }) {
  const [isRunning, setIsRunning] = useState(false);
  const [activeScenario, setActiveScenario] = useState(null);
  const [notice, setNotice] = useState(null);

  const getBaseMockUrl = () => {
    return window.location.origin.includes('localhost')
      ? 'http://localhost:5000/api/mock-receiver'
      : `${window.location.origin}/api/mock-receiver`;
  };

  const handleRunScenario = async (scenario) => {
    sounds.playClick();
    setIsRunning(true);
    setActiveScenario(scenario.id);
    setNotice(null);

    const baseUrl = getBaseMockUrl();
    const eventId = `sim_${scenario.id}_${Date.now()}`;

    try {
      if (scenario.id === 'rapid_fire') {
        const promises = Array.from({ length: 8 }).map((_, i) =>
          dispatchWebhook({
            destinationUrl: `${baseUrl}?status=200`,
            eventId: `sim_flood_${i}_${Date.now()}`,
            payload: {
              event: 'traffic.spike',
              batchIndex: i + 1,
              totalInBatch: 8,
              timestamp: new Date().toISOString(),
            },
          })
        );
        await Promise.all(promises);
        sounds.playSuccess();
        setNotice('Dispatched 8 concurrent events! The Redis sliding-window token bucket throttles to 5 req/s without flooding.');
      } else {
        await dispatchWebhook({
          destinationUrl: scenario.url(baseUrl, eventId),
          eventId,
          payload: {
            event: scenario.event,
            scenarioTitle: scenario.name,
            expectedBehavior: scenario.expected,
            triggeredAt: new Date().toISOString(),
          },
        });
        sounds.playSuccess();
        setNotice(`Triggered: "${scenario.name}". Switch to Delivery Logs to watch the worker execution.`);
      }

      if (onTriggeredTest) onTriggeredTest();
    } catch (err) {
      sounds.playWarning();
      setNotice(`Failed to trigger scenario: ${err.message}`);
    } finally {
      setIsRunning(false);
      setActiveScenario(null);
    }
  };

  const handleResetCounters = async () => {
    sounds.playClick();
    try {
      await resetMockReceiver();
      sounds.playSuccess();
      setNotice('Mock receiver simulation counters reset successfully.');
    } catch (err) {
      sounds.playWarning();
      setNotice('Could not reset counters: ' + err.message);
    }
  };

  const scenarios = [
    {
      id: 'success',
      name: 'Instant Success (200 OK)',
      category: 'Standard Flow',
      desc: 'Simulates a healthy downstream endpoint that acknowledges receipt on the first attempt.',
      event: 'invoice.paid',
      expected: 'Delivers on Attempt #1 in ~100-250ms with HTTP 200 OK.',
      badge: '200 OK',
      badgeColor: 'text-emerald-700 bg-emerald-50 border-emerald-200',
      icon: CheckCircle2,
      url: (base) => `${base}?status=200`,
      underTheHood: 'HTTP 200 -> WebhookJob status SUCCESS -> DeliveryAttempt logged with latency.',
      tip: 'Tests the fundamental happy path where the target responds immediately.',
    },
    {
      id: 'recovering',
      name: 'Self-Healing Flaky Server',
      category: 'Exponential Backoff',
      desc: 'Target server fails the first 2 attempts with HTTP 500, then recovers and succeeds on attempt 3.',
      event: 'order.placed',
      expected: 'Attempt 1 fails -> wait 2s -> Attempt 2 fails -> wait 4s -> Attempt 3 succeeds!',
      badge: 'Backoff 2s -> 4s',
      badgeColor: 'text-amber-700 bg-amber-50 border-amber-200',
      icon: Zap,
      url: (base, evtId) => `${base}?failUntil=2&code=500&key=${evtId}`,
      underTheHood: 'Worker catches 500 error -> throws -> BullMQ schedules delayed execution in Redis ZSET.',
      tip: 'The star demo scenario! Watch the 2s and 4s countdown timers live on the Delivery Logs table.',
    },
    {
      id: 'dlq',
      name: 'Exhausted Retries (DLQ)',
      category: 'Dead Letter Queue',
      desc: 'Target server remains persistently down (500). System exhausts all 3 retries and dead-letters.',
      event: 'critical.alert',
      expected: 'Waits 2s, 4s, 8s across 3 retries, then marks job permanently as FAILED.',
      badge: 'Max 3 Retries',
      badgeColor: 'text-rose-700 bg-rose-50 border-rose-200',
      icon: AlertTriangle,
      url: (base) => `${base}?status=500`,
      underTheHood: 'After 3 retries exhausted, job transitions to FAILED state and is moved to DLQ.',
      tip: 'Explain that dead-lettering prevents poison-pill jobs from clogging worker threads forever.',
    },
    {
      id: 'rate_limited',
      name: 'Downstream 429 Throttle',
      category: 'Rate Limit Backoff',
      desc: 'Target server rejects payload with HTTP 429 Too Many Requests due to downstream rate limits.',
      event: 'sync.customer',
      expected: 'Treated as a transient failure; scheduled for retry using exponential backoff.',
      badge: 'HTTP 429',
      badgeColor: 'text-orange-700 bg-orange-50 border-orange-200',
      icon: ShieldAlert,
      url: (base) => `${base}?status=429`,
      underTheHood: 'dispatcherService identifies HTTP 429 as isTransient = true, triggering exponential backoff.',
      tip: 'Highlights intelligent error classification: unlike 400 or 404, 429 is retried safely.',
    },
    {
      id: 'timeout',
      name: 'Hard Timeout (5000ms)',
      category: 'Socket Protection',
      desc: 'Target server hangs for 6500ms; dispatcher socket threshold (5000ms) safely aborts the request.',
      event: 'export.ready',
      expected: 'Aborted at 5000ms -> recorded as connection timeout -> retry scheduled.',
      badge: '5s Hard Timeout',
      badgeColor: 'text-purple-700 bg-purple-50 border-purple-200',
      icon: Timer,
      url: (base) => `${base}?delay=6500`,
      underTheHood: 'Axios timeout: 5000ms aborts socket to prevent zombie thread leaks.',
      tip: 'Essential in microservices to prevent slow third-party servers from hanging our workers.',
    },
    {
      id: 'rapid_fire',
      name: 'Rapid Fire Burst (8 Jobs)',
      category: 'Domain Protection',
      desc: 'Fires 8 concurrent webhooks to the same domain simultaneously to test the Token Bucket.',
      event: 'batch.export',
      expected: 'Token Bucket limits to 5 req/s. Remaining 3 jobs are delayed by 1s to prevent flood.',
      badge: 'Token Bucket',
      badgeColor: 'text-cyan-700 bg-cyan-50 border-cyan-200',
      icon: Layers,
      url: (base) => `${base}?status=200`,
      underTheHood: 'Redis sliding-window checkDomainRateLimit(domain) caps to 5 req/s with atomic Lua/pipeline.',
      tip: 'Demonstrates multi-tenant fairness and prevents single-domain thundering-herd spikes.',
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="glass-card rounded-2xl p-6 sm:p-7 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-l-4 border-l-amber-500">
        <div>
          <div className="flex items-center space-x-2 text-amber-700 font-bold text-xs uppercase tracking-wider mb-1">
            <Zap className="w-4 h-4" />
            <span>Interactive Interview Simulator</span>
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Failure Mode & Resilience Testing Suite
          </h2>
          <p className="text-xs text-slate-600 mt-1 max-w-2xl">
            Test the engine's distributed capabilities with 1 click. Validate exponential backoff, rate limiting, and network timeout handling without external tools.
          </p>
        </div>

        <button
          onClick={handleResetCounters}
          className="flex items-center space-x-2 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 rounded-xl border border-slate-200 shadow-sm transition active:scale-95 shrink-0"
        >
          <RotateCcw className="w-3.5 h-3.5 text-slate-600" />
          <span>Reset Simulation Counters</span>
        </button>
      </div>

      {notice && (
        <div className="glass-card rounded-2xl p-4 border border-emerald-300 bg-emerald-50/80 flex items-center justify-between gap-3 text-xs text-emerald-900 font-medium animate-fadeIn">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{notice}</span>
          </div>
          <button
            onClick={() => {
              sounds.playClick();
              onNavigate('deliveries');
            }}
            className="flex items-center gap-1 font-bold text-emerald-700 hover:underline shrink-0"
          >
            <span>View Delivery Logs</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 6 Big Scenario Cards with Interactive Hovercards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {scenarios.map((sc) => {
          const Icon = sc.icon;
          return (
            <InteractiveHoverCard
              key={sc.id}
              title={sc.name}
              category={sc.category}
              description={sc.desc}
              underTheHood={sc.underTheHood}
              interviewTip={sc.tip}
              position="top"
              className="w-full"
            >
              <div className="glass-card rounded-2xl p-6 flex flex-col justify-between transition-all duration-300 group hover:border-slate-300 h-full w-full cursor-help">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      {sc.category}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${sc.badgeColor}`}>
                      {sc.badge}
                    </span>
                  </div>

                  <div className="flex items-center space-x-2.5 mb-2">
                    <div className="p-2 rounded-xl bg-slate-100 group-hover:bg-emerald-50 group-hover:text-emerald-600 transition">
                      <Icon className="w-4 h-4" />
                    </div>
                    <h3 className="text-sm font-extrabold text-slate-900 group-hover:text-emerald-700 transition">
                      {sc.name}
                    </h3>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed mb-4">
                    {sc.desc}
                  </p>

                  <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-200/60 font-mono text-[11px] text-slate-700 space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block font-sans">
                      Expected Behavior:
                    </span>
                    <p className="text-xs">{sc.expected}</p>
                  </div>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRunScenario(sc);
                  }}
                  disabled={isRunning}
                  className="mt-5 w-full flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-emerald-600 active:scale-95 transition shadow-sm disabled:opacity-50"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>{activeScenario === sc.id ? 'Dispatching...' : 'Trigger Scenario'}</span>
                </button>
              </div>
            </InteractiveHoverCard>
          );
        })}
      </div>
    </div>
  );
}
