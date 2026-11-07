import { assign, createActor, setup } from 'xstate';
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
  wasPausedBeforeOverlay: boolean;
}

export type GameMachineEvent =
  | { type: 'OPEN_JOURNAL'; currentlyPaused: boolean }
  | { type: 'OPEN_DEDUCTION'; currentlyPaused: boolean }
  | { type: 'OPEN_SETTINGS'; currentlyPaused: boolean }
  | { type: 'RETURN_TO_OBSERVATION' }
  | { type: 'ADVANCE_NIGHT'; night: NightNumber }
  | { type: 'RESOLVE_CASE'; endingId: EndingId }
  | { type: 'RESET_INVESTIGATION' };

/**
 * Explicit Finite-State Machine (XState v5) governing primary gameplay state transitions
 * using immutable `assign` actions.
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
    wasPausedBeforeOverlay: false,
  },
  states: {
    observing: {
      on: {
        OPEN_JOURNAL: {
          target: 'journal_open',
          actions: assign({
            wasPausedBeforeOverlay: ({ event }) => event.currentlyPaused,
          }),
        },
        OPEN_DEDUCTION: {
          target: 'deduction_open',
          actions: assign({
            wasPausedBeforeOverlay: ({ event }) => event.currentlyPaused,
          }),
        },
        OPEN_SETTINGS: {
          target: 'settings_open',
          actions: assign({
            wasPausedBeforeOverlay: ({ event }) => event.currentlyPaused,
          }),
        },
        ADVANCE_NIGHT: {
          actions: assign({
            night: ({ event }) => event.night,
          }),
        },
        RESOLVE_CASE: {
          target: 'case_resolved',
          actions: assign({
            resolvedEndingId: ({ event }) => event.endingId,
          }),
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
          actions: assign({
            resolvedEndingId: ({ event }) => event.endingId,
          }),
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
          actions: assign({
            night: () => 1 as NightNumber,
            resolvedEndingId: () => null,
            wasPausedBeforeOverlay: () => false,
          }),
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
