import { APARTMENTS } from '../data/apartments';
import { DEDUCTION_HYPOTHESES, ENDINGS, MYSTERY_CLUES } from '../data/mysteryClues';
import { RESIDENTS } from '../data/residents';
import { INTERVENTIONS, WORLD_EVENT_TRIGGERS } from '../data/timelineEvents';
import {
  ApartmentId,
  ClueDefinition,
  EndingDefinition,
  EndingId,
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

export class SimulationEngine {
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

    // Fallback to last segment of the night
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
      // Secondary apartments have deterministic atmospheric light cycles
      let secondaryLightOn = true;
      if (!def.isDetailedInteractive) {
        if (aptId === 'apt_4c') secondaryLightOn = Math.sin(minute * 0.4) > -0.6; // flickering renovation lamp
        if (aptId === 'apt_3a') secondaryLightOn = minute < 145; // Mrs. Gable turns off TV at 02:25 AM
        if (aptId === 'apt_2a') secondaryLightOn = true; // Darkroom crimson glow
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

      // Subtle procedural micro-motion for pacing or working
      let offsetX = 0;
      let offsetZ = 0;
      if (seg.posture === 'pacing_nervously') {
        offsetX = Math.sin(minute * 2.5) * 0.55;
      }

      const worldPos: [number, number, number] = [
        aptDef.worldCenter[0] + wp.localPos[0] + offsetX,
        aptDef.worldCenter[1] - 1.25 + wp.localPos[1], // Floor level of apartment
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

    // Determine which clues are currently observable in the world
    const visibleClues = MYSTERY_CLUES.filter((clue) => {
      if (clue.night !== night) return false;
      if (minute < clue.minMinute || minute > clue.maxMinute) return false;
      if (clue.requiredFlags && !clue.requiredFlags.every((f) => flags.has(f))) return false;
      if (clue.blockedByFlags && clue.blockedByFlags.some((f) => flags.has(f))) return false;
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
   * Checks whether an optical observation scan satisfies zoom, focus distance, and apartment alignment.
   */
  public static checkClueOpticalConditions(
    clue: ClueDefinition,
    focusedApartmentId: ApartmentId | null,
    currentZoom: number,
    currentFocalDistance: number
  ): { canScan: boolean; reason: string; focusDelta: number } {
    if (focusedApartmentId !== clue.apartmentId) {
      return {
        canScan: false,
        reason: `Aim viewfinder at Apt ${APARTMENTS[clue.apartmentId].code}`,
        focusDelta: 99,
      };
    }

    if (currentZoom < clue.minZoomLevel) {
      return {
        canScan: false,
        reason: `Increase optical zoom to ${clue.minZoomLevel.toFixed(1)}x (Current: ${currentZoom.toFixed(1)}x)`,
        focusDelta: 0,
      };
    }

    const focusDelta = Math.abs(currentFocalDistance - clue.targetFocalDistance);
    const FOCUS_TOLERANCE = 1.85; // meters
    if (focusDelta > FOCUS_TOLERANCE) {
      return {
        canScan: false,
        reason: `Adjust focus ring to ~${clue.targetFocalDistance.toFixed(1)}m (Current: ${currentFocalDistance.toFixed(1)}m)`,
        focusDelta,
      };
    }

    return {
      canScan: true,
      reason: 'OPTICAL LOCK ACQUIRED — HOLD TO RECORD EVIDENCE',
      focusDelta,
    };
  }

  /**
   * Validates if an intervention can be executed at the current night and minute.
   */
  public static canTriggerIntervention(
    interventionId: InterventionId,
    night: NightNumber,
    minute: number,
    flags: Set<string>
  ): { allowed: boolean; reason: string } {
    const def = INTERVENTIONS.find((i) => i.id === interventionId);
    if (!def) return { allowed: false, reason: 'Unknown intervention' };
    if (flags.has(def.setsFlag)) {
      return { allowed: false, reason: 'Intervention already deployed this investigation' };
    }
    if (!def.allowedNights.includes(night)) {
      return {
        allowed: false,
        reason: `Available on Night ${def.allowedNights.join('/')}`,
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
    return { allowed: true, reason: 'READY TO DEPLOY' };
  }

  /**
   * Evaluates the player's unlocked Deduction Board hypotheses to determine the narrative ending.
   */
  public static resolveEnding(unlockedHypothesisIds: string[]): EndingDefinition {
    const hasTrueAccess = unlockedHypothesisIds.includes('hyp_coerced_blackout_access');
    const hasTrueHeist = unlockedHypothesisIds.includes('hyp_marcus_executed_heist');
    const hasTrueSting = unlockedHypothesisIds.includes('hyp_julian_elena_counter_sting');
    const hasFallacy = unlockedHypothesisIds.includes('hyp_misleading_julian_inside_job');

    // True conspiracy ending requires at least 2 of the 3 verified links (or all 3) and recognizing the counter-sting or heist
    const verifiedCount = [hasTrueAccess, hasTrueHeist, hasTrueSting].filter(Boolean).length;
    if (verifiedCount >= 2 && (hasTrueHeist || hasTrueSting)) {
      return ENDINGS.ending_true_conspiracy;
    }

    // If the player only linked the Night 1 misleading assumption blaming Julian Vance
    if (hasFallacy && verifiedCount < 2) {
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
