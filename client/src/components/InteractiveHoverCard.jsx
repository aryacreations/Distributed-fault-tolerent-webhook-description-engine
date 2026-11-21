import React, { useState } from 'react';
import { useTour } from '../context/TourContext';
import sounds from '../utils/soundEngine';
import { Sparkles, Code2, CheckCircle2, HelpCircle } from 'lucide-react';

/**
 * Realistic Light Glassmorphic Hover Inspector
 * Only active when the user explicitly turns ON the Interactive Tour.
 * Formatted for real clients and users to understand the system and dashboard.
 */
export default function InteractiveHoverCard({
  title,
  category = 'Feature',
  description,
  underTheHood,
  clientBenefit,
  position = 'top',
  children,
  className = '',
}) {
  const { isTourActive } = useTour();
  const [isHovered, setIsHovered] = useState(false);

  // If Tour is paused / OFF, do not show popups or play sounds
  const handleMouseEnter = () => {
    if (!isTourActive) return;
    sounds.playHover();
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
  };

  // Position styles for floating glass popover
  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-3',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-3',
    left: 'right-full top-1/2 -translate-y-1/2 mr-3',
    right: 'left-full top-1/2 -translate-y-1/2 ml-3',
  };

  return (
    <div
      className={`relative inline-block ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* If tour is active, show subtle glowing hint on element */}
      {isTourActive && (
        <span className="absolute -top-1 -right-1 flex h-2 w-2 z-10 pointer-events-none">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
        </span>
      )}

      {children}

      {/* Realistic Light Glassmorphic Popover (Only visible when Tour is ON) */}
      {isTourActive && isHovered && title && (
        <div
          className={`absolute z-50 w-72 sm:w-80 pointer-events-none transition-all duration-200 ${
            positionClasses[position] || positionClasses.top
          }`}
        >
          <div className="bg-white/90 backdrop-blur-2xl border border-white/95 rounded-2xl p-4 shadow-2xl shadow-slate-400/25 text-left text-xs space-y-2.5 text-slate-800 ring-1 ring-slate-900/5 animate-fadeIn">
            {/* Header */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center space-x-2 min-w-0">
                <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200/60 shrink-0">
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
                <span className="font-extrabold text-slate-900 text-xs truncate">
                  {title}
                </span>
              </div>
              <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-mono border border-slate-200 shrink-0">
                {category}
              </span>
            </div>

            {/* Description / Purpose */}
            {description && (
              <p className="text-[11px] text-slate-600 leading-relaxed font-sans">
                {description}
              </p>
            )}

            {/* Under The Hood Details */}
            {underTheHood && (
              <div className="p-2.5 rounded-xl bg-slate-50/90 border border-slate-200/70 text-[10px] space-y-1">
                <div className="flex items-center gap-1 text-slate-500 font-bold uppercase tracking-wider text-[9px]">
                  <Code2 className="w-3 h-3 text-emerald-600" />
                  <span>How It Works:</span>
                </div>
                <p className="text-slate-700 leading-snug font-mono text-[10px]">{underTheHood}</p>
              </div>
            )}

            {/* Client Value / User Benefit */}
            {clientBenefit && (
              <div className="p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-200/70 text-[10px] space-y-1">
                <div className="flex items-center gap-1 text-emerald-700 font-bold uppercase tracking-wider text-[9px]">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  <span>Client Benefit:</span>
                </div>
                <p className="text-emerald-950 leading-snug font-sans text-[11px]">
                  {clientBenefit}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
