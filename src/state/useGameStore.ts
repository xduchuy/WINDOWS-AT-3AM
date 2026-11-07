import { create } from 'zustand';
import { APARTMENTS } from '../data/apartments';
import { MYSTERY_CLUES } from '../data/mysteryClues';
import { INTERVENTIONS } from '../data/timelineEvents';
import { SaveDataPayload, SaveSystem } from '../simulation/SaveSystem';
import {
  ActiveApartmentState,
  ActiveResidentState,
  SimulationEngine,
} from '../simulation/SimulationEngine';
import { WorldClock } from '../simulation/WorldClock';
import {
  ApartmentId,
  ClueDefinition,
  CollectedClueRecord,
  EndingDefinition,
  InterventionId,
  NightNumber,
  QualityPreset,
  ResidentId,
} from '../types/game';
import { createGameplayFSM, GameplayMode } from './gameMachine';

const fsmActor = createGameplayFSM();

export interface SubtitleCue {
  id: string;
  speakerOrSource: string;
  text: string;
  timestamp: string;
  expiresAtMs: number;
}

const initialDebugMode =
  typeof window !== 'undefined' &&
  new URLSearchParams(window.location.search).get('debug') === '1';

export interface GameStoreState {
  // FSM, Mode & Time
  gameplayMode: GameplayMode;
  debugMode: boolean;
  hudHidden: boolean;
  night: NightNumber;
  minute: number; // 0 to 180
  timeScale: number; // 0 (paused), 1, 2, 5
  isPaused: boolean;
  nightTransitionBanner: string | null;

  // Camera & Optics
  focusedApartmentId: ApartmentId | null;
  hoveredApartmentId: ApartmentId | null;
  zoomLevel: number; // 1.0x (35mm) to 3.5x (135mm)
  focalDistance: number; // 8.0m to 24.0m
  autoFocusEnabled: boolean;
  isLineOfSightClear: boolean;
  isHoldingRecord: boolean;
  activeScanClueId: string | null;
  scanProgress: number; // 0 to 100
  lastOpticalRejection: string | null;

  // Simulation Snapshot
  worldFlags: string[];
  firedEventIds: string[];
  courtyardAlertness: number;
  residents: Record<ResidentId, ActiveResidentState>;
  apartments: Record<ApartmentId, ActiveApartmentState>;
  visibleClues: ClueDefinition[];

  // Investigation & Deduction
  collectedClues: CollectedClueRecord[];
  unlockedHypothesisIds: string[];
  selectedBoardClueId: string | null;
  lastDeductionFeedback: string | null;
  resolvedEnding: EndingDefinition | null;

  // Subtitles, Audio & Performance
  activeSubtitles: SubtitleCue[];
  audioMuted: boolean;
  qualityPreset: QualityPreset;
  fps: number;
  frameTimeMs: number;
  renderBackend: string;
  subtitlesEnabled: boolean;
  highContrastUi: boolean;
  reducedMotion: boolean;
  hasSavedGame: boolean;

  // Actions
  setGameplayMode: (mode: GameplayMode) => void;
  setDebugMode: (enabled: boolean) => void;
  toggleHudHidden: () => void;
  tickSimulation: (deltaSeconds: number) => void;
  setNight: (night: NightNumber) => boolean;
  setMinute: (minute: number) => boolean;
  advanceToNextNight: () => { ok: boolean; reason: string };
  setTimeScale: (scale: number) => void;
  togglePause: () => void;

  focusApartment: (aptId: ApartmentId | null) => void;
  setHoveredApartment: (aptId: ApartmentId | null) => void;
  setZoomLevel: (zoom: number) => void;
  setFocalDistance: (meters: number) => void;
  toggleAutoFocus: () => void;
  setLineOfSightClear: (clear: boolean) => void;
  setHoldingRecord: (holding: boolean) => void;

  stepClueScan: (deltaSeconds: number) => { newlyCollected?: ClueDefinition };
  collectClueImmediate: (clueId?: string) => { ok: boolean; reason: string; clue?: ClueDefinition };
  triggerIntervention: (interventionId: InterventionId) => { ok: boolean; message: string };

