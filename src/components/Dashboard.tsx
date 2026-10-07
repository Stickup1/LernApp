import React from 'react';
import { VocabUnit, UserProgress, LearningMode } from '../types/vocab';
import { Sparkles, Swords, PlusCircle } from 'lucide-react';

interface DashboardProps {
  units: VocabUnit[];
  selectedUnitId: string;
  onSelectUnit: (unitId: string) => void;
  progress: UserProgress;
  onStartMode: (mode: LearningMode) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  units,
  selectedUnitId,
  onSelectUnit,
  progress,
  onStartMode,
}) => {
  const currentUnit = units.find(u => u.id === selectedUnitId) || units[0];
  const allWords = selectedUnitId === 'all' 
    ? units.flatMap(u => u.words) 
    : currentUnit?.words || [];

  // Calculate Leitner Box stats
  const boxCounts = [0, 0, 0, 0, 0];
  allWords.forEach(w => {
    const boxIdx = Math.max(0, Math.min(4, (w.box || 1) - 1));
    boxCounts[boxIdx]++;
  });

  const masteredCount = boxCounts[4]; // Box 5
  const masteryPercent = allWords.length > 0 
    ? Math.round((masteredCount / allWords.length) * 100) 
    : 0;

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-8">
      {/* Hero Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-800 text-white p-6 sm:p-8 shadow-xl shadow-indigo-200">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-sm text-xs font-bold text-indigo-100">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Englisch-Training</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Hallo Lernheld! Ready für die nächste Mission? 🚀
            </h1>
            <p className="text-indigo-100 text-sm max-w-md">
              Übe Vokabeln, hör dir die Aussprache an und besiege das Vokabel-Monster im Bosskampf!
            </p>
          </div>

          <div className="bg-white/15 backdrop-blur-md rounded-2xl p-4 border border-white/20 flex items-center gap-4 self-stretch sm:self-auto justify-around">
            <div className="text-center">
              <div className="text-2xl sm:text-3xl font-black text-amber-300">{progress.xp}</div>
              <div className="text-xs text-indigo-100 font-semibold">Gesamt XP</div>
            </div>
            <div className="w-px h-10 bg-white/20" />
            <div className="text-center">
              <div className="text-2xl sm:text-3xl font-black text-emerald-300">{masteryPercent}%</div>
              <div className="text-xs text-indigo-100 font-semibold">Gemeistert</div>
            </div>
            <div className="w-px h-10 bg-white/20" />
            <div className="text-center">
              <div className="text-2xl sm:text-3xl font-black text-pink-300">{progress.monsterDefeatedCount}</div>
              <div className="text-xs text-indigo-100 font-semibold">Monster besiegt</div>
            </div>
          </div>
        </div>

        {/* Leitner Box Progress Mini-Bar */}
        <div className="mt-6 pt-5 border-t border-white/15">
          <div className="flex items-center justify-between text-xs font-semibold mb-2">
            <span className="text-indigo-100">5-Fächer-Kasten Fortschritt ({allWords.length} Vokabeln):</span>
            <span className="text-amber-200">Fach 5 (Gekonnt): {masteredCount} Wörter</span>
          </div>
          <div className="grid grid-cols-5 gap-2">
            {boxCounts.map((count, idx) => (
              <div key={idx} className="bg-black/20 rounded-xl p-2 text-center border border-white/10">
                <div className="text-xs font-medium text-indigo-200">Fach {idx + 1}</div>
                <div className="text-lg font-black text-white">{count}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Unit Selector & Modes or Empty State */}
      {units.length === 0 ? (
        <div className="bg-white rounded-3xl p-8 sm:p-12 border-2 border-dashed border-indigo-200 text-center space-y-5 shadow-xs">
          <div className="w-20 h-20 mx-auto rounded-3xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-4xl shadow-inner">
            📚
          </div>
          <div className="max-w-md mx-auto space-y-2">
            <h3 className="text-2xl font-black text-slate-800">
              Noch keine Lerneinheiten vorhanden
            </h3>
            <p className="text-sm text-slate-500 leading-relaxed">
              Lege jetzt deine erste Unit an (z. B. <em>Unit 1: My School</em>) und trage deine Vokabeln oder Schulbuch-Listen ein, um mit dem Lernen und den Spielen zu beginnen!
            </p>
          </div>
          <div className="pt-2">
            <button
              onClick={() => onStartMode('manager')}
              className="px-6 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-base rounded-2xl shadow-lg shadow-indigo-200 inline-flex items-center gap-2.5 transition-all hover:scale-105 active:scale-95"
            >
              <PlusCircle className="w-5 h-5" /> Erste Unit anlegen & Vokabeln eintragen
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Unit Selector */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
                <span>📚</span>
                <span>Wähle deine Lerneinheit (Unit)</span>
              </h2>
              <button
                onClick={() => onStartMode('manager')}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-xl transition-colors"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Unit anlegen / Vokabeln verwalten</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {/* Option: All Units */}
              <button
                onClick={() => onSelectUnit('all')}
                className={`p-4 rounded-2xl border text-left transition-all ${
                  selectedUnitId === 'all'
                    ? 'bg-indigo-50 border-indigo-500 shadow-md ring-2 ring-indigo-400/20'
                    : 'bg-white border-slate-200 hover:border-indigo-300 hover:shadow-xs'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-2xl">🌟</span>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
                    {units.flatMap(u => u.words).length} Wörter
                  </span>
                </div>
                <div className="font-extrabold text-slate-800 mt-2">Alle Units zusammen</div>
                <div className="text-xs text-slate-500 mt-0.5">Große Gesamtwiederholung</div>
              </button>

              {/* Individual Units */}
              {units.map((unit) => {
                const isSelected = selectedUnitId === unit.id;
                return (
                  <button
                    key={unit.id}
                    onClick={() => onSelectUnit(unit.id)}
                    className={`p-4 rounded-2xl border text-left transition-all ${
                      isSelected
                        ? 'bg-indigo-50 border-indigo-500 shadow-md ring-2 ring-indigo-400/20'
                        : 'bg-white border-slate-200 hover:border-indigo-300 hover:shadow-xs'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-2xl">{unit.icon}</span>
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                        {unit.words.length} Wörter
                      </span>
                    </div>
                    <div className="font-extrabold text-slate-800 mt-2 truncate">{unit.title}</div>
                    <div className="text-xs text-slate-500 mt-0.5 truncate">{unit.description}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Warning if selected unit has no words */}
          {allWords.length === 0 && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-amber-800 text-sm font-semibold flex items-center justify-between">
              <span>Diese Unit hat noch keine Vokabeln eingetragen.</span>
              <button
                onClick={() => onStartMode('manager')}
                className="px-3 py-1 bg-amber-600 text-white rounded-xl text-xs font-bold hover:bg-amber-700"
              >
                Vokabeln hinzufügen
              </button>
            </div>
          )}

          {/* Learning Modes / Game Modes */}
          <div className="space-y-4">
            <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
              <span>🎮</span>
              <span>Wähle deinen Trainings-Modus</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* 1. Flashcards */}
          <div
            onClick={() => onStartMode('flashcards')}
            className="group cursor-pointer bg-white rounded-3xl p-5 border border-slate-200 hover:border-indigo-400 hover:shadow-lg transition-all flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-2xl mb-4 group-hover:scale-110 transition-transform">
                🗂️
              </div>
              <h3 className="font-black text-lg text-slate-800 group-hover:text-indigo-600 transition-colors">
                Karteikarten
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Klassisches 5-Fächer-Lernen. Höre die Aussprache an und schätze dich selbst ein.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-amber-700">
              <span>+10 XP pro Karte</span>
              <span className="group-hover:translate-x-1 transition-transform">Starten →</span>
            </div>
          </div>

          {/* 2. Speed Quiz */}
          <div
            onClick={() => onStartMode('quiz')}
            className="group cursor-pointer bg-white rounded-3xl p-5 border border-slate-200 hover:border-indigo-400 hover:shadow-lg transition-all flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-2xl mb-4 group-hover:scale-110 transition-transform">
                ⚡
              </div>
              <h3 className="font-black text-lg text-slate-800 group-hover:text-indigo-600 transition-colors">
                Speed Quiz
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Wähle blitzschnell die richtige von 4 Bedeutungen aus. Baue deine Serie auf!
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-indigo-700">
              <span>+15 XP + Streak Bonus</span>
              <span className="group-hover:translate-x-1 transition-transform">Starten →</span>
            </div>
          </div>

          {/* 3. Scramble Mode */}
          <div
            onClick={() => onStartMode('scramble')}
            className="group cursor-pointer bg-white rounded-3xl p-5 border border-slate-200 hover:border-indigo-400 hover:shadow-lg transition-all flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-2xl mb-4 group-hover:scale-110 transition-transform">
                🧩
              </div>
              <h3 className="font-black text-lg text-slate-800 group-hover:text-indigo-600 transition-colors">
                Buchstabensalat
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Setze das englische Wort Buchstabe für Buchstabe zusammen. Perfekt für Touch & iPad!
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-emerald-700">
              <span>+15 XP pro Wort</span>
              <span className="group-hover:translate-x-1 transition-transform">Starten →</span>
            </div>
          </div>

          {/* 4. Writing Mode */}
          <div
            onClick={() => onStartMode('writing')}
            className="group cursor-pointer bg-white rounded-3xl p-5 border border-slate-200 hover:border-indigo-400 hover:shadow-lg transition-all flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-2xl bg-cyan-100 text-cyan-700 flex items-center justify-center font-bold text-2xl mb-4 group-hover:scale-110 transition-transform">
                ✍️
              </div>
              <h3 className="font-black text-lg text-slate-800 group-hover:text-indigo-600 transition-colors">
                Schreib-Trainer
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Tippe das Wort selbst ein. Ideal als Vorbereitung für Schulaufgaben und Tests.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-cyan-700">
              <span>+20 XP pro Wort</span>
              <span className="group-hover:translate-x-1 transition-transform">Starten →</span>
            </div>
          </div>

          {/* 5. Boss Fight: Monster Quest */}
          <div
            onClick={() => onStartMode('monster')}
            className="group cursor-pointer bg-gradient-to-br from-pink-500 via-rose-500 to-purple-600 text-white rounded-3xl p-5 shadow-lg shadow-pink-200 hover:scale-[1.02] transition-all flex flex-col justify-between md:col-span-2 lg:col-span-2"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-3xl">👾</span>
                <span className="text-xs font-extrabold px-3 py-1 bg-white/20 backdrop-blur-md rounded-full">
                  Bosskampf-Modus 🔥
                </span>
              </div>
              <h3 className="font-black text-xl mt-3">
                Monster-Quest: Besiege den Vokabel-Dämon!
              </h3>
              <p className="text-pink-100 text-xs mt-1 max-w-lg">
                Jede richtige Vokabel landet einen mächtigen Treffer beim Monster! Besiege es, bevor deine eigenen Herzen aufgebraucht sind.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-white/20 flex items-center justify-between text-xs font-bold text-white">
              <span>+50 XP & Helden-Abzeichen</span>
              <span className="group-hover:translate-x-1 transition-transform flex items-center gap-1">
                In den Kampf ziehen <Swords className="w-4 h-4" />
              </span>
            </div>
          </div>
        </div>
      </div>
    </>
  )}
</div>
);
};
