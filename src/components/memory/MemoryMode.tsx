import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, RotateCcw, Sparkles } from 'lucide-react';
import { EnglishAccent, VocabWord } from '../../types/vocab';
import { playSound } from '../../services/audio';
import { triggerConfetti } from '../../services/confetti';
import { speakEnglish } from '../../services/speech';
import { shuffleItems } from '../../services/random';

const PAIRS_PER_ROUND = 6;

interface MemoryCard {
  id: string;
  pairId: string;
  side: 'en' | 'de';
  text: string;
  word: VocabWord;
}

interface MemoryModeProps {
  words: VocabWord[];
  soundEnabled: boolean;
  voiceAccent: EnglishAccent;
  onUpdateWordBox: (wordId: string, newBox: number, isCorrect: boolean) => void;
  onAddXp: (amount: number) => void;
  onExit: () => void;
}

const createCards = (words: VocabWord[]): MemoryCard[] => shuffleItems(words.flatMap(word => ([
  { id: `${word.id}:en`, pairId: word.id, side: 'en' as const, text: word.en, word },
  { id: `${word.id}:de`, pairId: word.id, side: 'de' as const, text: word.de, word },
])));

export const MemoryMode: React.FC<MemoryModeProps> = ({
  words,
  soundEnabled,
  voiceAccent,
  onUpdateWordBox,
  onAddXp,
  onExit,
}) => {
  const [sessionWords, setSessionWords] = useState(() => shuffleItems(words));
  const [roundIndex, setRoundIndex] = useState(0);
  const roundWords = sessionWords.slice(roundIndex * PAIRS_PER_ROUND, (roundIndex + 1) * PAIRS_PER_ROUND);
  const [cards, setCards] = useState(() => createCards(sessionWords.slice(0, PAIRS_PER_ROUND)));
  const [selectedCards, setSelectedCards] = useState<MemoryCard[]>([]);
  const [matchedPairIds, setMatchedPairIds] = useState<string[]>([]);
  const [attempts, setAttempts] = useState(0);
  const [isResolving, setIsResolving] = useState(false);
  const mismatchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (mismatchTimeoutRef.current) clearTimeout(mismatchTimeoutRef.current);
  }, []);

  const handleCardClick = (card: MemoryCard) => {
    if (
      isResolving ||
      matchedPairIds.includes(card.pairId) ||
      selectedCards.some(selected => selected.id === card.id)
    ) return;

    if (card.side === 'en') speakEnglish(card.word.en, 0.9, voiceAccent);

    const nextSelectedCards = [...selectedCards, card];
    setSelectedCards(nextSelectedCards);

    if (nextSelectedCards.length < 2) return;

    setAttempts(count => count + 1);
    setIsResolving(true);

    const [firstCard, secondCard] = nextSelectedCards;
    if (firstCard.pairId === secondCard.pairId) {
      const nextMatchedPairIds = [...matchedPairIds, firstCard.pairId];
      setMatchedPairIds(nextMatchedPairIds);
      setSelectedCards([]);
      setIsResolving(false);
      onAddXp(10);
      onUpdateWordBox(
        firstCard.word.id,
        Math.min(5, (firstCard.word.box || 1) + 1),
        true,
      );

      if (nextMatchedPairIds.length === roundWords.length) {
        playSound('victory', soundEnabled);
        triggerConfetti();
      } else {
        playSound('correct', soundEnabled);
      }
      return;
    }

    mismatchTimeoutRef.current = setTimeout(() => {
      setSelectedCards([]);
      setIsResolving(false);
      mismatchTimeoutRef.current = null;
    }, 900);
  };

  const handleNextRound = () => {
    const nextRoundIndex = roundIndex + 1;
    const nextRoundStart = nextRoundIndex * PAIRS_PER_ROUND;

    if (nextRoundStart >= sessionWords.length) {
      const nextSessionWords = shuffleItems(words);
      setSessionWords(nextSessionWords);
      setRoundIndex(0);
      setCards(createCards(nextSessionWords.slice(0, PAIRS_PER_ROUND)));
    } else {
      setRoundIndex(nextRoundIndex);
      setCards(createCards(sessionWords.slice(nextRoundStart, nextRoundStart + PAIRS_PER_ROUND)));
    }

    setMatchedPairIds([]);
    setSelectedCards([]);
    setAttempts(0);
    setIsResolving(false);
  };

  if (cards.length === 0) {
    return (
      <div className="max-w-md mx-auto py-16 px-4 text-center">
        <div className="text-5xl mb-4">📭</div>
        <h2 className="text-xl font-bold text-slate-800">Keine Vokabeln vorhanden</h2>
        <p className="text-sm text-slate-500 mt-2">Bitte wähle eine Unit mit freigeschalteten Wörtern.</p>
        <button onClick={onExit} className="mt-6 px-6 py-2.5 bg-indigo-600 text-white font-bold rounded-2xl shadow-md hover:bg-indigo-700">
          Zurück
        </button>
      </div>
    );
  }

  const isComplete = matchedPairIds.length === roundWords.length;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
      <div className="flex items-center justify-between gap-3">
        <button
          onClick={onExit}
          className="text-slate-500 hover:text-slate-800 flex items-center gap-1.5 text-sm font-bold"
        >
          <ArrowLeft className="w-4 h-4" /> Beenden
        </button>
        <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
          <span className="rounded-full bg-indigo-50 px-3 py-1 text-indigo-700">Runde {roundIndex + 1}</span>
          <span className="rounded-full bg-slate-100 px-3 py-1">{matchedPairIds.length}/{roundWords.length} Paare</span>
        </div>
      </div>

      <div className="flex items-center justify-between text-xs font-bold text-slate-500">
        <span>Versuche: {attempts}</span>
        <span>Jedes Paar bringt 10 XP</span>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
        {cards.map(card => {
          const isMatched = matchedPairIds.includes(card.pairId);
          const isRevealed = isMatched || selectedCards.some(selected => selected.id === card.id);

          return (
            <button
              key={card.id}
              type="button"
              onClick={() => handleCardClick(card)}
              disabled={isMatched || isResolving}
              aria-label={isRevealed ? `${card.side === 'en' ? 'Englisch' : 'Deutsch'}: ${card.text}` : 'Verdeckte Karte aufdecken'}
              className={`aspect-square min-w-0 rounded-2xl border-2 p-2 sm:p-3 flex flex-col items-center justify-center gap-2 text-center transition-all duration-200 active:scale-95 disabled:cursor-default ${
                isMatched
                  ? 'border-emerald-300 bg-emerald-50 text-emerald-900'
                  : isRevealed
                    ? card.side === 'en'
                      ? 'border-sky-300 bg-sky-50 text-sky-950 shadow-sm'
                      : 'border-amber-300 bg-amber-50 text-amber-950 shadow-sm'
                    : 'border-slate-200 bg-white text-indigo-700 shadow-sm hover:border-indigo-300 hover:bg-indigo-50'
              }`}
            >
              {isRevealed ? (
                <>
                  <span className="text-[9px] font-black uppercase tracking-widest opacity-60">
                    {card.side === 'en' ? 'English' : 'Deutsch'}
                  </span>
                  <span className="w-full break-words text-sm sm:text-base font-extrabold leading-tight">{card.text}</span>
                  {isMatched && <Check className="h-4 w-4" aria-hidden="true" />}
                </>
              ) : (
                <span className="text-3xl font-black" aria-hidden="true">?</span>
              )}
            </button>
          );
        })}
      </div>

      {isComplete && (
        <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-center space-y-3" aria-live="polite">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-emerald-700 shadow-sm">
            <Sparkles className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-emerald-900">Alle Paare gefunden!</h2>
            <p className="mt-1 text-sm font-semibold text-emerald-800">
              {attempts} Versuche · +{matchedPairIds.length * 10} XP
            </p>
          </div>
          <button
            type="button"
            onClick={handleNextRound}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-black text-white hover:bg-emerald-800"
          >
            {roundIndex * PAIRS_PER_ROUND + roundWords.length < sessionWords.length
              ? <><ArrowRight className="h-4 w-4" /> Nächste Wörter</>
              : <><RotateCcw className="h-4 w-4" /> Neue Runde</>}
          </button>
        </section>
      )}
    </div>
  );
};