import React, { useEffect, useRef } from 'react';
import { DeductionBoard } from './components/DeductionBoard';
import { EndingModal } from './components/EndingModal';
import { InterventionPanel } from './components/InterventionPanel';
import { JournalDrawer } from './components/JournalDrawer';
import { OpticsReticle } from './components/OpticsReticle';
import { SettingsModal } from './components/SettingsModal';
import { TopTimeBar } from './components/TopTimeBar';
import { SceneManager } from './rendering/SceneManager';
import { useGameStore } from './state/useGameStore';

export const App: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { activeSubtitles, subtitlesEnabled } = useGameStore();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const manager = new SceneManager();
    manager.initialize(canvas);

    return () => {
      manager.dispose();
    };
  }, []);

  const latestSubtitle =
    activeSubtitles.length > 0 ? activeSubtitles[activeSubtitles.length - 1] : null;

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-[#04070d] select-none">
      {/* Primary 3D Babylon.js Observation Viewport */}
      <canvas
        ref={canvasRef}
        data-testid="observation-canvas"
        className="w-full h-full block outline-none cursor-crosshair"
      />

      {/* Restrained Cinematic Noir Interface */}
      <TopTimeBar />
      <OpticsReticle />
      <InterventionPanel />

      {/* Subtitles / Narrative Event Feed */}
      {subtitlesEnabled && latestSubtitle && (
        <div
          data-testid="subtitle-banner"
          className="pointer-events-none fixed bottom-14 left-1/2 -translate-x-1/2 z-20 max-w-xl w-[90vw] bg-[#04070d]/85 border border-slate-700/70 rounded px-4 py-2 text-center backdrop-blur-md shadow-xl"
        >
          <div className="font-mono text-[10px] tracking-widest text-amber-400 uppercase mb-0.5">
            {latestSubtitle.speakerOrSource}
          </div>
          <p className="font-serif text-xs md:text-sm text-slate-100 leading-snug">
            {latestSubtitle.text}
          </p>
        </div>
      )}

      {/* Drawers & Modals */}
      <JournalDrawer />
      <DeductionBoard />
      <SettingsModal />
      <EndingModal />
    </main>
  );
};

export default App;
