import React, { useState } from 'react';
import { AlertTriangle, BookOpen, CheckCircle2, Clock, User, X } from 'lucide-react';
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
    setNight,
    setMinute,
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
      className="pointer-events-auto fixed inset-y-14 right-4 z-30 w-[440px] max-w-[92vw] bg-[#060b15]/95 border border-slate-700/80 rounded-md shadow-2xl backdrop-blur-xl flex flex-col overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-amber-400" />
          <h2 className="font-serif text-base font-semibold text-slate-100">
            OBSERVATION JOURNAL
          </h2>
        </div>
        <button
          data-testid="close-journal-btn"
          onClick={() => setGameplayMode('observing')}
          className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Sub-navigation Tabs */}
      <div className="flex border-b border-slate-800 bg-slate-950/60 px-4 pt-2 gap-4 font-mono text-xs">
        <button
          data-testid="journal-tab-evidence"
          onClick={() => setActiveTab('evidence')}
          className={`pb-2 border-b-2 transition ${
            activeTab === 'evidence'
              ? 'border-amber-400 text-amber-300 font-semibold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          LOGGED CLUES ({collectedClues.length}/{MYSTERY_CLUES.length})
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
          TENANT DOSSIERS (4)
        </button>
      </div>

      {activeTab === 'evidence' ? (
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {/* Night Filter Bar */}
          <div className="flex items-center gap-1.5 font-mono text-[11px]">
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
              <p className="font-mono text-amber-300/90">NO EVIDENCE RECORDED IN THIS VIEW</p>
              <p>
                Select an illuminated apartment window (`4A`, `3B`, `2C`, `1A`), zoom in above
                `2.2x`, adjust your focal distance to `~19–20m`, and click{' '}
                <strong className="text-teal-300">Focus & Log Observation</strong> when an action
                occurs.
              </p>
            </div>
          ) : (
            filteredRecords.map((rec) => {
              const clue = MYSTERY_CLUES.find((m) => m.id === rec.clueId);
              if (!clue) return null;
              const apt = APARTMENTS[clue.apartmentId];
              const isRefuted =
                clue.contradictedByClueId && collectedIds.has(clue.contradictedByClueId);

              return (
                <div
                  key={rec.clueId}
                  data-testid={`journal-clue-${rec.clueId}`}
                  className={`p-3 rounded border transition ${
                    isRefuted
                      ? 'bg-rose-950/20 border-rose-500/40'
                      : 'bg-slate-900/80 border-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between font-mono text-[10px] text-amber-400 mb-1">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {rec.formattedTimestamp}
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-slate-950 text-slate-300">
                      APT {apt.code}
                    </span>
                  </div>

                  <h3 className="font-serif text-sm font-semibold text-slate-100 mb-1">
                    {clue.title}
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed mb-2">
                    {clue.description}
                  </p>

                  {clue.isMisleadingAssumption && (
                    <div className="flex items-center gap-1.5 text-[11px] font-mono text-amber-300 bg-amber-950/40 border border-amber-500/30 px-2 py-1 rounded">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                      <span>
                        {isRefuted
                          ? 'REFUTED ASSUMPTION: Contradicted by Night 2 3B Vault Bailment.'
                          : 'CAUTION: Circumstantial Night 1 assumption — verify across Night 2.'}
                      </span>
                    </div>
                  )}
                </div>
              );
            })
          )}

          {/* Investigation Leads Checklist */}
          <div className="pt-3 border-t border-slate-800/80">
            <h4 className="font-mono text-[10px] tracking-wider text-slate-400 uppercase mb-2">
              SURVEILLANCE LEADS (CLICK TO JUMP TO TIMESTAMP)
            </h4>
            <div className="space-y-1.5">
              {MYSTERY_CLUES.map((clue) => {
                const isDone = collectedIds.has(clue.id);
                const apt = APARTMENTS[clue.apartmentId];
                const targetMin = Math.floor((clue.minMinute + clue.maxMinute) / 2);

                return (
                  <div
                    key={clue.id}
                    className="flex items-center justify-between text-[11px] bg-slate-950/70 border border-slate-800/70 px-2.5 py-1.5 rounded"
                  >
                    <div className="flex items-center gap-2 truncate pr-2">
                      <CheckCircle2
                        className={`w-3.5 h-3.5 shrink-0 ${
                          isDone ? 'text-teal-400' : 'text-slate-600'
                        }`}
                      />
                      <span className={isDone ? 'text-slate-300 line-through' : 'text-slate-300'}>
                        [N{clue.night} · {apt.code}] {clue.deductionTag}
                      </span>
                    </div>
                    <button
                      data-testid={`jump-lead-${clue.id}`}
                      onClick={() => {
                        setNight(clue.night);
                        setMinute(targetMin);
                        focusApartment(clue.apartmentId);
                        setGameplayMode('observing');
                      }}
                      className="font-mono text-[10px] text-amber-400 hover:underline shrink-0"
                    >
                      OBSERVE
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
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
                    <User className="w-4 h-4 text-amber-400" />
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
                    APT {apt.code}
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
