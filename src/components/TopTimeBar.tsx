import React, { useState } from 'react';
import {
  BookOpen,
  ChevronRight,
  Clock,
  EyeOff,
  FastForward,
  GitBranch,
  Pause,
  Play,
  SlidersHorizontal,
} from 'lucide-react';
import { soundscape } from '../audio/SoundscapeEngine';
import { WorldClock } from '../simulation/WorldClock';
import { useGameStore } from '../state/useGameStore';
import { NightNumber } from '../types/game';

export const TopTimeBar: React.FC = () => {
  const {
    night,
    minute,
    timeScale,
    isPaused,
    gameplayMode,
    debugMode,
    hudHidden,
    collectedClues,
    unlockedHypothesisIds,
    highContrastUi,
    setNight,
    setMinute,
    advanceToNextNight,
    setTimeScale,
    togglePause,
    setGameplayMode,
    toggleHudHidden,
  } = useGameStore();

  const [showSpeedMenu, setShowSpeedMenu] = useState(false);

  if (hudHidden) {
    return (
      <button
        data-testid="exit-cinematic-mode-btn"
        onClick={toggleHudHidden}
        className="pointer-events-auto fixed top-3 right-3 z-20 p-2 rounded-full bg-slate-950/60 border border-slate-800/60 text-slate-400 hover:text-amber-300 backdrop-blur-md transition"
        title="Exit Cinematic Mode [H]"
      >
        <EyeOff className="w-3.5 h-3.5" />
      </button>
    );
  }

  const formattedClock = WorldClock.formatTime(minute);
  const cluesTonight = collectedClues.filter((c) => c.collectedAtNight === night).length;
  const canAdvanceNight = night < 3 && (minute >= 135 || cluesTonight >= 2);

  return (
    <header
      className={`pointer-events-auto fixed top-0 left-0 right-0 z-20 h-11 flex items-center justify-between px-3.5 transition-colors ${
        highContrastUi
          ? 'bg-black/95 border-b border-amber-400 text-white'
          : 'bg-[#04070d]/75 border-b border-slate-800/50 backdrop-blur-md text-slate-200'
      }`}
    >
      {/* LEFT: Small Editorial Game Mark */}
      <div className="flex items-center gap-2.5">
        <span className="font-serif text-xs font-semibold tracking-[0.18em] text-slate-100 uppercase">
          WINDOWS AT 3AM
        </span>
        <span className="hidden sm:inline font-mono text-[10px] tracking-widest text-slate-500">
          // 412 MERCER
        </span>
      </div>

      {/* CENTER: Night Indicator, Deterministic Clock, Pause/Play & Optional Next-Night Trigger */}
      <div className="flex items-center gap-2">
        {debugMode ? (
          <div
            className="flex items-center gap-0.5 rounded bg-slate-900/90 p-0.5 border border-amber-500/40"
            role="group"
            aria-label="Debug Night Selector"
          >
            {([1, 2, 3] as NightNumber[]).map((n) => (
              <button
                key={n}
                data-testid={`night-btn-${n}`}
                onClick={() => {
                  soundscape.init();
                  setNight(n);
                }}
                className={`px-2 py-0.5 font-mono text-[10px] rounded transition ${
                  night === n
                    ? 'bg-amber-500/25 text-amber-300 font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                N{n}
              </button>
            ))}
          </div>
        ) : (
          <span
            data-testid="active-night-indicator"
            className="px-2 py-0.5 rounded bg-slate-900/80 border border-slate-800 font-mono text-[10px] tracking-widest text-amber-300/90 uppercase"
          >
            NIGHT {night}
          </span>
        )}

        <div className="flex items-center gap-1.5 bg-slate-950/75 border border-slate-800/80 rounded px-2.5 py-1">
          <Clock className="w-3 h-3 text-amber-400/90" />
          <span
            data-testid="world-clock-display"
            className="font-mono text-xs font-medium tracking-widest text-slate-100 min-w-[66px]"
          >
            {formattedClock}
          </span>

          {debugMode && (
            <input
              type="range"
              aria-label="Debug timeline minute scrubber"
              data-testid="timeline-scrubber"
              min={0}
              max={180}
              step={1}
              value={Math.floor(minute)}
              onChange={(e) => setMinute(Number(e.target.value))}
              className="w-20 accent-amber-400 cursor-pointer h-1 bg-slate-800 rounded"
              title="Debug Mode Scrubber"
            />
          )}

          <button
            data-testid="pause-toggle-btn"
            onClick={() => {
              soundscape.init();
              togglePause();
            }}
            className="p-0.5 rounded hover:bg-slate-800 text-slate-300 hover:text-white transition"
            title={isPaused ? 'Resume [Space]' : 'Pause [Space]'}
          >
            {isPaused ? (
              <Play className="w-3.5 h-3.5 text-amber-400" />
            ) : (
              <Pause className="w-3.5 h-3.5" />
            )}
          </button>

          {/* Compact Speed Popover Trigger */}
          <div className="relative">
            <button
              data-testid="speed-popover-btn"
              onClick={() => setShowSpeedMenu((v) => !v)}
              className="flex items-center gap-0.5 px-1.5 py-0.5 rounded font-mono text-[10px] text-slate-400 hover:text-slate-200 hover:bg-slate-800/70 transition"
              title="Observation Pace"
            >
              <FastForward className="w-3 h-3" />
              <span>{timeScale}x</span>
            </button>

            {showSpeedMenu && (
              <div className="absolute top-7 left-0 z-30 flex items-center gap-1 bg-[#060b14] border border-slate-700/80 rounded p-1 shadow-xl">
                {[1, 2, 5].map((spd) => (
                  <button
                    key={spd}
                    data-testid={`speed-btn-${spd}x`}
                    onClick={() => {
                      soundscape.init();
                      setTimeScale(spd);
                      setShowSpeedMenu(false);
                    }}
                    className={`px-2 py-0.5 rounded font-mono text-[10px] ${
                      !isPaused && timeScale === spd
                        ? 'bg-amber-500/25 text-amber-300 border border-amber-400/40'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {spd}x
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {canAdvanceNight && (
          <button
            data-testid="advance-night-btn"
            onClick={() => {
              soundscape.init();
              advanceToNextNight();
            }}
            className="flex items-center gap-1 px-2 py-1 rounded bg-amber-500/20 hover:bg-amber-500/35 border border-amber-400/50 text-amber-200 font-mono text-[10px] transition"
            title="Conclude tonight's watch and advance to next night"
          >
            <span>END WATCH</span>
            <ChevronRight className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* RIGHT: Compact Icon Controls (Journal, Deduction, Menu) */}
      <div className="flex items-center gap-1.5">
        <button
          data-testid="open-journal-btn"
          onClick={() =>
            setGameplayMode(gameplayMode === 'journal_open' ? 'observing' : 'journal_open')
          }
          className={`relative flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-mono border transition ${
            gameplayMode === 'journal_open'
              ? 'bg-amber-500/25 border-amber-400 text-amber-200'
              : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-600'
          }`}
          title="Observation Journal [J]"
        >
          <BookOpen className="w-3.5 h-3.5 text-amber-400" />
          <span className="hidden md:inline text-[11px]">JOURNAL</span>
          <span
            data-testid="clue-count-badge"
            className="px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-300 text-[10px]"
          >
            {collectedClues.length}
          </span>
        </button>

        <button
          data-testid="open-deduction-btn"
          onClick={() =>
            setGameplayMode(gameplayMode === 'deduction_open' ? 'observing' : 'deduction_open')
          }
          className={`relative flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-mono border transition ${
            gameplayMode === 'deduction_open'
              ? 'bg-teal-500/25 border-teal-400 text-teal-200'
              : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-600'
          }`}
          title="Deduction Board [B]"
        >
          <GitBranch className="w-3.5 h-3.5 text-teal-400" />
          <span className="hidden md:inline text-[11px]">BOARD</span>
          <span
            data-testid="hypothesis-count-badge"
            className="px-1.5 py-0.2 rounded-full bg-teal-500/20 text-teal-300 text-[10px]"
          >
            {unlockedHypothesisIds.length}
          </span>
        </button>

        <button
          data-testid="open-settings-btn"
          onClick={() =>
            setGameplayMode(gameplayMode === 'settings_open' ? 'observing' : 'settings_open')
          }
          className={`p-1.5 rounded border transition ${
            gameplayMode === 'settings_open'
              ? 'bg-slate-800 border-amber-400 text-white'
              : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:text-white'
          }`}
          title="Menu, Audio, Graphics & Save/Load"
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
        </button>
      </div>
    </header>
  );
};
