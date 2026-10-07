import React, { useState } from 'react';
import { VocabWord } from '../../types/vocab';
import { Volume2, RotateCcw, Check, X, ArrowLeft, Sparkles } from 'lucide-react';
import { speakEnglish } from '../../services/speech';
import { playSound } from '../../services/audio';
import { triggerConfetti } from '../../services/confetti';

interface FlashcardModeProps {
  words: VocabWord[];
  soundEnabled: boolean;
  onUpdateWordBox: (wordId: string, newBox: number, isCorrect: boolean) => void;
  onAddXp: (amount: number) => void;
  onExit: () => void;
}

export const FlashcardMode: React.FC<FlashcardModeProps> = ({
  words,
  soundEnabled,
  onUpdateWordBox,
  onAddXp,
  onExit,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [direction, setDirection] = useState<'en-de' | 'de-en'>('en-de');
  const [finished, setFinished] = useState(false);

  if (words.length === 0) {
    return (
      <div className="max-w-md mx-auto text-center py-16 px-4">
        <div className="text-5xl mb-4">📭</div>
        <h2 className="text-xl font-bold text-slate-800">Keine Vokabeln ausgewählt</h2>
        <p className="text-sm text-slate-500 mt-2">Wähle bitte eine Lerneinheit mit Vokabeln aus.</p>
        <button
          onClick={onExit}
          className="mt-6 px-6 py-2.5 bg-indigo-600 text-white font-bold rounded-2xl shadow-md hover:bg-indigo-700"
        >
          Zurück zur Übersicht
        </button>
      </div>
    );
  }

  const currentWord = words[currentIndex];

  const handleNext = (correct: boolean) => {
    const currentBox = currentWord.box || 1;
    let nextBox = currentBox;

    if (correct) {
      nextBox = Math.min(5, currentBox + 1);
      playSound('correct', soundEnabled);
      onAddXp(10);
    } else {
      nextBox = 1; // Back to box 1 in Leitner method
      playSound('wrong', soundEnabled);
    }

    onUpdateWordBox(currentWord.id, nextBox, correct);

    setIsFlipped(false);
    if (currentIndex + 1 < words.length) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setFinished(true);
      triggerConfetti();
      playSound('victory', soundEnabled);
    }
  };

  const handleAudio = (e: React.MouseEvent) => {
    e.stopPropagation();
    speakEnglish(currentWord.en);
  };

  if (finished) {
    return (
      <div className="max-w-md mx-auto py-12 px-4 text-center space-y-6">
        <div className="w-20 h-20 mx-auto rounded-3xl bg-amber-100 flex items-center justify-center text-4xl shadow-inner">
          🏆
        </div>
        <div>
          <h2 className="text-2xl font-black text-slate-800">Klasse gemacht!</h2>
          <p className="text-sm text-slate-500 mt-1">
            Du hast alle {words.length} Karteikarten durchgearbeitet!
          </p>
        </div>
        <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-2xl text-indigo-800 text-sm font-semibold flex items-center justify-center gap-2">
          <Sparkles className="w-5 h-5 text-indigo-600" />
          <span>+{words.length * 10} XP gesammelt!</span>
        </div>
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => {
              setCurrentIndex(0);
              setIsFlipped(false);
              setFinished(false);
            }}
            className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl flex items-center gap-2"
          >
            <RotateCcw className="w-4 h-4" /> Nochmal üben
          </button>
          <button
            onClick={onExit}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl shadow-md"
          >
            Zurück zur Übersicht
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-6 space-y-6">
      {/* Header with Exit and Progress */}
      <div className="flex items-center justify-between">
        <button
          onClick={onExit}
          className="text-slate-500 hover:text-slate-800 flex items-center gap-1.5 text-sm font-bold"
        >
          <ArrowLeft className="w-4 h-4" /> Beenden
        </button>

        <div className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
          Karte {currentIndex + 1} von {words.length}
        </div>

        <button
          onClick={() => setDirection(d => (d === 'en-de' ? 'de-en' : 'en-de'))}
          className="text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-3 py-1 rounded-full"
        >
          {direction === 'en-de' ? 'Englisch ➔ Deutsch' : 'Deutsch ➔ Englisch'}
        </button>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
        <div
          className="bg-indigo-500 h-full transition-all duration-300"
          style={{ width: `${((currentIndex + 1) / words.length) * 100}%` }}
        />
      </div>

      {/* The Flashcard */}
      <div
        onClick={() => setIsFlipped(!isFlipped)}
        className="cursor-pointer select-none min-h-[300px] sm:min-h-[340px] bg-white rounded-3xl border-2 border-indigo-200/80 shadow-xl shadow-indigo-100/60 p-8 flex flex-col justify-between hover:border-indigo-400 transition-all text-center relative group"
      >
        {/* Top Card Badge: Leitner Box */}
        <div className="flex items-center justify-between text-xs font-bold">
          <span className="px-3 py-1 rounded-full bg-indigo-50 text-indigo-700">
            Kasten-Fach {currentWord.box || 1} von 5
          </span>
          <span className="text-slate-400 group-hover:text-indigo-600 transition-colors flex items-center gap-1">
            <RotateCcw className="w-3.5 h-3.5" /> Tippen zum Umdrehen
          </span>
        </div>

        {/* Center Content */}
        <div className="my-auto py-6">
          {!isFlipped ? (
            <div className="space-y-4">
              <div className="text-3xl sm:text-4xl font-black text-slate-800">
                {direction === 'en-de' ? currentWord.en : currentWord.de}
              </div>
              {direction === 'en-de' && (
                <button
                  onClick={handleAudio}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-bold rounded-full text-sm transition-transform active:scale-95"
                >
                  <Volume2 className="w-4 h-4" /> Anhören
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4 animate-pop">
              <div className="text-xs font-bold uppercase tracking-wider text-emerald-600">
                Übersetzung
              </div>
              <div className="text-3xl sm:text-4xl font-black text-emerald-700">
                {direction === 'en-de' ? currentWord.de : currentWord.en}
              </div>
              {currentWord.exampleEn && (
                <div className="mt-4 p-3 bg-slate-50 border border-slate-100 rounded-2xl text-xs sm:text-sm text-slate-600 italic">
                  „{currentWord.exampleEn}“
                </div>
              )}
              {direction === 'de-en' && (
                <button
                  onClick={handleAudio}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-bold rounded-full text-sm"
                >
                  <Volume2 className="w-4 h-4" /> Aussprache
                </button>
              )}
            </div>
          )}
        </div>

        <div className="text-xs text-slate-400">
          {!isFlipped ? 'Klicke auf die Karte, um die Lösung zu sehen' : 'Wie gut wusstest du es?'}
        </div>
      </div>

      {/* Answer Action Buttons (Show when flipped) */}
      {isFlipped ? (
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => handleNext(false)}
            className="py-3.5 px-4 rounded-2xl bg-rose-50 border-2 border-rose-200 text-rose-700 hover:bg-rose-100 font-extrabold flex items-center justify-center gap-2 transition-all active:scale-95"
          >
            <X className="w-5 h-5" /> Noch unsicher (Fach 1)
          </button>
          <button
            onClick={() => handleNext(true)}
            className="py-3.5 px-4 rounded-2xl bg-emerald-600 text-white hover:bg-emerald-700 font-extrabold shadow-lg shadow-emerald-200 flex items-center justify-center gap-2 transition-all active:scale-95"
          >
            <Check className="w-5 h-5" /> Gewusst! (+10 XP)
          </button>
        </div>
      ) : (
        <button
          onClick={() => {
            setIsFlipped(true);
            if (direction === 'en-de') speakEnglish(currentWord.en);
          }}
          className="w-full py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-base shadow-lg shadow-indigo-200 transition-all active:scale-95 flex items-center justify-center gap-2"
        >
          <RotateCcw className="w-5 h-5" /> Karte aufdecken
        </button>
      )}
    </div>
  );
};
