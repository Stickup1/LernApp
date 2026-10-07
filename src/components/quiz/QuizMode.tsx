import React, { useState, useEffect, useMemo } from 'react';
import { EnglishAccent, VocabWord } from '../../types/vocab';
import { Volume2, ArrowLeft, Flame, Sparkles, CheckCircle2, XCircle } from 'lucide-react';
import { speakEnglish } from '../../services/speech';
import { playSound } from '../../services/audio';
import { triggerConfetti } from '../../services/confetti';

interface QuizModeProps {
  words: VocabWord[];
  allWordsPool: VocabWord[];
  soundEnabled: boolean;
  voiceAccent: EnglishAccent;
  onUpdateWordBox: (wordId: string, newBox: number, isCorrect: boolean) => void;
  onAddXp: (amount: number) => void;
  onExit: () => void;
}

export const QuizMode: React.FC<QuizModeProps> = ({
  words,
  allWordsPool,
  soundEnabled,
  voiceAccent,
  onUpdateWordBox,
  onAddXp,
  onExit,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [streak, setStreak] = useState(0);
  const [totalXpEarned, setTotalXpEarned] = useState(0);
  const [finished, setFinished] = useState(false);
  const [shuffledWords, setShuffledWords] = useState<VocabWord[]>([]);

  useEffect(() => {
    // Shuffle words for quiz
    const shuffled = [...words].sort(() => Math.random() - 0.5);
    setShuffledWords(shuffled);
  }, [words]);

  const currentWord = shuffledWords[currentIndex];

  // Auto-speak English word on new question
  useEffect(() => {
    if (currentWord) {
      speakEnglish(currentWord.en, 0.9, voiceAccent);
    }
  }, [currentIndex, currentWord, voiceAccent]);

  // Generate 4 options: 1 correct + 3 random distractors
  const options = useMemo(() => {
    if (!currentWord) return [];
    const correct = currentWord.de;
    const pool = (allWordsPool.length > 5 ? allWordsPool : shuffledWords)
      .filter(w => w.de !== correct)
      .map(w => w.de);
    
    const shuffledDistractors = [...pool].sort(() => Math.random() - 0.5).slice(0, 3);
    const combined = [correct, ...shuffledDistractors];
    return combined.sort(() => Math.random() - 0.5);
  }, [currentWord, allWordsPool, shuffledWords]);

  if (!currentWord) {
    return null;
  }

  const handleSelect = (option: string) => {
    if (selectedOption !== null) return; // Prevent multiple clicks
    setSelectedOption(option);

    const isCorrect = option === currentWord.de;
    const currentBox = currentWord.box || 1;

    if (isCorrect) {
      const newStreak = streak + 1;
      setStreak(newStreak);
      const bonus = newStreak >= 3 ? 5 : 0;
      const xp = 15 + bonus;
      setTotalXpEarned(x => x + xp);
      onAddXp(xp);

      if (newStreak % 3 === 0) {
        playSound('streak', soundEnabled);
      } else {
        playSound('correct', soundEnabled);
      }
      onUpdateWordBox(currentWord.id, Math.min(5, currentBox + 1), true);
    } else {
      setStreak(0);
      playSound('wrong', soundEnabled);
      onUpdateWordBox(currentWord.id, 1, false);
    }

    // Wait 1.1s before advancing to show feedback
    setTimeout(() => {
      setSelectedOption(null);
      if (currentIndex + 1 < shuffledWords.length) {
        setCurrentIndex(i => i + 1);
      } else {
        setFinished(true);
        triggerConfetti();
        playSound('victory', soundEnabled);
      }
    }, 1100);
  };

  if (finished) {
    return (
      <div className="max-w-md mx-auto py-12 px-4 text-center space-y-6">
        <div className="w-20 h-20 mx-auto rounded-3xl bg-indigo-100 flex items-center justify-center text-4xl shadow-inner">
          ⚡
        </div>
        <div>
          <h2 className="text-2xl font-black text-slate-800">Quiz beendet!</h2>
          <p className="text-sm text-slate-500 mt-1">
            Super Durchlauf! Du hast fleißig Punkte gesammelt.
          </p>
        </div>
        <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-2xl text-indigo-900 text-base font-extrabold flex items-center justify-center gap-2">
          <Sparkles className="w-5 h-5 text-indigo-600" />
          <span>+{totalXpEarned} XP gesammelt!</span>
        </div>
        <button
          onClick={onExit}
          className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl shadow-md"
        >
          Zurück zur Übersicht
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-6 space-y-6">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={onExit}
          className="text-slate-500 hover:text-slate-800 flex items-center gap-1.5 text-sm font-bold"
        >
          <ArrowLeft className="w-4 h-4" /> Beenden
        </button>

        <div className="flex items-center gap-3">
          {streak > 1 && (
            <div className="flex items-center gap-1 text-xs font-black text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200 animate-bounce">
              <Flame className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
              <span>{streak}er Streak! (+5 Bonus)</span>
            </div>
          )}
          <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
            {currentIndex + 1} / {shuffledWords.length}
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
        <div
          className="bg-indigo-500 h-full transition-all duration-300"
          style={{ width: `${((currentIndex + 1) / shuffledWords.length) * 100}%` }}
        />
      </div>

      {/* Question Card */}
      <div className="bg-white rounded-3xl border-2 border-indigo-100 p-8 shadow-xl text-center space-y-3">
        <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">
          Was bedeutet dieses englische Wort?
        </span>
        <div className="text-3xl sm:text-4xl font-black text-slate-900 pt-2">
          {currentWord.en}
        </div>
        <button
          onClick={() => speakEnglish(currentWord.en, 0.9, voiceAccent)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-full transition-colors"
        >
          <Volume2 className="w-4 h-4" /> Aussprache wiederholen
        </button>
      </div>

      {/* 4 Answer Options */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
        {options.map((option, idx) => {
          const isSelected = selectedOption === option;
          const isCorrect = option === currentWord.de;

          let btnClass = "bg-white border-2 border-slate-200 text-slate-800 hover:border-indigo-400 hover:bg-indigo-50/40";

          if (selectedOption !== null) {
            if (isCorrect) {
              btnClass = "bg-emerald-500 border-2 border-emerald-600 text-white shadow-lg shadow-emerald-200 scale-[1.02]";
            } else if (isSelected && !isCorrect) {
              btnClass = "bg-rose-500 border-2 border-rose-600 text-white animate-shake";
            } else {
              btnClass = "bg-slate-100 border-2 border-slate-200 text-slate-400 opacity-60";
            }
          }

          return (
            <button
              key={idx}
              disabled={selectedOption !== null}
              onClick={() => handleSelect(option)}
              className={`p-4 rounded-2xl font-bold text-base transition-all text-left flex items-center justify-between min-h-[64px] active:scale-98 ${btnClass}`}
            >
              <span>{option}</span>
              {selectedOption !== null && isCorrect && (
                <CheckCircle2 className="w-5 h-5 text-white flex-shrink-0" />
              )}
              {selectedOption !== null && isSelected && !isCorrect && (
                <XCircle className="w-5 h-5 text-white flex-shrink-0" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
