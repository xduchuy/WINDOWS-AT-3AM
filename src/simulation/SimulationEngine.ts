import { APARTMENTS } from '../data/apartments';
import { DEDUCTION_HYPOTHESES, ENDINGS, MYSTERY_CLUES } from '../data/mysteryClues';
import { RESIDENTS } from '../data/residents';
import { INTERVENTIONS, WORLD_EVENT_TRIGGERS } from '../data/timelineEvents';
import {
  ApartmentId,
  ClueDefinition,
  EndingDefinition,
  InterventionId,
  NightNumber,
  ResidentId,
  ResidentPosture,
  ScheduleSegment,
  WorldEventTrigger,
} from '../types/game';

export interface ActiveResidentState {
  residentId: ResidentId;
  fullName: string;
  apartmentId: ApartmentId;
  waypointId: string;
  worldPosition: [number, number, number];
  facingYaw: number;
  posture: ResidentPosture;
  actionSummary: string;
  observableDetail: string;
  activePropId?: string;
}

export interface ActiveApartmentState {
  apartmentId: ApartmentId;
  lightOn: boolean;
  blindsState: 'open' | 'half' | 'closed';
  occupants: ResidentId[];
  activeProps: string[];
  emergencyBlackout: boolean;
}

export interface SimulationSnapshot {
  night: NightNumber;
  minute: number;
  residents: Record<ResidentId, ActiveResidentState>;
  apartments: Record<ApartmentId, ActiveApartmentState>;
  newlyTriggeredEvents: WorldEventTrigger[];
  visibleClues: ClueDefinition[];
}

export interface EvidenceValidationResult {
  canScan: boolean;
  reason: string;
  focusDelta: number;
  failedCondition?:
    | 'apartment'
    | 'time'
    | 'visibility'
    | 'line_of_sight'
    | 'optics'
    | 'prerequisites';
}

export class SimulationEngine {
  public static readonly MAX_ALERTNESS_BUDGET = 3;

  /**
   * Reconstructs consistent world flags and fired event IDs up to (targetNight, targetMinute),
   * pruning any future flags/events when rewinding or jumping in debug mode.
   */
  public static reconstructChronologyState(
    targetNight: NightNumber,
    targetMinute: number,
    existingFlags: Iterable<string>
  ): { flags: Set<string>; firedEventIds: Set<string> } {
    const interventionFlagDefs = new Map(
      INTERVENTIONS.map((int) => [int.setsFlag, int])
    );

    // Keep only intervention flags that could have occurred at or before (targetNight, targetMinute)
    const validFlags = new Set<string>();
    for (const flag of existingFlags) {
      const intDef = interventionFlagDefs.get(flag);
      if (intDef) {
        const minNight = Math.min(...intDef.allowedNights);
        if (
          targetNight > minNight ||
          (targetNight === minNight && targetMinute >= intDef.minMinute)
        ) {
          validFlags.add(flag);
        }
      }
    }

    const firedEventIds = new Set<string>();
    // Deterministically replay world events in chronological order up to target point
    const sortedEvents = [...WORLD_EVENT_TRIGGERS].sort((a, b) =>
      a.night !== b.night ? a.night - b.night : a.triggerMinute - b.triggerMinute
    );

    for (const evt of sortedEvents) {
      const isBeforeOrAt =
        evt.night < targetNight ||
        (evt.night === targetNight && evt.triggerMinute <= targetMinute);
      if (!isBeforeOrAt) continue;

      const reqOk = !evt.requiredFlags || evt.requiredFlags.every((f) => validFlags.has(f));
      const blkOk = !evt.blockedByFlags || evt.blockedByFlags.every((f) => !validFlags.has(f));
      if (reqOk && blkOk) {
        firedEventIds.add(evt.id);
        for (const f of evt.setsFlags) {
          validFlags.add(f);
        }
      }
    }

    return { flags: validFlags, firedEventIds };
  }