  selectBoardClue: (clueId: string | null) => void;
  linkCluesOnBoard: (clueA: string, clueB: string) => { ok: boolean; message: string };
  submitFinalVerdict: () => EndingDefinition;

  pushSubtitle: (speakerOrSource: string, text: string) => void;
  setQualityPreset: (preset: QualityPreset) => void;
  updatePerformanceMetrics: (fps: number, frameTimeMs: number, backend?: string) => void;
  toggleAudioMute: () => void;
  setAccessibilityOption: (
    key: 'subtitlesEnabled' | 'highContrastUi' | 'reducedMotion',
    value: boolean
  ) => void;

  saveGame: () => boolean;
  loadGame: () => boolean;
  resetInvestigation: () => void;
}

const initialSnapshot = SimulationEngine.evaluateSnapshot(1, 10, new Set(), new Set());

export const useGameStore = create<GameStoreState>((set, get) => ({
  gameplayMode: 'observing',
  debugMode: initialDebugMode,
  hudHidden: false,
  night: 1,
  minute: 10,
  timeScale: 1,
  isPaused: false,
  nightTransitionBanner: null,

  focusedApartmentId: null,
  hoveredApartmentId: null,
  zoomLevel: 1.0,
  focalDistance: 19.5,
  autoFocusEnabled: false,
  isLineOfSightClear: true,
  isHoldingRecord: false,
  activeScanClueId: null,
  scanProgress: 0,
  lastOpticalRejection: null,

  worldFlags: [],
  firedEventIds: [],
  courtyardAlertness: 0,
  residents: initialSnapshot.residents,
  apartments: initialSnapshot.apartments,
  visibleClues: initialSnapshot.visibleClues,

  collectedClues: [],
  unlockedHypothesisIds: [],
  selectedBoardClueId: null,
  lastDeductionFeedback: null,
  resolvedEnding: null,

  activeSubtitles: [
    {
      id: 'init_sub',
      speakerOrSource: 'NIGHT 1 // 00:10 AM',
      text: 'Click any window to focus. Scroll to zoom, press [F] to calibrate focus, and hold [R] to record evidence.',
      timestamp: 'NIGHT 1 // 00:10 AM',
      expiresAtMs: Date.now() + 8000,
    },
  ],
  audioMuted: false,
  qualityPreset: 'high',
  fps: 60,
  frameTimeMs: 16.6,
  renderBackend: 'WebGL2 // Filmic PBR',
  subtitlesEnabled: true,
  highContrastUi: false,
  reducedMotion: false,
  hasSavedGame: SaveSystem.hasSaveSlot(),

  setGameplayMode: (mode) => {
    const state = get();
    if (mode === state.gameplayMode) return;

    if (mode === 'observing') {
      const snap = fsmActor.getSnapshot();
      const restorePaused = snap.context.wasPausedBeforeOverlay;
      fsmActor.send({ type: 'RETURN_TO_OBSERVATION' });
      set({ gameplayMode: 'observing', isPaused: restorePaused });
    } else if (mode === 'journal_open') {
      fsmActor.send({
        type: 'OPEN_JOURNAL',
        currentlyPaused:
          state.gameplayMode === 'observing'
            ? state.isPaused
            : fsmActor.getSnapshot().context.wasPausedBeforeOverlay,
      });
      set({ gameplayMode: 'journal_open', isPaused: true });
    } else if (mode === 'deduction_open') {
      fsmActor.send({
        type: 'OPEN_DEDUCTION',
        currentlyPaused:
          state.gameplayMode === 'observing'
            ? state.isPaused
            : fsmActor.getSnapshot().context.wasPausedBeforeOverlay,
      });
      set({ gameplayMode: 'deduction_open', isPaused: true });
    } else if (mode === 'settings_open') {
      fsmActor.send({
        type: 'OPEN_SETTINGS',
        currentlyPaused:
          state.gameplayMode === 'observing'
            ? state.isPaused
            : fsmActor.getSnapshot().context.wasPausedBeforeOverlay,
      });
      set({ gameplayMode: 'settings_open', isPaused: true });
    } else {
      set({ gameplayMode: mode });
    }
  },

  setDebugMode: (enabled) => set({ debugMode: enabled }),

  toggleHudHidden: () => set((s) => ({ hudHidden: !s.hudHidden })),

  tickSimulation: (deltaSeconds) => {
    const state = get();
    const now = Date.now();
    const filteredSubs = state.activeSubtitles.filter((s) => s.expiresAtMs > now);

    const effectivelyPaused =
      state.isPaused || state.gameplayMode !== 'observing';

    const { nextMinute, reachedEndOfNight } = WorldClock.stepClock(
      state.minute,
      deltaSeconds,
      state.timeScale,
      effectivelyPaused
    );

    let nextNight = state.night;
    let finalMinute = nextMinute;
    let nextTimeScale = state.timeScale;
    let nextIsPaused = state.isPaused;
    let nextBanner = state.nightTransitionBanner;

    // Natural progression at 03:00 AM
    if (reachedEndOfNight && !effectivelyPaused) {
      if (state.night < 3) {
        nextNight = (state.night + 1) as NightNumber;
        finalMinute = 0;
        nextTimeScale = 1;
        fsmActor.send({ type: 'ADVANCE_NIGHT', night: nextNight });
        nextBanner = `NIGHT ${nextNight} // 00:00 AM`;
      } else {
        // End of Night 3 at 03:00 AM: pause and prompt final deduction
        finalMinute = WorldClock.MAX_MINUTES;
        nextIsPaused = true;
        nextTimeScale = 1;
      }
    }

    const flagSet = new Set(state.worldFlags);
    const firedSet = new Set(state.firedEventIds);
    const snapshot = SimulationEngine.evaluateSnapshot(nextNight, finalMinute, flagSet, firedSet);

    const newSubs = [...filteredSubs];
    for (const evt of snapshot.newlyTriggeredEvents) {
      firedSet.add(evt.id);
      for (const f of evt.setsFlags) {
        flagSet.add(f);
      }
      // Never allow fast-forward to silently bypass decision points
      if (evt.isDecisionPoint && nextTimeScale > 1) {
        nextTimeScale = 1;
      }
      newSubs.push({
        id: `${evt.id}_${now}`,
        speakerOrSource: `${APARTMENTS[evt.sourceApartmentId].code} // ${evt.title.toUpperCase()}`,
        text: evt.subtitle,
        timestamp: WorldClock.formatTimestamp(nextNight, finalMinute),
        expiresAtMs: now + 7500,
      });
    }

    set({
      night: nextNight,
      minute: finalMinute,
      timeScale: nextTimeScale,
      isPaused: nextIsPaused,
      nightTransitionBanner: nextBanner,
      worldFlags: Array.from(flagSet),
      firedEventIds: Array.from(firedSet),
      residents: snapshot.residents,
      apartments: snapshot.apartments,
      visibleClues: snapshot.visibleClues,
      activeSubtitles: newSubs.slice(-2),
    });
  },

  /**
   * Direct night switching is restricted to debugMode.
   * Normal gameplay must use natural clock rollover or advanceToNextNight().
   */
  setNight: (night) => {
    const state = get();
    if (!state.debugMode) {
      return false;
    }
    fsmActor.send({ type: 'ADVANCE_NIGHT', night });
    const reconstructed = SimulationEngine.reconstructChronologyState(
      night,
      10,
      state.worldFlags
    );
    const snapshot = SimulationEngine.evaluateSnapshot(
      night,
      10,
      reconstructed.flags,
      reconstructed.firedEventIds
    );
    set({
      night,
      minute: 10,
      worldFlags: Array.from(reconstructed.flags),
      firedEventIds: Array.from(reconstructed.firedEventIds),
      residents: snapshot.residents,
      apartments: snapshot.apartments,
      visibleClues: snapshot.visibleClues,
    });
    return true;
  },

  /**
   * Direct timeline scrubbing is restricted to debugMode.
   * Reconstructs consistent chronological flags when rewinding or jumping.
   */
  setMinute: (minute) => {
    const state = get();
    if (!state.debugMode) {
      return false;
    }
    const clamped = Math.max(0, Math.min(WorldClock.MAX_MINUTES, minute));
    const reconstructed = SimulationEngine.reconstructChronologyState(
      state.night,
      clamped,
      state.worldFlags
    );
    const snapshot = SimulationEngine.evaluateSnapshot(
      state.night,
      clamped,
      reconstructed.flags,
      reconstructed.firedEventIds
    );
    set({
      minute: clamped,
      worldFlags: Array.from(reconstructed.flags),
      firedEventIds: Array.from(reconstructed.firedEventIds),
      residents: snapshot.residents,
      apartments: snapshot.apartments,
      visibleClues: snapshot.visibleClues,
    });
    return true;
  },

  /**
   * Allows the player to conclude the current night watch once the night has reached 02:15 AM (135m)
   * or after collecting at least 2 clues from the current night, advancing naturally to the next night.
   */
  advanceToNextNight: () => {
    const state = get();
    if (state.night >= 3) {
      return {
        ok: false,
        reason: 'Final night in progress — open Deduction Board to submit verdict.',
      };
    }

    const cluesThisNight = state.collectedClues.filter(
      (c) => c.collectedAtNight === state.night
    ).length;

    if (state.minute < 135 && cluesThisNight < 2) {
      return {
        ok: false,
        reason: 'Continue observing until 02:15 AM or record at least 2 observations tonight.',
      };
    }

    const nextNight = (state.night + 1) as NightNumber;
    fsmActor.send({ type: 'ADVANCE_NIGHT', night: nextNight });
    // Ensure all events from the concluded night have their flags committed
    const endOfCurrentNight = SimulationEngine.reconstructChronologyState(
      state.night,
      180,
      state.worldFlags
    );
    const snapshot = SimulationEngine.evaluateSnapshot(
      nextNight,
      10,
      endOfCurrentNight.flags,
      endOfCurrentNight.firedEventIds
    );

    set({
      night: nextNight,
      minute: 10,
      timeScale: 1,
      worldFlags: Array.from(endOfCurrentNight.flags),
      firedEventIds: Array.from(endOfCurrentNight.firedEventIds),
      residents: snapshot.residents,
      apartments: snapshot.apartments,
      visibleClues: snapshot.visibleClues,
      nightTransitionBanner: `NIGHT ${nextNight} // 00:10 AM`,
    });

    get().pushSubtitle(
      `NIGHT ${nextNight} WATCH`,
      `Concluded Night ${state.night} log. Beginning Night ${nextNight} surveillance.`
    );
    return { ok: true, reason: `Advanced to Night ${nextNight}` };
  },

  setTimeScale: (scale) => set({ timeScale: scale, isPaused: scale === 0 }),

  togglePause: () => set((s) => ({ isPaused: !s.isPaused })),

  focusApartment: (aptId) => {
    if (!aptId) {
      set({
        focusedApartmentId: null,
        zoomLevel: 1.0,
        scanProgress: 0,
        activeScanClueId: null,
        lastOpticalRejection: null,
      });
      return;
    }
    const apt = APARTMENTS[aptId];
    set((state) => ({
      focusedApartmentId: aptId,
      zoomLevel: Math.max(state.zoomLevel, 2.2),
      focalDistance: state.autoFocusEnabled ? apt.focalDepthMeters : state.focalDistance,
      scanProgress: 0,
      activeScanClueId: null,
      lastOpticalRejection: null,
    }));
  },

  setHoveredApartment: (aptId) => set({ hoveredApartmentId: aptId }),

  setZoomLevel: (zoom) => {
    const clamped = Math.max(1.0, Math.min(3.5, Number(zoom.toFixed(2))));
    set({ zoomLevel: clamped });
  },

  setFocalDistance: (meters) => {
    const clamped = Math.max(8.0, Math.min(24.0, Number(meters.toFixed(1))));
    set({ focalDistance: clamped });
  },

  toggleAutoFocus: () => {
    set((state) => {
      const nextAuto = !state.autoFocusEnabled;
      const nextFocus =
        nextAuto && state.focusedApartmentId
          ? APARTMENTS[state.focusedApartmentId].focalDepthMeters
          : state.focalDistance;
      return { autoFocusEnabled: nextAuto, focalDistance: nextFocus };
    });
  },

  setLineOfSightClear: (clear) => set({ isLineOfSightClear: clear }),

  setHoldingRecord: (holding) => set({ isHoldingRecord: holding }),

  stepClueScan: (deltaSeconds) => {
    const state = get();
    const collectedSet = new Set(state.collectedClues.map((c) => c.clueId));

    const candidate = state.visibleClues.find(
      (c) => c.apartmentId === state.focusedApartmentId && !collectedSet.has(c.id)
    );

    if (!candidate) {
      if (state.scanProgress !== 0 || state.activeScanClueId !== null) {
        set({ scanProgress: 0, activeScanClueId: null });
      }
      return {};
    }

    const check = SimulationEngine.validateEvidenceCollection(candidate, {
      night: state.night,
      minute: state.minute,
      focusedApartmentId: state.focusedApartmentId,
      currentZoom: state.zoomLevel,
      currentFocalDistance: state.focalDistance,
      worldFlags: new Set(state.worldFlags),
      apartments: state.apartments,
      isLineOfSightClear: state.isLineOfSightClear,
    });

    if (!check.canScan) {
      set({
        activeScanClueId: candidate.id,
        scanProgress: Math.max(0, state.scanProgress - deltaSeconds * 40),
      });
      return {};
    }

    // Optical lock achieved: require holding [R] or Record button so looking alone does not auto-collect
    if (!state.isHoldingRecord) {
      set({
        activeScanClueId: candidate.id,
        scanProgress: Math.max(0, state.scanProgress - deltaSeconds * 30),
      });
      return {};
    }

    const fillRate = 135;
    const nextProgress = Math.min(100, state.scanProgress + deltaSeconds * fillRate);

    if (nextProgress >= 100) {
      const record: CollectedClueRecord = {
        clueId: candidate.id,
        collectedAtNight: state.night,
        collectedAtMinute: Math.floor(state.minute),
        formattedTimestamp: WorldClock.formatTimestamp(state.night, state.minute),
      };
      set({
        collectedClues: [...state.collectedClues, record],
        scanProgress: 0,
        activeScanClueId: null,
        lastOpticalRejection: null,
      });
      get().pushSubtitle(
        `OBSERVATION RECORDED [${APARTMENTS[candidate.apartmentId].code}]`,
        `${candidate.title}`
      );
      return { newlyCollected: candidate };
    }

    set({ activeScanClueId: candidate.id, scanProgress: nextProgress });
    return {};
  },

  /**
   * Strictly validates all 6 observation requirements before recording a clue.
   * Cannot be used to bypass apartment, time, visibility, line-of-sight, optical clarity, or event prerequisites.
   */
  collectClueImmediate: (clueId) => {
    const state = get();
    const collectedSet = new Set(state.collectedClues.map((c) => c.clueId));

    const targetClue = clueId
      ? MYSTERY_CLUES.find((c) => c.id === clueId)
      : state.visibleClues.find(
          (c) => c.apartmentId === state.focusedApartmentId && !collectedSet.has(c.id)
        );

    if (!targetClue) {
      const reason = 'No observable evidence at current focus and timestamp';
      set({ lastOpticalRejection: reason });
      return { ok: false, reason };
    }

    if (collectedSet.has(targetClue.id)) {
      return { ok: true, reason: 'Evidence already recorded', clue: targetClue };
    }

    const validation = SimulationEngine.validateEvidenceCollection(targetClue, {
      night: state.night,
      minute: state.minute,
      focusedApartmentId: state.focusedApartmentId,
      currentZoom: state.zoomLevel,
      currentFocalDistance: state.focalDistance,
      worldFlags: new Set(state.worldFlags),
      apartments: state.apartments,
      isLineOfSightClear: state.isLineOfSightClear,
    });

    if (!validation.canScan) {
      set({ lastOpticalRejection: validation.reason });
      return { ok: false, reason: validation.reason };
    }

    const record: CollectedClueRecord = {
      clueId: targetClue.id,
      collectedAtNight: state.night,
      collectedAtMinute: Math.floor(state.minute),
      formattedTimestamp: WorldClock.formatTimestamp(state.night, state.minute),
    };

    set({
      collectedClues: [...state.collectedClues, record],
      scanProgress: 0,
      activeScanClueId: null,
      lastOpticalRejection: null,
    });

    get().pushSubtitle(
      `OBSERVATION RECORDED [${APARTMENTS[targetClue.apartmentId].code}]`,
      `${targetClue.title}`
    );

    return { ok: true, reason: 'Evidence recorded', clue: targetClue };
  },

  triggerIntervention: (interventionId) => {
    const state = get();
    const def = INTERVENTIONS.find((i) => i.id === interventionId);
    if (!def) return { ok: false, message: 'Invalid intervention' };

    const collectedSet = new Set(state.collectedClues.map((c) => c.clueId));
    const check = SimulationEngine.canTriggerIntervention(
      interventionId,
      state.night,
      state.minute,
      new Set(state.worldFlags),
      collectedSet,
      state.courtyardAlertness
    );
    if (!check.allowed) {
      return { ok: false, message: check.reason };
    }

    const nextFlags = Array.from(new Set([...state.worldFlags, def.setsFlag]));
    const nextAlertness = state.courtyardAlertness + def.alertnessCost;
    const snapshot = SimulationEngine.evaluateSnapshot(
      state.night,
      state.minute,
      new Set(nextFlags),
      new Set(state.firedEventIds)
    );

    set({
      worldFlags: nextFlags,
      courtyardAlertness: nextAlertness,
      residents: snapshot.residents,
      apartments: snapshot.apartments,
      visibleClues: snapshot.visibleClues,
    });

    get().focusApartment(def.targetApartmentId);
    get().pushSubtitle(def.shortCode, def.consequenceDescription);
    return { ok: true, message: def.consequenceDescription };
  },

  selectBoardClue: (clueId) => set({ selectedBoardClueId: clueId }),

  linkCluesOnBoard: (clueA, clueB) => {
    if (clueA === clueB) {
      return { ok: false, message: 'Select two distinct pieces of evidence to synthesize.' };
    }

    const state = get();
    const collectedSet = new Set(state.collectedClues.map((c) => c.clueId));
    if (!collectedSet.has(clueA) || !collectedSet.has(clueB)) {
      return {
        ok: false,
        message: 'Both evidence pins must be observed and recorded before linking.',
      };
    }

    const hyp = SimulationEngine.findHypothesisByCluePair(clueA, clueB);
    if (!hyp) {
      set({
        selectedBoardClueId: null,
        lastDeductionFeedback:
          'INCONCLUSIVE LINK: Those two observations do not establish a direct causal connection.',
      });
      return {
        ok: false,
        message: 'No direct causal link between those two observations.',
      };
    }

    if (state.unlockedHypothesisIds.includes(hyp.id)) {
      set({
        selectedBoardClueId: null,
        lastDeductionFeedback: `Already synthesized: ${hyp.title}`,
      });
      return { ok: true, message: `Already synthesized: ${hyp.title}` };
    }

    const nextHyps = [...state.unlockedHypothesisIds, hyp.id];
    set({
      unlockedHypothesisIds: nextHyps,
      selectedBoardClueId: null,
      lastDeductionFeedback: hyp.conclusionText,
    });
    get().pushSubtitle('DEDUCTION SYNTHESIZED', hyp.title);
    return { ok: true, message: hyp.conclusionText };
  },

  submitFinalVerdict: () => {
    const state = get();
    const collectedSet = new Set(state.collectedClues.map((c) => c.clueId));
    const ending = SimulationEngine.resolveEnding(
      state.unlockedHypothesisIds,
      collectedSet
    );
    fsmActor.send({ type: 'RESOLVE_CASE', endingId: ending.id });
    set({
      gameplayMode: 'case_resolved',
      resolvedEnding: ending,
      isPaused: true,
    });
    return ending;
  },

  pushSubtitle: (speakerOrSource, text) => {
    const state = get();
    const cue: SubtitleCue = {
      id: `sub_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      speakerOrSource,
      text,
      timestamp: WorldClock.formatTimestamp(state.night, state.minute),
      expiresAtMs: Date.now() + 7000,
    };
    set({ activeSubtitles: [...state.activeSubtitles.slice(-1), cue] });
  },

  setQualityPreset: (preset) => set({ qualityPreset: preset }),

  updatePerformanceMetrics: (fps, frameTimeMs, backend) =>
    set((s) => ({
      fps,
      frameTimeMs,
      renderBackend: backend ?? s.renderBackend,
    })),

  toggleAudioMute: () => set((s) => ({ audioMuted: !s.audioMuted })),

  setAccessibilityOption: (key, value) => set({ [key]: value } as Partial<GameStoreState>),

  saveGame: () => {
    const state = get();
    const payload: SaveDataPayload = {
      version: 1,
      savedAtIso: new Date().toISOString(),
      night: state.night,
      minute: state.minute,
      worldFlags: state.worldFlags,
      firedEventIds: state.firedEventIds,
      collectedClues: state.collectedClues,
      unlockedHypothesisIds: state.unlockedHypothesisIds,
      courtyardAlertness: state.courtyardAlertness,
      qualityPreset: state.qualityPreset,
      subtitlesEnabled: state.subtitlesEnabled,
      highContrastUi: state.highContrastUi,
      reducedMotion: state.reducedMotion,
    };
    const ok = SaveSystem.saveToLocalStorage(payload);
    if (ok) {
      set({ hasSavedGame: true });
      get().pushSubtitle('SYSTEM', 'Investigation state saved.');
    }
    return ok;
  },

  loadGame: () => {
    const data = SaveSystem.loadFromLocalStorage();
    if (!data) return false;
    fsmActor.send({ type: 'ADVANCE_NIGHT', night: data.night });
    const snapshot = SimulationEngine.evaluateSnapshot(
      data.night,
      data.minute,
      new Set(data.worldFlags),
      new Set(data.firedEventIds)
    );
    set({
      night: data.night,
      minute: data.minute,
      worldFlags: data.worldFlags,
      firedEventIds: data.firedEventIds,
      courtyardAlertness: data.courtyardAlertness ?? 0,
      collectedClues: data.collectedClues,
      unlockedHypothesisIds: data.unlockedHypothesisIds,
      qualityPreset: data.qualityPreset,
      subtitlesEnabled: data.subtitlesEnabled,
      highContrastUi: data.highContrastUi,
      reducedMotion: data.reducedMotion,
      residents: snapshot.residents,
      apartments: snapshot.apartments,
      visibleClues: snapshot.visibleClues,
      gameplayMode: 'observing',
      resolvedEnding: null,
      isPaused: false,
    });
    get().pushSubtitle('SYSTEM', `Loaded saved investigation (Night ${data.night}).`);
    return true;
  },

  resetInvestigation: () => {
    fsmActor.send({ type: 'RESET_INVESTIGATION' });
    const snap = SimulationEngine.evaluateSnapshot(1, 10, new Set(), new Set());
    set({
      gameplayMode: 'observing',
      night: 1,
      minute: 10,
      timeScale: 1,
      isPaused: false,
      nightTransitionBanner: null,
      focusedApartmentId: null,
      zoomLevel: 1.0,
      focalDistance: 19.5,
      isLineOfSightClear: true,
      isHoldingRecord: false,
      lastOpticalRejection: null,
      worldFlags: [],
      firedEventIds: [],
      courtyardAlertness: 0,
      residents: snap.residents,
      apartments: snap.apartments,
      visibleClues: snap.visibleClues,
      collectedClues: [],
      unlockedHypothesisIds: [],
      selectedBoardClueId: null,
      lastDeductionFeedback: null,
      resolvedEnding: null,
      hasSavedGame: SaveSystem.hasSaveSlot(),
    });
    get().pushSubtitle('SYSTEM', 'Investigation reset to Night 1 // 00:10 AM.');
  },
}));
