import React, { useState, useRef, useEffect } from 'react';
import { VocabWord } from '../../types/vocab';
import { ArrowLeft, Check, Sparkles, Volume2, HelpCircle, Eye } from 'lucide-react';
import { speakEnglish } from '../../services/speech';
import { playSound } from '../../services/audio';
import { triggerConfetti } from '../../services/confetti';

interface WritingModeProps {
  words: VocabWord[];
  soundEnabled: boolean;
  onUpdateWordBox: (wordId: string, newBox: number, isCorrect: boolean) => void;
  onAddXp: (amount: number) => void;
  onExit: () => void;
}

export const WritingMode: React.FC<WritingModeProps> = ({
  words,
  soundEnabled,
  onUpdateWordBox,
  onAddXp,
  onExit,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [inputVal, setInputVal] = useState('');
  const [showSolution, setShowSolution] = useState(false);
  const [feedback, setFeedback] = useState<'idle' | 'correct' | 'wrong'>('idle');
  const [hintLevel, setHintLevel] = useState(0); // 0 = none, 1 = first letter, 2 = first 2 letters
  const [finished, setFinished] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const currentWord = words[currentIndex];

  useEffect(() => {
    setInputVal('');
    setShowSolution(false);
    setFeedback('idle');
    setHintLevel(0);
    setTimeout(() => {
      inputRef.current?.focus();
    }, 150);
  }, [currentIndex]);

  if (!currentWord) return null;

  const normalize = (str: string) => str.trim().toLowerCase().replace(/\s+/g, ' ');

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputVal.trim() || feedback === 'correct') return;

    const userClean = normalize(inputVal);
    const targetClean = normalize(currentWord.en);

    if (userClean === targetClean) {
      setFeedback('correct');
      playSound('correct', soundEnabled);
      speakEnglish(currentWord.en);
      const earnedXp = hintLevel > 0 ? 10 : 20;
      onAddXp(earnedXp);
      onUpdateWordBox(currentWord.id, Math.min(5, (currentWord.box || 1) + 1), true);

      setTimeout(() => {
        if (currentIndex + 1 < words.length) {
          setCurrentIndex(i => i + 1);
        } else {
          setFinished(true);
          triggerConfetti();
          playSound('victory', soundEnabled);
        }
      }, 1200);
    } else {
      setFeedback('wrong');
      playSound('wrong', soundEnabled);
      onUpdateWordBox(currentWord.id, 1, false);
    }
  };

  const handleShowHint = () => {
    setHintLevel(prev => Math.min(prev + 1, currentWord.en.length));
  };

  if (finished) {
    return (
      <div className="max-w-md mx-auto py-12 px-4 text-center space-y-6">
        <div className="w-20 h-20 mx-auto rounded-3xl bg-cyan-100 flex items-center justify-center text-4xl shadow-inner">
          ✍️
        </div>
        <div>
          <h2 className="text-2xl font-black text-slate-800">Schreibtest bestanden!</h2>
          <p className="text-sm text-slate-500 mt-1">
            Hervorragend geübt. Deine Rechtschreibung wird immer besser!
          </p>
        </div>
        <div className="p-4 bg-cyan-50 border border-cyan-200 rounded-2xl text-cyan-900 font-bold flex items-center justify-center gap-2">
          <Sparkles className="w-5 h-5 text-cyan-600" />
          <span>+{words.length * 20} XP erhalten!</span>
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
      <div className="flex items-center justify-between">
        <button
          onClick={onExit}
          className="text-slate-500 hover:text-slate-800 flex items-center gap-1.5 text-sm font-bold"
        >
          <ArrowLeft className="w-4 h-4" /> Beenden
        </button>
        <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
          Wort {currentIndex + 1} / {words.length}
        </span>
      </div>

      {/* Question Card */}
      <div className="bg-white rounded-3xl border-2 border-cyan-100 p-8 shadow-xl text-center space-y-3">
        <span className="text-xs font-bold uppercase tracking-wider text-cyan-600 bg-cyan-50 px-3 py-1 rounded-full">
          Übersetze ins Englische (Schreibweise zählt!)
        </span>
        <div className="text-3xl font-black text-slate-900 pt-2">
          {currentWord.de}
        </div>
        {currentWord.exampleEn && (
          <p className="text-xs text-slate-500 italic">
            Hinweis: {currentWord.type === 'noun' ? 'Substantiv' : currentWord.type === 'verb' ? 'Verb' : 'Vokabel'}
          </p>
        )}
      </div>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={inputVal}
            onChange={e => {
              setInputVal(e.target.value);
              if (feedback === 'wrong') setFeedback('idle');
            }}
            placeholder="Englisches Wort hier eintippen..."
            autoComplete="off"
            autoCorrect="off"
            spellCheck="false"
            className={`w-full py-4 px-5 text-xl font-bold rounded-2xl border-2 outline-none transition-all ${
              feedback === 'correct'
                ? 'bg-emerald-50 border-emerald-500 text-emerald-800'
                : feedback === 'wrong'
                ? 'bg-rose-50 border-rose-500 text-rose-800'
                : 'bg-white border-slate-300 focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100 text-slate-800'
            }`}
          />
          {feedback === 'correct' && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-600">
              <Check className="w-6 h-6 stroke-[3]" />
            </div>
          )}
        </div>

        {/* Hint Display */}
        {hintLevel > 0 && (
          <div className="text-center text-sm font-bold text-amber-600 bg-amber-50 py-2 rounded-xl border border-amber-200">
            Tipp: Beginnt mit „{currentWord.en.substring(0, hintLevel)}...“ ({currentWord.en.length} Zeichen)
          </div>
        )}

        {/* Solution reveal */}
        {showSolution && (
          <div className="text-center p-3 bg-indigo-50 border border-indigo-200 rounded-xl text-indigo-900 font-bold text-base flex items-center justify-center gap-2">
            <span>Richtige Lösung: <strong>{currentWord.en}</strong></span>
            <button
              type="button"
              onClick={() => speakEnglish(currentWord.en)}
              className="p-1 hover:bg-indigo-100 rounded-full"
            >
              <Volume2 className="w-4 h-4 text-indigo-600" />
            </button>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          <button
            type="submit"
            className="flex-1 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-base rounded-2xl shadow-lg shadow-indigo-200 transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            <span>Überprüfen</span>
            <Check className="w-5 h-5" />
          </button>
        </div>
      </form>

      {/* Helpful Actions */}
      <div className="flex items-center justify-between text-xs font-bold text-slate-500 pt-2">
        <button
          type="button"
          onClick={handleShowHint}
          className="flex items-center gap-1.5 hover:text-amber-600 transition-colors"
        >
          <HelpCircle className="w-4 h-4" /> Tipp anfordern
        </button>

        <button
          type="button"
          onClick={() => {
            setShowSolution(true);
            speakEnglish(currentWord.en);
          }}
          className="flex items-center gap-1.5 hover:text-indigo-600 transition-colors"
        >
          <Eye className="w-4 h-4" /> Lösung aufdecken
        </button>
      </div>
    </div>
  );
};
