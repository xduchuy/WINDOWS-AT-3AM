import { InterventionDefinition, WorldEventTrigger } from '../types/game';

export const WORLD_EVENT_TRIGGERS: WorldEventTrigger[] = [
  // NIGHT 1
  {
    id: 'evt_n1_safe_lock',
    night: 1,
    triggerMinute: 55,
    title: '4A Workshop Safe Sealed',
    subtitle: 'Julian Vance locks a crimson violin case inside the recessed wall safe behind the portrait.',
    sourceApartmentId: 'apt_4a',
    affectedApartmentIds: ['apt_4a'],
    setsFlags: ['flag_n1_safe_sealed'],
    soundCue: 'violin_chord',
  },
  {
    id: 'evt_n1_key_removed',
    night: 1,
    triggerMinute: 62,
    title: 'Master Key #4A Removed',
    subtitle: 'In Apt 1A, Nora Lin unhooks the brass 4A master key from the Superintendent rack.',
    sourceApartmentId: 'apt_1a',
    affectedApartmentIds: ['apt_1a', 'apt_2c'],
    setsFlags: ['flag_n1_master_key_taken'],
    soundCue: 'glass_clink',
  },
  {
    id: 'evt_n1_camera_shutter',
    night: 1,
    triggerMinute: 75,
    title: 'Telephoto Surveillance From 3B',
    subtitle: 'Elena Rostova parts her Venetian blinds in 3B to photograph the 2C fire escape landing.',
    sourceApartmentId: 'apt_3b',
    affectedApartmentIds: ['apt_3b', 'apt_2c'],
    setsFlags: ['flag_n1_elena_photos'],
    soundCue: 'glass_clink',
  },

  // NIGHT 2
  {
    id: 'evt_n2_bailment_transfer',
    night: 2,
    triggerMinute: 76,
    title: 'Custody Transfer in 3B',
    subtitle: 'Julian Vance carries an oilskin-wrapped violin down to Elena Rostova’s archival vault in 3B.',
    sourceApartmentId: 'apt_4a',
    affectedApartmentIds: ['apt_4a', 'apt_3b'],
    setsFlags: ['flag_n2_violin_in_3b'],
    soundCue: 'door_slam',
  },
  {
    id: 'evt_n2_breaker_blackout',
    night: 2,
    triggerMinute: 85,
    title: '01:25 AM 4th-Floor Breaker Cut',
    subtitle: 'Nora pulls the marked relay in 1A. Apt 4A plunges into darkness as Marcus Thorne enters 4A with a penlight.',
    sourceApartmentId: 'apt_1a',
    affectedApartmentIds: ['apt_1a', 'apt_4a', 'apt_2c'],
    setsFlags: ['flag_n2_4a_blackout_active'],
    soundCue: 'breaker_snap',
  },
  {
    id: 'evt_n2_power_restored',
    night: 2,
    triggerMinute: 130,
    title: 'Power Restored & Vent Stash',
    subtitle: '4th-floor power returns. Julian discovers his safe open while Marcus hides the stolen crimson case inside 2C’s wall vent.',
    sourceApartmentId: 'apt_2c',
    affectedApartmentIds: ['apt_4a', 'apt_2c', 'apt_1a'],
    setsFlags: ['flag_n2_case_hidden_in_2c'],
    soundCue: 'thunder',
  },

  // NIGHT 3
  {
    id: 'evt_n3_uv_discovery',
    night: 3,
    triggerMinute: 35,
    title: 'Blacklight Decoy Revelation',
    subtitle: 'In 2C, Marcus shines a UV lamp inside the stolen case and realizes Julian planted a stamped decoy.',
    sourceApartmentId: 'apt_2c',
    affectedApartmentIds: ['apt_2c', 'apt_4a'],
    setsFlags: ['flag_n3_decoy_exposed'],
    soundCue: 'violin_chord',
  },
  {
    id: 'evt_n3_1a_reconciliation',
    night: 3,
    triggerMinute: 86,
    title: 'Confrontation in Superintendent Flat 1A',
    subtitle: 'Julian confronts Nora in 1A; Nora produces Marcus Thorne’s yellow extortion note and key log.',
    sourceApartmentId: 'apt_1a',
    affectedApartmentIds: ['apt_1a', 'apt_4a', 'apt_2c'],
    setsFlags: ['flag_n3_nora_confessed'],
    soundCue: 'door_slam',
  },
];

export const INTERVENTIONS: InterventionDefinition[] = [
  {
    id: 'ring_courtyard_payphone',
    label: 'Dial 3rd-Floor Landing Payphone',
    shortCode: 'INT-01 // PAYPHONE',
    description:
      'Use your rotary line to ring the shared stairwell payphone outside 3C/2C on Night 1 (01:05–02:00 AM). Startles Marcus Thorne to the 2C window where he drops the duplicated 4A key tag under the lamp.',
    targetApartmentId: 'apt_2c',
    allowedNights: [1],
    minMinute: 65,
    maxMinute: 120,
    cooldownMinutes: 45,
    setsFlag: 'flag_payphone_rung',
    consequenceDescription:
      'Marcus Thorne rushes to the 2C window in panic, knocking the brass "4A" duplicate key tag into clear view of your telephoto lens.',
  },
  {
    id: 'laser_window_tap_3b',
    label: 'Flash Optical Viewfinder Signal to 3B',
    shortCode: 'INT-02 // OPTIC PING',
    description:
      'Blink your lens tally light toward Fellow Investigator Elena Rostova in Apt 3B on Night 2 (02:10–03:00 AM). Prompts her to open her blinds and hold up the decoded 1A-2C breaker extortion ledger.',
    targetApartmentId: 'apt_3b',
    allowedNights: [2],
    minMinute: 130,
    maxMinute: 180,
    cooldownMinutes: 45,
    setsFlag: 'flag_laser_signal_3b',
    consequenceDescription:
      'Elena recognizes a fellow observer across the courtyard, parts her Venetian blinds, and presses the extortion wire-transfer chart against the glass.',
  },
  {
    id: 'pulse_alley_breaker',
    label: 'Trip Courtyard Auxiliary Surge Alarm',
    shortCode: 'INT-03 // SURGE BELL',
    description:
      'Trigger the courtyard junction box test bell on Night 3 (01:30–03:00 AM). Panics Marcus in 2C into burning his carbon-copy extortion letters over the kitchen stove instead of quietly packing.',
    targetApartmentId: 'apt_2c',
    allowedNights: [3],
    minMinute: 90,
    maxMinute: 180,
    cooldownMinutes: 45,
    setsFlag: 'flag_alley_breaker_pulsed',
    consequenceDescription:
      'Thinking the police have wired the building, Marcus rushes to his galley stove in 2C and ignites the yellow audit extortion carbons.',
  },
];
