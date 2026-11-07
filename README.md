# WINDOWS AT 3AM — Cinematic 3D Observation & Narrative Investigation Game

**Genre:** Cinematic Urban Noir / 3D Observation & Deduction Mystery  
**Tech Stack:** TypeScript, Vite, Babylon.js (WebGL2 / WebGPU Filmic PBR), React 18, Tailwind CSS, Zustand, XState v5, Procedural glTF 2.0 (`.glb`) Asset Pipeline, Web Audio API, Vitest & Playwright.

---

## Core Investigation Loop

1. **Observe the Building:** Watch the 4-story, 12-window rear facade of 412 Mercer Courtyard across three consecutive nights (`00:00 AM – 03:00 AM`).
2. **Focus & Calibrate Optics:** Click any window in the 3D scene (or open the collapsible `WINDOWS` navigator), zoom in (`2.1x–3.5x`), and calibrate optical focus (`[F]` Auto-Focus or `[` / `]`) to bring interior details into sharp focus.
3. **Record Evidence (`[R]`):** Evidence is never collected automatically or exposed in advance. When your reticle has a valid line of sight, sufficient zoom, optical clarity, and narrative timing, hold **`R`** (or click **Record Observation**) to log the clue into your Journal with confidence and witness metadata.
4. **Deploy Contextual Interventions:** Open the collapsible `ACTIONS` tray in the bottom-left to trigger restricted courtyard interventions (e.g., ringing the 3C stairwell payphone, signaling Archivist Elena in 3B, or pulsing the alley surge bell) within their narrative windows. Each action consumes Courtyard Cover / Alertness budget (`MAX 3`) and visibly alters resident behavior.
5. **Synthesize Hypotheses & Submit Verdict:** Open the **Deduction Board (`[B]`)**, connect corroborating evidence pins to form hypotheses, distinguish confirmed syntheses from unproven/contradicted Night 1 assumptions, and submit your final verdict to reach the **True Conspiracy Resolution**, **Partial Indictment**, or **Cold Case Failure** ending.

---

## Controls

| Control | Action |
| :--- | :--- |
| **Left Click on 3D Window** | Focus telephoto camera onto apartment window |
| **Mouse Wheel** | Adjust optical zoom (`1.0x` Wide 35mm to `3.5x` Telephoto 135mm) |
| **`F` or `AF` Pill** | Toggle Auto-Focus calibration on active window plane |
| **`[` / `]` or `Q` / `E`** | Manual optical focal distance adjustment (`8.0m – 24.0m`) |
| **`R` (Hold or Press)** | Record observed evidence when optical lock is acquired |
| **`W` `A` `S` `D` / Arrows** | Pan camera view across the facade / interior |
| **`Space`** | Pause / Resume deterministic World Clock (`00:00 AM – 03:00 AM`) |
| **`H`** | Toggle **Cinematic Mode** (hides all non-essential HUD elements) |
| **`1` / `2` / `3` / `4`** | Quick-focus primary interactive apartments (`4A`, `3B`, `2C`, `1A`) |
| **`J`** | Toggle **Observation Journal & Tenant Notes** drawer |
| **`B`** | Toggle **Deduction & Hypothesis Board** workspace |
| **`Esc`** | Close active overlay / exit Cinematic Mode / return to wide view |

---

## Development & Verification Commands

```bash
# Install dependencies
pnpm install

# Generate 3D modular GLB assets & start development server
pnpm run dev

# Build production bundle
pnpm run build

# Run unit & simulation tests (Vitest)
pnpm test

# Run Playwright E2E browser verification & multi-viewport screenshot capture
pnpm run test:e2e
```
