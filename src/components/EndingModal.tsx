import React from 'react';
import { Award, Eye, RotateCcw, ShieldAlert } from 'lucide-react';
import { useGameStore } from '../state/useGameStore';

export const EndingModal: React.FC = () => {
  const {
    gameplayMode,
    resolvedEnding,
    collectedClues,
    unlockedHypothesisIds,
    setGameplayMode,
    resetInvestigation,
  } = useGameStore();

  if (gameplayMode !== 'case_resolved' || !resolvedEnding) return null;

  const isTrue = resolvedEnding.outcomeType === 'true_resolution';
  const isPartial = resolvedEnding.outcomeType === 'partial_truth';

  return (
    <div
      data-testid="ending-resolution-modal"
      className="pointer-events-auto fixed inset-0 z-40 bg-[#03060c]/95 backdrop-blur-xl flex items-center justify-center p-6"
    >
      <div className="max-w-2xl w-full bg-[#080f1d] border border-slate-700/80 rounded-lg p-8 shadow-2xl space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <span
              data-testid="ending-outcome-badge"
              className={`font-mono text-xs uppercase tracking-[0.25em] ${
                isTrue
                  ? 'text-teal-400'
                  : isPartial
                  ? 'text-amber-400'
                  : 'text-rose-400'
              }`}
            >
              {resolvedEnding.verdictSubtitle}
            </span>
            <h2
              data-testid="ending-title"
              className="font-serif text-2xl font-bold text-slate-100 mt-1"
            >
              {resolvedEnding.title}
            </h2>
          </div>

          {isTrue ? (
            <Award className="w-10 h-10 text-teal-400 shrink-0" />
          ) : (
            <ShieldAlert className="w-10 h-10 text-amber-400 shrink-0" />
          )}
        </div>

        <div className="space-y-3 text-sm text-slate-200 leading-relaxed">
          {resolvedEnding.summaryParagraphs.map((para, idx) => (
            <p key={idx}>{para}</p>
          ))}
        </div>

        <div className="p-4 rounded bg-slate-950/90 border border-slate-800 font-serif italic text-xs text-amber-200/90">
          “{resolvedEnding.epilogueNote}”
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-slate-800 font-mono text-xs text-slate-400">
          <div>
            CLUES LOGGED: {collectedClues.length} · DEDUCTIONS LINKED:{' '}
            {unlockedHypothesisIds.length}
          </div>

          <div className="flex items-center gap-3">
            <button
              data-testid="ending-continue-observing-btn"
              onClick={() => setGameplayMode('observing')}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 transition"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>CONTINUE OBSERVING</span>
            </button>

            <button
              data-testid="ending-new-investigation-btn"
              onClick={() => resetInvestigation()}
              className="flex items-center gap-1.5 px-4 py-2 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>NEW INVESTIGATION</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
