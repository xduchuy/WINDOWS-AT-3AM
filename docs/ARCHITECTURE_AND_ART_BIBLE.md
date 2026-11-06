# WINDOWS AT 3AM — Technical Architecture, Art Bible, Asset Pipeline & Vertical Slice Milestones

## 1. Executive Vision & Creative Direction
**Title:** *WINDOWS AT 3AM* ("The Mercer Courtyard Incident")  
**Genre:** Cinematic Urban Noir / 3D Observation & Narrative Deduction Simulation  
**Core Fantasy:** A sleepless observer in Apartment 304 Across the Courtyard watches the rain-slicked rear facade of **The Halcyon Arms (412 Mercer St.)** between **00:00 and 03:00 AM** across **three consecutive nights**. Behind twelve weathered sash windows across four floors, four key apartments—and eight supporting architectural vignettes—contain residents whose lives, secrets, schedules, and panicked decisions intersect around a missing rare violin, an illicit extortion drop, a tampered electrical breaker box, and an alibi forged in the dark.

---

## 2. Art Bible — Cinematic Urban Noir
### 2.1 Color Palette & Lighting Ratios
- **Exterior Ambient & Sky/Fog:** Deep Slate Midnight (`#080d18`), Wet Asphalt Shadow (`#050810`), Distant Sodium-Vapor Streetlight Haze (`#1a2436` blended with `#2d2218` at horizon).
- **Interior Key Lights (Selective Dynamic + Baked Ambient):**
  - **Apt 4A — Julian Vance (Luthier / Restorer, Floor 4 Left):** Warm Work-Bench Tungsten (`#ff9e44`, 2900K), Amber Varnish bounce, focused desk-lamp cone casting sharp shadow silhouettes against the back plaster wall.
  - **Apt 3B — Elena Rostova (Investigative Archivist, Floor 3 Center):** Cool-Green Banker's Lamp (`#4fd1a5` accent) mixed with Warm Floor Lamp (`#f5b064`), high-contrast Venetian blind slats casting striated shadow bars.
  - **Apt 2C — Marcus Thorne (Disgraced Auditor / Fixer, Floor 2 Right):** Moody Crimson/Amber Neon spill from alley sign (`#e8523f`) + dim kitchen pendant (`#d99b52`), nervous pacing silhouettes, cigarette/steam haze.
  - **Apt 1A — Nora Lin (Night-Shift Paramedic & Building Super's Daughter, Floor 1 Left):** Clinical Fluorescent Kitchen (`#b8d8be` / 4300K) transitioning to warm hallway alcove (`#e29950`), direct access to the Basement/Courtyard Fuse Box & Utility Corridor.
- **Materiality & Surface Response (PBR):**
  - **Weathered Brick (`roughness: 0.78`, wet streaks `roughness: 0.18`):** Procedural normal & roughness variation simulating vertical rainwater runoff beneath window sills and AC units.
  - **Wet Concrete Sills, Cornices & Courtyard Ground (`roughness: 0.12 - 0.35`, `metallic: 0.05`):** Specular reflection of warm apartment windows and neon alley signage.
  - **Wrought-Iron Balconies & Fire Escapes (`roughness: 0.42`, `metallic: 0.85`):** Dark oxidized iron (`#16191e`) catching rim highlights from window light spill.
  - **Window Glass & Condensation (`alpha: 0.22 - 0.45`, fresnel reflections, droplet streaks):** Separate glass panes for upper/lower sash windows; subtle rain droplet normal perturbation and warm interior bloom bleed.

### 2.2 Framing, Camera & Post-Processing
- **Observer Vantage:** Fixed tripod/handheld binocular perch at 3rd-floor height across the 18-meter courtyard.
- **Focal Length & Zoom:** Smooth optical zoom from **35mm Wide Overview** (full 4-story, 12-window facade + courtyard rain + utility junction) down to **135mm Telephoto Close-Up** (framing a single apartment interior with shallow Depth of Field).
- **Manual / Auto Focus Plane:** Rack focus shifts crisp focal distance from foreground rain cables (`4m`) to facade balconies (`15m`) to deep room interiors (`19m`). Inspecting evidence requires proper zoom AND optical focus lock.
- **Filmic Pipeline:** Babylon.js `ImageProcessingConfiguration` with ACES Filmic Tone Mapping, subtle vignette (`weight: 2.2`), calibrated exposure (`1.15`), contrast (`1.25`), subtle bloom (`threshold: 0.72`, `weight: 0.28`), and Depth-of-Field lens blur scaled by zoom level and quality preset.

---

## 3. Repository Architecture
```text
windows-at-3am/
├── docs/
│   └── ARCHITECTURE_AND_ART_BIBLE.md
├── scripts/
│   ├── generate-assets.mjs          # Procedural GLB binary model & PBR texture generator (buildings, rooms, props, characters)
│   └── blender-generate.py          # Companion Blender Python generator script for offline/Blender pipeline parity
├── public/
│   └── assets/
│       ├── models/                  # Generated modular GLBs (facade, 4 detailed room interiors, furniture kit, resident rigs)
│       └── textures/                # Generated procedural PBR maps (brick normal/roughness, rain droplets, baked lightmaps)
├── src/
│   ├── main.tsx                     # Application bootstrap
│   ├── App.tsx                      # Root layout & canvas + minimal Noir HUD integration
│   ├── types/
│   │   └── game.ts                  # Strict domain types for world clock, residents, apartments, clues, deductions, endings
│   ├── data/
│   │   ├── apartments.ts            # 12 windows across 4 floors + 4 deep interactive apartments metadata
│   │   ├── residents.ts             # 4 residents, traits, visual rigs, schedules across Nights 1–3
│   │   ├── timelineEvents.ts        # Deterministic cross-apartment event graph & intervention branches
│   │   └── mysteryClues.ts          # Discoverable evidence, misleading assumptions, deduction rules & 3 endings
│   ├── state/
│   │   ├── gameMachine.ts           # Explicit XState v5 finite-state machine for gameplay phases & narrative resolution
│   │   └── useGameStore.ts          # Zustand store synchronizing simulation, journal, deduction board, audio, & save/load
│   ├── simulation/
│   │   ├── WorldClock.ts            # Deterministic 00:00 -> 03:00 clock with variable time-scale, pause, & night transitions
│   │   ├── SimulationEngine.ts      # Evaluates schedules, cross-apartment causal triggers, light states, and props
│   │   └── SaveSystem.ts            # LocalStorage + JSON export/import deterministic state serialization
│   ├── rendering/
│   │   ├── SceneManager.ts          # WebGPU-first with WebGL2 fallback, PBR pipeline, shadows, baked+dynamic lighting
│   │   ├── ArchitectureBuilder.ts   # Loads GLB modules & constructs 4-floor 12-window facade, fire escapes, AC units, cables
│   │   ├── InteriorBuilder.ts       # Constructs 4 richly detailed apartments (4A, 3B, 2C, 1A) + 8 secondary parallax windows
│   │   ├── ResidentAnimator.ts      # Articulated humanoid character rigs, pose interpolation, room waypoint locomotion & prop use
│   │   ├── AtmosphereSystem.ts      # Layered rain particles, volumetric fog planes, wet-surface shimmer, window droplets
│   │   ├── CameraController.ts      # Pan/tilt, optical zoom (FOV), manual/auto focal distance, window lock-on, raycast inspection
│   │   └── QualityProfiler.ts       # Real-time CPU/GPU frame profiler & High/Medium/Low graphics preset auto-fallback
│   ├── audio/
│   │   └── SoundscapeEngine.ts      # Web Audio API procedural rain, distant thunder, room-specific directional audio & UI foley
│   ├── components/
│   │   ├── TopTimeBar.tsx           # Minimalist 00:00–03:00 clock, Night 1/2/3 selector, speed controls, FPS/preset badge
│   │   ├── OpticsReticle.tsx        # Binocular/telephoto viewfinder, focus meter, target apartment telemetry, clue scan progress
│   │   ├── InterventionPanel.tsx    # Restricted courtyard interventions (Ring Apt Phone, Trip Corridor Breaker, Flash Laser)
│   │   ├── JournalDrawer.tsx        # Timestamped observation log with filter by Night/Resident/Window
│   │   ├── DeductionBoard.tsx       # String-and-pinboard hypothesis linker with contradiction detection & case submission
│   │   ├── EndingModal.tsx          # Cinematic multi-ending dossier readout (True Resolution, Partial Framing, Cold Case Failure)
│   │   └── SettingsModal.tsx        # Graphics presets, Accessibility (high contrast, reduced motion, subtitles), Save/Load
│   └── test/
│       └── simulation.test.ts       # Vitest unit & integration suite for clock, schedules, interventions, clues & endings
└── tests/
    └── e2e.spec.ts                  # Playwright browser verification & visual screenshot validation
```

---

## 4. Asset Pipeline & Procedural GLB Generation
To guarantee zero empty-box placeholders and ensure deterministic, reproducible builds in both CI and local desktop environments:
1. **`scripts/generate-assets.mjs`** writes standard binary glTF 2.0 (`.glb`) files directly into `public/assets/models/` before `vite dev` or `vite build`:
   - `courtyard_facade_kit.glb`: Detailed cornice, weathered brick piers, sash window frames, wrought-iron balcony railings, external AC compressor units with fan grilles, and rain downspouts.
   - `furniture_kit.glb`: Authored multi-mesh interior assets (luthier workbench + violin case, archival bookshelf + banker's lamp, kitchen counter + refrigerator, sofa, bed, radiator, fuse box).
   - `resident_rig.glb`: Articulated stylized-noir humanoid character mesh hierarchy for resident instantiation.
2. **`scripts/blender-generate.py`** provides the Blender Python (`bpy`) equivalent script to generate and export the exact kit inside Blender 4.x when artists refine geometry interactively.
3. **Runtime Hybrid Assembly (`ArchitectureBuilder.ts` + `InteriorBuilder.ts`)**: Loads the generated `.glb` assets and augments them with procedural baked-lightmap textures, normal maps, animated curtains, dynamic shadow-casting spot lights, and interactive evidence hot-spots.

---

## 5. Vertical Slice Milestones
- **Phase 1 — Cinematic Exterior Hero Scene:** WebGPU/WebGL2 initialization, PBR brick/concrete/iron materials, 4-floor 12-window facade with balconies, AC units, catenary wires, layered rain, wet courtyard reflections, filmic post-processing, and optical camera zoom/focus.
- **Phase 2 — Four Detailed Apartment Interiors:** Complete geometry, furniture, props, baked ambient maps, and selective shadow-casting tungsten/fluorescent lights for **Apt 4A (Luthier Studio)**, **Apt 3B (Archivist Study)**, **Apt 2C (Auditor Kitchen/Lounge)**, and **Apt 1A (Paramedic Flat & Fuse Alcove)**, plus 8 curtained/lit secondary windows.
- **Phase 3 — Resident Movement & World Simulation:** Deterministic 00:00–03:00 clock across Nights 1, 2, and 3; 4 articulated residents executing scheduled activities, walking between room waypoints, toggling room lights, opening safes, hiding cases, and reacting to cross-apartment triggers.
- **Phase 4 — Evidence, Deduction & Interventions:** Focus-gated optical observation scanning, timestamped Evidence Journal, 3 restricted player interventions (Payphone Ring, Breaker Surge, Courtyard Signal) that alter resident schedules in real time, and interactive Deduction Board.
- **Phase 5 — Narrative Outcomes, Audio, Polish & Verification:** Three complete endings + failure state, spatial Web Audio rain & room soundscape, GPU/CPU quality profiler with presets, Save/Load system, Vitest suite, and Playwright screenshot verification.
