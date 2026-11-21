import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Volume2, 
  VolumeX, 
  X, 
  ChevronRight, 
  ChevronLeft, 
  CheckCircle2, 
  AlertTriangle, 
  Zap, 
  Layers, 
  Database, 
  ShieldCheck,
  Send,
  Sparkles,
  Headphones
} from 'lucide-react';

const CHAPTERS = [
  {
    id: 1,
    title: 'The Challenge: Fragile Distributed Webhooks',
    subtitle: 'Why synchronous delivery crashes modern backends',
    duration: 16,
    script:
      'In distributed architectures, services broadcast webhook events to third-party clients. But external target servers can crash, experience heavy latency, or suffer downtime. If your backend waits for external responses synchronously, worker threads get blocked, causing connection exhaustion and cascading system outages.',
    badge: 'Problem Definition',
    badgeColor: 'bg-rose-100 text-rose-800 border-rose-200',
  },
  {
    id: 2,
    title: 'Sub-30ms Non-Blocking Ingestion',
    subtitle: 'Physical decoupling via Redis and BullMQ',
    duration: 16,
    script:
      'Our Ingestion API solves this through non-blocking design. When a client dispatches an event, the API validates the schema, records an initial state, pushes the job to a Redis BullMQ queue, and returns HTTP 202 Accepted in under 30 milliseconds. The caller is never blocked by downstream network delays.',
    badge: 'HTTP 202 Accepted',
    badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  },
  {
    id: 3,
    title: 'Fault-Tolerant Exponential Backoff',
    subtitle: 'Resilient retries without thundering-herd overload',
    duration: 20,
    script:
      'When our background worker sends an HTTP request, it categorizes errors. Permanent 4xx client errors fail fast. But transient 5xx errors, 429 rate limits, and network timeouts trigger automatic retries scheduled with exponential backoff: waiting 2 seconds, then 4 seconds, then 8 seconds. If 3 retries fail, it moves to the Dead Letter Queue.',
    badge: '2s -> 4s -> 8s Backoff',
    badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
  },
  {
    id: 4,
    title: 'Per-Destination Domain Rate Limiting',
    subtitle: 'Protecting partner servers with a Redis Token Bucket',
    duration: 18,
    script:
      'If an upstream service bursts hundreds of webhooks to the same destination domain, blasting them simultaneously acts as an accidental denial-of-service. Our engine enforces an in-memory Redis Sliding Window Token Bucket, capping outbound dispatches to 5 requests per second per domain while smoothly buffering the rest.',
    badge: 'Token Bucket',
    badgeColor: 'bg-cyan-100 text-cyan-800 border-cyan-200',
  },
  {
    id: 5,
    title: 'Immutable Audit Trail & Observability',
    subtitle: 'Full MongoDB persistence and real-time React dashboard',
    duration: 16,
    script:
      'Every single delivery attempt is logged in MongoDB Atlas with exact latency in milliseconds, HTTP response codes, and error payloads. Developers and interviewers can inspect the complete execution timeline live on our React glassmorphic dashboard or test edge cases with one-click simulations.',
    badge: 'Full Observability',
    badgeColor: 'bg-purple-100 text-purple-800 border-purple-200',
  },
];

/**
 * Play a gentle introductory chime via Web Audio API (works across all browsers)
 */
function playAudioChime() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(523.25, now); // C5
    osc.frequency.exponentialRampToValueAtTime(659.25, now + 0.15); // E5
    osc.frequency.exponentialRampToValueAtTime(783.99, now + 0.3); // G5

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.6);
  } catch {
    // Ignore audio context errors if browser blocks
  }
}

