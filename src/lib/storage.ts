export interface Progress {
  started: boolean;
  current: number;
  completed: number[];
}

export interface Preferences {
  motion: boolean;
  volume: number;
}

const SAVE_KEY = 'lisiere-progress-v1';
const PREFS_KEY = 'lisiere-preferences-v1';

export const EMPTY_PROGRESS: Progress = { started: false, current: 0, completed: [] };
export const DEFAULT_PREFERENCES: Preferences = { motion: true, volume: 0.35 };

export function readProgress(): Progress {
  try {
    const value = JSON.parse(localStorage.getItem(SAVE_KEY) || 'null');
    if (!value || !Array.isArray(value.completed)) return { ...EMPTY_PROGRESS };
    return {
      started: value.started === true,
      current: Number.isInteger(value.current) ? Math.max(0, Math.min(2, value.current)) : 0,
      completed: [...new Set<number>(value.completed.filter((n: unknown) =>
        typeof n === 'number' && Number.isInteger(n) && n >= 0 && n <= 2))],
    };
  } catch {
    return { ...EMPTY_PROGRESS };
  }
}

export function saveProgress(progress: Progress): boolean {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(progress));
    return true;
  } catch {
    return false;
  }
}

export function readPreferences(): Preferences {
  try {
    const value = JSON.parse(localStorage.getItem(PREFS_KEY) || 'null');
    return {
      motion: value?.motion !== false,
      volume: typeof value?.volume === 'number' ? Math.max(0, Math.min(1, value.volume)) : 0.35,
    };
  } catch {
    return { ...DEFAULT_PREFERENCES };
  }
}

export function savePreferences(preferences: Preferences) {
  try {
    localStorage.setItem(PREFS_KEY, JSON.stringify(preferences));
  } catch {
    // Private browsing can make storage unavailable; play remains possible.
  }
}