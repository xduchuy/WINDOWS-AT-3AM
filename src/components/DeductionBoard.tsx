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

  // Only reveal hypotheses that are ALREADY synthesized by the player,
  // OR where the player has genuinely collected BOTH required evidence pins!
  const unlockedHyps = DEDUCTION_HYPOTHESES.filter((h) =>
    unlockedHypothesisIds.includes(h.id)
  );
  const readyToLinkHyps = DEDUCTION_HYPOTHESES.filter(
    (h) =>
      !unlockedHypothesisIds.includes(h.id) &&
      collectedIds.has(h.requiredClueIds[0]) &&
      collectedIds.has(h.requiredClueIds[1])
  );

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
      className="pointer-events-auto fixed inset-0 z-30 bg-[#04070d]/90 backdrop-blur-xl flex items-center justify-center p-4 md:p-6"
    >
      <div className="w-full max-w-5xl h-[84vh] bg-[#070d19] border border-slate-800 rounded-lg shadow-2xl flex flex-col overflow-hidden">
        {/* Top Bar */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-slate-950/70">
          <div>
            <span className="font-mono text-[10px] tracking-[0.22em] text-teal-400 uppercase">
              INVESTIGATION WORKSPACE
            </span>
            <h2 className="font-serif text-base md:text-lg font-semibold text-slate-100 flex items-center gap-2">
              <GitBranch className="w-4 h-4 text-teal-400" />
              DEDUCTION & HYPOTHESIS BOARD
            </h2>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              data-testid="submit-verdict-btn"
              onClick={() => submitFinalVerdict()}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded font-mono text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-lg transition"
            >
              <FileCheck2 className="w-3.5 h-3.5" />
              <span>SUBMIT VERDICT</span>
            </button>

            <button
              data-testid="close-deduction-btn"
              onClick={() => setGameplayMode('observing')}
              className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-slate-800"
              title="Close [ESC]"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Status Bar */}
        <div className="px-5 py-2 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between text-xs font-mono">
          <span className="text-slate-300 truncate pr-4">
            {selectedBoardClueId
              ? `PIN SELECTED: [${
                  MYSTERY_CLUES.find((c) => c.id === selectedBoardClueId)?.deductionTag
                }] — Click a second corroborating pin to test connection.`
              : lastDeductionFeedback ||
                'Click any two recorded evidence pins to connect observations into a hypothesis.'}
          </span>
          <span className="text-teal-400 shrink-0">
            CONFIRMED LINKS:{' '}
            {
              unlockedHypothesisIds.filter(
                (id) => !DEDUCTION_HYPOTHESES.find((h) => h.id === id)?.isFallacy
              ).length
            }
          </span>
        </div>

        {/* Main Workspace */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
          {/* Left Column: Collected Evidence Pins */}
          <div className="lg:col-span-6 p-4 md:p-5 overflow-y-auto border-b lg:border-b-0 lg:border-r border-slate-800 space-y-3">
            <h3 className="font-mono text-[11px] tracking-wider text-amber-400 uppercase">
              1. RECORDED EVIDENCE PINS ({collectedDefs.length})
            </h3>

            {collectedDefs.length === 0 ? (
              <div className="p-5 rounded border border-dashed border-slate-800 text-slate-400 text-xs space-y-2">
                <p>No evidence pins recorded yet.</p>
                <p>
                  Observe the apartment windows across Mercer Courtyard, calibrate optical zoom and
                  focus, and record physical clues first.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {collectedDefs.map((clue) => {
                  const isSelected = selectedBoardClueId === clue.id;
                  const apt = APARTMENTS[clue.apartmentId];
                  const isRefuted =
                    clue.contradictedByClueId && collectedIds.has(clue.contradictedByClueId);

                  return (
                    <button
                      key={clue.id}
                      data-testid={`board-clue-pin-${clue.id}`}
                      onClick={() => handleClueClick(clue.id)}
                      className={`text-left p-3 rounded border transition flex flex-col justify-between ${
                        isSelected
                          ? 'bg-teal-500/25 border-teal-400 ring-1 ring-teal-400'
                          : isRefuted
                          ? 'bg-rose-950/20 border-rose-500/40 hover:border-rose-400'
                          : 'bg-slate-900/85 border-slate-800 hover:border-amber-400/60'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between font-mono text-[10px] text-amber-400 mb-1">
                          <span>
                            NIGHT {clue.night} · APT {apt.code}
                          </span>
                          <Link2 className="w-3 h-3 text-teal-400" />
                        </div>
                        <div className="font-mono text-xs font-semibold text-slate-100 mb-1">
                          {clue.deductionTag}
                        </div>
                        <p className="text-[11px] text-slate-400 line-clamp-2">
                          {clue.title}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Column: Synthesized Hypotheses (No Uncollected Spoilers Shown) */}
          <div className="lg:col-span-6 p-4 md:p-5 overflow-y-auto space-y-3 bg-slate-950/40">
            <h3 className="font-mono text-[11px] tracking-wider text-teal-400 uppercase">
              2. SYNTHESIZED HYPOTHESES ({unlockedHyps.length})
            </h3>

            {/* Corroborating pairs ready to synthesize from already-collected evidence */}
            {readyToLinkHyps.map((hyp) => {
              const [reqA, reqB] = hyp.requiredClueIds;
              const clueA = MYSTERY_CLUES.find((c) => c.id === reqA);
              const clueB = MYSTERY_CLUES.find((c) => c.id === reqB);
              return (
                <div
                  key={hyp.id}
                  className="p-3 rounded border border-dashed border-teal-500/40 bg-teal-950/15 flex items-center justify-between gap-3"
                >
                  <div className="text-xs font-mono text-slate-300">
                    <span className="text-teal-400 block text-[10px]">
                      CORROBORATING PINS AVAILABLE:
                    </span>
                    <span>
                      {clueA?.deductionTag} + {clueB?.deductionTag}
                    </span>
                  </div>
                  <button
                    data-testid={`synthesize-btn-${hyp.id}`}
                    onClick={() => linkCluesOnBoard(reqA, reqB)}
                    className="shrink-0 px-2.5 py-1 rounded font-mono text-[10px] bg-teal-500/25 border border-teal-400 text-teal-200 hover:bg-teal-500/40 flex items-center gap-1"
                  >
                    <Sparkles className="w-3 h-3" /> CONNECT
                  </button>
                </div>
              );
            })}

            {unlockedHyps.length === 0 && readyToLinkHyps.length === 0 && (
              <div className="p-5 rounded border border-slate-800/80 bg-slate-900/30 text-xs text-slate-400 space-y-2">
                <p className="font-mono text-slate-300 text-[11px]">
                  NO HYPOTHESES SYNTHESIZED YET
                </p>
                <p>
                  Hypotheses are never revealed in advance. Collect corroborating observations
                  across apartments and link two pins on the left to form a deduction.
                </p>
              </div>
            )}

            {unlockedHyps.map((hyp) => {
              const isContradicted =
                hyp.refutedByClueId && collectedIds.has(hyp.refutedByClueId);

              return (
                <div
                  key={hyp.id}
                  data-testid={`hypothesis-card-${hyp.id}`}
                  className={`p-4 rounded border transition ${
                    isContradicted
                      ? 'bg-rose-950/30 border-rose-500/50'
                      : hyp.isFallacy
                      ? 'bg-amber-950/30 border-amber-500/50'
                      : 'bg-teal-950/30 border-teal-500/50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-mono text-[10px] uppercase tracking-wider flex items-center gap-1.5">
                      {isContradicted ? (
                        <span className="text-rose-400 flex items-center gap-1">
                          <AlertOctagon className="w-3.5 h-3.5" /> CONTRADICTED BY 3B VAULT EVIDENCE
                        </span>
                      ) : hyp.isFallacy ? (
                        <span className="text-amber-400 flex items-center gap-1">
                          <AlertOctagon className="w-3.5 h-3.5" /> UNPROVEN ASSUMPTION
                        </span>
                      ) : (
                        <span className="text-teal-400 flex items-center gap-1">
                          <CheckCircle className="w-3.5 h-3.5" /> CONFIRMED SYNTHESIS
                        </span>
                      )}
                    </span>
                  </div>

                  <h4 className="font-serif text-sm font-semibold text-slate-100 mb-1">
                    {hyp.title}
                  </h4>

                  <p className="text-xs text-slate-300 leading-relaxed mb-2">{hyp.claim}</p>

                  <div className="text-[11px] font-mono text-slate-300 bg-slate-950/80 p-2 rounded border border-slate-800">
                    {hyp.conclusionText}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