  /**
   * Resolves the active schedule segment for a resident given night, minute, and world flags.
   */
  public static resolveResidentSegment(
    residentId: ResidentId,
    night: NightNumber,
    minute: number,
    flags: Set<string>
  ): ScheduleSegment {
    const resident = RESIDENTS[residentId];
    const candidates = resident.schedules.filter((seg) => {
      if (seg.night !== night) return false;
      if (minute < seg.startMinute || minute > seg.endMinute) return false;
      if (seg.requiresFlag && !flags.has(seg.requiresFlag)) return false;
      if (seg.blockedByFlag && flags.has(seg.blockedByFlag)) return false;
      return true;
    });

    if (candidates.length > 0) {
      return candidates[0];
    }

    const nightSegments = resident.schedules.filter((s) => s.night === night);
    return nightSegments[nightSegments.length - 1] || resident.schedules[0];
  }

  /**
   * Evaluates deterministic world state at (night, minute, flags).
   */
  public static evaluateSnapshot(
    night: NightNumber,
    minute: number,
    flags: Set<string>,
    firedEventIds: Set<string>
  ): SimulationSnapshot {
    const newlyTriggeredEvents: WorldEventTrigger[] = [];

    for (const evt of WORLD_EVENT_TRIGGERS) {
      if (evt.night === night && minute >= evt.triggerMinute && !firedEventIds.has(evt.id)) {
        const reqOk = !evt.requiredFlags || evt.requiredFlags.every((f) => flags.has(f));
        const blkOk = !evt.blockedByFlags || evt.blockedByFlags.every((f) => !flags.has(f));
        if (reqOk && blkOk) {
          newlyTriggeredEvents.push(evt);
        }
      }
    }

    const apartments = {} as Record<ApartmentId, ActiveApartmentState>;
    for (const aptId of Object.keys(APARTMENTS) as ApartmentId[]) {
      const def = APARTMENTS[aptId];
      let secondaryLightOn = true;
      if (!def.isDetailedInteractive) {
        if (aptId === 'apt_4c') secondaryLightOn = Math.sin(minute * 0.4) > -0.6;
        if (aptId === 'apt_3a') secondaryLightOn = minute < 145;
        if (aptId === 'apt_2a') secondaryLightOn = true;
      }

      const is4ABlackout =
        aptId === 'apt_4a' && night === 2 && minute >= 85 && minute < 130;

      apartments[aptId] = {
        apartmentId: aptId,
        lightOn: is4ABlackout ? false : secondaryLightOn,
        blindsState: 'open',
        occupants: [],
        activeProps: [],
        emergencyBlackout: is4ABlackout,
      };
    }

    const residents = {} as Record<ResidentId, ActiveResidentState>;
    for (const resId of Object.keys(RESIDENTS) as ResidentId[]) {
      const resDef = RESIDENTS[resId];
      const seg = SimulationEngine.resolveResidentSegment(resId, night, minute, flags);
      const aptDef = APARTMENTS[seg.apartmentId];
      const wp =
        aptDef.waypoints[seg.waypointId] ||
        Object.values(aptDef.waypoints)[0] || {
          id: 'default',
          label: 'Center',
          localPos: [0, 0, 0],
          facingYaw: Math.PI,
        };

      let offsetX = 0;
      let offsetZ = 0;
      if (seg.posture === 'pacing_nervously') {
        offsetX = Math.sin(minute * 2.5) * 0.55;
      }

      const worldPos: [number, number, number] = [
        aptDef.worldCenter[0] + wp.localPos[0] + offsetX,
        aptDef.worldCenter[1] - 1.25 + wp.localPos[1],
        aptDef.worldCenter[2] + wp.localPos[2] + offsetZ,
      ];

      residents[resId] = {
        residentId: resId,
        fullName: resDef.fullName,
        apartmentId: seg.apartmentId,
        waypointId: seg.waypointId,
        worldPosition: worldPos,
        facingYaw: wp.facingYaw,
        posture: seg.posture,
        actionSummary: seg.actionSummary,
        observableDetail: seg.observableDetail,
        activePropId: seg.activePropId,
      };

      const targetApt = apartments[seg.apartmentId];
      if (targetApt) {
        targetApt.occupants.push(resId);
        targetApt.lightOn = targetApt.emergencyBlackout ? false : seg.lightOn;
        targetApt.blindsState = seg.blindsState;
        if (seg.activePropId) {
          targetApt.activeProps.push(seg.activePropId);
        }
      }
    }

    const visibleClues = MYSTERY_CLUES.filter((clue) => {
      if (clue.night !== night) return false;
      if (minute < clue.minMinute || minute > clue.maxMinute) return false;
      if (clue.requiredFlags && !clue.requiredFlags.every((f) => flags.has(f))) return false;
      if (clue.blockedByFlags && clue.blockedByFlags.some((f) => flags.has(f))) return false;
      const aptState = apartments[clue.apartmentId];
      if (aptState && aptState.blindsState === 'closed') return false;
      return true;
    });

    return {
      night,
      minute,
      residents,
      apartments,
      newlyTriggeredEvents,
      visibleClues,
    };
  }

