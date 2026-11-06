import { createActor, setup } from 'xstate';
import { EndingId, NightNumber } from '../types/game';

export type GameplayMode =
  | 'observing'
  | 'journal_open'
  | 'deduction_open'
  | 'settings_open'
  | 'case_resolved';

export interface GameMachineContext {
  night: NightNumber;
  resolvedEndingId: EndingId | null;
}

export type GameMachineEvent =
  | { type: 'OPEN_JOURNAL' }
  | { type: 'OPEN_DEDUCTION' }
  | { type: 'OPEN_SETTINGS' }
  | { type: 'RETURN_TO_OBSERVATION' }
  | { type: 'ADVANCE_NIGHT'; night: NightNumber }
  | { type: 'RESOLVE_CASE'; endingId: EndingId }
  | { type: 'RESET_INVESTIGATION' };

/**
 * Explicit Finite-State Machine (XState v5) governing primary gameplay state transitions.
 */
export const gameMachine = setup({
  types: {
    context: {} as GameMachineContext,
    events: {} as GameMachineEvent,
  },
}).createMachine({
  id: 'windowsAt3AM',
  initial: 'observing',
  context: {
    night: 1,
    resolvedEndingId: null,
  },
  states: {
    observing: {
      on: {
        OPEN_JOURNAL: { target: 'journal_open' },
        OPEN_DEDUCTION: { target: 'deduction_open' },
        OPEN_SETTINGS: { target: 'settings_open' },
        ADVANCE_NIGHT: {
          actions: ({ context, event }) => {
            context.night = event.night;
          },
        },
        RESOLVE_CASE: {
          target: 'case_resolved',
          actions: ({ context, event }) => {
            context.resolvedEndingId = event.endingId;
          },
        },
      },
    },
    journal_open: {
      on: {
        RETURN_TO_OBSERVATION: { target: 'observing' },
        OPEN_DEDUCTION: { target: 'deduction_open' },
        OPEN_SETTINGS: { target: 'settings_open' },
      },
    },
    deduction_open: {
      on: {
        RETURN_TO_OBSERVATION: { target: 'observing' },
        OPEN_JOURNAL: { target: 'journal_open' },
        OPEN_SETTINGS: { target: 'settings_open' },
        RESOLVE_CASE: {
          target: 'case_resolved',
          actions: ({ context, event }) => {
            context.resolvedEndingId = event.endingId;
          },
        },
      },
    },
    settings_open: {
      on: {
        RETURN_TO_OBSERVATION: { target: 'observing' },
        OPEN_JOURNAL: { target: 'journal_open' },
        OPEN_DEDUCTION: { target: 'deduction_open' },
      },
    },
    case_resolved: {
      on: {
        RETURN_TO_OBSERVATION: { target: 'observing' },
        RESET_INVESTIGATION: {
          target: 'observing',
          actions: ({ context }) => {
            context.night = 1;
            context.resolvedEndingId = null;
          },
        },
      },
    },
  },
});

export function createGameplayFSM() {
  const actor = createActor(gameMachine);
  actor.start();
  return actor;
}
