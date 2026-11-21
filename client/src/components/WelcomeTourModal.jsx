import React from 'react';
import { Compass, Play, X, Sparkles, CheckCircle2, ArrowRight } from 'lucide-react';
import sounds from '../utils/soundEngine';

export default function WelcomeTourModal({ isOpen, onStartTour, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-fadeIn">
      <div className="bg-white/95 backdrop-blur-2xl border border-white/90 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl shadow-slate-400/25 text-left space-y-5 ring-1 ring-slate-900/5 animate-scaleIn">
        {/* Top Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/20 text-white font-black text-xl">
              ⚡
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Distributed Engine
                </span>
              </div>
              <h3 className="text-lg font-extrabold text-slate-900 tracking-tight mt-0.5">
                Welcome to Dispatcher Console
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

        {/* Overview Pitch */}
        <p className="text-xs text-slate-600 leading-relaxed font-sans">
          Would you like a <strong>60-second Autopilot Virtual Tour</strong>? The tour will automatically navigate sections, auto-hover features, and explain the non-blocking architecture step-by-step.
        </p>

        {/* Feature Highlights */}
        <div className="space-y-2 p-3.5 bg-slate-50/80 rounded-2xl border border-slate-200/60 text-xs">
          <div className="flex items-center gap-2 text-slate-700 font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Automated tab-by-tab walkthrough</span>
          </div>
          <div className="flex items-center gap-2 text-slate-700 font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Auto-hovering architectural explanations</span>
          </div>
          <div className="flex items-center gap-2 text-slate-700 font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Live failure mode and retry simulation demo</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
          <button
            onClick={() => {
              sounds.playSuccess();
              onStartTour();
            }}
            className="w-full sm:w-auto flex-1 flex items-center justify-center space-x-2 py-3 px-5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-600/25 transition active:scale-95"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Start Virtual Tour (Autopilot)</span>
          </button>

          <button
            onClick={() => {
              sounds.playClick();
              onClose();
            }}
            className="w-full sm:w-auto py-3 px-4 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
          >
            Explore on My Own
          </button>
        </div>
      </div>
    </div>
  );
}
