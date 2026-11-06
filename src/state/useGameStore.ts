import { create } from 'zustand';
import { APARTMENTS } from '../data/apartments';
import { DEDUCTION_HYPOTHESES, MYSTERY_CLUES } from '../data/mysteryClues';
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

export interface GameStoreState {
  // FSM & Time
  gameplayMode: GameplayMode;
  night: NightNumber;
  minute: number; // 0 to 180
  timeScale: number; // 0 (paused), 1, 2, 5
  isPaused: boolean;

  // Camera & Optics
  focusedApartmentId: ApartmentId | null;
  hoveredApartmentId: ApartmentId | null;
  zoomLevel: number; // 1.0x (35mm) to 3.5x (135mm)
  focalDistance: number; // 8.0m to 24.0m
  autoFocusEnabled: boolean;
  activeScanClueId: string | null;
  scanProgress: number; // 0 to 100

  // Simulation Snapshot
  worldFlags: string[];
  firedEventIds: string[];
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
  tickSimulation: (deltaSeconds: number) => void;
  setNight: (night: NightNumber) => void;
  setMinute: (minute: number) => void;
  setTimeScale: (scale: number) => void;
  togglePause: () => void;

  focusApartment: (aptId: ApartmentId | null) => void;
  setHoveredApartment: (aptId: ApartmentId | null) => void;
  setZoomLevel: (zoom: number) => void;
  setFocalDistance: (meters: number) => void;
  toggleAutoFocus: () => void;

  stepClueScan: (deltaSeconds: number) => { newlyCollected?: ClueDefinition };
  collectClueImmediate: (clueId: string) => void;
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
  night: 1,
  minute: 10, // Start at 00:10 AM on Night 1 with active room scenes
  timeScale: 1,
  isPaused: false,

  focusedApartmentId: null,
  hoveredApartmentId: null,
  zoomLevel: 1.0,
  focalDistance: 19.5,
  autoFocusEnabled: false,
  activeScanClueId: null,
  scanProgress: 0,

