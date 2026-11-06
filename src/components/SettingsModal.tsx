import React, { useState } from 'react';
import { Download, FolderOpen, Monitor, RotateCcw, Save, ShieldCheck, X } from 'lucide-react';
import { useGameStore } from '../state/useGameStore';
import { QualityPreset } from '../types/game';

export const SettingsModal: React.FC = () => {
  const {
    gameplayMode,
    qualityPreset,
    fps,
    frameTimeMs,
    renderBackend,
    subtitlesEnabled,
    highContrastUi,
    reducedMotion,
    hasSavedGame,
    setGameplayMode,
    setQualityPreset,
    setAccessibilityOption,
    saveGame,
    loadGame,
    resetInvestigation,
  } = useGameStore();

  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  if (gameplayMode !== 'settings_open') return null;

  return (
    <div
      data-testid="settings-modal"
      className="pointer-events-auto fixed inset-0 z-30 bg-[#04070d]/85 backdrop-blur-lg flex items-center justify-center p-4"
    >
      <div className="w-full max-w-lg bg-[#070d19] border border-slate-700/80 rounded-lg shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Monitor className="w-4 h-4 text-amber-400" />
            <h2 className="font-serif text-base font-semibold text-slate-100">
              SYSTEM SETTINGS, PROFILER & SAVE DATA
            </h2>
          </div>
          <button
            data-testid="close-settings-btn"
            onClick={() => setGameplayMode('observing')}
            className="p-1 rounded text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-5 text-xs">
          {/* GPU/CPU Telemetry & Quality Presets */}
          <div className="space-y-2">
            <div className="flex items-center justify-between font-mono text-[11px] text-slate-400">
              <span>RENDERING PIPELINE & TELEMETRY</span>
              <span className="text-teal-400">
                {renderBackend} · {fps} FPS ({frameTimeMs} ms)
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {(['high', 'medium', 'low'] as QualityPreset[]).map((preset) => (
                <button
                  key={preset}
                  data-testid={`preset-btn-${preset}`}
                  onClick={() => setQualityPreset(preset)}
                  className={`py-2 px-3 rounded font-mono uppercase border transition ${
                    qualityPreset === preset
                      ? 'bg-amber-500/25 border-amber-400 text-amber-200 font-semibold'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {preset} QUALITY
                </button>
              ))}
            </div>
          </div>

          {/* Accessibility & Subtitles */}
          <div className="space-y-2 pt-3 border-t border-slate-800">
            <span className="font-mono text-[11px] text-slate-400 uppercase block">
              ACCESSIBILITY & INTERFACE
            </span>

            <label className="flex items-center justify-between p-2 rounded bg-slate-900/70 border border-slate-800 cursor-pointer">
              <span className="text-slate-200">Cinematic Observation Subtitles</span>
              <input
                type="checkbox"
                checked={subtitlesEnabled}
                onChange={(e) => setAccessibilityOption('subtitlesEnabled', e.target.checked)}
                className="accent-amber-400"
              />
            </label>

            <label className="flex items-center justify-between p-2 rounded bg-slate-900/70 border border-slate-800 cursor-pointer">
              <span className="text-slate-200">High-Contrast Noir HUD</span>
              <input
                type="checkbox"
                checked={highContrastUi}
                onChange={(e) => setAccessibilityOption('highContrastUi', e.target.checked)}
                className="accent-amber-400"
              />
            </label>

            <label className="flex items-center justify-between p-2 rounded bg-slate-900/70 border border-slate-800 cursor-pointer">
              <span className="text-slate-200">Reduced Camera & Weather Motion</span>
              <input
                type="checkbox"
                checked={reducedMotion}
                onChange={(e) => setAccessibilityOption('reducedMotion', e.target.checked)}
                className="accent-amber-400"
              />
            </label>
          </div>

          {/* Deterministic Save / Load System */}
          <div className="space-y-2.5 pt-3 border-t border-slate-800">
            <span className="font-mono text-[11px] text-slate-400 uppercase block">
              INVESTIGATION SAVE SYSTEM
            </span>

            {saveMessage && (
              <div
                data-testid="save-status-banner"
                className="p-2 rounded bg-teal-950/60 border border-teal-500/40 text-teal-200 font-mono text-[11px] flex items-center gap-1.5"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>{saveMessage}</span>
              </div>
            )}

            <div className="grid grid-cols-3 gap-2 font-mono">
              <button
                data-testid="save-game-btn"
                onClick={() => {
                  const ok = saveGame();
                  setSaveMessage(
                    ok ? 'Saved current night, clock, and clues.' : 'Failed to save.'
                  );
                }}
                className="flex items-center justify-center gap-1.5 py-2 px-3 rounded bg-teal-500/20 hover:bg-teal-500/35 text-teal-200 border border-teal-400/50"
              >
                <Save className="w-3.5 h-3.5" />
                <span>SAVE</span>
              </button>

              <button
                data-testid="load-game-btn"
                disabled={!hasSavedGame}
                onClick={() => {
                  const ok = loadGame();
                  setSaveMessage(ok ? 'Loaded saved investigation.' : 'No save found.');
                }}
                className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded border ${
                  hasSavedGame
                    ? 'bg-amber-500/20 hover:bg-amber-500/35 text-amber-200 border-amber-400/50'
                    : 'bg-slate-900 border-slate-800 text-slate-600 cursor-not-allowed'
                }`}
              >
                <FolderOpen className="w-3.5 h-3.5" />
                <span>LOAD</span>
              </button>

              <button
                data-testid="reset-game-btn"
                onClick={() => {
                  resetInvestigation();
                  setSaveMessage('Reset to Night 1 // 00:10 AM.');
                }}
                className="flex items-center justify-center gap-1.5 py-2 px-3 rounded bg-rose-950/40 hover:bg-rose-900/50 text-rose-300 border border-rose-500/40"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>RESET</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
