import React from 'react';
import { Crosshair, Eye, Focus, Sparkles, ZoomIn } from 'lucide-react';
import { soundscape } from '../audio/SoundscapeEngine';
import { APARTMENT_LIST, APARTMENTS } from '../data/apartments';
import { RESIDENTS } from '../data/residents';
import { SimulationEngine } from '../simulation/SimulationEngine';
import { useGameStore } from '../state/useGameStore';
import { ApartmentId } from '../types/game';

export const OpticsReticle: React.FC = () => {
  const {
    focusedApartmentId,
    hoveredApartmentId,
    zoomLevel,
    focalDistance,
    autoFocusEnabled,
    residents,
    apartments,
    visibleClues,
    collectedClues,
    scanProgress,
    focusApartment,
    setZoomLevel,
    setFocalDistance,
    toggleAutoFocus,
    collectClueImmediate,
  } = useGameStore();

  const activeAptId = focusedApartmentId || hoveredApartmentId;
  const activeAptDef = activeAptId ? APARTMENTS[activeAptId] : null;
  const activeSimApt = activeAptId ? apartments[activeAptId] : null;

  const collectedSet = new Set(collectedClues.map((c) => c.clueId));
  const uncollectedClueInApt = visibleClues.find(
    (c) => c.apartmentId === focusedApartmentId && !collectedSet.has(c.id)
  );

  const opticalCheck = uncollectedClueInApt
    ? SimulationEngine.checkClueOpticalConditions(
        uncollectedClueInApt,
        focusedApartmentId,
        zoomLevel,
        focalDistance
      )
    : null;

  // Occupants inside the currently inspected apartment
  const occupantStates = activeSimApt
    ? activeSimApt.occupants.map((rId) => residents[rId]).filter(Boolean)
    : [];

  return (
    <>
      {/* Subtle Optical Viewfinder Corner Brackets */}
      <div className="pointer-events-none fixed inset-0 z-10 flex items-center justify-center">
        <div className="relative w-[86vw] h-[76vh] border border-slate-400/10 rounded-sm">
          <div className="absolute -top-px -left-px w-5 h-5 border-t-2 border-l-2 border-amber-400/50" />
          <div className="absolute -top-px -right-px w-5 h-5 border-t-2 border-r-2 border-amber-400/50" />
          <div className="absolute -bottom-px -left-px w-5 h-5 border-b-2 border-l-2 border-amber-400/50" />
          <div className="absolute -bottom-px -right-px w-5 h-5 border-b-2 border-r-2 border-amber-400/50" />

          {/* Center Crosshair Pip */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-2">
            <Crosshair
              className={`w-6 h-6 transition-all duration-300 ${
                opticalCheck?.canScan
                  ? 'text-teal-400 scale-125'
                  : uncollectedClueInApt
                  ? 'text-amber-400'
                  : 'text-slate-400/25'
              }`}
            />
          </div>
        </div>
      </div>

      {/* Left Floating Compact Window Selector Matrix (All 12 Windows across 4 Floors) */}
      <aside
        aria-label="Building Window Matrix"
        className="pointer-events-auto fixed left-4 top-20 z-20 bg-[#050912]/85 border border-slate-800/80 rounded-md p-2.5 backdrop-blur-md w-48"
      >
        <div className="flex items-center justify-between mb-2">
          <span className="font-mono text-[10px] tracking-widest text-slate-400 uppercase">
            WINDOW OPTICS (12)
          </span>
          {focusedApartmentId && (
            <button
              data-testid="reset-overview-btn"
              onClick={() => focusApartment(null)}
              className="font-mono text-[10px] text-amber-400 hover:underline"
            >
              WIDE [ESC]
            </button>
          )}
        </div>

        <div className="grid grid-cols-3 gap-1">
          {APARTMENT_LIST.map((apt) => {
            const sim = apartments[apt.id];
            const isFocused = focusedApartmentId === apt.id;
            const hasClueNow = visibleClues.some(
              (c) => c.apartmentId === apt.id && !collectedSet.has(c.id)
            );

            return (
              <button
                key={apt.id}
                data-testid={`window-select-${apt.code}`}
                onClick={() => {
                  soundscape.init();
                  focusApartment(apt.id as ApartmentId);
                }}
                className={`relative flex flex-col items-center py-1 px-1 rounded text-[11px] font-mono border transition ${
                  isFocused
                    ? 'bg-amber-500/30 border-amber-400 text-amber-200 font-bold'
                    : apt.isDetailedInteractive
                    ? 'bg-slate-900/90 border-slate-700 text-slate-200 hover:border-amber-400/60'
                    : 'bg-slate-950/60 border-slate-800/70 text-slate-500 hover:text-slate-300'
                }`}
                title={`${apt.code}: ${apt.name}`}
              >
                <div className="flex items-center gap-1">
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{
                      backgroundColor: sim?.lightOn ? apt.themeColorHex : '#334155',
                    }}
                  />
                  <span>{apt.code}</span>
                </div>
                {apt.residentId && (
                  <span className="text-[8px] text-slate-400 truncate max-w-full">
                    {RESIDENTS[apt.residentId].fullName.split(' ')[0]}
                  </span>
                )}
                {hasClueNow && (
                  <span
                    data-testid={`clue-ping-${apt.code}`}
                    className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-teal-400 animate-ping"
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Optical Zoom & Manual/Auto Focus Controls */}
        <div className="mt-3 pt-2.5 border-t border-slate-800/80 space-y-2">
          <div>
            <div className="flex justify-between text-[10px] font-mono text-slate-300 mb-0.5">
              <span className="flex items-center gap-1">
                <ZoomIn className="w-3 h-3 text-amber-400" /> ZOOM
              </span>
              <span data-testid="zoom-readout">{zoomLevel.toFixed(1)}x</span>
            </div>
            <input
              type="range"
              aria-label="Optical zoom level"
              data-testid="zoom-slider"
              min={1.0}
              max={3.5}
              step={0.1}
              value={zoomLevel}
              onChange={(e) => setZoomLevel(Number(e.target.value))}
              className="w-full h-1 accent-amber-400 bg-slate-800 rounded cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between items-center text-[10px] font-mono text-slate-300 mb-0.5">
              <span className="flex items-center gap-1">
                <Focus className="w-3 h-3 text-teal-400" /> FOCUS
              </span>
              <div className="flex items-center gap-1.5">
                <span data-testid="focus-readout">{focalDistance.toFixed(1)}m</span>
                <button
                  data-testid="autofocus-btn"
                  onClick={toggleAutoFocus}
                  className={`px-1 py-0.2 rounded text-[9px] border ${
                    autoFocusEnabled
                      ? 'bg-teal-500/25 border-teal-400 text-teal-300'
                      : 'border-slate-700 text-slate-400'
                  }`}
                >
                  AF
                </button>
              </div>
            </div>
            <input
              type="range"
              aria-label="Optical focal distance"
              data-testid="focus-slider"
              min={8.0}
              max={24.0}
              step={0.2}
              value={focalDistance}
              onChange={(e) => setFocalDistance(Number(e.target.value))}
              className="w-full h-1 accent-teal-400 bg-slate-800 rounded cursor-pointer"
            />
          </div>
        </div>
      </aside>

      {/* Right-Bottom Telephoto Inspection & Evidence Acquisition Readout */}
      {activeAptDef && (
        <div
          data-testid="apartment-telemetry-card"
          className="pointer-events-auto fixed right-4 bottom-16 z-20 w-80 bg-[#050912]/90 border border-slate-800/90 rounded-md p-3.5 backdrop-blur-md shadow-2xl"
        >
          <div className="flex items-center justify-between border-b border-slate-800 pb-1.5 mb-2">
            <div>
              <span className="font-mono text-[10px] text-amber-400 uppercase tracking-widest">
                APT {activeAptDef.code} // FLOOR {activeAptDef.floor}
              </span>
              <h2 className="font-serif text-sm font-semibold text-slate-100">
                {activeAptDef.name}
              </h2>
            </div>
            <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800">
              {activeAptDef.focalDepthMeters.toFixed(1)}m
            </span>
          </div>

          {occupantStates.length > 0 ? (
            <div className="space-y-2 mb-2.5">
              {occupantStates.map((occ) => (
                <div
                  key={occ.residentId}
                  className="bg-slate-900/75 border border-slate-800/90 rounded p-2 text-xs"
                >
                  <div className="flex items-center justify-between font-mono text-[11px] text-amber-300 mb-0.5">
                    <span>{occ.fullName}</span>
                    <span className="text-[9px] text-slate-400 uppercase">
                      {occ.posture.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <p className="text-slate-200 font-medium text-[11px] leading-snug">
                    {occ.actionSummary}
                  </p>
                  {zoomLevel >= 1.8 && (
                    <p className="text-slate-400 text-[11px] mt-1 leading-relaxed">
                      {occ.observableDetail}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-400 text-xs mb-2.5 leading-relaxed">
              {activeAptDef.description}
            </p>
          )}

          {/* Evidence Scan Calibration Status */}
          {uncollectedClueInApt && (
            <div
              data-testid="active-clue-scanner"
              className="mt-2 pt-2 border-t border-slate-800/90"
            >
              <div className="flex items-center justify-between text-[11px] font-mono mb-1">
                <span className="flex items-center gap-1 text-teal-300">
                  <Sparkles className="w-3.5 h-3.5" /> DISCOVERABLE EVIDENCE
                </span>
                <span className="text-slate-400">{Math.round(scanProgress)}%</span>
              </div>

              <div className="w-full h-1.5 bg-slate-900 rounded overflow-hidden mb-1.5">
                <div
                  className="h-full bg-teal-400 transition-all duration-150"
                  style={{ width: `${scanProgress}%` }}
                />
              </div>

              <p className="font-mono text-[10px] text-amber-300/95 mb-2">
                {opticalCheck?.reason}
              </p>

              {/* Direct Record Button when optical lock is achieved or calibrated */}
              <button
                data-testid="record-evidence-btn"
                onClick={() => {
                  // Calibrate optics automatically and record the observed clue
                  setZoomLevel(Math.max(zoomLevel, uncollectedClueInApt.minZoomLevel + 0.1));
                  setFocalDistance(uncollectedClueInApt.targetFocalDistance);
                  soundscape.playCue('scan_lock');
                  collectClueImmediate(uncollectedClueInApt.id);
                }}
                className="w-full py-1.5 px-2.5 rounded font-mono text-[11px] font-semibold bg-teal-500/20 hover:bg-teal-500/35 text-teal-200 border border-teal-400/50 flex items-center justify-center gap-1.5 transition"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>FOCUS & LOG OBSERVATION</span>
              </button>
            </div>
          )}
        </div>
      )}
    </>
  );
};
