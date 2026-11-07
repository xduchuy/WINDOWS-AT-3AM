import React, { useState } from 'react';
import { PhoneCall, Radio, ShieldAlert, Zap } from 'lucide-react';
import { soundscape } from '../audio/SoundscapeEngine';
import { INTERVENTIONS } from '../data/timelineEvents';
import { SimulationEngine } from '../simulation/SimulationEngine';
import { useGameStore } from '../state/useGameStore';
import { InterventionId } from '../types/game';

export const InterventionPanel: React.FC = () => {
  const {
    night,
    minute,
    hudHidden,
    worldFlags,
    collectedClues,
    courtyardAlertness,
    triggerIntervention,
  } = useGameStore();

  const [isOpen, setIsOpen] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  if (hudHidden) return null;

  const flagSet = new Set(worldFlags);
  const collectedSet = new Set(collectedClues.map((c) => c.clueId));

  // Filter interventions relevant to current night or already deployed
  const relevantInterventions = INTERVENTIONS.filter(
    (item) => item.allowedNights.includes(night) || flagSet.has(item.setsFlag)
  );

  const anyReadyNow = relevantInterventions.some(
    (item) =>
      SimulationEngine.canTriggerIntervention(
        item.id,
        night,
        minute,
        flagSet,
        collectedSet,
        courtyardAlertness
      ).allowed
  );

  const getIcon = (id: InterventionId) => {
    if (id === 'ring_courtyard_payphone') return <PhoneCall className="w-3.5 h-3.5" />;
    if (id === 'laser_window_tap_3b') return <Radio className="w-3.5 h-3.5" />;
    return <Zap className="w-3.5 h-3.5" />;
  };

  return (
    <div
      aria-label="Courtyard Interventions"
      className="pointer-events-auto fixed bottom-3 left-3 z-20 flex flex-col items-start gap-1.5"
    >
      {feedback && (
        <div
          data-testid="intervention-feedback"
          className="bg-slate-950/90 border border-amber-400/50 text-amber-200 font-mono text-[10px] px-2.5 py-1 rounded max-w-xs shadow-lg"
        >
          {feedback}
        </div>
      )}

      {isOpen && (
        <div
          data-testid="intervention-tray"
          className="bg-[#050912]/90 border border-slate-800/90 rounded-md p-2.5 backdrop-blur-md shadow-xl w-64 space-y-2"
        >
          <div className="flex items-center justify-between font-mono text-[10px] text-slate-400 border-b border-slate-800 pb-1">
            <span>COURTYARD ACTIONS</span>
            <span className="flex items-center gap-1 text-amber-300">
              <ShieldAlert className="w-3 h-3" />
              ALERT {courtyardAlertness}/{SimulationEngine.MAX_ALERTNESS_BUDGET}
            </span>
          </div>

          {relevantInterventions.map((item) => {
            const check = SimulationEngine.canTriggerIntervention(
              item.id,
              night,
              minute,
              flagSet,
              collectedSet,
              courtyardAlertness
            );
            const alreadyUsed = flagSet.has(item.setsFlag);

            return (
              <div
                key={item.id}
                className="p-2 rounded bg-slate-900/70 border border-slate-800/80 space-y-1"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] font-semibold text-slate-200 flex items-center gap-1.5">
                    {getIcon(item.id)}
                    {item.shortCode}
                  </span>
                  <span className="font-mono text-[9px] text-slate-400">
                    {alreadyUsed ? 'DEPLOYED' : check.allowed ? 'READY' : 'LOCKED'}
                  </span>
                </div>

                <p className="text-[10px] text-slate-400 leading-snug">
                  {check.allowed ? item.tradeoffWarning : check.reason}
                </p>

                <button
                  data-testid={`intervention-btn-${item.id}`}
                  disabled={!check.allowed}
                  onClick={() => {
                    soundscape.init();
                    const res = triggerIntervention(item.id);
                    if (res.ok) {
                      soundscape.playCue(
                        item.id === 'ring_courtyard_payphone' ? 'phone_ring' : 'breaker_snap'
                      );
                    }
                    setFeedback(res.message);
                    setTimeout(() => setFeedback(null), 4500);
                  }}
                  className={`w-full py-1 px-2 rounded font-mono text-[10px] border transition ${
                    alreadyUsed
                      ? 'bg-teal-950/30 border-teal-700/40 text-teal-400 cursor-default'
                      : check.allowed
                      ? 'bg-amber-500/20 border-amber-400 text-amber-200 hover:bg-amber-500/35'
                      : 'bg-slate-950/60 border-slate-800 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  {alreadyUsed ? 'ACTION COMPLETED' : item.label}
                </button>
              </div>
            );
          })}
        </div>
      )}

      <button
        data-testid="toggle-interventions-btn"
        onClick={() => setIsOpen((v) => !v)}
        className={`h-9 flex items-center gap-1.5 px-3 rounded-full font-mono text-[10px] border backdrop-blur-md transition ${
          isOpen
            ? 'bg-amber-500/25 border-amber-400 text-amber-200'
            : anyReadyNow
            ? 'bg-[#04070d]/85 border-amber-400/60 text-amber-300'
            : 'bg-[#04070d]/75 border-slate-800/80 text-slate-400 hover:text-slate-200'
        }`}
        title="Contextual Courtyard Actions"
      >
        <Zap className="w-3.5 h-3.5 text-amber-400" />
        <span>ACTIONS</span>
        {anyReadyNow && (
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
        )}
      </button>
    </div>
  );
};
