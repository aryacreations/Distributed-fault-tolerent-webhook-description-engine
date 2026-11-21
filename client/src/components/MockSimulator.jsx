import React, { useState } from 'react';
import { Play, RotateCcw, AlertOctagon, Timer, Zap, CheckCircle } from 'lucide-react';
import { dispatchWebhook, resetMockReceiver } from '../services/api';

export default function MockSimulator({ onTriggeredTest }) {
  const [isRunning, setIsRunning] = useState(false);
  const [activeScenario, setActiveScenario] = useState(null);
  const [notice, setNotice] = useState(null);

  const getBaseMockUrl = () => {
    return window.location.origin.includes('localhost')
      ? 'http://localhost:5000/api/mock-receiver'
      : `${window.location.origin}/api/mock-receiver`;
  };

  const handleRunScenario = async (scenario) => {
    setIsRunning(true);
    setActiveScenario(scenario.id);
    setNotice(null);

    const baseUrl = getBaseMockUrl();
    const eventId = `sim_${scenario.id}_${Date.now()}`;

    try {
      if (scenario.id === 'rapid_fire') {
        // Dispatch 8 simultaneous webhooks to the same domain to trigger domain rate-limiter
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
        setNotice('Dispatched 8 concurrent events! Watch domain rate limiter buffer and stagger requests.');
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
        setNotice(`Triggered: ${scenario.name}. Check the jobs table below to observe worker execution!`);
      }

      if (onTriggeredTest) onTriggeredTest();
    } catch (err) {
      setNotice(`Failed to trigger scenario: ${err.message}`);
    } finally {
      setIsRunning(false);
      setActiveScenario(null);
    }
  };

  const handleResetCounters = async () => {
    try {
      await resetMockReceiver();
      setNotice('Mock receiver simulation counters reset successfully.');
    } catch (err) {
      setNotice('Could not reset counters: ' + err.message);
    }
  };

  const scenarios = [
    {
      id: 'success',
      name: 'Instant Success (200 OK)',
      desc: 'Normal single-attempt delivery path',
      event: 'invoice.paid',
      expected: 'Delivers on Attempt #1 in ~200ms',
      badge: '200 OK',
      badgeColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
      url: (base) => `${base}?status=200`,
    },
    {
      id: 'recovering',
      name: 'Self-Healing Flaky Server',
      desc: 'Fails attempts 1 & 2 (500), recovers on attempt 3 (200)',
      event: 'order.placed',
      expected: 'Exponential backoff: 2s wait -> 4s wait -> Success!',
      badge: 'Backoff Demo',
      badgeColor: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
      url: (base, evtId) => `${base}?failUntil=2&code=500&key=${evtId}`,
    },
    {
      id: 'dlq',
      name: 'Exhausted Retries (DLQ)',
      desc: 'Permanent 500 error; all 3 retries will fail',
      event: 'critical.alert',
      expected: 'Waits 2s, 4s, 8s -> Moves to FAILED Dead-Letter',
      badge: 'Max 3 Retries',
      badgeColor: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
      url: (base) => `${base}?status=500`,
    },
    {
      id: 'rate_limited',
      name: 'Downstream 429 Throttle',
      desc: 'Target server returns 429 Too Many Requests',
      event: 'sync.customer',
      expected: 'Treated as transient error and safely retried',
      badge: 'HTTP 429',
      badgeColor: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
      url: (base) => `${base}?status=429`,
    },
    {
      id: 'timeout',
      name: 'Hard Timeout (5000ms)',
      desc: 'Server hangs for 6500ms; triggers client abort',
      event: 'export.ready',
      expected: 'Aborted at 5000ms threshold -> scheduled for retry',
      badge: '5s Timeout',
      badgeColor: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
      url: (base) => `${base}?delay=6500`,
    },
    {
      id: 'rapid_fire',
      name: 'Rapid Fire Burst (8 Jobs)',
      desc: 'Bursts 8 requests to same domain simultaneously',
      event: 'batch.export',
      expected: 'Token Bucket throttles to 5 req/s without crashing target',
      badge: 'Rate Limiter',
      badgeColor: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
      url: (base) => `${base}?status=200`,
    },
  ];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base font-semibold text-white flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-400" />
            Interview Test Suite & Scenarios
          </h2>
          <p className="text-xs text-slate-400">
            One-click triggers for edge cases: test retries, backoff, timeouts, and rate limits live.
          </p>
        </div>

        <button
          onClick={handleResetCounters}
          title="Reset simulation counters"
          className="flex items-center space-x-1 px-2.5 py-1 text-[11px] font-medium text-slate-400 hover:text-slate-200 bg-slate-800/80 hover:bg-slate-800 rounded border border-slate-700 transition"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Reset Counters</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {scenarios.map((sc) => (
          <div
            key={sc.id}
            className="bg-slate-950/70 border border-slate-800 hover:border-slate-700 rounded-lg p-3.5 flex flex-col justify-between transition group"
          >
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-semibold text-slate-200 group-hover:text-emerald-400 transition">
                  {sc.name}
                </span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono border ${sc.badgeColor}`}>
                  {sc.badge}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 leading-snug mb-2">
                {sc.desc}
              </p>
              <div className="text-[10px] text-slate-400 bg-slate-900/90 rounded px-2 py-1 font-mono border border-slate-800">
                Expected: {sc.expected}
              </div>
            </div>

            <button
              onClick={() => handleRunScenario(sc)}
              disabled={isRunning}
              className="mt-3 w-full flex items-center justify-center space-x-1.5 text-[11px] font-medium py-1.5 px-3 rounded bg-slate-800 hover:bg-emerald-600 hover:text-white text-slate-300 transition border border-slate-700 hover:border-emerald-500 disabled:opacity-50"
            >
              <Play className="w-3 h-3 fill-current" />
              <span>{activeScenario === sc.id ? 'Triggering...' : 'Trigger Scenario'}</span>
            </button>
          </div>
        ))}
      </div>

      {notice && (
        <div className="mt-3 p-2.5 bg-slate-800/90 border border-slate-700 rounded text-xs text-slate-300 flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{notice}</span>
        </div>
      )}
    </div>
  );
}