  worldFlags: [],
  firedEventIds: [],
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
      speakerOrSource: 'MERCER COURTYARD // 00:10 AM',
      text: 'Rain steady across the rear facade. Select any illuminated window (1A, 2C, 3B, 4A) to zoom in, calibrate focus, and observe.',
      timestamp: 'NIGHT 1 // 00:10 AM',
      expiresAtMs: Date.now() + 9000,
    },
  ],
  audioMuted: false,
  qualityPreset: 'high',
  fps: 60,
  frameTimeMs: 16.6,
  renderBackend: 'WebGL2 / PBR',
  subtitlesEnabled: true,
  highContrastUi: false,
  reducedMotion: false,
  hasSavedGame: SaveSystem.hasSaveSlot(),

  setGameplayMode: (mode) => {
    if (mode === 'observing') fsmActor.send({ type: 'RETURN_TO_OBSERVATION' });
    else if (mode === 'journal_open') fsmActor.send({ type: 'OPEN_JOURNAL' });
    else if (mode === 'deduction_open') fsmActor.send({ type: 'OPEN_DEDUCTION' });
    else if (mode === 'settings_open') fsmActor.send({ type: 'OPEN_SETTINGS' });
    set({ gameplayMode: mode });
  },

  tickSimulation: (deltaSeconds) => {
    const state = get();
    const now = Date.now();
    const filteredSubs = state.activeSubtitles.filter((s) => s.expiresAtMs > now);

    const { nextMinute, reachedEndOfNight } = WorldClock.stepClock(
      state.minute,
      deltaSeconds,
      state.timeScale,
      state.isPaused || state.gameplayMode === 'case_resolved'
    );

    let nextNight = state.night;
    let finalMinute = nextMinute;

    // Automatically roll over from 03:00 AM to next night if not on Night 3
    if (reachedEndOfNight && !state.isPaused) {
      if (state.night < 3) {
        nextNight = (state.night + 1) as NightNumber;
        finalMinute = 0;
        fsmActor.send({ type: 'ADVANCE_NIGHT', night: nextNight });
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
      newSubs.push({
        id: `${evt.id}_${now}`,
        speakerOrSource: `${APARTMENTS[evt.sourceApartmentId].code} // ${evt.title.toUpperCase()}`,
        text: evt.subtitle,
        timestamp: WorldClock.formatTimestamp(nextNight, finalMinute),
        expiresAtMs: now + 8500,
      });
    }

    set({
      night: nextNight,
      minute: finalMinute,
      worldFlags: Array.from(flagSet),
      firedEventIds: Array.from(firedSet),
      residents: snapshot.residents,
      apartments: snapshot.apartments,
      visibleClues: snapshot.visibleClues,
      activeSubtitles: newSubs.slice(-3),
    });
  },

  setNight: (night) => {
    const state = get();
    fsmActor.send({ type: 'ADVANCE_NIGHT', night });
    const snapshot = SimulationEngine.evaluateSnapshot(
      night,
      10,
      new Set(state.worldFlags),
      new Set(state.firedEventIds)
    );
    set({
      night,
      minute: 10,
      residents: snapshot.residents,
      apartments: snapshot.apartments,
      visibleClues: snapshot.visibleClues,
    });
    get().pushSubtitle(
      `NIGHT ${night} LOG`,
      `Switched observation reel to Night ${night} (00:10 AM).`
    );
  },

  setMinute: (minute) => {
    const clamped = Math.max(0, Math.min(WorldClock.MAX_MINUTES, minute));
    const state = get();
    const flagSet = new Set(state.worldFlags);
    const firedSet = new Set(state.firedEventIds);
    const snapshot = SimulationEngine.evaluateSnapshot(state.night, clamped, flagSet, firedSet);
    for (const evt of snapshot.newlyTriggeredEvents) {
      firedSet.add(evt.id);
      evt.setsFlags.forEach((f) => flagSet.add(f));
    }
    set({
      minute: clamped,
      worldFlags: Array.from(flagSet),
      firedEventIds: Array.from(firedSet),
      residents: snapshot.residents,
      apartments: snapshot.apartments,
      visibleClues: snapshot.visibleClues,
    });
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
      });
      return;
    }
    const apt = APARTMENTS[aptId];
    set((state) => ({
      focusedApartmentId: aptId,
      zoomLevel: Math.max(state.zoomLevel, 2.4),
      focalDistance: state.autoFocusEnabled ? apt.focalDepthMeters : state.focalDistance,
      scanProgress: 0,
      activeScanClueId: null,
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

  stepClueScan: (deltaSeconds) => {
    const state = get();
    const collectedSet = new Set(state.collectedClues.map((c) => c.clueId));

    // Find an uncollected visible clue in the focused apartment
    const candidate = state.visibleClues.find(
      (c) => c.apartmentId === state.focusedApartmentId && !collectedSet.has(c.id)
    );

    if (!candidate) {
      if (state.scanProgress !== 0 || state.activeScanClueId !== null) {
        set({ scanProgress: 0, activeScanClueId: null });
      }
      return {};
    }

    const check = SimulationEngine.checkClueOpticalConditions(
      candidate,
      state.focusedApartmentId,
      state.zoomLevel,
      state.focalDistance
    );

    if (!check.canScan) {
      set({
        activeScanClueId: candidate.id,
        scanProgress: Math.max(0, state.scanProgress - deltaSeconds * 35),
      });
      return {};
    }

    const nextProgress = Math.min(100, state.scanProgress + deltaSeconds * 75);
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
      });
      get().pushSubtitle(
        `EVIDENCE LOGGED [${APARTMENTS[candidate.apartmentId].code}]`,
        `${candidate.title} — recorded in Observation Journal.`
      );
      return { newlyCollected: candidate };
    }

    set({ activeScanClueId: candidate.id, scanProgress: nextProgress });
    return {};
  },

  collectClueImmediate: (clueId) => {
    const state = get();
    if (state.collectedClues.some((c) => c.clueId === clueId)) return;
    const clue = MYSTERY_CLUES.find((c) => c.id === clueId);
    if (!clue) return;

    const record: CollectedClueRecord = {
      clueId: clue.id,
      collectedAtNight: state.night,
      collectedAtMinute: Math.floor(state.minute),
      formattedTimestamp: WorldClock.formatTimestamp(state.night, state.minute),
    };
    set({
      collectedClues: [...state.collectedClues, record],
      scanProgress: 0,
      activeScanClueId: null,
    });
    get().pushSubtitle(
      `EVIDENCE LOGGED [${APARTMENTS[clue.apartmentId].code}]`,
      `${clue.title} — added to Journal & Deduction Board.`
    );
  },

  triggerIntervention: (interventionId) => {
    const state = get();
    const def = INTERVENTIONS.find((i) => i.id === interventionId);
    if (!def) return { ok: false, message: 'Invalid intervention' };

    const check = SimulationEngine.canTriggerIntervention(
      interventionId,
      state.night,
      state.minute,
      new Set(state.worldFlags)
    );
    if (!check.allowed) {
      return { ok: false, message: check.reason };
    }

    const nextFlags = Array.from(new Set([...state.worldFlags, def.setsFlag]));
    const snapshot = SimulationEngine.evaluateSnapshot(
      state.night,
      state.minute,
      new Set(nextFlags),
      new Set(state.firedEventIds)
    );

    set({
      worldFlags: nextFlags,
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
    const hyp = SimulationEngine.findHypothesisByCluePair(clueA, clueB);
    if (!hyp) {
      set({
        selectedBoardClueId: null,
        lastDeductionFeedback:
          'No direct causal link between those two observations. Check timestamps and apartment connections.',
      });
      return {
        ok: false,
        message: 'No direct causal link between those two observations.',
      };
    }

    const state = get();
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
    const ending = SimulationEngine.resolveEnding(state.unlockedHypothesisIds);
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
      expiresAtMs: Date.now() + 8000,
    };
    set({ activeSubtitles: [...state.activeSubtitles.slice(-2), cue] });
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
      qualityPreset: state.qualityPreset,
      subtitlesEnabled: state.subtitlesEnabled,
      highContrastUi: state.highContrastUi,
      reducedMotion: state.reducedMotion,
    };
    const ok = SaveSystem.saveToLocalStorage(payload);
    if (ok) {
      set({ hasSavedGame: true });
      get().pushSubtitle('SYSTEM', 'Investigation state saved to local storage.');
    }
    return ok;
  },

  loadGame: () => {
    const data = SaveSystem.loadFromLocalStorage();
    if (!data) return false;
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
    });
    get().pushSubtitle('SYSTEM', `Loaded saved investigation (Night ${data.night}).`);
    return true;
  },

  resetInvestigation: () => {
    SaveSystem.clearSaveSlot();
    fsmActor.send({ type: 'RESET_INVESTIGATION' });
    const snap = SimulationEngine.evaluateSnapshot(1, 10, new Set(), new Set());
    set({
      gameplayMode: 'observing',
      night: 1,
      minute: 10,
      timeScale: 1,
      isPaused: false,
      focusedApartmentId: null,
      zoomLevel: 1.0,
      focalDistance: 19.5,
      worldFlags: [],
      firedEventIds: [],
      residents: snap.residents,
      apartments: snap.apartments,
      visibleClues: snap.visibleClues,
      collectedClues: [],
      unlockedHypothesisIds: [],
      selectedBoardClueId: null,
      lastDeductionFeedback: null,
      resolvedEnding: null,
      hasSavedGame: false,
    });
    get().pushSubtitle('SYSTEM', 'Investigation reset to Night 1 // 00:10 AM.');
  },
}));
