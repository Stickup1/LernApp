import React, { useState, useEffect, useRef } from 'react';
import { VocabWord } from '../../types/vocab';
import { Volume2, ArrowLeft, Check, Sparkles, HelpCircle, RotateCcw, Eye, Mic, MicOff } from 'lucide-react';
import { isPronunciationCheckSupported, speakEnglish, startPronunciationCheck } from '../../services/speech';
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
  const [inputVal, setInputVal] = useState('');
  const [feedback, setFeedback] = useState<'idle' | 'correct' | 'wrong'>('idle');
  const [showSolution, setShowSolution] = useState(false);
  const [hintLevel, setHintLevel] = useState(0);
  const [direction, setDirection] = useState<'en-de' | 'de-en'>('en-de');
  const [finished, setFinished] = useState(false);
  const [score, setScore] = useState({ correct: 0, wrong: 0 });
  const [pronunciationFeedback, setPronunciationFeedback] = useState('');
  const [isListening, setIsListening] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const stopListeningRef = useRef<(() => void) | null>(null);

  const currentWord = words[currentIndex];

  useEffect(() => {
    resetCard();
  }, [currentIndex]);

  useEffect(() => {
    return () => {
      stopListeningRef.current?.();
      stopListeningRef.current = null;
    };
  }, []);

  const resetCard = () => {
    stopListeningRef.current?.();
    stopListeningRef.current = null;
    setInputVal('');
    setFeedback('idle');
    setShowSolution(false);
    setHintLevel(0);
    setPronunciationFeedback('');
    setIsListening(false);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const normalize = (str: string) =>
    str.trim().toLowerCase()
      .replace(/\s+/g, ' ')
      // strip leading article for German ("der", "die", "das")
      .replace(/^(der|die|das|the)\s+/i, '');

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputVal.trim() || feedback !== 'idle') return;

    const answer = direction === 'en-de' ? currentWord.de : currentWord.en;

    const userClean = normalize(inputVal);
    const targetClean = normalize(answer);

    // Check exact match or match ignoring leading article
    const isCorrect = userClean === targetClean;

    if (isCorrect) {
      setFeedback('correct');
      playSound('correct', soundEnabled);
      if (direction === 'de-en') speakEnglish(currentWord.en);
      const earnedXp = hintLevel > 0 ? 8 : 12;
      onAddXp(earnedXp);
      onUpdateWordBox(currentWord.id, Math.min(5, (currentWord.box || 1) + 1), true);
      setScore(s => ({ ...s, correct: s.correct + 1 }));

      setTimeout(() => advance(), 1000);
    } else {
      setFeedback('wrong');
      playSound('wrong', soundEnabled);
      onUpdateWordBox(currentWord.id, 1, false);
      setScore(s => ({ ...s, wrong: s.wrong + 1 }));
    }
  };

  const advance = () => {
    if (currentIndex + 1 < words.length) {
      setCurrentIndex(i => i + 1);
    } else {
      setFinished(true);
      triggerConfetti();
      playSound('victory', soundEnabled);
    }
  };

  const handlePronunciationPractice = () => {
    if (isListening) {
      stopListeningRef.current?.();
      stopListeningRef.current = null;
      setIsListening(false);
      return;
    }

    speakEnglish(currentWord.en);
    if (!isPronunciationCheckSupported()) {
      setPronunciationFeedback('Die Sprachaufnahme wird in diesem Browser nicht unterstützt.');
      return;
    }

    setPronunciationFeedback('Bitte spreche das Wort laut nach...');
    setIsListening(true);
    stopListeningRef.current?.();
    stopListeningRef.current = startPronunciationCheck(
      currentWord.en,
      ({ transcript, matches }) => {
        setIsListening(false);
        setPronunciationFeedback(
          matches
            ? `Sehr gut! Du hast "${currentWord.en}" richtig gesprochen.`
            : `Fast! Du hast "${transcript || 'das Wort'}" gesagt. Versuch es noch einmal mit "${currentWord.en}".`
        );
      },
      () => {
        setIsListening(false);
        setPronunciationFeedback('Bitte noch einmal deutlich sprechen.');
      },
    );
  };

  if (words.length === 0) {
    return (
      <div className="max-w-md mx-auto text-center py-16 px-4">
        <div className="text-5xl mb-4">📭</div>
        <h2 className="text-xl font-bold text-slate-800">Keine Vokabeln vorhanden</h2>
        <p className="text-sm text-slate-500 mt-2">Bitte wähle eine Unit mit Vokabeln.</p>
        <button onClick={onExit} className="mt-6 px-6 py-2.5 bg-indigo-600 text-white font-bold rounded-2xl shadow-md hover:bg-indigo-700">
          Zurück
        </button>
      </div>
    );
  }

  if (finished) {
    const total = score.correct + score.wrong;
    const percent = Math.round((score.correct / total) * 100);
    return (
      <div className="max-w-md mx-auto py-12 px-4 text-center space-y-6">
        <div className="w-20 h-20 mx-auto rounded-3xl bg-amber-100 flex items-center justify-center text-4xl shadow-inner">
          🏆
        </div>
        <div>
          <h2 className="text-2xl font-black text-slate-800">Runde beendet!</h2>
          <p className="text-sm text-slate-500 mt-1">Du hast alle {words.length} Vokabeln eingetippt.</p>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3 text-center">
            <div className="text-2xl font-black text-emerald-700">{score.correct}</div>
            <div className="text-xs font-bold text-emerald-600">Richtig</div>
          </div>
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-3 text-center">
            <div className="text-2xl font-black text-rose-700">{score.wrong}</div>
            <div className="text-xs font-bold text-rose-600">Falsch</div>
          </div>
          <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-3 text-center">
            <div className="text-2xl font-black text-indigo-700">{percent}%</div>
            <div className="text-xs font-bold text-indigo-600">Quote</div>
          </div>
        </div>
        <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-2xl text-indigo-800 font-bold flex items-center justify-center gap-2">
          <Sparkles className="w-5 h-5 text-indigo-600" />
          <span>+{score.correct * 12} XP gesammelt!</span>
        </div>
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => { setCurrentIndex(0); setScore({ correct: 0, wrong: 0 }); setFinished(false); }}
            className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl flex items-center gap-2"
          >
            <RotateCcw className="w-4 h-4" /> Nochmal
          </button>
          <button onClick={onExit} className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl shadow-md">
            Zurück
          </button>
        </div>
      </div>
    );
  }

  const questionText = direction === 'en-de' ? currentWord.en : currentWord.de;
  const answerLang = direction === 'en-de' ? 'Deutsch' : 'Englisch';

  return (
    <div className="max-w-xl mx-auto px-4 py-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button onClick={onExit} className="text-slate-500 hover:text-slate-800 flex items-center gap-1.5 text-sm font-bold">
          <ArrowLeft className="w-4 h-4" /> Beenden
        </button>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setDirection(d => d === 'en-de' ? 'de-en' : 'en-de')}
            className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full hover:bg-indigo-100"
          >
            {direction === 'en-de' ? 'EN → DE' : 'DE → EN'}
          </button>
          <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
            {currentIndex + 1} / {words.length}
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
        <div
          className="bg-indigo-500 h-full transition-all duration-300"
          style={{ width: `${((currentIndex + 1) / words.length) * 100}%` }}
        />
      </div>

      {/* Question Card */}
      <div className={`rounded-3xl p-7 border-2 shadow-xl text-center space-y-3 transition-all ${
        feedback === 'correct' ? 'bg-emerald-50 border-emerald-400' :
        feedback === 'wrong' ? 'bg-rose-50 border-rose-300' :
        'bg-white border-indigo-100'
      }`}>
        <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">
          Wie lautet die {answerLang}-Übersetzung?
        </span>

        <div className="text-3xl sm:text-4xl font-black text-slate-900 pt-1">
          {questionText}
        </div>

        {/* Audio button – always shown for English words */}
        {(direction === 'en-de') && (
          <div className="flex items-center justify-center gap-2 flex-wrap">
            <button
              onClick={() => speakEnglish(currentWord.en)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-full transition-colors"
            >
              <Volume2 className="w-4 h-4" /> Anhören
            </button>

            {isPronunciationCheckSupported() && (
              <button
                type="button"
                onClick={handlePronunciationPractice}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-violet-700 bg-violet-50 hover:bg-violet-100 rounded-full transition-colors"
              >
                {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                {isListening ? 'Stoppen' : 'Aussprache üben'}
              </button>
            )}
          </div>
        )}

        {/* Hint */}
        {hintLevel > 0 && (
          <div className="text-sm font-bold text-amber-700 bg-amber-50 border border-amber-200 px-4 py-2 rounded-xl">
            Tipp: Beginnt mit „{(direction === 'en-de' ? currentWord.de : currentWord.en).substring(0, hintLevel)}…"
          </div>
        )}

        {/* Correct answer reveal */}
        {showSolution && feedback === 'wrong' && (
          <div className="text-sm font-bold text-indigo-800 bg-indigo-50 border border-indigo-200 px-4 py-2 rounded-xl flex items-center justify-center gap-2">
            <Eye className="w-4 h-4" />
            Richtig: <strong>{direction === 'en-de' ? currentWord.de : currentWord.en}</strong>
            {direction === 'de-en' && (
              <button onClick={() => speakEnglish(currentWord.en)} className="ml-1">
                <Volume2 className="w-4 h-4 text-indigo-500" />
              </button>
            )}
          </div>
        )}

        {/* Leitner box badge */}
        <div className="text-xs text-slate-400">Kasten-Fach {currentWord.box || 1} / 5</div>
      </div>

      {pronunciationFeedback && (
        <div className="rounded-2xl border border-violet-200 bg-violet-50 px-4 py-3 text-sm font-bold text-violet-800">
          {pronunciationFeedback}
        </div>
      )}

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          ref={inputRef}
          type="text"
          value={inputVal}
          onChange={e => {
            setInputVal(e.target.value);
            if (feedback === 'wrong') {
              setFeedback('idle');
              setShowSolution(false);
            }
          }}
          placeholder={`${answerLang}e Übersetzung eintippen…`}
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          disabled={feedback === 'correct'}
          className={`w-full py-4 px-5 text-xl font-bold rounded-2xl border-2 outline-none transition-all ${
            feedback === 'correct'
              ? 'bg-emerald-50 border-emerald-500 text-emerald-800'
              : feedback === 'wrong'
              ? 'bg-rose-50 border-rose-400 text-rose-800 animate-shake'
              : 'bg-white border-slate-300 focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100 text-slate-800'
          }`}
        />

        <button
          type="submit"
          disabled={feedback === 'correct' || !inputVal.trim()}
          className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-black text-base rounded-2xl shadow-lg shadow-indigo-200 transition-all active:scale-95 flex items-center justify-center gap-2"
        >
          <Check className="w-5 h-5" /> Überprüfen (+12 XP)
        </button>
      </form>

      {/* Helper actions */}
      {feedback !== 'correct' && (
        <div className="flex items-center justify-between text-xs font-bold text-slate-500">
          <button
            type="button"
            onClick={() => setHintLevel(h => Math.min(h + 1, (direction === 'en-de' ? currentWord.de : currentWord.en).length))}
            className="flex items-center gap-1.5 hover:text-amber-600 transition-colors"
          >
            <HelpCircle className="w-4 h-4" /> Tipp anfordern
          </button>

          {feedback === 'wrong' && !showSolution && (
            <button
              type="button"
              onClick={() => { setShowSolution(true); if (direction === 'de-en') speakEnglish(currentWord.en); }}
              className="flex items-center gap-1.5 hover:text-indigo-600 transition-colors"
            >
              <Eye className="w-4 h-4" /> Lösung zeigen
            </button>
          )}

          {feedback === 'wrong' && (
            <button
              type="button"
              onClick={advance}
              className="flex items-center gap-1.5 hover:text-slate-700 transition-colors"
            >
              Weiter → <span className="text-slate-400">(kein XP)</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};
