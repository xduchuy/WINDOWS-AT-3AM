export type NightNumber = 1 | 2 | 3;

export type QualityPreset = 'high' | 'medium' | 'low';

export type ApartmentId =
  | 'apt_4a' // Floor 4 Left - Julian Vance (Luthier / Restorer) - Detailed Interactive
  | 'apt_4b' // Floor 4 Center - Secondary Architectural Interior
  | 'apt_4c' // Floor 4 Right - Secondary Architectural Interior
  | 'apt_3a' // Floor 3 Left - Secondary Architectural Interior
  | 'apt_3b' // Floor 3 Center - Elena Rostova (Investigative Archivist) - Detailed Interactive
  | 'apt_3c' // Floor 3 Right - Secondary Architectural Interior
  | 'apt_2a' // Floor 2 Left - Secondary Architectural Interior
  | 'apt_2b' // Floor 2 Center - Secondary Architectural Interior
  | 'apt_2c' // Floor 2 Right - Marcus Thorne (Disgraced Auditor) - Detailed Interactive
  | 'apt_1a' // Floor 1 Left - Nora Lin (Paramedic & Super's Daughter) - Detailed Interactive
  | 'apt_1b' // Floor 1 Center - Secondary Architectural Interior (Lobby / Mailboxes)
  | 'apt_1c'; // Floor 1 Right - Secondary Architectural Interior (Boiler / Utility Room)

export type ResidentId = 'julian' | 'elena' | 'marcus' | 'nora';

export type ResidentPosture =
  | 'idle_standing'
  | 'walking'
  | 'working_desk'
  | 'pacing_nervously'
  | 'searching_cabinet'
  | 'looking_out_window'
  | 'carrying_case'
  | 'inspecting_fusebox'
  | 'making_phone_call';

export interface RoomWaypoint {
  id: string;
  label: string;
  localPos: [number, number, number]; // Relative to apartment origin
  facingYaw: number;
}

export interface ApartmentDefinition {
  id: ApartmentId;
  code: string; // e.g., "4A"
  name: string;
  floor: 1 | 2 | 3 | 4;
  column: 0 | 1 | 2; // 0 = Left, 1 = Center, 2 = Right
  isDetailedInteractive: boolean;
  residentId?: ResidentId;
  themeColorHex: string;
  kelvinLightTemp: number;
  baseLightIntensity: number;
  focalDepthMeters: number; // Distance from observer camera for focus calibration
  worldCenter: [number, number, number];
  description: string;
  waypoints: Record<string, RoomWaypoint>;
}

export interface ScheduleSegment {
  id: string;
  night: NightNumber;
  startMinute: number; // Minutes after 00:00 (0 to 180)
  endMinute: number;
  apartmentId: ApartmentId;
  waypointId: string;
  posture: ResidentPosture;
  lightOn: boolean;
  blindsState: 'open' | 'half' | 'closed';
  actionSummary: string;
  observableDetail: string;
  activePropId?: string;
  requiresFlag?: string; // Only active if world state flag is present
  blockedByFlag?: string; // Skipped if world state flag is present
}

export interface ResidentDefinition {
  id: ResidentId;
  fullName: string;
  age: number;
  occupation: string;
  homeApartmentId: ApartmentId;
  coatColor: string;
  accentColor: string;
  bio: string;
  secretSummary: string;
  schedules: ScheduleSegment[];
}

export interface WorldEventTrigger {
  id: string;
  night: NightNumber;
  triggerMinute: number;
  title: string;
  subtitle: string;
  sourceApartmentId: ApartmentId;
  affectedApartmentIds: ApartmentId[];
  setsFlags: string[];
  requiredFlags?: string[];
  blockedByFlags?: string[];
  isDecisionPoint?: boolean; // Slows fast-forward to 1x so player never misses key windows
  soundCue:
    | 'thunder'
    | 'phone_ring'
    | 'breaker_snap'
    | 'glass_clink'
    | 'violin_chord'
    | 'door_slam';
}

export type InterventionId =
  | 'ring_courtyard_payphone'
  | 'pulse_alley_breaker'
  | 'laser_window_tap_3b';

export interface InterventionDefinition {
  id: InterventionId;
  label: string;
  shortCode: string;
  description: string;
  tradeoffWarning: string;
  alertnessCost: number; // Raises courtyard alertness / consumes cover budget
  prerequisiteClueId?: string; // Optional or contextual discovery condition
  targetApartmentId: ApartmentId;
  allowedNights: NightNumber[];
  minMinute: number;
  maxMinute: number;
  cooldownMinutes: number;
  setsFlag: string;
  consequenceDescription: string;
}

export type EvidenceConfidence = 'confirmed' | 'ambiguous' | 'circumstantial';

export interface ClueDefinition {
  id: string;
  title: string;
  category: 'physical_prop' | 'resident_action' | 'cross_apartment' | 'red_herring';
  night: NightNumber;
  apartmentId: ApartmentId;
  minMinute: number;
  maxMinute: number;
  minZoomLevel: number; // e.g., 2.2x optical zoom required
  targetFocalDistance: number; // e.g. 18.5m (must be within +/- 1.8m focus tolerance)
  requiredFlags?: string[];
  blockedByFlags?: string[];
  isMisleadingAssumption?: boolean;
  contradictedByClueId?: string;
  confidence: EvidenceConfidence;
  witnessOrObject: string;
  relatedClueIds: string[];
  opticalHintPrompt: string; // Non-spoiler diegetic prompt shown when zooming in before capture
  description: string;
  deductionTag: string;
  localOffset: [number, number, number]; // Offset inside apartment for 3D reticle marker
}

export interface CollectedClueRecord {
  clueId: string;
  collectedAtNight: NightNumber;
  collectedAtMinute: number;
  formattedTimestamp: string;
}

export type HypothesisClassification =
  | 'confirmed_synthesis'
  | 'unproven_assumption'
  | 'contradicted_fallacy';

export interface DeductionHypothesis {
  id: string;
  title: string;
  claim: string;
  requiredClueIds: [string, string]; // Pair of clues linked on the deduction board
  isFallacy: boolean;
  classification: HypothesisClassification;
  refutedByClueId?: string;
  conclusionText: string;
}

export type EndingId =
  | 'ending_true_conspiracy'
  | 'ending_scapegoat_julian'
  | 'ending_failure_cold_case';

export interface EndingDefinition {
  id: EndingId;
  title: string;
  verdictSubtitle: string;
  outcomeType: 'true_resolution' | 'partial_truth' | 'failure';
  summaryParagraphs: string[];
  epilogueNote: string;
}
