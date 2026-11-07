import { beforeEach, describe, expect, it } from 'vitest';
import { APARTMENT_LIST, INTERACTIVE_APARTMENTS } from '../data/apartments';
import { DEDUCTION_HYPOTHESES, MYSTERY_CLUES } from '../data/mysteryClues';
import { RESIDENT_LIST } from '../data/residents';
import { SimulationEngine } from '../simulation/SimulationEngine';
import { WorldClock } from '../simulation/WorldClock';
import { useGameStore } from '../state/useGameStore';

describe('WINDOWS AT 3AM — Upgraded Investigation Gameplay, Guards, Simulation & Endings', () => {
  beforeEach(() => {
    useGameStore.getState().setDebugMode(false);
    useGameStore.getState().resetInvestigation();
  });

  it('1. defines 12 windows across 4 floors and 4 residents with 3-night schedules', () => {
    expect(APARTMENT_LIST).toHaveLength(12);
    expect(INTERACTIVE_APARTMENTS).toHaveLength(4);
    expect(RESIDENT_LIST).toHaveLength(4);
    expect(WorldClock.formatTime(0)).toBe('00:00 AM');
    expect(WorldClock.formatTime(180)).toBe('03:00 AM');
  });

  it('2. prevents arbitrary night skipping and timeline scrubbing in normal gameplay mode', () => {
    const store = useGameStore.getState();
    expect(store.debugMode).toBe(false);
    expect(store.night).toBe(1);

    // Attempting to skip to Night 2 or Night 3 in normal mode must be rejected
    const skippedNight = store.setNight(2);
    expect(skippedNight).toBe(false);
    expect(useGameStore.getState().night).toBe(1);

    // Attempting to scrub the timeline directly in normal mode must be rejected
    const scrubbedMinute = store.setMinute(120);
    expect(scrubbedMinute).toBe(false);
    expect(useGameStore.getState().minute).toBe(10);

    // Attempting to advance night early before 02:15 AM (135m) and with < 2 clues must be rejected
    const earlyAdvance = store.advanceToNextNight();
    expect(earlyAdvance.ok).toBe(false);
    expect(useGameStore.getState().night).toBe(1);
  });

  it('3. progresses nights naturally when time reaches 03:00 AM or after tonight watch criteria are met', () => {
    const store = useGameStore.getState();

    // Advance simulation clock naturally to 03:00 AM (180 minutes) on Night 1
    store.tickSimulation(120); // 120s * 1.5 = 180 minutes
    expect(useGameStore.getState().night).toBe(2);
    expect(useGameStore.getState().minute).toBe(0);
  });

  it('4. reconstructs consistent chronological flags when rewinding in debug mode', () => {
    const store = useGameStore.getState();
    store.setDebugMode(true);

    // Jump to Night 2 at 01:40 AM (100m): Night 1 and Night 2 blackout events should be present
    store.setNight(2);
    store.setMinute(100);
    expect(useGameStore.getState().worldFlags).toContain('flag_n2_4a_blackout_active');

    // Rewind back to Night 1 at 00:20 AM (20m): future Night 2 flags must be pruned!
    store.setNight(1);
    store.setMinute(20);
    expect(useGameStore.getState().worldFlags).not.toContain('flag_n2_4a_blackout_active');
    expect(useGameStore.getState().worldFlags).not.toContain('flag_n1_safe_sealed');
  });

  it('5. strictly rejects invalid evidence capture across all 6 observation conditions', () => {
    const store = useGameStore.getState();

    // At Night 1, 00:10 AM, clue_n1_extortion_note_1a is active in apt_1a (requires zoom >= 2.2, focus ~20.1m)
    // Condition 1 fail: Wrong apartment (focused on 4A instead of 1A)
    store.focusApartment('apt_4a');
    store.setZoomLevel(2.5);
    store.setFocalDistance(20.1);
    const wrongApt = store.collectClueImmediate('clue_n1_extortion_note_1a');
    expect(wrongApt.ok).toBe(false);

    // Condition 5a fail: Insufficient optical zoom (1.2x < 2.2x)
    store.focusApartment('apt_1a');
    store.setZoomLevel(1.2);
    store.setFocalDistance(20.1);
    const lowZoom = store.collectClueImmediate('clue_n1_extortion_note_1a');
    expect(lowZoom.ok).toBe(false);

    // Condition 5b fail: Out-of-focus focal distance (10.0m vs 20.1m)
    store.setZoomLevel(2.5);
    store.setFocalDistance(10.0);
    const badFocus = store.collectClueImmediate('clue_n1_extortion_note_1a');
    expect(badFocus.ok).toBe(false);

    // Condition 4 fail: Obstructed line of sight (camera panned away from window)
    store.setFocalDistance(20.1);
    store.setLineOfSightClear(false);
    const badLOS = store.collectClueImmediate('clue_n1_extortion_note_1a');
    expect(badLOS.ok).toBe(false);

    // Condition 2 fail: Wrong narrative time (attempting to collect a Night 2 clue on Night 1)
    store.setLineOfSightClear(true);
    const wrongTime = store.collectClueImmediate('clue_n2_bailment_3b');
    expect(wrongTime.ok).toBe(false);

    // Condition 6 fail: Missing prerequisite intervention flag (clue_n1_payphone_keytag requires flag_payphone_rung)
    const missingFlag = store.collectClueImmediate('clue_n1_payphone_keytag');
    expect(missingFlag.ok).toBe(false);

    expect(useGameStore.getState().collectedClues).toHaveLength(0);
  });

  it('6. records evidence when all 6 observation conditions are genuinely satisfied', () => {
    const store = useGameStore.getState();
    store.focusApartment('apt_1a');
    store.setZoomLevel(2.4);
    store.setFocalDistance(20.1);
    store.setLineOfSightClear(true);

    const validCapture = store.collectClueImmediate('clue_n1_extortion_note_1a');
    expect(validCapture.ok).toBe(true);
    expect(useGameStore.getState().collectedClues).toHaveLength(1);
    expect(useGameStore.getState().collectedClues[0].clueId).toBe('clue_n1_extortion_note_1a');
  });

  it('7. enforces intervention prerequisites, alertness cost, and resident reactions', () => {
    const store = useGameStore.getState();
    store.setDebugMode(true);

    // Night 2 at 02:20 AM (140m): laser_window_tap_3b requires clue_n2_bailment_3b first!
    store.setNight(2);
    store.setMinute(140);
    const blockedByPrereq = store.triggerIntervention('laser_window_tap_3b');
    expect(blockedByPrereq.ok).toBe(false);

    // Collect clue_n2_bailment_3b at 01:30 AM (90m) on Night 2 first
    store.setMinute(90);
    store.focusApartment('apt_3b');
    store.setZoomLevel(2.4);
    store.setFocalDistance(18.8);
    expect(store.collectClueImmediate('clue_n2_bailment_3b').ok).toBe(true);

    // Now at 02:20 AM (140m), laser_window_tap_3b succeeds, raises alertness, and changes Elena's behavior
    store.setMinute(140);
    const triggered = store.triggerIntervention('laser_window_tap_3b');
    expect(triggered.ok).toBe(true);
    expect(useGameStore.getState().courtyardAlertness).toBe(1);
    expect(useGameStore.getState().residents.elena.posture).toBe('looking_out_window');
    expect(useGameStore.getState().apartments.apt_3b.blindsState).toBe('open');
  });

  it('8. validates deduction links, rejects uncollected clue pairs, and resolves all 3 endings', () => {
    const store = useGameStore.getState();

    // Rejects linking clues that haven't been collected yet
    const uncollectedLink = store.linkCluesOnBoard(
      'clue_n1_extortion_note_1a',
      'clue_n2_breaker_sabotage_1a'
    );
    expect(uncollectedLink.ok).toBe(false);

    // 1. Failure Ending when submitting with no verified deductions
    expect(SimulationEngine.resolveEnding([], new Set()).id).toBe('ending_failure_cold_case');

    // 2. Partial Ending when submitting with only 1 verified link or Night 1 unproven assumption
    expect(
      SimulationEngine.resolveEnding(
        ['hyp_misleading_julian_inside_job'],
        new Set(['clue_n1_safe_deposit', 'clue_n1_missing_master_key'])
      ).id
    ).toBe('ending_scapegoat_julian');

    // 3. True Conspiracy Ending when corroborating evidence across Nights 1-3 is collected & linked
    const trueClueSet = new Set([
      'clue_n1_extortion_note_1a',
      'clue_n2_breaker_sabotage_1a',
      'clue_n1_forged_manifest_2c',
      'clue_n2_vent_stash_2c',
      'clue_n2_bailment_3b',
      'clue_n3_uv_decoy_stamp',
    ]);
    expect(
      SimulationEngine.resolveEnding(
        [
          'hyp_coerced_blackout_access',
          'hyp_marcus_executed_heist',
          'hyp_julian_elena_counter_sting',
        ],
        trueClueSet
      ).id
    ).toBe('ending_true_conspiracy');
  });

  it('9. preserves pause state across overlay transitions and supports Save/Load/Reset', () => {
    const store = useGameStore.getState();
    expect(store.isPaused).toBe(false);

    // Opening Journal pauses simulation; returning to observation restores unpaused state
    store.setGameplayMode('journal_open');
    expect(useGameStore.getState().isPaused).toBe(true);
    store.setGameplayMode('observing');
    expect(useGameStore.getState().isPaused).toBe(false);

    // Collect a clue, save game, reset, and load back
    store.focusApartment('apt_1a');
    store.setZoomLevel(2.4);
    store.setFocalDistance(20.1);
    store.collectClueImmediate('clue_n1_extortion_note_1a');
    expect(useGameStore.getState().collectedClues).toHaveLength(1);

    expect(store.saveGame()).toBe(true);
    store.resetInvestigation();
    expect(useGameStore.getState().collectedClues).toHaveLength(0);

    expect(store.loadGame()).toBe(true);
    expect(useGameStore.getState().collectedClues).toHaveLength(1);
  });
});