  /**
   * Comprehensive 6-condition validation for authentic observation evidence capture:
   * 1. Correct apartment
   * 2. Correct narrative time (night & minute window)
   * 3. Physical visibility in 3D scene (blinds not closed, prop/action active)
   * 4. Valid line of sight (camera aimed at window opening, not panned away)
   * 5. Sufficient optical clarity (zoomLevel & focalDistance within tolerance)
   * 6. Required preceding event flags
   */
  public static validateEvidenceCollection(
    clue: ClueDefinition,
    params: {
      night: NightNumber;
      minute: number;
      focusedApartmentId: ApartmentId | null;
      currentZoom: number;
      currentFocalDistance: number;
      worldFlags: Set<string>;
      apartments?: Record<ApartmentId, ActiveApartmentState>;
      isLineOfSightClear?: boolean;
    }
  ): EvidenceValidationResult {
    // 1. Correct apartment
    if (params.focusedApartmentId !== clue.apartmentId) {
      return {
        canScan: false,
        reason: `Focus viewfinder on Apt ${APARTMENTS[clue.apartmentId].code}`,
        focusDelta: 99,
        failedCondition: 'apartment',
      };
    }

    // 2. Correct narrative time
    if (
      params.night !== clue.night ||
      params.minute < clue.minMinute ||
      params.minute > clue.maxMinute
    ) {
      return {
        canScan: false,
        reason: 'No anomalous activity visible at this timestamp',
        focusDelta: 99,
        failedCondition: 'time',
      };
    }

    // 6. Required preceding event conditions
    if (
      clue.requiredFlags &&
      !clue.requiredFlags.every((f) => params.worldFlags.has(f))
    ) {
      return {
        canScan: false,
        reason: 'Prerequisite courtyard condition not met',
        focusDelta: 99,
        failedCondition: 'prerequisites',
      };
    }
    if (
      clue.blockedByFlags &&
      clue.blockedByFlags.some((f) => params.worldFlags.has(f))
    ) {
      return {
        canScan: false,
        reason: 'Observation opportunity has passed',
        focusDelta: 99,
        failedCondition: 'prerequisites',
      };
    }

    // 3. Physical visibility
    const aptState = params.apartments?.[clue.apartmentId];
    if (aptState && aptState.blindsState === 'closed') {
      return {
        canScan: false,
        reason: 'Window blinds are drawn closed — interior obstructed',
        focusDelta: 99,
        failedCondition: 'visibility',
      };
    }

    // 4. Valid 3D line of sight
    if (params.isLineOfSightClear === false) {
      return {
        canScan: false,
        reason: 'Line of sight obstructed — center reticle on window interior',
        focusDelta: 99,
        failedCondition: 'line_of_sight',
      };
    }

    // 5. Sufficient optical clarity (Zoom & Focal Distance)
    if (params.currentZoom < clue.minZoomLevel) {
      return {
        canScan: false,
        reason: `Zoom to ${clue.minZoomLevel.toFixed(1)}x+ (now ${params.currentZoom.toFixed(1)}x)`,
        focusDelta: 0,
        failedCondition: 'optics',
      };
    }

    const focusDelta = Math.abs(params.currentFocalDistance - clue.targetFocalDistance);
    const FOCUS_TOLERANCE = 1.85; // meters
    if (focusDelta > FOCUS_TOLERANCE) {
      return {
        canScan: false,
        reason: `Calibrate focus to ~${clue.targetFocalDistance.toFixed(1)}m [F]`,
        focusDelta,
        failedCondition: 'optics',
      };
    }

    return {
      canScan: true,
      reason: 'OPTICAL LOCK — HOLD [R] OR CLICK TO RECORD',
      focusDelta,
    };
  }

