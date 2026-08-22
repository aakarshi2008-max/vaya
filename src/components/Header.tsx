import React, { useState } from 'react';
import { Zap, Users, Activity, Sparkles, Sun, Flame, Menu, X } from 'lucide-react';

interface HeaderProps {
  theme: 'hh-goa' | 'rose-white';
  onToggleTheme: () => void;
  onOpenBenchmark?: () => void;
  onOpenTeam?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  theme,
  onToggleTheme,
  onOpenBenchmark,
  onOpenTeam,
}) => {
  const isHHGoa = theme === 'hh-goa';

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--theme-border-subtle)] bg-[var(--theme-card-bg)]/90 backdrop-blur-xl px-4 py-3 sm:px-8 transition-colors shadow-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
        {/* Brand Logo */}
        <a href="#" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center font-black text-xl app-btn-primary">
            <Zap className="w-5 h-5 fill-current" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-lg tracking-wider text-[var(--theme-text-title)]">
                JULIE
              </span>
              <span className="app-badge">
                {isHHGoa ? 'HH GOA 2026' : 'WHITE + PINK'}
              </span>
            </div>
            <p className="font-mono text-[10px] text-[var(--theme-text-muted)]">
              HH GOA 2026 · TASK 02
            </p>
          </div>
        </a>

        {/* Right CTA Actions: Theme Switcher, SLA Badge & Team Button */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Animated Theme Toggler Pill */}
          <button
            onClick={onToggleTheme}
            className="px-3.5 py-1.5 rounded-full border font-mono text-xs font-black flex items-center gap-2 cursor-pointer app-btn-primary shadow-sm"
            title={`Switch to ${isHHGoa ? 'White + Pink' : 'HH Goa Official'} theme`}
          >
            {isHHGoa ? (
              <>
                <Sun className="w-3.5 h-3.5 animate-spin-slow" />
                <span>WHITE+PINK</span>
              </>
            ) : (
              <>
                <Flame className="w-3.5 h-3.5" />
                <span>HH GOA VIBE</span>
              </>
            )}
          </button>

          {/* Sub-200ms Badge */}
          <div className="hidden items-center gap-2 font-mono text-[11px] font-bold sm:flex app-badge">
            <span className="h-2 w-2 animate-ping rounded-full bg-[var(--theme-accent-primary)]" />
            &lt; 200MS TARGET MET
          </div>

          {onOpenBenchmark && (
            <button
              onClick={onOpenBenchmark}
              className="rounded-full px-4 py-2 font-mono text-xs font-black flex items-center gap-1.5 cursor-pointer app-card-subtle hover:border-[var(--theme-border)] transition-all"
            >
              <Activity className="w-3.5 h-3.5" />
              BENCHMARK
            </button>
          )}

          {onOpenTeam && (
            <button
              onClick={onOpenTeam}
              className="rounded-full px-5 py-2 font-mono text-xs font-black inline-flex items-center gap-1.5 cursor-pointer app-btn-primary"
            >
              <Users className="w-3.5 h-3.5" />
              TEAM
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
