import React, { useState, useEffect, useRef } from 'react';
import { VocabUnit, UserProgress, LearningMode, VocabWord, EnglishAccent } from './types/vocab';
import {
  getStoredUnits,
  saveStoredUnits,
  getStoredProgress,
  saveStoredProgress,
} from './services/storage';
import { Navbar } from './components/Navbar';
import { Dashboard } from './components/Dashboard';
import { FlashcardMode } from './components/flashcard/FlashcardMode';
import { QuizMode } from './components/quiz/QuizMode';
import { ScrambleMode } from './components/scramble/ScrambleMode';
import { WritingMode } from './components/writing/WritingMode';
import { MonsterQuest } from './components/monster/MonsterQuest';
import { VocabManager } from './components/manage/VocabManager';
import { playSound } from './services/audio';
import { triggerConfetti } from './services/confetti';

export const App: React.FC = () => {
  const [units, setUnits] = useState<VocabUnit[]>([]);
  const [selectedUnitId, setSelectedUnitId] = useState<string>('all');
  const [currentMode, setCurrentMode] = useState<LearningMode>('dashboard');
  const [progress, setProgress] = useState<UserProgress>(getStoredProgress);
  const importInputRef = useRef<HTMLInputElement | null>(null);

  // Initialize units from storage
  useEffect(() => {
    const loadedUnits = getStoredUnits();
    setUnits(loadedUnits);
    if (loadedUnits.length > 0 && selectedUnitId !== 'all') {
      setSelectedUnitId(loadedUnits[0].id);
    }
  }, []);

  // Save progress changes
  useEffect(() => {
    saveStoredProgress(progress);
  }, [progress]);

  // Handle XP addition and Level up check
  const handleAddXp = (amount: number) => {
    setProgress(prev => {
      const nextXp = prev.xp + amount;
      const calculatedLevel = Math.floor(nextXp / 120) + 1;
      const isLevelUp = calculatedLevel > prev.level;

      if (isLevelUp) {
        playSound('levelup', prev.soundEnabled);
        triggerConfetti();
      }

      return {
        ...prev,
        xp: nextXp,
        level: calculatedLevel,
        wordsPracticedToday: prev.wordsPracticedToday + 1,
      };
    });
  };

  const handleToggleSound = () => {
    setProgress(prev => ({
      ...prev,
      soundEnabled: !prev.soundEnabled,
    }));
  };

  const handleChangeVoiceAccent = (voiceAccent: EnglishAccent) => {
    setProgress(prev => ({
      ...prev,
      voiceAccent,
    }));
  };

  const handleUpdateWordBox = (wordId: string, newBox: number, isCorrect: boolean) => {
    setUnits(prevUnits => {
      const updated = prevUnits.map(unit => ({
        ...unit,
        words: unit.words.map(w => {
          if (w.id === wordId) {
            return {
              ...w,
              box: newBox,
              lastPracticed: new Date().toISOString(),
              correctCount: isCorrect ? w.correctCount + 1 : w.correctCount,
              incorrectCount: !isCorrect ? w.incorrectCount + 1 : w.incorrectCount,
            };
          }
          return w;
        }),
      }));
      saveStoredUnits(updated);
      return updated;
    });
  };

  const handleSaveUnits = (newUnits: VocabUnit[]) => {
    setUnits(newUnits);
    saveStoredUnits(newUnits);
  };

  const handleMonsterDefeated = () => {
    setProgress(prev => ({
      ...prev,
      monsterDefeatedCount: prev.monsterDefeatedCount + 1,
    }));
  };

  const handleExportData = () => {
    const payload = {
      version: 1,
      exportedAt: new Date().toISOString(),
      progress,
      units,
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `lernheld-backup-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImportData = async () => {
    importInputRef.current?.click();
  };

  const handleRawImportFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result || '{}'));

        if (Array.isArray(parsed.units)) {
          setUnits(parsed.units);
          saveStoredUnits(parsed.units);
        }

        if (parsed.progress && typeof parsed.progress === 'object') {
          const mergedProgress = { ...getStoredProgress(), ...parsed.progress };
          setProgress(mergedProgress);
          saveStoredProgress(mergedProgress);
        }

        setCurrentMode('dashboard');
        window.alert('Backup erfolgreich wiederhergestellt.');
      } catch (error) {
        console.error('Import failed', error);
        window.alert('Die Backup-Datei ist ungültig. Bitte prüfe das Format.');
      } finally {
        event.target.value = '';
      }
    };

    reader.readAsText(file);
  };

  // Get active word pool for current selected unit
  const activeWords: VocabWord[] = 
    selectedUnitId === 'all'
      ? units.flatMap(u => u.words)
      : units.find(u => u.id === selectedUnitId)?.words || [];

  const allWordsPool: VocabWord[] = units.flatMap(u => u.words);

  const handleSelectMode = (mode: LearningMode) => {
    setCurrentMode(mode);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col selection:bg-indigo-500 selection:text-white">
      <input
        ref={importInputRef}
        type="file"
        accept="application/json"
        className="hidden"
        onChange={handleRawImportFile}
      />

      <Navbar
        progress={progress}
        currentMode={currentMode}
        onSelectMode={handleSelectMode}
        onToggleSound={handleToggleSound}
        onChangeVoiceAccent={handleChangeVoiceAccent}
        onExportData={handleExportData}
        onImportData={handleImportData}
      />

      <main className="flex-1 pb-16">
        {currentMode === 'dashboard' && (
          <Dashboard
            units={units}
            selectedUnitId={selectedUnitId}
            onSelectUnit={setSelectedUnitId}
            progress={progress}
            onStartMode={handleSelectMode}
          />
        )}

        {currentMode === 'flashcards' && (
          <FlashcardMode
            words={activeWords}
            soundEnabled={progress.soundEnabled}
            voiceAccent={progress.voiceAccent}
            onUpdateWordBox={handleUpdateWordBox}
            onAddXp={handleAddXp}
            onExit={() => setCurrentMode('dashboard')}
          />
        )}

        {currentMode === 'quiz' && (
          <QuizMode
            words={activeWords}
            allWordsPool={allWordsPool}
            soundEnabled={progress.soundEnabled}
            voiceAccent={progress.voiceAccent}
            onUpdateWordBox={handleUpdateWordBox}
            onAddXp={handleAddXp}
            onExit={() => setCurrentMode('dashboard')}
          />
        )}

        {currentMode === 'scramble' && (
          <ScrambleMode
            words={activeWords}
            soundEnabled={progress.soundEnabled}
            voiceAccent={progress.voiceAccent}
            onUpdateWordBox={handleUpdateWordBox}
            onAddXp={handleAddXp}
            onExit={() => setCurrentMode('dashboard')}
          />
        )}

        {currentMode === 'writing' && (
          <WritingMode
            words={activeWords}
            soundEnabled={progress.soundEnabled}
            voiceAccent={progress.voiceAccent}
            onUpdateWordBox={handleUpdateWordBox}
            onAddXp={handleAddXp}
            onExit={() => setCurrentMode('dashboard')}
          />
        )}

        {currentMode === 'monster' && (
          <MonsterQuest
            words={activeWords.length > 3 ? activeWords : allWordsPool}
            soundEnabled={progress.soundEnabled}
            voiceAccent={progress.voiceAccent}
            onMonsterDefeated={handleMonsterDefeated}
            onAddXp={handleAddXp}
            onExit={() => setCurrentMode('dashboard')}
          />
        )}

        {currentMode === 'manager' && (
          <VocabManager
            units={units}
            onSaveUnits={handleSaveUnits}
            onExit={() => setCurrentMode('dashboard')}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white/70 py-4 text-center text-xs text-slate-400">
        LernApp • Offline-fähig & Kostenlos
      </footer>
    </div>
  );
};

export default App;
