import { ClueDefinition, DeductionHypothesis, EndingDefinition } from '../types/game';

export const MYSTERY_CLUES: ClueDefinition[] = [
  // NIGHT 1 CLUES
  {
    id: 'clue_n1_safe_deposit',
    title: 'Crimson Violin Case Locked in 4A Safe',
    category: 'resident_action',
    night: 1,
    apartmentId: 'apt_4a',
    minMinute: 55,
    maxMinute: 115,
    minZoomLevel: 2.1,
    targetFocalDistance: 20.2,
    isMisleadingAssumption: true,
    contradictedByClueId: 'clue_n2_bailment_3b',
    description:
      'Julian Vance conceals a crimson violin case inside his wall safe behind a portrait. At first glance, this looks like Julian hiding an unrecorded instrument for an inside-job insurance fraud.',
    deductionTag: 'Suspect: Julian Hiding Case',
    localOffset: [1.15, 0.3, 1.2],
  },
  {
    id: 'clue_n1_extortion_note_1a',
    title: 'Yellow Audit Extortion Demand in 1A',
    category: 'physical_prop',
    night: 1,
    apartmentId: 'apt_1a',
    minMinute: 0,
    maxMinute: 65,
    minZoomLevel: 2.2,
    targetFocalDistance: 20.1,
    description:
      'On Nora Lin’s kitchen counter lies a typed demand on yellow Lloyd-Mercer audit stationery coercing her to hand over the 4A master key and cut the 4th-floor power at 01:25 AM on Night 2.',
    deductionTag: 'Coercion: 1A Extorted on Audit Paper',
    localOffset: [0.35, 0.1, 0.05],
  },
  {
    id: 'clue_n1_missing_master_key',
    title: 'Superintendent Key #4A Unhooked',
    category: 'resident_action',
    night: 1,
    apartmentId: 'apt_1a',
    minMinute: 60,
    maxMinute: 125,
    minZoomLevel: 2.2,
    targetFocalDistance: 20.1,
    description:
      'Nora Lin removes the brass master key tagged "4A - VANCE" from the ground-floor superintendent board and seals it in an envelope.',
    deductionTag: 'Access: 1A Master Key Removed',
    localOffset: [0.85, 0.35, 1.3],
  },
  {
    id: 'clue_n1_forged_manifest_2c',
    title: 'Pier 14 Customs Manifest in 2C',
    category: 'physical_prop',
    night: 1,
    apartmentId: 'apt_2c',
    minMinute: 0,
    maxMinute: 65,
    minZoomLevel: 2.2,
    targetFocalDistance: 19.6,
    description:
      'Marcus Thorne stamps a diplomatic cargo manifest in Apt 2C scheduling a "Cremona String Instrument" for export on a freighter leaving Pier 14 after Night 3.',
    deductionTag: 'Motive: Marcus Smuggling Manifest',
    localOffset: [-0.45, 0.1, 0.1],
  },
  {
    id: 'clue_n1_payphone_keytag',
    title: 'Dropped "4A" Brass Key Tag in 2C (Intervention)',
    category: 'cross_apartment',
    night: 1,
    apartmentId: 'apt_2c',
    minMinute: 65,
    maxMinute: 120,
    minZoomLevel: 2.3,
    targetFocalDistance: 19.6,
    requiredFlags: ['flag_payphone_rung'],
    description:
      'Startled by your courtyard payphone ring, Marcus knocks a brass key tag stamped "SUPER 4A" under his table lamp—proving he received the master key from 1A.',
    deductionTag: 'Link: Marcus Holds 4A Master Key',
    localOffset: [0.0, 0.05, -0.95],
  },

  // NIGHT 2 CLUES
  {
    id: 'clue_n2_bailment_3b',
    title: 'Signed Bailment Transfer of Authentic Violin in 3B',
    category: 'cross_apartment',
    night: 2,
    apartmentId: 'apt_3b',
    minMinute: 75,
    maxMinute: 130,
    minZoomLevel: 2.1,
    targetFocalDistance: 18.8,
    description:
      'Before the blackout, Julian Vance delivers the real 1714 Orpheus violin wrapped in oilskin to investigator Elena Rostova in 3B and signs a witnessed safekeeping receipt.',
    deductionTag: 'Alibi: Real Violin Safely in 3B Vault',
    localOffset: [-1.15, 0.35, 0.8],
  },
  {
    id: 'clue_n2_breaker_sabotage_1a',
    title: 'Forced 01:25 AM Breaker Cut & Log Entry in 1A',
    category: 'resident_action',
    night: 2,
    apartmentId: 'apt_1a',
    minMinute: 82,
    maxMinute: 132,
    minZoomLevel: 2.1,
    targetFocalDistance: 20.1,
    description:
      'Nora Lin pulls the red-taped 4th-floor breaker lever in 1A, cutting power to 4A while writing "COERCED BY 2C AUDITOR" inside the maintenance logbook.',
    deductionTag: 'Sabotage: 1A Cut Power Under Duress',
    localOffset: [-1.2, 0.35, 0.85],
  },
  {
    id: 'clue_n2_heist_in_4a',
    title: 'Gloved Intruder Steals Crimson Case from Darkened 4A',
    category: 'cross_apartment',
    night: 2,
    apartmentId: 'apt_4a',
    minMinute: 85,
    maxMinute: 130,
    minZoomLevel: 2.3,
    targetFocalDistance: 20.2,
    description:
      'During the 4th-floor blackout, Marcus Thorne enters 4A with a penlight and uses the master key to steal the crimson violin case from Julian’s safe.',
    deductionTag: 'Act: Marcus Burglarized 4A Safe',
    localOffset: [1.1, 0.25, 1.25],
  },
  {
    id: 'clue_n2_vent_stash_2c',
    title: 'Crimson Violin Case Hidden in 2C Wall Vent',
    category: 'physical_prop',
    night: 2,
    apartmentId: 'apt_2c',
    minMinute: 130,
    maxMinute: 180,
    minZoomLevel: 2.2,
    targetFocalDistance: 19.6,
    description:
      'Immediately after returning from the darkened 4th floor, Marcus unscrews the false air vent in 2C and conceals the stolen crimson violin case inside the wall cavity.',
    deductionTag: 'Possession: Stolen Case Hidden in 2C',
    localOffset: [-1.25, 0.1, 1.35],
  },
  {
    id: 'clue_n2_elena_ledger_signal',
    title: 'Elena’s Wire-Transfer & Extortion Chart in 3B (Intervention)',
    category: 'cross_apartment',
    night: 2,
    apartmentId: 'apt_3b',
    minMinute: 130,
    maxMinute: 180,
    minZoomLevel: 2.2,
    targetFocalDistance: 18.8,
    requiredFlags: ['flag_laser_signal_3b'],
    description:
      'In response to your optical viewfinder ping, Elena holds up a forensic chart connecting Marcus Thorne’s gambling debts to three staged Lloyd-Mercer vault thefts.',
    deductionTag: 'Pattern: Auditor Fraud Ring Confirmed',
    localOffset: [0.0, 0.2, -1.0],
  },

  // NIGHT 3 CLUES
  {
    id: 'clue_n3_uv_decoy_stamp',
    title: 'UV Blacklight Reveals "DECOY TRAP" Inside Stolen Case',
    category: 'physical_prop',
    night: 3,
    apartmentId: 'apt_2c',
    minMinute: 0,
    maxMinute: 90,
    minZoomLevel: 2.2,
    targetFocalDistance: 19.6,
    description:
      'When Marcus inspects the stolen violin in 2C under ultraviolet light, Julian’s fluorescent stamp glows inside the lid—proving Julian anticipated the theft and baited the safe with a replica.',
    deductionTag: 'Sting: Stolen Violin is Julian’s Decoy',
    localOffset: [-0.45, 0.2, 0.1],
  },
  {
    id: 'clue_n3_burning_extortion_2c',
    title: 'Marcus Burning Yellow Extortion Carbons Over Stove (Intervention)',
    category: 'resident_action',
    night: 3,
    apartmentId: 'apt_2c',
    minMinute: 90,
    maxMinute: 180,
    minZoomLevel: 2.2,
    targetFocalDistance: 19.6,
    requiredFlags: ['flag_alley_breaker_pulsed'],
    description:
      'Panicked by the courtyard surge bell, Marcus burns the yellow audit carbon copies matching the extortion note found in Nora Lin’s kitchen.',
    deductionTag: 'Proof: Marcus Authored 1A Extortion',
    localOffset: [1.05, 0.25, 0.6],
  },
  {
    id: 'clue_n3_joint_testimony_1a',
    title: 'Julian & Nora Reconcile Key Log & Extortion Note in 1A',
    category: 'cross_apartment',
    night: 3,
    apartmentId: 'apt_1a',
    minMinute: 85,
    maxMinute: 180,
    minZoomLevel: 2.1,
    targetFocalDistance: 20.1,
    description:
      'In Apt 1A, Nora shows Julian Vance the coerced key log and Marcus’s yellow demand note, proving she acted under duress and confirming Marcus as the mastermind.',
    deductionTag: 'Corroboration: 1A & 4A Unite Against 2C',
    localOffset: [0.8, 0.25, 1.2],
  },
];

