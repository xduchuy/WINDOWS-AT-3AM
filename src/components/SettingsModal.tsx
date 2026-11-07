import React, { useState } from 'react';
import {
  Bug,
  EyeOff,
  FolderOpen,
  Monitor,
  RotateCcw,
  Save,
  ShieldCheck,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import { soundscape } from '../audio/SoundscapeEngine';
import { useGameStore } from '../state/useGameStore';
import { QualityPreset } from '../types/game';

export const SettingsModal: React.FC = () => {
  const {
    gameplayMode,
    debugMode,
    hudHidden,
    audioMuted,
    qualityPreset,
    fps,
    frameTimeMs,
    renderBackend,
    subtitlesEnabled,
    highContrastUi,
    reducedMotion,
    hasSavedGame,
    setGameplayMode,
    setDebugMode,
    toggleHudHidden,
    toggleAudioMute,
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
      <div className="w-full max-w-lg bg-[#070d19] border border-slate-800 rounded-lg shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Monitor className="w-4 h-4 text-amber-400" />
            <h2 className="font-serif text-sm font-semibold tracking-wider text-slate-100 uppercase">
              OBSERVATION MENU & SETTINGS
            </h2>
          </div>
          <button
            data-testid="close-settings-btn"
            onClick={() => setGameplayMode('observing')}
            className="p-1 rounded text-slate-400 hover:text-white"
            title="Close [ESC]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4 text-xs max-h-[82vh] overflow-y-auto">
          {/* Audio & Cinematic HUD Quick Controls */}
          <div className="grid grid-cols-2 gap-2 font-mono">
            <button
              data-testid="mute-audio-btn"
              onClick={() => {
                soundscape.init();
                toggleAudioMute();
              }}
              className="flex items-center justify-center gap-2 py-2 px-3 rounded bg-slate-900 border border-slate-800 text-slate-200 hover:border-slate-600 transition"
            >
              {audioMuted ? (
                <>
                  <VolumeX className="w-3.5 h-3.5 text-rose-400" />
                  <span>AUDIO: MUTED</span>
                </>
              ) : (
                <>
                  <Volume2 className="w-3.5 h-3.5 text-teal-400" />
                  <span>AUDIO: ACTIVE</span>
                </>
              )}
            </button>

            <button
              data-testid="toggle-cinematic-hud-btn"
              onClick={() => {
                toggleHudHidden();
                setGameplayMode('observing');
              }}
              className="flex items-center justify-center gap-2 py-2 px-3 rounded bg-slate-900 border border-slate-800 text-slate-200 hover:border-slate-600 transition"
            >
              <EyeOff className="w-3.5 h-3.5 text-amber-400" />
              <span>{hudHidden ? 'SHOW HUD [H]' : 'CINEMATIC MODE [H]'}</span>
            </button>
          </div>

          {/* Graphics Presets & Renderer Telemetry */}
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <div className="flex items-center justify-between font-mono text-[10px] text-slate-400">
              <span>GRAPHICS QUALITY</span>
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
                  className={`py-1.5 px-3 rounded font-mono text-[11px] uppercase border transition ${
                    qualityPreset === preset
                      ? 'bg-amber-500/25 border-amber-400 text-amber-200 font-semibold'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          {/* Accessibility & Interface */}
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <span className="font-mono text-[10px] text-slate-400 uppercase block">
              ACCESSIBILITY & INTERFACE
            </span>

            <label className="flex items-center justify-between p-2 rounded bg-slate-900/70 border border-slate-800 cursor-pointer">
              <span className="text-slate-200">Observation Subtitles</span>
              <input
                type="checkbox"
                checked={subtitlesEnabled}
                onChange={(e) => setAccessibilityOption('subtitlesEnabled', e.target.checked)}
                className="accent-amber-400"
              />
            </label>

            <label className="flex items-center justify-between p-2 rounded bg-slate-900/70 border border-slate-800 cursor-pointer">
              <span className="text-slate-200">High-Contrast HUD</span>
              <input
                type="checkbox"
                checked={highContrastUi}
                onChange={(e) => setAccessibilityOption('highContrastUi', e.target.checked)}
                className="accent-amber-400"
              />
            </label>

            <label className="flex items-center justify-between p-2 rounded bg-slate-900/70 border border-slate-800 cursor-pointer">
              <span className="text-slate-200">Reduced Motion</span>
              <input
                type="checkbox"
                checked={reducedMotion}
                onChange={(e) => setAccessibilityOption('reducedMotion', e.target.checked)}
                className="accent-amber-400"
              />
            </label>

            <label className="flex items-center justify-between p-2 rounded bg-slate-900/70 border border-slate-800 cursor-pointer">
              <span className="text-slate-400 flex items-center gap-1.5">
                <Bug className="w-3.5 h-3.5 text-amber-400" />
                Developer Timeline Scrubbing Mode
              </span>
              <input
                data-testid="toggle-debug-mode-btn"
                type="checkbox"
                checked={debugMode}
                onChange={(e) => setDebugMode(e.target.checked)}
                className="accent-amber-400"
              />
            </label>
          </div>

          {/* Save / Load / Reset */}
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <span className="font-mono text-[10px] text-slate-400 uppercase block">
              INVESTIGATION SAVE SLOT
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
