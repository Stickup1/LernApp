import { LearnerProfile, ProfileAccent, VocabUnit, UserProgress } from '../types/vocab';
import { DEFAULT_UNITS } from '../data/defaultUnits';

const UNITS_STORAGE_KEY = 'lernheld_vocab_units_v2';
const PROGRESS_STORAGE_KEY = 'lernheld_user_progress_v1';
const PROFILES_STORAGE_KEY = 'lernheld_profiles_v1';

const PROFILE_AVATARS = ['🚀', '🦊', '🐼', '🤖', '🦁', '🐸', '🌟', '🎯'];
const PROFILE_ACCENTS: ProfileAccent[] = ['indigo', 'amber', 'emerald', 'rose', 'sky', 'violet'];

const getSafeProfileAvatar = (name: string, index?: number): string => {
  const pool = PROFILE_AVATARS;
  const seed = Array.from(name).reduce((total, char) => total + char.charCodeAt(0), 0);
  const selectedIndex = typeof index === 'number' ? index : Math.abs(seed) % pool.length;
  return pool[selectedIndex] ?? pool[0];
};

const getSafeProfileAccent = (name: string, index?: number): ProfileAccent => {
  const pool = PROFILE_ACCENTS;
  const seed = Array.from(name).reduce((total, char) => total + char.charCodeAt(0), 0);
  const selectedIndex = typeof index === 'number' ? index : Math.abs(seed) % pool.length;
  return pool[selectedIndex] ?? pool[0];
};

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

export const createProfile = (
  name: string,
  units: VocabUnit[] = DEFAULT_UNITS,
  progress: UserProgress = INITIAL_PROGRESS,
  avatar?: string,
  accentColor?: ProfileAccent,
): LearnerProfile => ({
  id: `profile_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
  name: name.trim() || 'Lernheld',
  avatar: avatar || getSafeProfileAvatar(name.trim() || 'Lernheld'),
  accentColor: accentColor || getSafeProfileAccent(name.trim() || 'Lernheld'),
  progress: {
    ...progress,
    lastActiveDate: new Date().toISOString().split('T')[0],
  },
  units,
});

export const getStoredProfiles = (): LearnerProfile[] => {
  try {
    if (localStorage.getItem('lernheld_vocab_units_v1')) {
      localStorage.removeItem('lernheld_vocab_units_v1');
    }

    const raw = localStorage.getItem(PROFILES_STORAGE_KEY);
    if (!raw) {
      const fallbackProfile = createProfile('Lernheld');
      saveStoredProfiles([fallbackProfile]);
      return [fallbackProfile];
    }

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      const fallbackProfile = createProfile('Lernheld');
      saveStoredProfiles([fallbackProfile]);
      return [fallbackProfile];
    }

    return (parsed as LearnerProfile[]).map((profile, index) => ({
      ...profile,
      avatar: profile.avatar || getSafeProfileAvatar(profile.name || 'Lernheld', index),
      accentColor: profile.accentColor || getSafeProfileAccent(profile.name || 'Lernheld', index),
    }));
  } catch (e) {
    console.error('Failed to load profiles from localStorage', e);
    const fallbackProfile = createProfile('Lernheld');
    saveStoredProfiles([fallbackProfile]);
    return [fallbackProfile];
  }
};

export const saveStoredProfiles = (profiles: LearnerProfile[]): void => {
  try {
    localStorage.setItem(PROFILES_STORAGE_KEY, JSON.stringify(profiles));
  } catch (e) {
    console.error('Failed to save profiles to localStorage', e);
  }
};

export const getStoredUnits = (): VocabUnit[] => {
  try {
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

    const today = new Date().toISOString().split('T')[0];
    if (progress.lastActiveDate !== today) {
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
      if (progress.lastActiveDate === yesterday) {
        progress.streakDays += 1;
      } else {
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

export const getXpForNextLevel = (currentLevel: number): number => {
  return currentLevel * 120;
};
