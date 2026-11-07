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
  courtyardAlertness?: number;
  qualityPreset: QualityPreset;
  subtitlesEnabled: boolean;
  highContrastUi: boolean;
  reducedMotion: boolean;
}

const STORAGE_KEY = 'windows_at_3am_save_v1';
const memoryFallback = new Map<string, string>();

function getStorage(): {
  getItem: (k: string) => string | null;
  setItem: (k: string, v: string) => void;
  removeItem: (k: string) => void;
} {
  if (typeof globalThis !== 'undefined' && 'localStorage' in globalThis && globalThis.localStorage) {
    return globalThis.localStorage;
  }
  return {
    getItem: (k) => memoryFallback.get(k) ?? null,
    setItem: (k, v) => {
      memoryFallback.set(k, v);
    },
    removeItem: (k) => {
      memoryFallback.delete(k);
    },
  };
}

export class SaveSystem {
  public static saveToLocalStorage(payload: SaveDataPayload): boolean {
    try {
      getStorage().setItem(STORAGE_KEY, JSON.stringify(payload));
      return true;
    } catch (err) {
      console.warn('[SaveSystem] Failed to write save slot:', err);
      return false;
    }
  }

  public static loadFromLocalStorage(): SaveDataPayload | null {
    try {
      const raw = getStorage().getItem(STORAGE_KEY);
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
      return getStorage().getItem(STORAGE_KEY) !== null;
    } catch {
      return false;
    }
  }

  public static clearSaveSlot(): void {
    try {
      getStorage().removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  }
}