export default function AnimatedExplainerModal({ isOpen, onClose }) {
  const [currentChapter, setCurrentChapter] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [availableVoices, setAvailableVoices] = useState([]);

  const progressTimerRef = useRef(null);
  const keepAliveTimerRef = useRef(null);

  // Initialize and load system voices reliably
  useEffect(() => {
    if (!('speechSynthesis' in window)) return;

    const updateVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      if (voices && voices.length > 0) {
        setAvailableVoices(voices);
      }
    };

    updateVoices();
    window.speechSynthesis.onvoiceschanged = updateVoices;

    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.onvoiceschanged = null;
      }
    };
  }, []);

  // Speak narration text with anti-stall keepalive
  const speakChapter = (chapterIndex) => {
    if (!('speechSynthesis' in window)) return;

    // Reset previous utterances
    window.speechSynthesis.cancel();
    clearInterval(keepAliveTimerRef.current);

    if (isMuted) return;

    // Unpause if stuck in paused state from previous sessions
    window.speechSynthesis.resume();

    const text = CHAPTERS[chapterIndex].script;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 1.0;
    utterance.pitch = 1.02;

    // Select natural English voice
    const voices = availableVoices.length > 0 ? availableVoices : window.speechSynthesis.getVoices();
    const selectedVoice = 
      voices.find((v) => v.lang.startsWith('en') && (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Samantha') || v.name.includes('David') || v.name.includes('Jenny') || v.name.includes('Guy'))) ||
      voices.find((v) => v.lang.startsWith('en')) ||
      voices[0];

    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }

    utterance.onend = () => {
      clearInterval(keepAliveTimerRef.current);
      if (chapterIndex < CHAPTERS.length - 1) {
        handleGoToChapter(chapterIndex + 1);
      } else {
        setIsPlaying(false);
      }
    };

    utterance.onerror = (e) => {
      console.warn('[SpeechSynthesis notice]', e.error);
      clearInterval(keepAliveTimerRef.current);
    };

    // Chrome SpeechSynthesis Anti-Stall Hack
    keepAliveTimerRef.current = setInterval(() => {
      if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
        window.speechSynthesis.pause();
        window.speechSynthesis.resume();
      }
    }, 6000);

    // Save global reference to prevent V8 garbage collection
    window._explainerUtterance = utterance;
    window.speechSynthesis.speak(utterance);
  };

  const handleStartTour = () => {
    playAudioChime();
    setHasStarted(true);
    setIsPlaying(true);
    speakChapter(0);
  };

  const handleGoToChapter = (index) => {
    window.speechSynthesis.cancel();
    clearInterval(keepAliveTimerRef.current);
    setCurrentChapter(index);
    setProgress(0);
    if (isPlaying) {
      speakChapter(index);
    }
  };

  const handleTogglePlay = () => {
    if (isPlaying) {
      window.speechSynthesis.pause();
      setIsPlaying(false);
    } else {
      setIsPlaying(true);
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      } else {
        speakChapter(currentChapter);
      }
    }
  };

  const handleToggleMute = () => {
    if (!isMuted) {
      window.speechSynthesis.cancel();
      clearInterval(keepAliveTimerRef.current);
      setIsMuted(true);
    } else {
      setIsMuted(false);
      if (isPlaying) {
        speakChapter(currentChapter);
      }
    }
  };

  // Progress timer for scrubber bar
  useEffect(() => {
    if (!isPlaying) {
      clearInterval(progressTimerRef.current);
      return;
    }

    const durationMs = CHAPTERS[currentChapter].duration * 1000;
    const intervalMs = 100;
    const step = (intervalMs / durationMs) * 100;

    progressTimerRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) return 100;
        return prev + step;
      });
    }, intervalMs);

    return () => clearInterval(progressTimerRef.current);
  }, [isPlaying, currentChapter]);

  // Clean reset when modal closes
  useEffect(() => {
    if (!isOpen) {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      clearInterval(progressTimerRef.current);
      clearInterval(keepAliveTimerRef.current);
      setIsPlaying(false);
      setHasStarted(false);
      setProgress(0);
      setCurrentChapter(0);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const current = CHAPTERS[currentChapter];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-white/95 backdrop-blur-2xl border border-white/90 rounded-3xl w-full max-w-5xl max-h-[95vh] flex flex-col shadow-2xl overflow-hidden font-sans">
        {/* Top Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center shadow-md text-white font-black text-sm">
              ▶
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-extrabold text-slate-900 tracking-tight">
                  System Architecture Explainer
                </h3>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${current.badgeColor}`}>
                  {current.badge}
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                Chapter {currentChapter + 1} of {CHAPTERS.length}: {current.title}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleToggleMute}
              title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition"
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-rose-500" /> : <Volume2 className="w-4 h-4 text-emerald-600" />}
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Video Canvas Stage */}
        <div className="relative flex-1 min-h-[350px] sm:min-h-[420px] bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 p-6 flex flex-col items-center justify-center overflow-hidden">
          {/* Animated Background Mesh */}
          <div className="absolute inset-0 opacity-20 pointer-events-none">
            <div className="absolute -top-24 -left-24 w-96 h-96 bg-emerald-500 rounded-full blur-3xl animate-pulse" />
            <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-cyan-500 rounded-full blur-3xl animate-pulse" />
          </div>

          {/* User Gesture Start Overlay (Fixes Browser Autoplay Block) */}
          {!hasStarted ? (
            <div className="relative z-20 flex flex-col items-center text-center p-6 space-y-5 animate-fadeIn">
              <div className="w-16 h-16 rounded-3xl bg-emerald-600/20 border border-emerald-500/40 flex items-center justify-center shadow-2xl text-emerald-400">
                <Headphones className="w-8 h-8 animate-bounce" />
              </div>
              <div>
                <h3 className="text-xl font-extrabold text-white">
                  Distributed Webhook Engine Tour
                </h3>
                <p className="text-xs text-slate-400 mt-1 max-w-md">
                  5-chapter animated walkthrough with English voiceover narration explaining non-blocking ingestion, exponential backoff, and rate limiting.
                </p>
              </div>

              <button
                onClick={handleStartTour}
                className="flex items-center space-x-2 px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-sm shadow-xl shadow-emerald-600/30 active:scale-95 transition"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Start Tour with Sound</span>
              </button>
            </div>
          ) : (
            /* Active Animation Stage */
            <div className="relative z-10 w-full max-w-3xl">
              {currentChapter === 0 && (
                /* Scene 1: The Problem */
                <div className="flex flex-col items-center text-center space-y-6 animate-fadeIn">
                  <div className="flex items-center justify-center gap-4 sm:gap-8 w-full">
                    <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700 text-slate-200 text-center w-36">
                      <Send className="w-6 h-6 mx-auto mb-2 text-blue-400" />
                      <span className="text-xs font-bold block">Caller Service</span>
                      <span className="text-[10px] text-slate-400">Blocked Thread</span>
                    </div>

                    <div className="flex flex-col items-center">
                      <span className="text-[11px] text-rose-400 font-bold mb-1 animate-pulse">10s Synchronous Wait...</span>
                      <div className="w-24 sm:w-36 h-1 bg-gradient-to-r from-blue-500 via-rose-500 to-rose-600 rounded-full" />
                      <span className="text-[10px] text-slate-500 mt-1">Threads Exhausted</span>
                    </div>

                    <div className="p-4 rounded-2xl bg-rose-950/60 border border-rose-500/50 text-rose-200 text-center w-36">
                      <AlertTriangle className="w-6 h-6 mx-auto mb-2 text-rose-400 animate-bounce" />
                      <span className="text-xs font-bold block">External Server</span>
                      <span className="text-[10px] text-rose-400">504 Timeout / Down</span>
                    </div>
                  </div>

                  <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300 max-w-md">
                    <strong>Risk:</strong> Cascading failures. One slow customer endpoint exhausts connection pools across the entire application.
                  </div>
                </div>
              )}

              {currentChapter === 1 && (
                /* Scene 2: 202 Ingestion */
                <div className="flex flex-col items-center text-center space-y-6 animate-fadeIn">
                  <div className="flex items-center justify-between gap-4 w-full">
                    <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700 text-slate-200 text-center w-36">
                      <Send className="w-6 h-6 mx-auto mb-2 text-emerald-400" />
                      <span className="text-xs font-bold block">Client Ingest</span>
                      <span className="text-[10px] text-emerald-400">&lt;30ms Roundtrip</span>
                    </div>

                    <div className="flex-1 flex flex-col items-center px-2">
                      <div className="flex items-center justify-center gap-1 text-[11px] font-mono text-emerald-400 mb-1">
                        <Sparkles className="w-3.5 h-3.5 text-emerald-400 animate-spin" />
                        <span>202 Accepted {`{ jobId }`}</span>
                      </div>
                      <div className="w-full h-1 bg-emerald-500 rounded-full relative overflow-hidden">
                        <div className="w-1/3 h-full bg-white animate-slide" />
                      </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-800/80 border border-emerald-500/50 text-slate-200 text-center w-36 shadow-lg shadow-emerald-500/20">
                      <Layers className="w-6 h-6 mx-auto mb-2 text-emerald-400" />
                      <span className="text-xs font-bold block">Redis BullMQ</span>
                      <span className="text-[10px] text-slate-400">Instant FIFO Push</span>
                    </div>
                  </div>

                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-300 max-w-md">
                    <strong>Solution:</strong> Ingestion returns immediately. The client never waits for downstream execution.
                  </div>
                </div>
              )}

              {currentChapter === 2 && (
                /* Scene 3: Exponential Backoff */
                <div className="flex flex-col items-center text-center space-y-5 animate-fadeIn">
                  <div className="grid grid-cols-3 gap-3 w-full">
                    <div className="p-3 bg-slate-900 border border-slate-700 rounded-2xl text-slate-300">
                      <span className="text-[10px] text-slate-400 block font-mono">Attempt #1</span>
                      <span className="text-xs font-bold text-rose-400 block mt-1">HTTP 500 Error</span>
                      <span className="text-[10px] text-amber-400 block mt-2 font-mono">Wait: 2 Seconds</span>
                    </div>

                    <div className="p-3 bg-slate-900 border border-slate-700 rounded-2xl text-slate-300">
                      <span className="text-[10px] text-slate-400 block font-mono">Attempt #2</span>
                      <span className="text-xs font-bold text-rose-400 block mt-1">HTTP 500 Error</span>
                      <span className="text-[10px] text-amber-400 block mt-2 font-mono">Wait: 4 Seconds</span>
                    </div>

                    <div className="p-3 bg-emerald-950/60 border border-emerald-500/60 rounded-2xl text-emerald-200 shadow-lg shadow-emerald-500/20">
                      <span className="text-[10px] text-emerald-400 block font-mono">Attempt #3</span>
                      <span className="text-xs font-bold text-emerald-300 block mt-1">HTTP 200 OK!</span>
                      <span className="text-[10px] text-emerald-400 block mt-2 font-mono">Delivered!</span>
                    </div>
                  </div>

                  <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-amber-300 max-w-md">
                    <strong>Formula:</strong> <code>Delay = BaseDelay &times; 2<sup>(attempt - 1)</sup></code>. Avoids thundering-herd crash loops.
                  </div>
                </div>
              )}

              {currentChapter === 3 && (
                /* Scene 4: Rate Limiting */
                <div className="flex flex-col items-center text-center space-y-5 animate-fadeIn">
                  <div className="flex items-center justify-between gap-4 w-full">
                    <div className="p-4 rounded-2xl bg-slate-800 border border-slate-700 text-slate-300 w-36">
                      <span className="text-base font-extrabold text-cyan-400 block">8 Burst</span>
                      <span className="text-[10px] text-slate-400">Concurrent Jobs</span>
                    </div>

                    <div className="p-4 rounded-2xl bg-cyan-950/80 border border-cyan-500/60 text-cyan-200 text-center w-48 shadow-lg shadow-cyan-500/20">
                      <ShieldCheck className="w-6 h-6 mx-auto mb-1 text-cyan-400" />
                      <span className="text-xs font-bold block">Token Bucket</span>
                      <span className="text-[10px] text-cyan-300">Max 5 req/s per domain</span>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-800 border border-slate-700 text-slate-300 w-36">
                      <span className="text-base font-extrabold text-emerald-400 block">Smooth</span>
                      <span className="text-[10px] text-slate-400">Target Protected</span>
                    </div>
                  </div>

                  <div className="p-3 bg-cyan-500/10 border border-cyan-500/30 rounded-xl text-xs text-cyan-300 max-w-md">
                    <strong>Fairness:</strong> Throttles per destination hostname. High traffic to Partner A never slows down Partner B.
                  </div>
                </div>
              )}

              {currentChapter === 4 && (
                /* Scene 5: MongoDB Audit & UI */
                <div className="flex flex-col items-center text-center space-y-5 animate-fadeIn">
                  <div className="grid grid-cols-2 gap-4 w-full">
                    <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700 text-slate-200 text-left">
                      <div className="flex items-center gap-2 mb-2">
                        <Database className="w-5 h-5 text-emerald-400" />
                        <span className="text-xs font-bold">MongoDB Atlas</span>
                      </div>
                      <ul className="text-[11px] text-slate-400 space-y-1 font-mono">
                        <li>&bull; Polymorphic BSON payload</li>
                        <li>&bull; Append-only attempt log</li>
                        <li>&bull; Roundtrip duration (ms)</li>
                      </ul>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700 text-slate-200 text-left">
                      <div className="flex items-center gap-2 mb-2">
                        <Zap className="w-5 h-5 text-purple-400" />
                        <span className="text-xs font-bold">React Console</span>
                      </div>
                      <ul className="text-[11px] text-slate-400 space-y-1 font-mono">
                        <li>&bull; 1-Click edge case lab</li>
                        <li>&bull; Step-by-step visual modal</li>
                        <li>&bull; Live Redis queue counters</li>
                      </ul>
                    </div>
                  </div>

                  <div className="p-3 bg-purple-500/10 border border-purple-500/30 rounded-xl text-xs text-purple-300 max-w-md">
                    <strong>Production Ready:</strong> Full transparency with immutable audit trails and live telemetry.
                  </div>
                </div>
              )}

              {/* Subtitles / Captions Banner */}
              <div className="mt-6 p-3.5 bg-slate-900/90 backdrop-blur-md rounded-2xl border border-slate-800 text-slate-200 text-xs sm:text-sm text-center leading-relaxed shadow-lg">
                <span className="text-emerald-400 font-bold mr-2">[Narrator]:</span>
                {current.script}
              </div>
            </div>
          )}
        </div>

        {/* Video Progress Scrubber */}
        <div className="w-full bg-slate-200 h-1.5 relative overflow-hidden">
          <div
            className="bg-emerald-600 h-full transition-all duration-100 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Bottom Controls */}
        <div className="p-4 sm:p-5 border-t border-slate-100 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Chapter Selector Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {CHAPTERS.map((ch, idx) => (
              <button
                key={ch.id}
                onClick={() => handleGoToChapter(idx)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                  currentChapter === idx
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {idx + 1}. {ch.badge}
              </button>
            ))}
          </div>

          {/* Playback Controls */}
          <div className="flex items-center justify-end space-x-2 shrink-0">
            <button
              disabled={currentChapter === 0}
              onClick={() => handleGoToChapter(currentChapter - 1)}
              className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 disabled:opacity-40 transition"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <button
              onClick={handleTogglePlay}
              className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-600/20 active:scale-95 transition"
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
              <span>{isPlaying ? 'Pause' : 'Play'}</span>
            </button>

            <button
              disabled={currentChapter === CHAPTERS.length - 1}
              onClick={() => handleGoToChapter(currentChapter + 1)}
              className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 disabled:opacity-40 transition"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
