import { Engine } from '@babylonjs/core';
import { useGameStore } from '../state/useGameStore';

/**
 * Profiles real-time FPS & CPU/GPU frame time and manages automatic quality preset fallback
 * if sustained frame rates drop below threshold.
 */
export class QualityProfiler {
  private sampleCount = 0;
  private lowFpsStreak = 0;
  private lastReportTime = performance.now();

  public sampleFrame(engine: Engine, backendName: string): void {
    this.sampleCount++;
    const now = performance.now();
    if (now - this.lastReportTime < 1000) return;

    this.lastReportTime = now;
    const currentFps = Math.round(engine.getFps());
    const frameTimeMs = Number((1000 / Math.max(1, currentFps)).toFixed(1));

    const store = useGameStore.getState();
    store.updatePerformanceMetrics(currentFps, frameTimeMs, backendName);

    // Automatic fallback if FPS stays below 24 for 4 consecutive seconds
    if (currentFps < 24 && this.sampleCount > 120) {
      this.lowFpsStreak++;
      if (this.lowFpsStreak >= 4) {
        this.lowFpsStreak = 0;
        if (store.qualityPreset === 'high') {
          store.setQualityPreset('medium');
        } else if (store.qualityPreset === 'medium') {
          store.setQualityPreset('low');
        }
      }
    } else {
      this.lowFpsStreak = 0;
    }
  }
}
