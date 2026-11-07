import React, { useState } from 'react';
import {
  Compass,
  Crosshair,
  Eye,
  Focus,
  Minimize2,
  Sliders,
  ZoomIn,
} from 'lucide-react';
import { soundscape } from '../audio/SoundscapeEngine';
import { APARTMENT_LIST, APARTMENTS } from '../data/apartments';
import { SimulationEngine } from '../simulation/SimulationEngine';
import { useGameStore } from '../state/useGameStore';
import { ApartmentId } from '../types/game';

export const OpticsReticle: React.FC = () => {
  const {
    night,
    minute,
    hudHidden,
    focusedApartmentId,
    hoveredApartmentId,
    zoomLevel,
    focalDistance,
    autoFocusEnabled,
    isLineOfSightClear,
    apartments,
    worldFlags,
    visibleClues,
    collectedClues,
    scanProgress,
    lastOpticalRejection,
    focusApartment,
    setZoomLevel,
    setFocalDistance,
    toggleAutoFocus,
    setHoldingRecord,
    collectClueImmediate,
  } = useGameStore();

  const [isNavExpanded, setIsNavExpanded] = useState(false);
  const [isOpticsExpanded, setIsOpticsExpanded] = useState(false);

  if (hudHidden) return null;

  const activeAptId = focusedApartmentId || hoveredApartmentId;
  const activeAptDef = activeAptId ? APARTMENTS[activeAptId] : null;

  const collectedSet = new Set(collectedClues.map((c) => c.clueId));
  const uncollectedClueInApt = visibleClues.find(
    (c) => c.apartmentId === focusedApartmentId && !collectedSet.has(c.id)
  );

  const validation = uncollectedClueInApt
    ? SimulationEngine.validateEvidenceCollection(uncollectedClueInApt, {
        night,
        minute,
        focusedApartmentId,
        currentZoom: zoomLevel,
        currentFocalDistance: focalDistance,
        worldFlags: new Set(worldFlags),
        apartments,
        isLineOfSightClear,
      })
    : null;

  // Only show contextual observation prompt when zoomed in (>= 1.6x) on a focused apartment
  const showContextualReticleFeedback =
    Boolean(focusedApartmentId) && zoomLevel >= 1.6 && Boolean(uncollectedClueInApt);

  return (
    <>
      {/* Quiet Viewfinder Center Reticle & Contextual Observation Prompt */}
      <div className="pointer-events-none fixed inset-0 z-10 flex items-center justify-center">
        <div className="relative flex flex-col items-center">
          <Crosshair
            className={`w-5 h-5 transition-all duration-300 ${
              validation?.canScan
                ? 'text-teal-400 scale-125'
                : showContextualReticleFeedback
                ? 'text-amber-400/80'
                : 'text-slate-400/20'
            }`}
          />

          {/* Subtle Contextual Observation Lock Near Reticle (No Premature Spoilers) */}
          {showContextualReticleFeedback && uncollectedClueInApt && (
            <div
              data-testid="active-clue-scanner"
              className="pointer-events-auto mt-6 flex flex-col items-center bg-[#04070d]/85 border border-slate-800/90 rounded px-3 py-1.5 backdrop-blur-md shadow-lg max-w-xs text-center"
            >
              <span className="font-mono text-[10px] tracking-wider text-slate-300">
                {validation?.canScan
                  ? 'OPTICAL LOCK ACQUIRED'
                  : uncollectedClueInApt.opticalHintPrompt}
              </span>

              {scanProgress > 0 && (
                <div className="w-36 h-1 bg-slate-900 rounded overflow-hidden mt-1">
                  <div
                    className="h-full bg-teal-400 transition-all duration-100"
                    style={{ width: `${scanProgress}%` }}
                  />
                </div>
              )}

              {validation?.canScan ? (
                <button
                  data-testid="record-evidence-btn"
                  onMouseDown={() => setHoldingRecord(true)}
                  onMouseUp={() => setHoldingRecord(false)}
                  onClick={() => {
                    soundscape.init();
                    const res = collectClueImmediate(uncollectedClueInApt.id);
                    if (res.ok) {
                      soundscape.playCue('scan_lock');
                    }
                  }}
                  className="mt-1.5 px-2.5 py-0.5 rounded font-mono text-[10px] font-semibold bg-teal-500/25 hover:bg-teal-500/40 text-teal-200 border border-teal-400/50 flex items-center gap-1 transition"
                >
                  <Eye className="w-3 h-3" />
                  <span>RECORD OBSERVATION [R]</span>
                </button>
              ) : (
                <span className="font-mono text-[9px] text-amber-400/90 mt-0.5">
                  {validation?.reason}
                </span>
              )}
            </div>
          )}

          {lastOpticalRejection && !showContextualReticleFeedback && (
            <div
              data-testid="optical-rejection-toast"
              className="mt-4 px-2.5 py-1 rounded bg-rose-950/80 border border-rose-500/40 font-mono text-[10px] text-rose-200"
            >
              {lastOpticalRejection}
            </div>
          )}
        </div>
      </div>

      {/* Collapsible Window Navigator (Default Collapsed) */}
      <aside
        aria-label="Window Navigator"
        className="pointer-events-auto fixed left-3 top-14 z-20"
      >
        <button
          data-testid="toggle-window-nav-btn"
          onClick={() => setIsNavExpanded((v) => !v)}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-mono border backdrop-blur-md transition ${
            isNavExpanded
              ? 'bg-slate-900/90 border-amber-400/60 text-amber-200'
              : 'bg-[#04070d]/75 border-slate-800/80 text-slate-300 hover:border-slate-600'
          }`}
          title="Toggle Window Navigator (or click 3D windows directly)"
        >
          <Compass className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-[10px]">WINDOWS</span>
        </button>

        {isNavExpanded && (
          <div
            data-testid="window-nav-popover"
            className="mt-1.5 p-2 rounded bg-[#050912]/90 border border-slate-800/90 backdrop-blur-md shadow-xl w-40"
          >
            <div className="grid grid-cols-3 gap-1">
              {APARTMENT_LIST.map((apt) => {
                const sim = apartments[apt.id];
                const isFocused = focusedApartmentId === apt.id;
                return (
                  <button
                    key={apt.id}
                    data-testid={`window-select-${apt.code}`}
                    onClick={() => {
                      soundscape.init();
                      focusApartment(apt.id as ApartmentId);
                    }}
                    className={`flex items-center justify-center gap-1 py-1 px-1 rounded text-[10px] font-mono border transition ${
                      isFocused
                        ? 'bg-amber-500/30 border-amber-400 text-amber-200 font-semibold'
                        : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:border-slate-600'
                    }`}
                  >
                    <span
                      className="w-1.5 h-1.5 rounded-full"
                      style={{
                        backgroundColor: sim?.lightOn ? apt.themeColorHex : '#334155',
                      }}
                    />
                    <span>{apt.code}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </aside>

      {/* Compact Bottom-Center Optical Readout & Minimal Apartment Status */}
      <div className="pointer-events-auto fixed bottom-3 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-1.5">
        {isOpticsExpanded && (
          <div
            data-testid="optics-sliders-popover"
            className="flex items-center gap-4 bg-[#050912]/90 border border-slate-800/90 rounded px-3.5 py-2 backdrop-blur-md shadow-xl"
          >
            <div className="flex items-center gap-2">
              <ZoomIn className="w-3.5 h-3.5 text-amber-400" />
              <input
                type="range"
                aria-label="Optical zoom level"
                data-testid="zoom-slider"
                min={1.0}
                max={3.5}
                step={0.1}
                value={zoomLevel}
                onChange={(e) => setZoomLevel(Number(e.target.value))}
                className="w-24 h-1 accent-amber-400 bg-slate-800 rounded cursor-pointer"
              />
            </div>

            <div className="flex items-center gap-2">
              <Focus className="w-3.5 h-3.5 text-teal-400" />
              <input
                type="range"
                aria-label="Optical focal distance"
                data-testid="focus-slider"
                min={8.0}
                max={24.0}
                step={0.2}
                value={focalDistance}
                onChange={(e) => setFocalDistance(Number(e.target.value))}
                className="w-24 h-1 accent-teal-400 bg-slate-800 rounded cursor-pointer"
              />
            </div>
          </div>
        )}

        <div
          data-testid="apartment-telemetry-card"
          className="h-9 flex items-center gap-3 bg-[#04070d]/80 border border-slate-800/80 rounded-full px-4 backdrop-blur-md text-xs font-mono shadow-lg"
        >
          {/* Minimal Apartment Code & Observation Status */}
          <span className="text-amber-300 font-semibold tracking-wider text-[11px]">
            {activeAptDef ? `APT ${activeAptDef.code}` : 'COURTYARD'}
          </span>

          <div className="h-3 w-px bg-slate-800" />

          <span className="text-slate-300 text-[11px]" data-testid="zoom-readout">
            {zoomLevel.toFixed(1)}x
          </span>

          <span className="text-slate-400 text-[11px]" data-testid="focus-readout">
            {focalDistance.toFixed(1)}m
          </span>

          <button
            data-testid="autofocus-btn"
            onClick={toggleAutoFocus}
            className={`px-1.5 py-0.5 rounded text-[10px] border transition ${
              autoFocusEnabled
                ? 'bg-teal-500/25 border-teal-400 text-teal-300'
                : 'border-slate-700 text-slate-400 hover:text-slate-200'
            }`}
            title="Auto-Focus [F]"
          >
            AF
          </button>

          <button
            data-testid="toggle-optics-sliders-btn"
            onClick={() => setIsOpticsExpanded((v) => !v)}
            className={`p-1 rounded transition ${
              isOpticsExpanded ? 'text-amber-300' : 'text-slate-400 hover:text-white'
            }`}
            title="Toggle Manual Optics Sliders"
          >
            <Sliders className="w-3.5 h-3.5" />
          </button>

          {focusedApartmentId && (
            <button
              data-testid="reset-overview-btn"
              onClick={() => focusApartment(null)}
              className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-amber-300 transition"
              title="Wide View [ESC]"
            >
              <Minimize2 className="w-3 h-3" />
              <span className="hidden sm:inline">WIDE</span>
            </button>
          )}
        </div>
      </div>
    </>
  );
};
