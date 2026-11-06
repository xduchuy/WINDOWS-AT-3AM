# WINDOWS AT 3AM — Cinematic 3D Observation & Narrative Mystery

**Genre:** Cinematic Urban Noir / 3D Observation Simulation  
**Tech Stack:** TypeScript, Vite, Babylon.js (WebGPU / WebGL2), React 18, Tailwind CSS, Zustand, XState v5, Procedural glTF 2.0 (`.glb`) Asset Pipeline, Web Audio API, Vitest & Playwright.

---

## Quick Start

```bash
# Install dependencies
pnpm install

# Generate 3D modular GLB assets & start development server
pnpm run dev

# Build production bundle
pnpm run build

# Run unit & simulation tests
pnpm test

# Run Playwright browser verification & visual capture
pnpm run test:e2e
```

---

## Controls & Observation Mechanics

| Control | Action |
| :--- | :--- |
| **Left Click on Window / Matrix (`1A–4C`)** | Lock telephoto camera onto apartment window |
| **Mouse Wheel / Zoom Slider** | Adjust optical zoom (`1.0x` Wide 35mm to `3.5x` Telephoto 135mm) |
| **`[` / `]` or `Q` / `E` or Focus Slider** | Calibrate optical focal distance (`8.0m` to `24.0m`) |
| **`F` or `AF` Button** | Toggle Auto-Focus lock on active window plane |
| **`W` `A` `S` `D` / Arrow Keys** | Pan camera view across the facade / interior |
| **`Space`** | Pause / Resume deterministic World Clock (`00:00 AM – 03:00 AM`) |
| **`1` / `2` / `3` / `4`** | Quick-focus primary interactive apartments (`4A`, `3B`, `2C`, `1A`) |
| **`J`** | Toggle timestamped Observation Journal & Tenant Dossiers |
| **`B`** | Toggle Deduction & Hypothesis Board |
| **`Esc`** | Return to wide courtyard overview / close active modal |
