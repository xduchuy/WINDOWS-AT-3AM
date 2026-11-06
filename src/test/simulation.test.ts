import { describe, expect, it } from 'vitest';
import { APARTMENT_LIST, INTERACTIVE_APARTMENTS } from '../data/apartments';
import { DEDUCTION_HYPOTHESES, MYSTERY_CLUES } from '../data/mysteryClues';
import { RESIDENT_LIST } from '../data/residents';
import { SimulationEngine } from '../simulation/SimulationEngine';
import { WorldClock } from '../simulation/WorldClock';

describe('WINDOWS AT 3AM — Core Simulation, Clock, Interventions & Mystery Resolution', () => {
  it('defines 12 apartment windows across 4 floors with 4 detailed interactive interiors', () => {
    expect(APARTMENT_LIST).toHaveLength(12);
    expect(INTERACTIVE_APARTMENTS).toHaveLength(4);
    const codes = INTERACTIVE_APARTMENTS.map((a) => a.code).sort();
    expect(codes).toEqual(['1A', '2C', '3B', '4A']);
  });

  it('defines 4 residents with complete 3-night schedules from 00:00 to 03:00 AM', () => {
    expect(RESIDENT_LIST).toHaveLength(4);
    for (const resident of RESIDENT_LIST) {
      for (const night of [1, 2, 3] as const) {
        const segs = resident.schedules.filter((s) => s.night === night);
        expect(segs.length).toBeGreaterThanOrEqual(2);
      }
    }
  });

  it('formats and advances the deterministic WorldClock from 00:00 AM to 03:00 AM', () => {
    expect(WorldClock.formatTime(0)).toBe('00:00 AM');
    expect(WorldClock.formatTime(85)).toBe('01:25 AM');
    expect(WorldClock.formatTime(180)).toBe('03:00 AM');

    const step = WorldClock.stepClock(10, 20, 2, false);
    expect(step.nextMinute).toBe(70);
    expect(step.reachedEndOfNight).toBe(false);

    const endStep = WorldClock.stepClock(175, 10, 2, false);
    expect(endStep.nextMinute).toBe(180);
    expect(endStep.reachedEndOfNight).toBe(true);
  });

  it('triggers cross-apartment consequences during the Night 2 01:25 AM breaker blackout', () => {
    const snapBefore = SimulationEngine.evaluateSnapshot(2, 60, new Set(), new Set());
    expect(snapBefore.apartments.apt_4a.lightOn).toBe(true);
    expect(snapBefore.residents.julian.apartmentId).toBe('apt_4a');

    // At 01:30 AM (minute 90) on Night 2:
    // - Julian is in 3B transferring the real violin to Elena
    // - Nora pulled the 4th-floor breaker in 1A, so 4A is in emergencyBlackout
    // - Marcus infiltrated 4A to steal the decoy crimson case
    const snapBlackout = SimulationEngine.evaluateSnapshot(2, 90, new Set(), new Set());
    expect(snapBlackout.apartments.apt_4a.emergencyBlackout).toBe(true);
    expect(snapBlackout.apartments.apt_4a.lightOn).toBe(false);
    expect(snapBlackout.residents.julian.apartmentId).toBe('apt_3b');
    expect(snapBlackout.residents.marcus.apartmentId).toBe('apt_4a');
    expect(snapBlackout.residents.nora.posture).toBe('inspecting_fusebox');
  });

  it('alters resident behavior when a restricted courtyard intervention is deployed', () => {
    const checkInvalid = SimulationEngine.canTriggerIntervention(
      'ring_courtyard_payphone',
      1,
      20, // Too early (window is 65..120)
      new Set()
    );
    expect(checkInvalid.allowed).toBe(false);

    const checkValid = SimulationEngine.canTriggerIntervention(
      'ring_courtyard_payphone',
      1,
      80,
      new Set()
    );
    expect(checkValid.allowed).toBe(true);

    // Without intervention flag, Marcus paces at table
    const snapDefault = SimulationEngine.evaluateSnapshot(1, 80, new Set(), new Set());
    expect(snapDefault.residents.marcus.posture).toBe('pacing_nervously');

    // With flag_payphone_rung, Marcus rushes to window and reveals clue_n1_payphone_keytag
    const snapIntervened = SimulationEngine.evaluateSnapshot(
      1,
      80,
      new Set(['flag_payphone_rung']),
      new Set()
    );
    expect(snapIntervened.residents.marcus.posture).toBe('looking_out_window');
    expect(
      snapIntervened.visibleClues.some((c) => c.id === 'clue_n1_payphone_keytag')
    ).toBe(true);
  });

  it('enforces optical zoom and focal distance conditions before recording evidence', () => {
    const clue = MYSTERY_CLUES.find((c) => c.id === 'clue_n1_extortion_note_1a')!;

    // Wrong apartment
    expect(
      SimulationEngine.checkClueOpticalConditions(clue, 'apt_4a', 2.5, 20.1).canScan
    ).toBe(false);

    // Insufficient zoom
    expect(
      SimulationEngine.checkClueOpticalConditions(clue, 'apt_1a', 1.2, 20.1).canScan
    ).toBe(false);

    // Out-of-focus focal distance
    expect(
      SimulationEngine.checkClueOpticalConditions(clue, 'apt_1a', 2.5, 11.0).canScan
    ).toBe(false);

    // Properly zoomed and focused
    expect(
      SimulationEngine.checkClueOpticalConditions(clue, 'apt_1a', 2.5, 20.0).canScan
    ).toBe(true);
  });

  it('distinguishes between True Conspiracy Resolution, Scapegoat Ending, and Cold Case Failure', () => {
    expect(DEDUCTION_HYPOTHESES).toHaveLength(4);

    // 1. Cold case failure when no hypotheses are unlocked
    const coldEnding = SimulationEngine.resolveEnding([]);
    expect(coldEnding.id).toBe('ending_failure_cold_case');

    // 2. Partial/Misleading Scapegoat ending when only the Night 1 fallacy is submitted
    const scapegoatEnding = SimulationEngine.resolveEnding([
      'hyp_misleading_julian_inside_job',
    ]);
    expect(scapegoatEnding.id).toBe('ending_scapegoat_julian');

    // 3. True resolution when verified cross-apartment hypotheses are linked
    const trueEnding = SimulationEngine.resolveEnding([
      'hyp_coerced_blackout_access',
      'hyp_marcus_executed_heist',
      'hyp_julian_elena_counter_sting',
    ]);
    expect(trueEnding.id).toBe('ending_true_conspiracy');
  });
});
