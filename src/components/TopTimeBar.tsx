import React from 'react';
import {
  BookOpen,
  Clock,
  FastForward,
  GitBranch,
  Pause,
  Play,
  Settings,
  Volume2,
  VolumeX,
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
    collectedClues,
    unlockedHypothesisIds,
    audioMuted,
    fps,
    qualityPreset,
    highContrastUi,
    setNight,
    setMinute,
    setTimeScale,
    togglePause,
    setGameplayMode,
    toggleAudioMute,
  } = useGameStore();

  const formattedClock = WorldClock.formatTime(minute);

  return (
    <header
      className={`pointer-events-auto fixed top-0 left-0 right-0 z-20 flex items-center justify-between px-5 py-2.5 transition-colors ${
        highContrastUi
          ? 'bg-black/95 border-b border-amber-400 text-white'
          : 'bg-gradient-to-b from-[#04070d]/90 via-[#04070d]/65 to-transparent text-slate-200'
      }`}
    >
      {/* Left: Title & Night Reel Switcher */}
      <div className="flex items-center gap-4">
        <div className="flex flex-col">
          <span className="font-mono text-[10px] tracking-[0.28em] text-amber-400/90 uppercase">
            412 MERCER COURTYARD
          </span>
          <h1 className="font-serif text-base font-semibold tracking-wider text-slate-100">
            WINDOWS AT 3AM
          </h1>
        </div>

        <div className="h-5 w-px bg-slate-700/60" />

        <div
          className="flex items-center gap-1 rounded bg-slate-900/80 p-0.5 border border-slate-700/50"
          role="group"
          aria-label="Night selector"
        >
          {([1, 2, 3] as NightNumber[]).map((n) => (
            <button
              key={n}
              data-testid={`night-btn-${n}`}
              onClick={() => {
                soundscape.init();
                setNight(n);
              }}
              className={`px-2.5 py-1 font-mono text-xs rounded transition-all ${
                night === n
                  ? 'bg-amber-500/25 text-amber-300 border border-amber-400/50 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              NIGHT {n}
            </button>
          ))}
        </div>
      </div>

      {/* Center: Deterministic 00:00 -> 03:00 AM World Clock & Timeline Scrubber */}
      <div className="flex items-center gap-3 bg-slate-950/80 border border-slate-800/80 rounded-md px-3.5 py-1.5 backdrop-blur-md">
        <Clock className="w-3.5 h-3.5 text-amber-400" />
        <span
          data-testid="world-clock-display"
          className="font-mono text-sm font-semibold tracking-widest text-amber-300 min-w-[78px]"
        >
          {formattedClock}
        </span>

        <input
          type="range"
          aria-label="Timeline minute scrubber"
          data-testid="timeline-scrubber"
          min={0}
          max={180}
          step={1}
          value={Math.floor(minute)}
          onChange={(e) => setMinute(Number(e.target.value))}
          className="w-28 md:w-36 accent-amber-400 cursor-pointer h-1 bg-slate-800 rounded-lg"
          title="Scrub observation timeline (00:00 AM to 03:00 AM)"
        />

        <button
          data-testid="pause-toggle-btn"
          onClick={() => {
            soundscape.init();
            togglePause();
          }}
          className="p-1 rounded hover:bg-slate-800 text-slate-200 transition"
          title={isPaused ? 'Resume (Space)' : 'Pause (Space)'}
        >
          {isPaused ? <Play className="w-3.5 h-3.5 text-amber-400" /> : <Pause className="w-3.5 h-3.5" />}
        </button>

        <div className="flex items-center gap-0.5 text-[11px] font-mono">
          {[1, 2, 5].map((spd) => (
            <button
              key={spd}
              data-testid={`speed-btn-${spd}x`}
              onClick={() => {
                soundscape.init();
                setTimeScale(spd);
              }}
              className={`px-1.5 py-0.5 rounded ${
                !isPaused && timeScale === spd
                  ? 'bg-amber-500/25 text-amber-300 border border-amber-400/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {spd}x
            </button>
          ))}
        </div>
      </div>

      {/* Right: Journal, Deduction Board, Audio & Settings */}
      <div className="flex items-center gap-2">
        <button
          data-testid="open-journal-btn"
          onClick={() =>
            setGameplayMode(gameplayMode === 'journal_open' ? 'observing' : 'journal_open')
          }
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono border transition ${
            gameplayMode === 'journal_open'
              ? 'bg-amber-500/25 border-amber-400 text-amber-200'
              : 'bg-slate-900/75 border-slate-700/70 text-slate-300 hover:border-slate-500'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5 text-amber-400" />
          <span>JOURNAL</span>
          <span
            data-testid="clue-count-badge"
            className="ml-0.5 px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-300 text-[10px]"
          >
            {collectedClues.length}
          </span>
        </button>

        <button
          data-testid="open-deduction-btn"
          onClick={() =>
            setGameplayMode(gameplayMode === 'deduction_open' ? 'observing' : 'deduction_open')
          }
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono border transition ${
            gameplayMode === 'deduction_open'
              ? 'bg-teal-500/25 border-teal-400 text-teal-200'
              : 'bg-slate-900/75 border-slate-700/70 text-slate-300 hover:border-slate-500'
          }`}
        >
          <GitBranch className="w-3.5 h-3.5 text-teal-400" />
          <span>DEDUCTION</span>
          <span
            data-testid="hypothesis-count-badge"
            className="ml-0.5 px-1.5 py-0.2 rounded-full bg-teal-500/20 text-teal-300 text-[10px]"
          >
            {unlockedHypothesisIds.length}
          </span>
        </button>

        <button
          data-testid="mute-audio-btn"
          onClick={() => {
            soundscape.init();
            toggleAudioMute();
          }}
          className="p-1.5 rounded bg-slate-900/75 border border-slate-700/70 text-slate-300 hover:text-white"
          title={audioMuted ? 'Unmute Atmosphere' : 'Mute Atmosphere'}
        >
          {audioMuted ? <VolumeX className="w-3.5 h-3.5 text-rose-400" /> : <Volume2 className="w-3.5 h-3.5 text-teal-400" />}
        </button>

        <button
          data-testid="open-settings-btn"
          onClick={() =>
            setGameplayMode(gameplayMode === 'settings_open' ? 'observing' : 'settings_open')
          }
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-slate-900/75 border border-slate-700/70 text-slate-300 hover:text-white text-xs font-mono"
          title="Graphics, Save/Load & Accessibility"
        >
          <Settings className="w-3.5 h-3.5" />
          <span className="hidden xl:inline text-[10px] text-slate-400">
            {fps}FPS · {qualityPreset.toUpperCase()}
          </span>
        </button>
      </div>
    </header>
  );
};