export const DEDUCTION_HYPOTHESES: DeductionHypothesis[] = [
  {
    id: 'hyp_misleading_julian_inside_job',
    title: 'Fallacy: Julian Vance Staged an Inside-Job Theft',
    claim:
      'Julian locked the crimson violin case in his 4A safe on Night 1 to fake its disappearance and collect the restoration insurance himself.',
    requiredClueIds: ['clue_n1_safe_deposit', 'clue_n1_missing_master_key'],
    isFallacy: true,
    refutedByClueId: 'clue_n2_bailment_3b',
    conclusionText:
      'WARNING — MISLEADING ASSUMPTION: Relying only on Night 1 observations frames Julian Vance, ignoring that he transferred the authentic violin to 3B for safekeeping before the Night 2 blackout.',
  },
  {
    id: 'hyp_coerced_blackout_access',
    title: 'Coerced Access: Marcus Blackmailed Nora for the 4A Key & Blackout',
    claim:
      'Auditor Marcus Thorne (2C) used yellow audit extortion notes to force Superintendent Nora Lin (1A) into handing over the 4A master key and pulling the 4th-floor breaker at 01:25 AM.',
    requiredClueIds: ['clue_n1_extortion_note_1a', 'clue_n2_breaker_sabotage_1a'],
    isFallacy: false,
    conclusionText:
      'VERIFIED LINK: Nora Lin did not act out of malice; Marcus Thorne leveraged clinic records to force her to disable 4A’s lights and surrender the master key.',
  },
  {
    id: 'hyp_marcus_executed_heist',
    title: 'The 01:25 AM Heist: Marcus Burglarized 4A & Hid the Case in 2C',
    claim:
      'During the Night 2 blackout, Marcus Thorne entered 4A with the stolen master key, took the crimson violin case, and concealed it behind the false wall vent in 2C alongside his Pier 14 smuggling manifest.',
    requiredClueIds: ['clue_n1_forged_manifest_2c', 'clue_n2_vent_stash_2c'],
    isFallacy: false,
    conclusionText:
      'VERIFIED LINK: Physical possession and smuggling intent converge on Apt 2C. Marcus Thorne is both the burglar and the exporter.',
  },
  {
    id: 'hyp_julian_elena_counter_sting',
    title: 'The Luthier’s Counter-Trap: Decoy in 2C, Authentic Stradivarius in 3B',
    claim:
      'Julian Vance anticipated the burglary, transferred the real 1714 violin to Elena Rostova’s vault in 3B on Night 2, and left a UV-stamped decoy in the 4A safe that trapped Marcus on Night 3.',
    requiredClueIds: ['clue_n2_bailment_3b', 'clue_n3_uv_decoy_stamp'],
    isFallacy: false,
    conclusionText:
      'VERIFIED LINK: The 1714 Orpheus violin was never lost. Julian and Elena executed a witnessed counter-sting that caught Marcus red-handed with a marked replica.',
  },
];

