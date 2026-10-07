import React from 'react';
import { UserProgress, LearningMode, EnglishAccent } from '../types/vocab';
import { getXpForNextLevel } from '../services/storage';
import { Flame, Volume2, VolumeX, Sparkles, Home, Settings } from 'lucide-react';

interface NavbarProps {
  progress: UserProgress;
  currentMode: LearningMode;
  onSelectMode: (mode: LearningMode) => void;
  onToggleSound: () => void;
  onChangeVoiceAccent: (accent: EnglishAccent) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  progress,
  currentMode,
  onSelectMode,
  onToggleSound,
  onChangeVoiceAccent,
}) => {
  const xpNeeded = getXpForNextLevel(progress.level);
  const xpCurrentLevel = progress.xp % xpNeeded;
  const progressPercent = Math.min(100, Math.round((xpCurrentLevel / xpNeeded) * 100));

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-indigo-100 shadow-sm">
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
        {/* Brand / Logo */}
        <button
          onClick={() => onSelectMode('dashboard')}
          className="flex items-center gap-2 group text-left focus:outline-none"
        >
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white flex items-center justify-center font-bold text-xl shadow-md shadow-indigo-200 group-hover:scale-105 transition-transform">
            ⚡
          </div>
          <div>
            <div className="font-extrabold text-lg text-slate-800 leading-tight flex items-center gap-1.5">
              <span>LernHeld</span>
            </div>
            <div className="text-xs font-medium text-slate-500">Englisch · Einstieg</div>
          </div>
        </button>

        {/* Player Stats: Streak, Level, XP */}
        <div className="flex items-center gap-3">
          {/* Streak Flame */}
          <div
            title={`Tages-Serie: ${progress.streakDays} Tage in Folge aktiv!`}
            className="flex items-center gap-1 bg-amber-50 border border-amber-200 text-amber-700 px-2.5 py-1 rounded-xl text-sm font-black shadow-xs"
          >
            <Flame className="w-4 h-4 fill-amber-500 text-amber-500 animate-pulse" />
            <span>{progress.streakDays}</span>
          </div>

          {/* Level & XP Bar */}
          <div className="hidden sm:flex flex-col items-end gap-0.5">
            <div className="flex items-center gap-1 text-xs font-bold text-indigo-900">
              <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
              <span>Level {progress.level}</span>
              <span className="text-slate-400 font-normal">({progress.xp} XP)</span>
            </div>
            <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-emerald-400 transition-all duration-500 rounded-full"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Nav Actions */}
          <div className="flex items-center gap-2">
            <label className="hidden sm:flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-2 py-1.5 text-[11px] font-bold text-slate-600">
              <span>Voice</span>
              <select
                value={progress.voiceAccent}
                onChange={e => onChangeVoiceAccent(e.target.value as EnglishAccent)}
                className="bg-transparent font-bold text-slate-700 outline-none"
                aria-label="Aussprache-Auswahl"
              >
                <option value="en-GB">UK</option>
                <option value="en-US">US</option>
              </select>
            </label>

            <button
              onClick={() => onSelectMode('dashboard')}
              title="Zurück zur Übersicht"
              className={`p-2 rounded-xl transition-colors ${
                currentMode === 'dashboard'
                  ? 'bg-indigo-100 text-indigo-700 font-bold'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Home className="w-5 h-5" />
            </button>

            <button
              onClick={() => onSelectMode('manager')}
              title="Vokabeln verwalten & neue hinzufügen"
              className={`p-2 rounded-xl transition-colors ${
                currentMode === 'manager'
                  ? 'bg-indigo-100 text-indigo-700 font-bold'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Settings className="w-5 h-5" />
            </button>

            <button
              onClick={onToggleSound}
              title={progress.soundEnabled ? 'Ton an' : 'Ton aus'}
              className="p-2 text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              {progress.soundEnabled ? (
                <Volume2 className="w-5 h-5 text-indigo-600" />
              ) : (
                <VolumeX className="w-5 h-5 text-slate-400" />
              )}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
