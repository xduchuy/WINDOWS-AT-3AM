import { ApartmentDefinition, ApartmentId } from '../types/game';

/**
 * Coordinate convention:
 * Building front wall sits at Z = 0.
 * Apartment interiors extend from Z = 0 (window plane) to Z = 4.5 (back wall).
 * Observer camera perches across the courtyard at Z = -18.5, Y = 8.4.
 * Columns:
 *   Column 0 (Left):   X = -5.2
 *   Column 1 (Center): X =  0.0
 *   Column 2 (Right):  X = +5.2
 * Floors:
 *   Floor 1: Y = 2.2
 *   Floor 2: Y = 5.8
 *   Floor 3: Y = 9.4
 *   Floor 4: Y = 13.0
 */
export const APARTMENTS: Record<ApartmentId, ApartmentDefinition> = {
  apt_4a: {
    id: 'apt_4a',
    code: '4A',
    name: 'Vance Luthier Workshop',
    floor: 4,
    column: 0,
    isDetailedInteractive: true,
    residentId: 'julian',
    themeColorHex: '#ff9e44',
    kelvinLightTemp: 2850,
    baseLightIntensity: 1.55,
    focalDepthMeters: 20.2,
    worldCenter: [-5.2, 13.0, 2.1],
    description:
      'Top-floor corner workshop of master violin restorer Julian Vance. Features a hanging magnifying lamp, luthier workbench, wall-mounted chisels, acoustic moulds, and a reinforced wall safe behind an oil portrait.',
    waypoints: {
      window: { id: 'window', label: 'Balcony Sash Window', localPos: [0.0, 0.0, -1.25], facingYaw: Math.PI },
      workbench: { id: 'workbench', label: 'Luthier Workbench', localPos: [-0.65, 0.0, 0.15], facingYaw: -Math.PI / 2 },
      wall_safe: { id: 'wall_safe', label: 'Recessed Wall Safe', localPos: [1.15, 0.0, 1.35], facingYaw: 0 },
      doorway: { id: 'doorway', label: 'Hallway Door', localPos: [1.4, 0.0, 1.75], facingYaw: 0 },
    },
  },
  apt_4b: {
    id: 'apt_4b',
    code: '4B',
    name: 'Conservatory Storage Loft',
    floor: 4,
    column: 1,
    isDetailedInteractive: false,
    themeColorHex: '#6c8ebf',
    kelvinLightTemp: 4100,
    baseLightIntensity: 0.45,
    focalDepthMeters: 19.6,
    worldCenter: [0.0, 13.0, 2.1],
    description: 'Dusty upper storage room stacked with sheet-draped mannequins, music stands, and rain-streaked skylights.',
    waypoints: {
      window: { id: 'window', label: 'Window', localPos: [0, 0, -1.1], facingYaw: Math.PI },
    },
  },
  apt_4c: {
    id: 'apt_4c',
    code: '4C',
    name: 'Vacant Attic Studio',
    floor: 4,
    column: 2,
    isDetailedInteractive: false,
    themeColorHex: '#52657c',
    kelvinLightTemp: 3600,
    baseLightIntensity: 0.32,
    focalDepthMeters: 20.2,
    worldCenter: [5.2, 13.0, 2.1],
    description: 'Under renovation. Painter drop-cloths, step-ladder, and a flickering trouble-light hanging from exposed rafters.',
    waypoints: {
      window: { id: 'window', label: 'Window', localPos: [0, 0, -1.1], facingYaw: Math.PI },
    },
  },
  apt_3a: {
    id: 'apt_3a',
    code: '3A',
    name: 'Mrs. Gable’s Conservatory Parlor',
    floor: 3,
    column: 0,
    isDetailedInteractive: false,
    themeColorHex: '#d49a6a',
    kelvinLightTemp: 2700,
    baseLightIntensity: 0.55,
    focalDepthMeters: 19.5,
    worldCenter: [-5.2, 9.4, 2.1],
    description: 'Heavy lace curtains, indoor ferns, and the bluish flicker of a late-night cathode-ray television.',
    waypoints: {
      window: { id: 'window', label: 'Window', localPos: [0, 0, -1.1], facingYaw: Math.PI },
    },
  },
  apt_3b: {
    id: 'apt_3b',
    code: '3B',
    name: 'Rostova Archival Study',
    floor: 3,
    column: 1,
    isDetailedInteractive: true,
    residentId: 'elena',
    themeColorHex: '#4fd1a5',
    kelvinLightTemp: 3400,
    baseLightIntensity: 1.48,
    focalDepthMeters: 18.8,
    worldCenter: [0.0, 9.4, 2.1],
    description:
      'Floor-to-ceiling archival bookshelves, an emerald banker’s lamp, a 35mm telephoto tripod aimed at the stairwell shaft, and a cork evidence board tracking insurance fraud.',
    waypoints: {
      window: { id: 'window', label: 'Venetian Blind Window', localPos: [0.0, 0.0, -1.2], facingYaw: Math.PI },
      desk: { id: 'desk', label: 'Emerald Banker Desk', localPos: [0.55, 0.0, 0.1], facingYaw: Math.PI / 2 },
      bookshelf: { id: 'bookshelf', label: 'Ledger Archive Shelf', localPos: [-1.25, 0.0, 0.85], facingYaw: -Math.PI / 2 },
      doorway: { id: 'doorway', label: 'Corridor Door', localPos: [1.35, 0.0, 1.75], facingYaw: 0 },
    },
  },
  apt_3c: {
    id: 'apt_3c',
    code: '3C',
    name: 'Stairwell Landing & Payphone Alcove',
    floor: 3,
    column: 2,
    isDetailedInteractive: false,
    themeColorHex: '#c98a4b',
    kelvinLightTemp: 3000,
    baseLightIntensity: 0.72,
    focalDepthMeters: 19.5,
    worldCenter: [5.2, 9.4, 2.1],
    description: 'Shared 3rd-floor landing with terrazzo steps, institutional green wainscoting, and a rotary wall payphone.',
    waypoints: {
      window: { id: 'window', label: 'Landing Window', localPos: [0, 0, -1.1], facingYaw: Math.PI },
    },
  },
  apt_2a: {
    id: 'apt_2a',
    code: '2A',
    name: 'Drifter’s Darkroom Flat',
    floor: 2,
    column: 0,
    isDetailedInteractive: false,
    themeColorHex: '#b83b3b',
    kelvinLightTemp: 2200,
    baseLightIntensity: 0.48,
    focalDepthMeters: 19.6,
    worldCenter: [-5.2, 5.8, 2.1],
    description: 'Bathed in dim crimson safelight with drying negatives strung across the window frame.',
    waypoints: {
      window: { id: 'window', label: 'Window', localPos: [0, 0, -1.1], facingYaw: Math.PI },
    },
  },
  apt_2b: {
    id: 'apt_2b',
    code: '2B',
    name: 'Central Laundry & Vent Shaft',
    floor: 2,
    column: 1,
    isDetailedInteractive: false,
    themeColorHex: '#7da1b8',
    kelvinLightTemp: 4500,
    baseLightIntensity: 0.52,
    focalDepthMeters: 18.9,
    worldCenter: [0.0, 5.8, 2.1],
    description: 'Steam-fogged glass, rotating laundry drums, and exposed copper hot-water risers.',
    waypoints: {
      window: { id: 'window', label: 'Window', localPos: [0, 0, -1.1], facingYaw: Math.PI },
    },
  },
  apt_2c: {
    id: 'apt_2c',
    code: '2C',
    name: 'Thorne’s Galley & Lounge',
    floor: 2,
    column: 2,
    isDetailedInteractive: true,
    residentId: 'marcus',
    themeColorHex: '#e8684a',
    kelvinLightTemp: 2650,
    baseLightIntensity: 1.42,
    focalDepthMeters: 19.6,
    worldCenter: [5.2, 5.8, 2.1],
    description:
      'Cramped mid-century lounge and galley kitchen of disgraced art-insurance auditor Marcus Thorne. Lit by a low amber pendant over a dining table strewn with shipping manifests, a paper shredder, and a false-bottomed air vent.',
    waypoints: {
      window: { id: 'window', label: 'Fire-Escape Window', localPos: [0.0, 0.0, -1.2], facingYaw: Math.PI },
      table: { id: 'table', label: 'Manifest Dining Table', localPos: [-0.45, 0.0, 0.1], facingYaw: Math.PI },
      kitchen: { id: 'kitchen', label: 'Galley Stove & Shredder', localPos: [1.1, 0.0, 0.65], facingYaw: Math.PI / 2 },
      air_vent: { id: 'air_vent', label: 'False-Bottomed Wall Vent', localPos: [-1.3, 0.0, 1.45], facingYaw: -Math.PI / 2 },
    },
  },
  apt_1a: {
    id: 'apt_1a',
    code: '1A',
    name: 'Lin’s Ground-Floor Flat & Fuse Alcove',
    floor: 1,
    column: 0,
    isDetailedInteractive: true,
    residentId: 'nora',
    themeColorHex: '#88d4ab',
    kelvinLightTemp: 4100,
    baseLightIntensity: 1.45,
    focalDepthMeters: 20.1,
    worldCenter: [-5.2, 2.2, 2.1],
    description:
      'Ground-floor apartment of paramedic Nora Lin, doubling as the building superintendent office. Contains the master electrical breaker panel, spare tenant key rack, first-aid lockers, and a direct service door to the courtyard.',
    waypoints: {
      window: { id: 'window', label: 'Barred Courtyard Window', localPos: [0.0, 0.0, -1.2], facingYaw: Math.PI },
      fusebox: { id: 'fusebox', label: 'Master Breaker Panel', localPos: [-1.25, 0.0, 0.9], facingYaw: -Math.PI / 2 },
      key_rack: { id: 'key_rack', label: 'Tenant Master Key Board', localPos: [0.85, 0.0, 1.4], facingYaw: 0 },
      counter: { id: 'counter', label: 'Kitchen & First-Aid Counter', localPos: [0.35, 0.0, 0.05], facingYaw: Math.PI / 2 },
    },
  },
  apt_1b: {
    id: 'apt_1b',
    code: '1B',
    name: 'Rear Courtyard Vestibule & Mailboxes',
    floor: 1,
    column: 1,
    isDetailedInteractive: false,
    themeColorHex: '#c49358',
    kelvinLightTemp: 2900,
    baseLightIntensity: 0.68,
    focalDepthMeters: 19.3,
    worldCenter: [0.0, 2.2, 2.1],
    description: 'Checkered tile vestibule with brass tenant mailboxes, wet umbrella stand, and courtyard exit door.',
    waypoints: {
      window: { id: 'window', label: 'Transom Window', localPos: [0, 0, -1.1], facingYaw: Math.PI },
    },
  },
  apt_1c: {
    id: 'apt_1c',
    code: '1C',
    name: 'Boiler & Coal Chute Room',
    floor: 1,
    column: 2,
    isDetailedInteractive: false,
    themeColorHex: '#d96b38',
    kelvinLightTemp: 2400,
    baseLightIntensity: 0.58,
    focalDepthMeters: 20.1,
    worldCenter: [5.2, 2.2, 2.1],
    description: 'Hissing cast-iron steam manifolds, pressure gauges, and an orange furnace pilot glow.',
    waypoints: {
      window: { id: 'window', label: 'Grated Window', localPos: [0, 0, -1.1], facingYaw: Math.PI },
    },
  },
};

export const APARTMENT_LIST: ApartmentDefinition[] = Object.values(APARTMENTS);
export const INTERACTIVE_APARTMENTS: ApartmentDefinition[] = APARTMENT_LIST.filter(
  (a) => a.isDetailedInteractive
);
