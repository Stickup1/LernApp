import React, { useState, useEffect } from 'react';
import { EnglishAccent, VocabWord } from '../../types/vocab';
import { ArrowLeft, RotateCcw, Volume2, Sparkles } from 'lucide-react';
import { speakEnglish } from '../../services/speech';
import { playSound } from '../../services/audio';
import { triggerConfetti } from '../../services/confetti';

interface ScrambleModeProps {
  words: VocabWord[];
  soundEnabled: boolean;
  voiceAccent: EnglishAccent;
  onUpdateWordBox: (wordId: string, newBox: number, isCorrect: boolean) => void;
  onAddXp: (amount: number) => void;
  onExit: () => void;
}

interface LetterTile {
  id: string;
  char: string;
  isUsed: boolean;
}

export const ScrambleMode: React.FC<ScrambleModeProps> = ({
  words,
  soundEnabled,
  voiceAccent,
  onUpdateWordBox,
  onAddXp,
  onExit,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [availableTiles, setAvailableTiles] = useState<LetterTile[]>([]);
  const [selectedTiles, setSelectedTiles] = useState<LetterTile[]>([]);
  const [isSuccess, setIsSuccess] = useState(false);
  const [finished, setFinished] = useState(false);

  const currentWord = words[currentIndex];

  useEffect(() => {
    if (!currentWord) return;
    // Prepare letters from the english word (ignoring spaces or punctuation in tile creation, or keeping spaces as spacers)
    // Let's break down into characters
    const cleanWord = currentWord.en.toLowerCase();
    const tiles: LetterTile[] = cleanWord.split('').map((char, idx) => ({
      id: `${char}_${idx}_${Math.random()}`,
      char,
      isUsed: false,
    }));

    // Shuffle tiles
    setAvailableTiles([...tiles].sort(() => Math.random() - 0.5));
    setSelectedTiles([]);
    setIsSuccess(false);
  }, [currentIndex, currentWord]);

  if (!currentWord) return null;

  const currentConstructedWord = selectedTiles.map(t => t.char).join('');
  const targetWord = currentWord.en.toLowerCase();

  const handleTileClick = (tile: LetterTile) => {
    if (tile.isUsed || isSuccess) return;

    const newSelected = [...selectedTiles, tile];
    setSelectedTiles(newSelected);
    setAvailableTiles(prev =>
      prev.map(t => (t.id === tile.id ? { ...t, isUsed: true } : t))
    );

    // Check if word is complete
    const constructed = newSelected.map(t => t.char).join('');
    if (constructed === targetWord) {
      setIsSuccess(true);
      playSound('correct', soundEnabled);
      speakEnglish(currentWord.en, 0.9, voiceAccent);
      onAddXp(15);
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
    } else if (constructed.length === targetWord.length) {
      playSound('wrong', soundEnabled);
    }
  };

  const handleRemoveTile = (tile: LetterTile) => {
    if (isSuccess) return;
    setSelectedTiles(prev => prev.filter(t => t.id !== tile.id));
    setAvailableTiles(prev =>
      prev.map(t => (t.id === tile.id ? { ...t, isUsed: false } : t))
    );
  };

  const handleReset = () => {
    setSelectedTiles([]);
    setAvailableTiles(prev => prev.map(t => ({ ...t, isUsed: false })));
  };

  if (finished) {
    return (
      <div className="max-w-md mx-auto py-12 px-4 text-center space-y-6">
        <div className="w-20 h-20 mx-auto rounded-3xl bg-emerald-100 flex items-center justify-center text-4xl shadow-inner">
          🧩
        </div>
        <div>
          <h2 className="text-2xl font-black text-slate-800">Puzzle gemeistert!</h2>
          <p className="text-sm text-slate-500 mt-1">
            Alle Wörter erfolgreich zusammengesetzt!
          </p>
        </div>
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-900 font-bold flex items-center justify-center gap-2">
          <Sparkles className="w-5 h-5 text-emerald-600" />
          <span>+{words.length * 15} XP erhalten!</span>
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
      <div className="bg-white rounded-3xl border-2 border-emerald-100 p-6 shadow-xl text-center space-y-2">
        <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">
          Gesuchtes deutsches Wort
        </span>
        <div className="text-3xl font-black text-slate-900 pt-2">
          {currentWord.de}
        </div>
        <p className="text-xs text-slate-400">
          Tippe die Buchstaben in der richtigen Reihenfolge an:
        </p>
      </div>

      {/* Target Word Input Area (Slots) */}
      <div
        className={`min-h-[70px] p-3 rounded-2xl border-2 flex flex-wrap items-center justify-center gap-1.5 transition-all ${
          isSuccess
            ? 'bg-emerald-50 border-emerald-400'
            : currentConstructedWord.length === targetWord.length
            ? 'bg-rose-50 border-rose-300'
            : 'bg-white border-dashed border-slate-300'
        }`}
      >
        {selectedTiles.length === 0 ? (
          <span className="text-sm font-medium text-slate-400 italic">
            Hier erscheinen deine ausgewählten Buchstaben
          </span>
        ) : (
          selectedTiles.map(tile => (
            <button
              key={tile.id}
              onClick={() => handleRemoveTile(tile)}
              className={`min-w-10 h-11 px-2.5 rounded-xl font-black text-lg shadow-sm transition-transform active:scale-95 flex items-center justify-center ${
                isSuccess
                  ? 'bg-emerald-500 text-white'
                  : 'bg-indigo-600 text-white hover:bg-rose-500'
              }`}
            >
              {tile.char === ' ' ? '␣' : tile.char}
            </button>
          ))
        )}
      </div>

      {/* Available Letter Tiles */}
      <div className="bg-slate-100/70 p-4 rounded-3xl">
        <div className="flex flex-wrap items-center justify-center gap-2">
          {availableTiles.map(tile => (
            <button
              key={tile.id}
              disabled={tile.isUsed || isSuccess}
              onClick={() => handleTileClick(tile)}
              className={`min-w-11 h-12 px-3 rounded-2xl font-black text-lg transition-all shadow-sm flex items-center justify-center ${
                tile.isUsed
                  ? 'bg-slate-200 text-transparent opacity-30 cursor-not-allowed scale-90'
                  : 'bg-white border-2 border-slate-200 text-slate-800 hover:border-indigo-400 hover:scale-105 active:scale-95'
              }`}
            >
              {tile.char === ' ' ? 'LEER' : tile.char}
            </button>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between gap-3">
        <button
          onClick={handleReset}
          disabled={selectedTiles.length === 0 || isSuccess}
          className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 font-bold text-xs flex items-center gap-1.5 transition-colors disabled:opacity-50"
        >
          <RotateCcw className="w-3.5 h-3.5" /> Zurücksetzen
        </button>

        <button
          onClick={() => speakEnglish(currentWord.en, 0.9, voiceAccent)}
          className="px-4 py-2.5 rounded-xl bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-bold text-xs flex items-center gap-1.5 transition-colors"
        >
          <Volume2 className="w-3.5 h-3.5" /> Aussprache anhören
        </button>
      </div>
    </div>
  );
};
