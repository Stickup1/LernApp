export interface VocabMeaning {
  id: string;
  de: string;
  exampleEn?: string;
  exampleDe?: string;
  box?: number;
  lastPracticed?: string;
  correctCount?: number;
  incorrectCount?: number;
}

export interface VocabWord {
  id: string;
  en: string;
  de: string;
  exampleEn?: string;
  exampleDe?: string;
  meanings?: VocabMeaning[];
  type?: 'noun' | 'verb' | 'adjective' | 'phrase' | 'other';
  box: number; // 1 to 5 (Leitner system)
  isActive?: boolean; // false = staged, not yet available for learning
  lastPracticed?: string;
  correctCount: number;
  incorrectCount: number;
}

export type LearningWord = Omit<VocabWord, 'meanings'>;

export interface VocabUnit {
  id: string;
  title: string;
  description: string;
  icon: string; // Emoji
  isCustom?: boolean;
  words: VocabWord[];
}

export type EnglishAccent = 'en-GB' | 'en-US';

export interface UserProgress {
  xp: number;
  level: number;
  streakDays: number;
  lastActiveDate: string; // YYYY-MM-DD
  wordsPracticedToday: number;
  monsterDefeatedCount: number;
  soundEnabled: boolean;
  ttsSpeed: number; // 0.8 to 1.0
  voiceAccent: EnglishAccent;
}

export type ProfileAccent = 'indigo' | 'amber' | 'emerald' | 'rose' | 'sky' | 'violet';

export interface LearnerProfile {
  id: string;
  name: string;
  avatar?: string;
  accentColor?: ProfileAccent;
  progress: UserProgress;
  units: VocabUnit[];
}

export type LearningMode = 
  | 'dashboard'
  | 'flashcards'
  | 'memory'
  | 'scramble'
  | 'writing'
  | 'monster'
  | 'manager';
