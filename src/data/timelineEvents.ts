import { InterventionDefinition, WorldEventTrigger } from '../types/game';

export const WORLD_EVENT_TRIGGERS: WorldEventTrigger[] = [
  // NIGHT 1
  {
    id: 'evt_n1_safe_lock',
    night: 1,
    triggerMinute: 55,
    title: '4A Workshop Activity',
    subtitle: 'Movement near the rear portrait wall in Apartment 4A.',
    sourceApartmentId: 'apt_4a',
    affectedApartmentIds: ['apt_4a'],
    setsFlags: ['flag_n1_safe_sealed'],
    isDecisionPoint: true,
    soundCue: 'violin_chord',
  },
  {
    id: 'evt_n1_key_removed',
    night: 1,
    triggerMinute: 62,
    title: '1A Key Rack Activity',
    subtitle: 'Metallic clink from the ground-floor Superintendent alcove in 1A.',
    sourceApartmentId: 'apt_1a',
    affectedApartmentIds: ['apt_1a', 'apt_2c'],
    setsFlags: ['flag_n1_master_key_taken'],
    isDecisionPoint: true,
    soundCue: 'glass_clink',
  },
  {
    id: 'evt_n1_camera_shutter',
    night: 1,
    triggerMinute: 75,
    title: '3B Window Slats Parted',
    subtitle: 'Venetian blinds shift in Apartment 3B; a camera lens reflects courtyard rain.',
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
    title: '3B Corridor Arrival',
    subtitle: 'Footsteps on the 3rd-floor landing; two figures meet inside Study 3B.',
    sourceApartmentId: 'apt_4a',
    affectedApartmentIds: ['apt_4a', 'apt_3b'],
    setsFlags: ['flag_n2_violin_in_3b'],
    isDecisionPoint: true,
    soundCue: 'door_slam',
  },
  {
    id: 'evt_n2_breaker_blackout',
    night: 2,
    triggerMinute: 85,
    title: '01:25 AM 4th-Floor Relay Cut',
    subtitle: 'Blue electrical arc flashes in 1A. Top-floor Apartment 4A drops into emergency shadow.',
    sourceApartmentId: 'apt_1a',
    affectedApartmentIds: ['apt_1a', 'apt_4a', 'apt_2c'],
    setsFlags: ['flag_n2_4a_blackout_active'],
    isDecisionPoint: true,
    soundCue: 'breaker_snap',
  },
  {
    id: 'evt_n2_power_restored',
    night: 2,
    triggerMinute: 130,
    title: '4th-Floor Power Restored',
    subtitle: 'Main voltage returns to Floor 4; rapid movement behind the curtains in 2C.',
    sourceApartmentId: 'apt_2c',
    affectedApartmentIds: ['apt_4a', 'apt_2c', 'apt_1a'],
    setsFlags: ['flag_n2_case_hidden_in_2c'],
    isDecisionPoint: true,
    soundCue: 'thunder',
  },

  // NIGHT 3
  {
    id: 'evt_n3_uv_discovery',
    night: 3,
    triggerMinute: 35,
    title: '2C Violet Lamp Glow',
    subtitle: 'An ultraviolet beam illuminates an open instrument case on the 2C dining table.',
    sourceApartmentId: 'apt_2c',
    affectedApartmentIds: ['apt_2c', 'apt_4a'],
    setsFlags: ['flag_n3_decoy_exposed'],
    isDecisionPoint: true,
    soundCue: 'violin_chord',
  },
  {
    id: 'evt_n3_1a_reconciliation',
    night: 3,
    triggerMinute: 86,
    title: '1A Superintendent Confrontation',
    subtitle: 'Two tenants meet by the master key board in ground-floor Apartment 1A.',
    sourceApartmentId: 'apt_1a',
    affectedApartmentIds: ['apt_1a', 'apt_4a', 'apt_2c'],
    setsFlags: ['flag_n3_nora_confessed'],
    isDecisionPoint: true,
    soundCue: 'door_slam',
  },
];

export const INTERVENTIONS: InterventionDefinition[] = [
  {
    id: 'ring_courtyard_payphone',
    label: 'Dial 3C Landing Payphone',
    shortCode: 'PAYPHONE // 3C-2C',
    description:
      'Ring the shared stairwell rotary payphone on Night 1 (01:05–02:00 AM) to draw the 2C occupant to the window.',
    tradeoffWarning:
      'COST: +1 Courtyard Alertness. Startles Apt 2C into checking the courtyard.',
    alertnessCost: 1,
    targetApartmentId: 'apt_2c',
    allowedNights: [1],
    minMinute: 65,
    maxMinute: 120,
    cooldownMinutes: 45,
    setsFlag: 'flag_payphone_rung',
    consequenceDescription:
      'The stairwell payphone rings across the wet courtyard. In 2C, Marcus Thorne rushes to the window, knocking a brass key tag onto the floor under his table lamp.',
  },
  {
    id: 'laser_window_tap_3b',
    label: 'Pulse Viewfinder Tally Light at 3B',
    shortCode: 'OPTIC SIGNAL // 3B',
    description:
      'Blink your camera tally light toward Archivist Elena Rostova in 3B on Night 2 (02:10–03:00 AM) after witnessing the 3B transfer.',
    tradeoffWarning:
      'COST: +1 Courtyard Alertness. Reveals your vantage point to Apartment 3B.',
    alertnessCost: 1,
    prerequisiteClueId: 'clue_n2_bailment_3b',
    targetApartmentId: 'apt_3b',
    allowedNights: [2],
    minMinute: 130,
    maxMinute: 180,
    cooldownMinutes: 45,
    setsFlag: 'flag_laser_signal_3b',
    consequenceDescription:
      'Elena spots your optical pulse from across the courtyard, opens her Venetian blinds, and holds a forensic wire-transfer ledger against the 3B glass.',
  },
  {
    id: 'pulse_alley_breaker',
    label: 'Trip Courtyard Surge Bell',
    shortCode: 'SURGE BELL // ALLEY',
    description:
      'Trigger the courtyard junction test alarm on Night 3 (01:30–03:00 AM) to pressure Apt 2C into destroying paper trails.',
    tradeoffWarning:
      'COST: +1 Courtyard Alertness. High noise — triggers immediate panic in 2C.',
    alertnessCost: 1,
    targetApartmentId: 'apt_2c',
    allowedNights: [3],
    minMinute: 90,
    maxMinute: 180,
    cooldownMinutes: 45,
    setsFlag: 'flag_alley_breaker_pulsed',
    consequenceDescription:
      'The courtyard surge bell clangs. Fearing a raid, Marcus rushes to his galley stove in 2C and ignites his yellow carbon-copy extortion sheets.',
  },
];
