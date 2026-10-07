import React, { useState, useEffect, useMemo } from 'react';
import { VocabWord } from '../../types/vocab';
import { Swords, Heart, ArrowLeft, Volume2, Sparkles } from 'lucide-react';
import { speakEnglish } from '../../services/speech';
import { playSound } from '../../services/audio';
import { triggerMegaConfetti } from '../../services/confetti';

interface MonsterQuestProps {
  words: VocabWord[];
  soundEnabled: boolean;
  onMonsterDefeated: () => void;
  onAddXp: (amount: number) => void;
  onExit: () => void;
}

const MONSTER_ROSTER = [
  { name: 'Schlamm-Kobold Grumpf', maxHp: 8, avatar: '👾', color: 'from-emerald-500 to-teal-700' },
  { name: 'Feuer-Dämon Ignis', maxHp: 10, avatar: '👹', color: 'from-orange-500 to-red-700' },
  { name: 'Schatten-Drache Nox', maxHp: 12, avatar: '🐉', color: 'from-indigo-600 to-purple-900' },
  { name: 'Kosmo-Krake Zorg', maxHp: 14, avatar: '🐙', color: 'from-pink-500 to-fuchsia-800' },
];

export const MonsterQuest: React.FC<MonsterQuestProps> = ({
  words,
  soundEnabled,
  onMonsterDefeated,
  onAddXp,
  onExit,
}) => {
  const [monsterIndex, setMonsterIndex] = useState(0);
  const [monsterHp, setMonsterHp] = useState(8);
  const [playerHp, setPlayerHp] = useState(3);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isMonsterHit, setIsMonsterHit] = useState(false);
  const [isPlayerHit, setIsPlayerHit] = useState(false);
  const [gameState, setGameState] = useState<'playing' | 'victory' | 'defeat'>('playing');

  const monster = MONSTER_ROSTER[monsterIndex % MONSTER_ROSTER.length];
  const shuffledWords = useMemo(() => [...words].sort(() => Math.random() - 0.5), [words]);
  const currentWord = shuffledWords[currentWordIndex % shuffledWords.length];

  useEffect(() => {
    setMonsterHp(monster.maxHp);
    setPlayerHp(3);
    setGameState('playing');
  }, [monsterIndex, monster]);

  const options = useMemo(() => {
    if (!currentWord) return [];
    const correct = currentWord.de;
    const pool = words.filter(w => w.de !== correct).map(w => w.de);
    const distractors = pool.sort(() => Math.random() - 0.5).slice(0, 3);
    return [correct, ...distractors].sort(() => Math.random() - 0.5);
  }, [currentWord, words]);

  const handleAnswer = (option: string) => {
    if (selectedAnswer !== null || gameState !== 'playing') return;
    setSelectedAnswer(option);

    const isCorrect = option === currentWord.de;

    if (isCorrect) {
      // Hit monster!
      setIsMonsterHit(true);
      playSound('hit', soundEnabled);
      const nextHp = Math.max(0, monsterHp - 2);
      setMonsterHp(nextHp);

      if (nextHp === 0) {
        setTimeout(() => {
          setGameState('victory');
          triggerMegaConfetti();
          playSound('victory', soundEnabled);
          onAddXp(60);
          onMonsterDefeated();
        }, 800);
      }
    } else {
      // Player hit!
      setIsPlayerHit(true);
      playSound('wrong', soundEnabled);
      const nextPlayerHp = playerHp - 1;
      setPlayerHp(nextPlayerHp);

      if (nextPlayerHp === 0) {
        setTimeout(() => {
          setGameState('defeat');
        }, 800);
      }
    }

    setTimeout(() => {
      setSelectedAnswer(null);
      setIsMonsterHit(false);
      setIsPlayerHit(false);
      if (gameState === 'playing') {
        setCurrentWordIndex(i => i + 1);
      }
    }, 1100);
  };

  if (gameState === 'victory') {
    return (
      <div className="max-w-md mx-auto py-12 px-4 text-center space-y-6">
        <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-tr from-amber-400 to-amber-200 flex items-center justify-center text-5xl shadow-xl animate-bounce">
          🏆
        </div>
        <div>
          <h2 className="text-3xl font-black text-slate-800">Sieg! Monster besiegt!</h2>
          <p className="text-sm text-slate-500 mt-2">
            Du hast <strong>{monster.name}</strong> bezwungen! Du bist ein wahrer Held.
          </p>
        </div>
        <div className="p-4 bg-amber-50 border border-amber-300 rounded-2xl text-amber-900 font-black text-lg flex items-center justify-center gap-2">
          <Sparkles className="w-6 h-6 text-amber-600" />
          <span>+60 Bonus XP eingesackt!</span>
        </div>
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => setMonsterIndex(m => m + 1)}
            className="px-6 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl shadow-lg flex items-center gap-2"
          >
            <Swords className="w-5 h-5" /> Nächstes Monster
          </button>
          <button
            onClick={onExit}
            className="px-5 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl"
          >
            Zurück
          </button>
        </div>
      </div>
    );
  }

  if (gameState === 'defeat') {
    return (
      <div className="max-w-md mx-auto py-12 px-4 text-center space-y-6">
        <div className="w-20 h-20 mx-auto rounded-full bg-slate-200 flex items-center justify-center text-4xl">
          🩹
        </div>
        <div>
          <h2 className="text-2xl font-black text-slate-800">Knapp daneben!</h2>
          <p className="text-sm text-slate-500 mt-2">
            Das Monster war diesmal zu stark. Erhole dich kurz und probiere es direkt noch einmal!
          </p>
        </div>
        <button
          onClick={() => {
            setPlayerHp(3);
            setMonsterHp(monster.maxHp);
            setGameState('playing');
          }}
          className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl shadow-lg"
        >
          Revanche fordern! ⚔️
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-6 space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={onExit}
          className="text-slate-500 hover:text-slate-800 flex items-center gap-1.5 text-sm font-bold"
        >
          <ArrowLeft className="w-4 h-4" /> Fliehen
        </button>

        {/* Player Hearts */}
        <div className="flex items-center gap-1 bg-rose-50 px-3 py-1 rounded-full border border-rose-200">
          <span className="text-xs font-black text-rose-700 mr-1">Deine Leben:</span>
          {[1, 2, 3].map(heartNum => (
            <Heart
              key={heartNum}
              className={`w-5 h-5 ${
                playerHp >= heartNum
                  ? 'fill-rose-500 text-rose-500 animate-pulse'
                  : 'text-slate-300'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Battle Arena */}
      <div
        className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${monster.color} text-white p-6 shadow-xl transition-transform ${
          isMonsterHit ? 'animate-wiggle scale-95' : isPlayerHit ? 'translate-x-2' : ''
        }`}
      >
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs font-extrabold uppercase tracking-widest text-white/70">
              Boss-Gegner
            </div>
            <h3 className="text-xl font-black">{monster.name}</h3>
          </div>
          <div className="text-5xl">{monster.avatar}</div>
        </div>

        {/* Monster HP Bar */}
        <div className="mt-4 space-y-1">
          <div className="flex justify-between text-xs font-bold text-white/90">
            <span>Monster-KP</span>
            <span>{monsterHp} / {monster.maxHp}</span>
          </div>
          <div className="h-4 bg-black/30 rounded-full overflow-hidden p-0.5 border border-white/20">
            <div
              className="h-full bg-gradient-to-r from-emerald-400 to-green-500 rounded-full transition-all duration-300"
              style={{ width: `${(monsterHp / monster.maxHp) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Prompt Card */}
      <div className="bg-white rounded-3xl border-2 border-indigo-100 p-6 shadow-lg text-center space-y-2">
        <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">
          Zauberspruch: Übersetze richtig für einen Treffer!
        </span>
        <div className="text-3xl font-black text-slate-800 pt-2">
          {currentWord.en}
        </div>
        <button
          onClick={() => speakEnglish(currentWord.en)}
          className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold text-indigo-600 hover:text-indigo-800"
        >
          <Volume2 className="w-4 h-4" /> Anhören
        </button>
      </div>

      {/* 4 Attack Choices */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {options.map((option, idx) => {
          const isSelected = selectedAnswer === option;
          const isCorrect = option === currentWord.de;

          let btnClass = "bg-white border-2 border-slate-200 text-slate-800 hover:border-indigo-400 hover:bg-indigo-50/50";
          if (selectedAnswer !== null) {
            if (isCorrect) {
              btnClass = "bg-emerald-500 border-2 border-emerald-600 text-white font-black scale-102";
            } else if (isSelected && !isCorrect) {
              btnClass = "bg-rose-500 border-2 border-rose-600 text-white font-black";
            }
          }

          return (
            <button
              key={idx}
              disabled={selectedAnswer !== null}
              onClick={() => handleAnswer(option)}
              className={`p-4 rounded-2xl font-extrabold text-base transition-all text-left flex items-center justify-between min-h-[58px] active:scale-95 ${btnClass}`}
            >
              <span>{option}</span>
              <Swords className="w-4 h-4 opacity-40" />
            </button>
          );
        })}
      </div>
    </div>
  );
};