  /**
   * Backwards-compatible helper wrapping optical conditions check.
   */
  public static checkClueOpticalConditions(
    clue: ClueDefinition,
    focusedApartmentId: ApartmentId | null,
    currentZoom: number,
    currentFocalDistance: number
  ): { canScan: boolean; reason: string; focusDelta: number } {
    return SimulationEngine.validateEvidenceCollection(clue, {
      night: clue.night,
      minute: clue.minMinute,
      focusedApartmentId,
      currentZoom,
      currentFocalDistance,
      worldFlags: new Set(clue.requiredFlags || []),
    });
  }

  /**
   * Validates if an intervention can be executed at the current night, minute, prerequisites, and alertness budget.
   */
  public static canTriggerIntervention(
    interventionId: InterventionId,
    night: NightNumber,
    minute: number,
    flags: Set<string>,
    collectedClueIds: Set<string> = new Set(),
    currentAlertness = 0
  ): { allowed: boolean; reason: string } {
    const def = INTERVENTIONS.find((i) => i.id === interventionId);
    if (!def) return { allowed: false, reason: 'Unknown intervention' };
    if (flags.has(def.setsFlag)) {
      return { allowed: false, reason: 'Already deployed during this investigation' };
    }
    if (currentAlertness + def.alertnessCost > SimulationEngine.MAX_ALERTNESS_BUDGET) {
      return {
        allowed: false,
        reason: 'Courtyard alertness too high — further interventions will compromise cover',
      };
    }
    if (!def.allowedNights.includes(night)) {
      return {
        allowed: false,
        reason: `Active on Night ${def.allowedNights.join('/')}`,
      };
    }
    if (minute < def.minMinute || minute > def.maxMinute) {
      const startH = Math.floor(def.minMinute / 60);
      const startM = String(def.minMinute % 60).padStart(2, '0');
      const endH = Math.floor(def.maxMinute / 60);
      const endM = String(def.maxMinute % 60).padStart(2, '0');
      return {
        allowed: false,
        reason: `Window: 0${startH}:${startM}–0${endH}:${endM} AM`,
      };
    }
    if (def.prerequisiteClueId && !collectedClueIds.has(def.prerequisiteClueId)) {
      return {
        allowed: false,
        reason: 'Requires observing prior 3B transfer evidence first',
      };
    }
    return { allowed: true, reason: 'READY TO DEPLOY' };
  }

  /**
   * Evaluates the player's unlocked Deduction Board hypotheses AND verifies that the underlying
   * evidence clues were genuinely collected before awarding True or Partial endings.
   */
  public static resolveEnding(
    unlockedHypothesisIds: string[],
    collectedClueIds?: Set<string>
  ): EndingDefinition {
    // Filter unlocked hypotheses to ensure their required clues were actually collected (if set provided)
    const validHyps = unlockedHypothesisIds.filter((hypId) => {
      const def = DEDUCTION_HYPOTHESES.find((h) => h.id === hypId);
      if (!def) return false;
      if (!collectedClueIds) return true;
      return (
        collectedClueIds.has(def.requiredClueIds[0]) &&
        collectedClueIds.has(def.requiredClueIds[1])
      );
    });

    const hasTrueAccess = validHyps.includes('hyp_coerced_blackout_access');
    const hasTrueHeist = validHyps.includes('hyp_marcus_executed_heist');
    const hasTrueSting = validHyps.includes('hyp_julian_elena_counter_sting');
    const hasFallacy = validHyps.includes('hyp_misleading_julian_inside_job');

    const verifiedCount = [hasTrueAccess, hasTrueHeist, hasTrueSting].filter(Boolean).length;

    // True conspiracy ending requires at least 2 verified deductions including the heist or counter-sting
    if (verifiedCount >= 2 && (hasTrueHeist || hasTrueSting)) {
      return ENDINGS.ending_true_conspiracy;
    }

    // Partial / compromised ending if the player synthesized only 1 verified link OR submitted the Night 1 fallacy
    if (verifiedCount === 1 || hasFallacy) {
      return ENDINGS.ending_scapegoat_julian;
    }

    return ENDINGS.ending_failure_cold_case;
  }

  public static findHypothesisByCluePair(clueA: string, clueB: string) {
    return DEDUCTION_HYPOTHESES.find(
      (h) =>
        (h.requiredClueIds[0] === clueA && h.requiredClueIds[1] === clueB) ||
        (h.requiredClueIds[0] === clueB && h.requiredClueIds[1] === clueA)
    );
  }
}
