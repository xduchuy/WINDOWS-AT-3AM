import React, { useState } from 'react';
import { PhoneCall, Radio, Zap } from 'lucide-react';
import { soundscape } from '../audio/SoundscapeEngine';
import { INTERVENTIONS } from '../data/timelineEvents';
import { SimulationEngine } from '../simulation/SimulationEngine';
import { useGameStore } from '../state/useGameStore';
import { InterventionId } from '../types/game';

export const InterventionPanel: React.FC = () => {
  const { night, minute, worldFlags, triggerIntervention } = useGameStore();
  const [feedback, setFeedback] = useState<string | null>(null);
  const flagSet = new Set(worldFlags);

  const getIcon = (id: InterventionId) => {
    if (id === 'ring_courtyard_payphone') return <PhoneCall className="w-3.5 h-3.5" />;
    if (id === 'laser_window_tap_3b') return <Radio className="w-3.5 h-3.5" />;
    return <Zap className="w-3.5 h-3.5" />;
  };

  return (
    <div
      aria-label="Courtyard Interventions"
      className="pointer-events-auto fixed bottom-3 left-4 z-20 flex flex-col gap-1.5 max-w-xl"
    >
      {feedback && (
        <div className="bg-slate-950/90 border border-amber-400/50 text-amber-200 font-mono text-[11px] px-3 py-1 rounded">
          {feedback}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2 bg-[#050912]/85 border border-slate-800/80 rounded-md px-3 py-1.5 backdrop-blur-md">
        <span className="font-mono text-[10px] tracking-wider text-slate-400 uppercase mr-1">
          INTERVENTIONS:
        </span>

        {INTERVENTIONS.map((item) => {
          const check = SimulationEngine.canTriggerIntervention(
            item.id,
            night,
            minute,
            flagSet
          );
          const alreadyUsed = flagSet.has(item.setsFlag);

          return (
            <button
              key={item.id}
              data-testid={`intervention-btn-${item.id}`}
              onClick={() => {
                soundscape.init();
                const res = triggerIntervention(item.id);
                if (res.ok) {
                  soundscape.playCue(
                    item.id === 'ring_courtyard_payphone' ? 'phone_ring' : 'breaker_snap'
                  );
                }
                setFeedback(res.message);
                setTimeout(() => setFeedback(null), 5000);
              }}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded font-mono text-[11px] border transition ${
                alreadyUsed
                  ? 'bg-teal-950/40 border-teal-600/40 text-teal-400'
                  : check.allowed
                  ? 'bg-amber-500/20 border-amber-400 text-amber-200 hover:bg-amber-500/35'
                  : 'bg-slate-900/70 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
              title={`${item.description} (${check.reason})`}
            >
              {getIcon(item.id)}
              <span>{item.shortCode}</span>
              <span className="text-[9px] opacity-75">
                {alreadyUsed ? '[DEPLOYED]' : check.allowed ? '[READY]' : `[N${item.allowedNights[0]}]`}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
