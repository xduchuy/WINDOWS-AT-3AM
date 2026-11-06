import { NightNumber } from '../types/game';

/**
 * Deterministic World Clock running from 00:00 (0 minutes) to 03:00 AM (180 minutes)
 * across Nights 1, 2, and 3.
 */
export class WorldClock {
  public static readonly MAX_MINUTES = 180; // 00:00 to 03:00 AM

  public static formatTime(minuteOfNight: number): string {
    const clamped = Math.max(0, Math.min(WorldClock.MAX_MINUTES, Math.floor(minuteOfNight)));
    const hours = Math.floor(clamped / 60);
    const mins = clamped % 60;
    const hh = String(hours).padStart(2, '0');
    const mm = String(mins).padStart(2, '0');
    return `${hh}:${mm} AM`;
  }

  public static formatTimestamp(night: NightNumber, minuteOfNight: number): string {
    return `NIGHT ${night} // ${WorldClock.formatTime(minuteOfNight)}`;
  }

  public static stepClock(
    currentMinute: number,
    deltaSeconds: number,
    timeScale: number,
    isPaused: boolean
  ): { nextMinute: number; reachedEndOfNight: boolean } {
    if (isPaused || timeScale <= 0) {
      return {
        nextMinute: currentMinute,
        reachedEndOfNight: currentMinute >= WorldClock.MAX_MINUTES,
      };
    }

    // At 1x speed, 1 real second = 1.5 simulation minutes (so 3 hours = 120s at 1x, or faster at 2x/5x)
    const addedMinutes = deltaSeconds * 1.5 * timeScale;
    const nextMinute = Math.min(WorldClock.MAX_MINUTES, currentMinute + addedMinutes);
    return {
      nextMinute,
      reachedEndOfNight: nextMinute >= WorldClock.MAX_MINUTES,
    };
  }
}
