import React, { useState } from 'react';
import sounds from '../utils/soundEngine';
import { Info, Sparkles, Code2, MessageSquare, Zap } from 'lucide-react';

/**
 * Interactive Hover Inspector Wrapper
 * Plays realistic UI sound on hover and surfaces an architectural explanation
 * with specific interview talking points for every button, card, and section.
 */
export default function InteractiveHoverCard({
  title,
  category = 'Architecture',
  description,
  underTheHood,
  interviewTip,
  position = 'top',
  children,
  className = '',
}) {
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseEnter = () => {
    sounds.playHover();
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
  };

  // Position styles for the floating popover
  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2.5',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2.5',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2.5',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2.5',
  };

  return (
    <div
      className={`relative inline-block ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}

      {/* Interactive Floating Hover Popover */}
      {isHovered && title && (
        <div
          className={`absolute z-50 w-72 sm:w-80 pointer-events-none transition-all duration-200 animate-fadeIn ${
            positionClasses[position] || positionClasses.top
          }`}
        >
          <div className="bg-slate-900/95 backdrop-blur-xl border border-emerald-500/40 rounded-2xl p-3.5 shadow-2xl text-left text-xs space-y-2 text-slate-200 ring-1 ring-emerald-500/20">
            {/* Header */}
            <div className="flex items-center justify-between pb-1.5 border-b border-slate-800">
              <div className="flex items-center space-x-1.5 min-w-0">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="font-extrabold text-white text-xs truncate">
                  {title}
                </span>
              </div>
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono border border-emerald-500/30 shrink-0">
                {category}
              </span>
            </div>

            {/* Description */}
            {description && (
              <p className="text-[11px] text-slate-300 leading-relaxed font-sans">
                {description}
              </p>
            )}

            {/* Under The Hood Details */}
            {underTheHood && (
              <div className="p-2 rounded-xl bg-slate-950/80 border border-slate-800 text-[10px] space-y-0.5 font-mono">
                <div className="flex items-center gap-1 text-slate-400 font-bold uppercase tracking-wider text-[9px]">
                  <Code2 className="w-3 h-3 text-cyan-400" />
                  <span>Under The Hood:</span>
                </div>
                <p className="text-cyan-300 leading-snug">{underTheHood}</p>
              </div>
            )}

            {/* Interview Talking Point */}
            {interviewTip && (
              <div className="p-2 rounded-xl bg-emerald-950/50 border border-emerald-500/30 text-[10px] space-y-0.5">
                <div className="flex items-center gap-1 text-emerald-400 font-bold uppercase tracking-wider text-[9px]">
                  <MessageSquare className="w-3 h-3 text-emerald-400" />
                  <span>Interview Tip:</span>
                </div>
                <p className="text-emerald-200 leading-snug italic font-sans">
                  "{interviewTip}"
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
