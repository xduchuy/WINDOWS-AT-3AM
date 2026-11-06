import { CollectedClueRecord, NightNumber, QualityPreset } from '../types/game';

export interface SaveDataPayload {
  version: number;
  savedAtIso: string;
  night: NightNumber;
  minute: number;
  worldFlags: string[];
  firedEventIds: string[];
  collectedClues: CollectedClueRecord[];
  unlockedHypothesisIds: string[];
  qualityPreset: QualityPreset;
  subtitlesEnabled: boolean;
  highContrastUi: boolean;
  reducedMotion: boolean;
}

const STORAGE_KEY = 'windows_at_3am_save_v1';

export class SaveSystem {
  public static saveToLocalStorage(payload: SaveDataPayload): boolean {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
      return true;
    } catch (err) {
      console.warn('[SaveSystem] Failed to write save slot:', err);
      return false;
    }
  }

  public static loadFromLocalStorage(): SaveDataPayload | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as SaveDataPayload;
      if (parsed && typeof parsed.night === 'number' && Array.isArray(parsed.collectedClues)) {
        return parsed;
      }
      return null;
    } catch (err) {
      console.warn('[SaveSystem] Failed to parse save slot:', err);
      return null;
    }
  }

  public static hasSaveSlot(): boolean {
    try {
      return localStorage.getItem(STORAGE_KEY) !== null;
    } catch {
      return false;
    }
  }

  public static clearSaveSlot(): void {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  }
}