export const ENDINGS: Record<string, EndingDefinition> = {
  ending_true_conspiracy: {
    id: 'ending_true_conspiracy',
    title: 'THE ORPHEUS COUNTER-STING // COMPLETE EXONERATION',
    verdictSubtitle: 'TRUE NARRATIVE RESOLUTION — ALL CONSPIRATORS & ALIBIS VERIFIED',
    outcomeType: 'true_resolution',
    summaryParagraphs: [
      'Your timestamped observation dossier and telephoto evidence are delivered to Elena Rostova and Harbor Precinct detectives at 03:05 AM, thirty minutes before the Pier 14 freighter weighs anchor.',
      'Confronted with photographs of the false air vent in 2C, the UV-stamped decoy violin, the Pier 14 smuggling manifest, and the charred yellow extortion carbons, suspended auditor Marcus Thorne surrenders without firing a shot.',
      'Master luthier Julian Vance retrieves the authentic 1714 "Orpheus" violin unharmed from Elena’s archival vault in 3B, while your corroboration of the coerced maintenance log clears paramedic Nora Lin of felony complicity.',
    ],
    epilogueNote:
      'Across Mercer Courtyard, the rain finally slackens at dawn. In Apartment 4A, the warm tungsten workbench lamp stays lit as Julian draws a bow across the restored strings.',
  },
  ending_scapegoat_julian: {
    id: 'ending_scapegoat_julian',
    title: 'THE RUSHED INDICTMENT // WRONGFUL ARREST IN 4A',
    verdictSubtitle: 'COMPROMISED ENDING — MISLEADING ASSUMPTION SUBMITTED',
    outcomeType: 'partial_truth',
    summaryParagraphs: [
      'Acting on incomplete Night 1 observations and the unrefuted assumption that Julian Vance staged an inside job, investigators raid Apartment 4A and arrest the master luthier along with Nora Lin.',
      'Down in Apartment 2C, Marcus Thorne hears the sirens in the courtyard, abandons the UV-marked decoy in the air shaft, and slips out the rear service alley before his Pier 14 manifest is ever connected to the break-in.',
      'Though Elena Rostova eventually produces the bailment receipt from 3B weeks later, the true mastermind has already vanished across the Atlantic.',
    ],
    epilogueNote:
      'Looking at a window is not the same as understanding what lies behind it. The truth was visible across Nights 2 and 3—waiting for a steadier lens.',
  },
  ending_failure_cold_case: {
    id: 'ending_failure_cold_case',
    title: '03:00 AM DEPARTURE // THE COLD COURTYARD',
    verdictSubtitle: 'FAILURE OUTCOME — INSUFFICIENT CORROBORATED DEDUCTIONS',
    outcomeType: 'failure',
    summaryParagraphs: [
      'The grandfather clock in the vestibule strikes 03:00 AM on the final night without a corroborated chain of evidence linking the extortion in 1A, the vault transfer in 3B, and the hidden vent in 2C.',
      'Under cover of the downpour, Marcus Thorne descends the rear iron fire escape carrying his weekender bag, while contradicting accounts between Floor 1 and Floor 4 leave precinct detectives deadlocked.',
      'By morning, the Halcyon Arms shutters its courtyard blinds. The case of the 1714 Orpheus violin dissolves into insurance litigation and unanswered suspicions.',
    ],
    epilogueNote:
      'Tip: Ensure you zoom in (>2.2x), calibrate optical focus to ~19–20m, observe across all three nights, and link at least two verified hypotheses on the Deduction Board.',
  },
};
