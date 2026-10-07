export interface VocabWord {
  id: string;
  en: string;
  de: string;
  exampleEn?: string;
  exampleDe?: string;
  type?: 'noun' | 'verb' | 'adjective' | 'phrase' | 'other';
  box: number; // 1 to 5 (Leitner system)
  lastPracticed?: string;
  correctCount: number;
  incorrectCount: number;
}

export interface VocabUnit {
  id: string;
  title: string;
  description: string;
  icon: string; // Emoji
  isCustom?: boolean;
  words: VocabWord[];
}

export interface UserProgress {
  xp: number;
  level: number;
  streakDays: number;
  lastActiveDate: string; // YYYY-MM-DD
  wordsPracticedToday: number;
  monsterDefeatedCount: number;
  soundEnabled: boolean;
  ttsSpeed: number; // 0.8 to 1.0
}

export type LearningMode = 
  | 'dashboard'
  | 'flashcards'
  | 'quiz'
  | 'scramble'
  | 'writing'
  | 'monster'
  | 'manager';
