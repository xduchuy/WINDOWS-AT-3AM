import React from 'react';
import {
  AlertOctagon,
  CheckCircle,
  FileCheck2,
  GitBranch,
  Link2,
  Sparkles,
  X,
} from 'lucide-react';
import { APARTMENTS } from '../data/apartments';
import { DEDUCTION_HYPOTHESES, MYSTERY_CLUES } from '../data/mysteryClues';
import { useGameStore } from '../state/useGameStore';

export const DeductionBoard: React.FC = () => {
  const {
    gameplayMode,
    collectedClues,
    unlockedHypothesisIds,
    selectedBoardClueId,
    lastDeductionFeedback,
    setGameplayMode,
    selectBoardClue,
    linkCluesOnBoard,
    submitFinalVerdict,
  } = useGameStore();

  if (gameplayMode !== 'deduction_open') return null;

  const collectedIds = new Set(collectedClues.map((c) => c.clueId));
  const collectedDefs = MYSTERY_CLUES.filter((c) => collectedIds.has(c.id));

  const handleClueClick = (clueId: string) => {
    if (!selectedBoardClueId) {
      selectBoardClue(clueId);
      return;
    }
    if (selectedBoardClueId === clueId) {
      selectBoardClue(null);
      return;
    }
    linkCluesOnBoard(selectedBoardClueId, clueId);
  };

  return (
    <div
      data-testid="deduction-board-modal"
      className="pointer-events-auto fixed inset-0 z-30 bg-[#04070d]/90 backdrop-blur-xl flex items-center justify-center p-6"
    >
      <div className="w-full max-w-5xl h-[84vh] bg-[#070d19] border border-slate-700/80 rounded-lg shadow-2xl flex flex-col overflow-hidden">
        {/* Top Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/70">
          <div>
            <span className="font-mono text-[10px] tracking-[0.25em] text-teal-400 uppercase">
              CASE RECONSTRUCTION // THE 1714 ORPHEUS VIOLIN
            </span>
            <h2 className="font-serif text-lg font-semibold text-slate-100 flex items-center gap-2">
              <GitBranch className="w-5 h-5 text-teal-400" />
              DEDUCTION & HYPOTHESIS BOARD
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <button
              data-testid="submit-verdict-btn"
              onClick={() => submitFinalVerdict()}
              className="flex items-center gap-2 px-4 py-2 rounded font-mono text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-lg transition"
            >
              <FileCheck2 className="w-4 h-4" />
              <span>SUBMIT INVESTIGATION VERDICT</span>
            </button>

            <button
              data-testid="close-deduction-btn"
              onClick={() => setGameplayMode('observing')}
              className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Feedback Banner */}
        <div className="px-6 py-2.5 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between text-xs font-mono">
          <span className="text-slate-300">
            {selectedBoardClueId
              ? `SELECTED PIN: [${
                  MYSTERY_CLUES.find((c) => c.id === selectedBoardClueId)?.deductionTag
                }] — Click a second related clue pin to link them.`
              : lastDeductionFeedback ||
                'Select any two corroborating evidence pins below to synthesize a deduction hypothesis.'}
          </span>
          <span className="text-teal-400">
            VERIFIED LINKS:{' '}
            {
              unlockedHypothesisIds.filter(
                (id) => !DEDUCTION_HYPOTHESES.find((h) => h.id === id)?.isFallacy
              ).length
            }{' '}
            / 3
          </span>
        </div>

        {/* Main Two-Column Board */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
          {/* Left Column: Collected Evidence Pins */}
          <div className="lg:col-span-6 p-5 overflow-y-auto border-r border-slate-800 space-y-3">
            <h3 className="font-mono text-xs tracking-wider text-amber-400 uppercase mb-2">
              1. COLLECTED EVIDENCE PINS ({collectedDefs.length})
            </h3>

            {collectedDefs.length === 0 ? (
              <div className="p-5 rounded border border-dashed border-slate-700 text-slate-400 text-xs space-y-2">
                <p>No evidence pins collected yet.</p>
                <p>
                  Return to courtyard observation or use the Journal surveillance leads to observe
                  Apartments 4A, 3B, 2C, and 1A.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {collectedDefs.map((clue) => {
                  const isSelected = selectedBoardClueId === clue.id;
                  const apt = APARTMENTS[clue.apartmentId];
                  return (
                    <button
                      key={clue.id}
                      data-testid={`board-clue-pin-${clue.id}`}
                      onClick={() => handleClueClick(clue.id)}
                      className={`text-left p-3 rounded border transition flex flex-col justify-between ${
                        isSelected
                          ? 'bg-teal-500/25 border-teal-400 ring-2 ring-teal-400/40'
                          : 'bg-slate-900/85 border-slate-800 hover:border-amber-400/60'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between font-mono text-[10px] text-amber-400 mb-1">
                          <span>
                            NIGHT {clue.night} · APT {apt.code}
                          </span>
                          <Link2 className="w-3.5 h-3.5 text-teal-400" />
                        </div>
                        <div className="font-mono text-xs font-semibold text-slate-100 mb-1">
                          {clue.deductionTag}
                        </div>
                        <p className="text-[11px] text-slate-400 line-clamp-3">
                          {clue.title}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Column: Synthesized Hypotheses & Case Logic */}
          <div className="lg:col-span-6 p-5 overflow-y-auto space-y-3 bg-slate-950/40">
            <h3 className="font-mono text-xs tracking-wider text-teal-400 uppercase mb-2">
              2. SYNTHESIZED DEDUCTION HYPOTHESES ({unlockedHypothesisIds.length}/
              {DEDUCTION_HYPOTHESES.length})
            </h3>

            {DEDUCTION_HYPOTHESES.map((hyp) => {
              const isUnlocked = unlockedHypothesisIds.includes(hyp.id);
              const [reqA, reqB] = hyp.requiredClueIds;
              const clueA = MYSTERY_CLUES.find((c) => c.id === reqA);
              const clueB = MYSTERY_CLUES.find((c) => c.id === reqB);
              const canAutoSynthesize =
                !isUnlocked && collectedIds.has(reqA) && collectedIds.has(reqB);

              return (
                <div
                  key={hyp.id}
                  data-testid={`hypothesis-card-${hyp.id}`}
                  className={`p-4 rounded border transition ${
                    isUnlocked
                      ? hyp.isFallacy
                        ? 'bg-amber-950/30 border-amber-500/50'
                        : 'bg-teal-950/30 border-teal-500/50'
                      : 'bg-slate-900/40 border-slate-800/80 opacity-80'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-mono text-[10px] uppercase tracking-wider flex items-center gap-1.5">
                      {isUnlocked ? (
                        hyp.isFallacy ? (
                          <span className="text-amber-400 flex items-center gap-1">
                            <AlertOctagon className="w-3.5 h-3.5" /> MISLEADING ASSUMPTION
                          </span>
                        ) : (
                          <span className="text-teal-400 flex items-center gap-1">
                            <CheckCircle className="w-3.5 h-3.5" /> VERIFIED DEDUCTION
                          </span>
                        )
                      ) : (
                        <span className="text-slate-500">UNLINKED HYPOTHESIS</span>
                      )}
                    </span>

                    {canAutoSynthesize && (
                      <button
                        data-testid={`synthesize-btn-${hyp.id}`}
                        onClick={() => linkCluesOnBoard(reqA, reqB)}
                        className="px-2.5 py-0.5 rounded font-mono text-[10px] bg-teal-500/25 border border-teal-400 text-teal-200 hover:bg-teal-500/40 flex items-center gap-1"
                      >
                        <Sparkles className="w-3 h-3" /> LINK PINS
                      </button>
                    )}
                  </div>

                  <h4 className="font-serif text-sm font-semibold text-slate-100 mb-1">
                    {isUnlocked ? hyp.title : '??? — Requires Corroborating Evidence Pair'}
                  </h4>

                  <p className="text-xs text-slate-300 leading-relaxed mb-2">
                    {isUnlocked
                      ? hyp.claim
                      : `Link [${clueA?.deductionTag}] + [${clueB?.deductionTag}]`}
                  </p>

                  {isUnlocked && (
                    <div className="text-[11px] font-mono text-slate-300 bg-slate-950/80 p-2 rounded border border-slate-800">
                      {hyp.conclusionText}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
