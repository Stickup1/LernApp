import { VocabUnit, UserProgress } from '../types/vocab';
import { DEFAULT_UNITS } from '../data/defaultUnits';

const UNITS_STORAGE_KEY = 'lernheld_vocab_units_v2';
const PROGRESS_STORAGE_KEY = 'lernheld_user_progress_v1';

export const INITIAL_PROGRESS: UserProgress = {
  xp: 0,
  level: 1,
  streakDays: 1,
  lastActiveDate: new Date().toISOString().split('T')[0],
  wordsPracticedToday: 0,
  monsterDefeatedCount: 0,
  soundEnabled: true,
  ttsSpeed: 0.9,
  voiceAccent: 'en-GB',
};

export const getStoredUnits = (): VocabUnit[] => {
  try {
    // Clear old v1 dummy data if present
    if (localStorage.getItem('lernheld_vocab_units_v1')) {
      localStorage.removeItem('lernheld_vocab_units_v1');
    }
    const raw = localStorage.getItem(UNITS_STORAGE_KEY);
    if (!raw) return DEFAULT_UNITS;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : DEFAULT_UNITS;
  } catch (e) {
    console.error('Failed to load units from localStorage', e);
    return DEFAULT_UNITS;
  }
};

export const saveStoredUnits = (units: VocabUnit[]): void => {
  try {
    localStorage.setItem(UNITS_STORAGE_KEY, JSON.stringify(units));
  } catch (e) {
    console.error('Failed to save units to localStorage', e);
  }
};

export const getStoredProgress = (): UserProgress => {
  try {
    const raw = localStorage.getItem(PROGRESS_STORAGE_KEY);
    if (!raw) return INITIAL_PROGRESS;
    const progress: UserProgress = { ...INITIAL_PROGRESS, ...JSON.parse(raw) };
    
    // Check daily streak
    const today = new Date().toISOString().split('T')[0];
    if (progress.lastActiveDate !== today) {
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
      if (progress.lastActiveDate === yesterday) {
        // Consecutive day
        progress.streakDays += 1;
      } else {
        // Missed a day
        progress.streakDays = 1;
      }
      progress.lastActiveDate = today;
      progress.wordsPracticedToday = 0;
      saveStoredProgress(progress);
    }
    
    return progress;
  } catch (e) {
    console.error('Failed to load progress from localStorage', e);
    return INITIAL_PROGRESS;
  }
};

export const saveStoredProgress = (progress: UserProgress): void => {
  try {
    localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(progress));
  } catch (e) {
    console.error('Failed to save progress to localStorage', e);
  }
};

// Calculate level threshold: Level 1 = 0 XP, Level 2 = 100 XP, Level 3 = 250 XP, etc.
export const getXpForNextLevel = (currentLevel: number): number => {
  return currentLevel * 120;
};
