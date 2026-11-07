import React, { useState } from 'react';
import {
  AlertTriangle,
  BookOpen,
  Clock,
  Link2,
  MapPin,
  ShieldCheck,
  User,
  X,
} from 'lucide-react';
import { APARTMENTS } from '../data/apartments';
import { MYSTERY_CLUES } from '../data/mysteryClues';
import { RESIDENT_LIST } from '../data/residents';
import { useGameStore } from '../state/useGameStore';
import { NightNumber } from '../types/game';

export const JournalDrawer: React.FC = () => {
  const {
    gameplayMode,
    collectedClues,
    setGameplayMode,
    focusApartment,
  } = useGameStore();
  const [filterNight, setFilterNight] = useState<NightNumber | 'ALL'>('ALL');
  const [activeTab, setActiveTab] = useState<'evidence' | 'dossiers'>('evidence');

  if (gameplayMode !== 'journal_open') return null;

  const collectedIds = new Set(collectedClues.map((c) => c.clueId));
  const filteredRecords = collectedClues.filter((rec) => {
    const def = MYSTERY_CLUES.find((m) => m.id === rec.clueId);
    if (!def) return false;
    return filterNight === 'ALL' || def.night === filterNight;
  });

  return (
    <div
      data-testid="journal-drawer"
      className="pointer-events-auto fixed inset-y-12 right-3 z-30 w-[420px] max-w-[94vw] bg-[#060b15]/95 border border-slate-800/90 rounded-md shadow-2xl backdrop-blur-xl flex flex-col overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-amber-400" />
          <h2 className="font-serif text-sm font-semibold tracking-wider text-slate-100 uppercase">
            OBSERVATION JOURNAL
          </h2>
        </div>
        <button
          data-testid="close-journal-btn"
          onClick={() => setGameplayMode('observing')}
          className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800"
          title="Close [ESC]"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Sub-navigation Tabs */}
      <div className="flex border-b border-slate-800 bg-slate-950/60 px-4 pt-2 gap-5 font-mono text-[11px]">
        <button
          data-testid="journal-tab-evidence"
          onClick={() => setActiveTab('evidence')}
          className={`pb-2 border-b-2 transition ${
            activeTab === 'evidence'
              ? 'border-amber-400 text-amber-300 font-semibold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          RECORDED EVIDENCE ({collectedClues.length})
        </button>
        <button
          data-testid="journal-tab-dossiers"
          onClick={() => setActiveTab('dossiers')}
          className={`pb-2 border-b-2 transition ${
            activeTab === 'dossiers'
              ? 'border-amber-400 text-amber-300 font-semibold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          TENANT NOTES (4)
        </button>
      </div>

      {activeTab === 'evidence' ? (
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {/* Night Filter Bar */}
          <div className="flex items-center gap-1.5 font-mono text-[10px]">
            {(['ALL', 1, 2, 3] as const).map((f) => (
              <button
                key={String(f)}
                onClick={() => setFilterNight(f)}
                className={`px-2 py-0.5 rounded border ${
                  filterNight === f
                    ? 'bg-amber-500/20 border-amber-400 text-amber-200'
                    : 'bg-slate-900 border-slate-800 text-slate-400'
                }`}
              >
                {f === 'ALL' ? 'ALL NIGHTS' : `NIGHT ${f}`}
              </button>
            ))}
          </div>

          {filteredRecords.length === 0 ? (
            <div className="bg-slate-900/50 border border-slate-800/80 rounded p-4 text-xs text-slate-400 space-y-2">
              <p className="font-mono text-amber-300/90 text-[11px]">
                NO OBSERVATIONS RECORDED YET
              </p>
              <p className="leading-relaxed">
                Click an illuminated apartment window (`4A`, `3B`, `2C`, `1A`), scroll to zoom
                (`2.2x+`), press `F` to calibrate focus, and hold `R` when you spot suspicious
                props or resident activity.
              </p>
            </div>
          ) : (
            filteredRecords.map((rec) => {
              const clue = MYSTERY_CLUES.find((m) => m.id === rec.clueId);
              if (!clue) return null;
              const apt = APARTMENTS[clue.apartmentId];
              const isRefuted =
                clue.contradictedByClueId && collectedIds.has(clue.contradictedByClueId);

              // Only show cross-references to other clues the player has ALREADY discovered
              const discoveredCrossRefs = clue.relatedClueIds
                .filter((id) => collectedIds.has(id))
                .map((id) => MYSTERY_CLUES.find((m) => m.id === id))
                .filter(Boolean);

              return (
                <div
                  key={rec.clueId}
                  data-testid={`journal-clue-${rec.clueId}`}
                  className={`p-3 rounded border transition space-y-2 ${
                    isRefuted
                      ? 'bg-rose-950/20 border-rose-500/40'
                      : 'bg-slate-900/80 border-slate-800'
                  }`}
                >
                  {/* Timestamp & Location */}
                  <div className="flex items-center justify-between font-mono text-[10px]">
                    <span className="flex items-center gap-1 text-amber-400">
                      <Clock className="w-3 h-3" /> {rec.formattedTimestamp}
                    </span>
                    <button
                      onClick={() => {
                        focusApartment(clue.apartmentId);
                        setGameplayMode('observing');
                      }}
                      className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-950 text-slate-300 hover:text-amber-300 border border-slate-800"
                    >
                      <MapPin className="w-2.5 h-2.5 text-amber-400" />
                      APT {apt.code}
                    </button>
                  </div>

                  {/* Title & Confidence Badge */}
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-serif text-sm font-semibold text-slate-100">
                      {clue.title}
                    </h3>
                    <span
                      className={`shrink-0 font-mono text-[9px] uppercase px-1.5 py-0.5 rounded border ${
                        isRefuted
                          ? 'bg-rose-950/60 border-rose-500/50 text-rose-300'
                          : clue.confidence === 'confirmed'
                          ? 'bg-teal-950/50 border-teal-500/40 text-teal-300'
                          : 'bg-amber-950/50 border-amber-500/40 text-amber-300'
                      }`}
                    >
                      {isRefuted ? 'CONTRADICTED' : clue.confidence}
                    </span>
                  </div>

                  {/* Witness / Object Metadata */}
                  <div className="font-mono text-[10px] text-slate-400 flex items-center gap-1.5">
                    <ShieldCheck className="w-3 h-3 text-teal-400 shrink-0" />
                    <span>SUBJECT: {clue.witnessOrObject}</span>
                  </div>

                  {/* Visual Description */}
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {clue.description}
                  </p>

                  {/* Ambiguity / Contradiction Warning */}
                  {clue.isMisleadingAssumption && (
                    <div className="flex items-center gap-1.5 text-[10px] font-mono text-amber-300 bg-amber-950/40 border border-amber-500/30 px-2 py-1 rounded">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                      <span>
                        {isRefuted
                          ? 'CONTRADICTED: Refuted by Night 2 witnessed bailment in Apt 3B.'
                          : 'AMBIGUOUS: Circumstantial Night 1 observation — verify across later nights.'}
                      </span>
                    </div>
                  )}

                  {/* Cross-references to other discovered clues */}
                  {discoveredCrossRefs.length > 0 && (
                    <div className="pt-1.5 border-t border-slate-800/80 flex flex-wrap items-center gap-1 font-mono text-[9px] text-teal-300">
                      <Link2 className="w-3 h-3" />
                      <span>CORROBORATES:</span>
                      {discoveredCrossRefs.map((ref) => (
                        <span
                          key={ref!.id}
                          className="px-1.5 py-0.2 rounded bg-slate-950 border border-slate-800 text-slate-300"
                        >
                          {ref!.deductionTag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {RESIDENT_LIST.map((res) => {
            const apt = APARTMENTS[res.homeApartmentId];
            return (
              <div
                key={res.id}
                className="p-3 rounded bg-slate-900/80 border border-slate-800 space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <User className="w-3.5 h-3.5 text-amber-400" />
                    <h3 className="font-serif text-sm font-semibold text-slate-100">
                      {res.fullName} ({res.age})
                    </h3>
                  </div>
                  <button
                    onClick={() => {
                      focusApartment(res.homeApartmentId);
                      setGameplayMode('observing');
                    }}
                    className="font-mono text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-400/40"
                  >
                    FOCUS {apt.code}
                  </button>
                </div>
                <p className="font-mono text-[10px] text-teal-300">{res.occupation}</p>
                <p className="text-xs text-slate-300 leading-relaxed">{res.bio}</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
