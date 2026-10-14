import React, { useState, useEffect, useRef } from 'react';
import { VocabUnit, LearningMode, VocabWord, EnglishAccent, LearnerProfile } from './types/vocab';
import {
  getStoredProfiles,
  saveStoredProfiles,
  createProfile,
  INITIAL_PROGRESS,
} from './services/storage';
import { Navbar } from './components/Navbar';
import { Dashboard } from './components/Dashboard';
import { FlashcardMode } from './components/flashcard/FlashcardMode';
import { MemoryMode } from './components/memory/MemoryMode';
import { ScrambleMode } from './components/scramble/ScrambleMode';
import { WritingMode } from './components/writing/WritingMode';
import { MonsterQuest } from './components/monster/MonsterQuest';
import { VocabManager } from './components/manage/VocabManager';
import { playSound } from './services/audio';
import { triggerConfetti } from './services/confetti';

export const App: React.FC = () => {
  const initialProfiles = getStoredProfiles();
  const [profiles, setProfiles] = useState<LearnerProfile[]>(initialProfiles);
  const [activeProfileId, setActiveProfileId] = useState<string>(initialProfiles[0].id);
  const [selectedUnitId, setSelectedUnitId] = useState<string>('all');
  const [currentMode, setCurrentMode] = useState<LearningMode>('dashboard');
  const importInputRef = useRef<HTMLInputElement | null>(null);

  const activeProfile = profiles.find(profile => profile.id === activeProfileId) ?? profiles[0];
  const units = activeProfile?.units ?? [];
  const progress = activeProfile?.progress ?? INITIAL_PROGRESS;

  useEffect(() => {
    setSelectedUnitId('all');
  }, [activeProfileId]);

  const updateActiveProfile = (update: (profile: LearnerProfile) => LearnerProfile) => {
    setProfiles(prevProfiles => prevProfiles.map(profile =>
      profile.id === activeProfileId ? update(profile) : profile
    ));
  };

  useEffect(() => {
    saveStoredProfiles(profiles);
  }, [profiles]);

  // Handle XP addition and Level up check
  const handleAddXp = (amount: number) => {
    const nextXp = progress.xp + amount;
    const calculatedLevel = Math.floor(nextXp / 120) + 1;

    if (calculatedLevel > progress.level) {
      playSound('levelup', progress.soundEnabled);
      triggerConfetti();
    }

    updateActiveProfile(profile => ({
      ...profile,
      progress: {
        ...profile.progress,
        xp: nextXp,
        level: calculatedLevel,
        wordsPracticedToday: profile.progress.wordsPracticedToday + 1,
      },
    }));
  };

  const handleToggleSound = () => {
    updateActiveProfile(profile => ({
      ...profile,
      progress: { ...profile.progress, soundEnabled: !profile.progress.soundEnabled },
    }));
  };

  const handleChangeVoiceAccent = (voiceAccent: EnglishAccent) => {
    updateActiveProfile(profile => ({
      ...profile,
      progress: { ...profile.progress, voiceAccent },
    }));
  };

  const handleUpdateWordBox = (wordId: string, newBox: number, isCorrect: boolean) => {
    updateActiveProfile(profile => ({
      ...profile,
      units: profile.units.map(unit => ({
        ...unit,
        words: unit.words.map(word => word.id === wordId
          ? {
              ...word,
              box: newBox,
              lastPracticed: new Date().toISOString(),
              correctCount: isCorrect ? word.correctCount + 1 : word.correctCount,
              incorrectCount: !isCorrect ? word.incorrectCount + 1 : word.incorrectCount,
            }
          : word
        ),
      })),
    }));
  };

  const handleSaveUnits = (newUnits: VocabUnit[]) => {
    updateActiveProfile(profile => ({ ...profile, units: newUnits }));
  };

  const handleMonsterDefeated = () => {
    updateActiveProfile(profile => ({
      ...profile,
      progress: {
        ...profile.progress,
        monsterDefeatedCount: profile.progress.monsterDefeatedCount + 1,
      },
    }));
  };

  const handleCreateProfile = () => {
    const nextName = window.prompt('Name des neuen Lernprofils:', 'Neues Profil');
    if (!nextName) return;

    const avatarOptions = ['🚀', '🦊', '🐼', '🤖', '🦁', '🐸', '🌟', '🎯'];
    const accentOptions = ['indigo', 'amber', 'emerald', 'rose', 'sky', 'violet'];

    const avatarInput = window.prompt(
      `Avatar für ${nextName} wählen:\n${avatarOptions.join(' ')}\nLeer lassen = zufällig`,
      avatarOptions[0]
    );

    const accentInput = window.prompt(
      `Farbe für ${nextName} wählen:\n${accentOptions.join(', ')}\nLeer lassen = zufällig`,
      'indigo'
    );

    const selectedAvatar = avatarInput && avatarOptions.includes(avatarInput) ? avatarInput : undefined;
    const normalizedAccent = accentInput?.trim().toLowerCase();
    const selectedAccent = normalizedAccent && accentOptions.includes(normalizedAccent)
      ? normalizedAccent as 'indigo' | 'amber' | 'emerald' | 'rose' | 'sky' | 'violet'
      : undefined;

    const newProfile = createProfile(
      nextName,
      activeProfile?.units ?? [],
      { ...INITIAL_PROGRESS },
      selectedAvatar,
      selectedAccent
    );
    setProfiles(prev => [...prev, newProfile]);
    setActiveProfileId(newProfile.id);
    setCurrentMode('dashboard');
  };

  const handleSelectProfile = (profileId: string) => {
    setActiveProfileId(profileId);
    setCurrentMode('dashboard');
  };

  const handleExportData = () => {
    const payload = {
      version: 1,
      exportedAt: new Date().toISOString(),
      profiles,
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

        if (Array.isArray(parsed.profiles) && parsed.profiles.length > 0) {
          setProfiles(parsed.profiles);
          setActiveProfileId(parsed.profiles[0].id);
        } else if (Array.isArray(parsed.units)) {
          const importedProfile = createProfile('Importiert', parsed.units, { ...INITIAL_PROGRESS, ...parsed.progress });
          setProfiles(prev => [...prev, importedProfile]);
          setActiveProfileId(importedProfile.id);
        } else if (parsed.progress && typeof parsed.progress === 'object') {
          updateActiveProfile(profile => ({
            ...profile,
            progress: { ...profile.progress, ...parsed.progress },
          }));
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
    (selectedUnitId === 'all'
      ? units.flatMap(u => u.words)
      : units.find(u => u.id === selectedUnitId)?.words || [])
      .filter(word => word.isActive !== false);

  const allWordsPool = units
    .flatMap(unit => unit.words)
    .filter(word => word.isActive !== false);

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
        profiles={profiles}
        activeProfileId={activeProfileId}
        onSelectMode={handleSelectMode}
        onToggleSound={handleToggleSound}
        onChangeVoiceAccent={handleChangeVoiceAccent}
        onSelectProfile={handleSelectProfile}
        onCreateProfile={handleCreateProfile}
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
            profiles={profiles}
            activeProfileId={activeProfileId}
            onSelectProfile={handleSelectProfile}
            onCreateProfile={handleCreateProfile}
            onStartMode={handleSelectMode}
          />
        )}

        {currentMode === 'flashcards' && (
          <FlashcardMode
            key={`${activeProfileId}:${selectedUnitId}`}
            words={activeWords}
            soundEnabled={progress.soundEnabled}
            voiceAccent={progress.voiceAccent}
            onUpdateWordBox={handleUpdateWordBox}
            onAddXp={handleAddXp}
            onExit={() => setCurrentMode('dashboard')}
          />
        )}

        {currentMode === 'memory' && (
          <MemoryMode
            key={`${activeProfileId}:${selectedUnitId}`}
            words={activeWords}
            soundEnabled={progress.soundEnabled}
            voiceAccent={progress.voiceAccent}
            onUpdateWordBox={handleUpdateWordBox}
            onAddXp={handleAddXp}
            onExit={() => setCurrentMode('dashboard')}
          />
        )}

        {currentMode === 'scramble' && (
          <ScrambleMode
            key={`${activeProfileId}:${selectedUnitId}`}
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
            key={`${activeProfileId}:${selectedUnitId}`}
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
            key={`${activeProfileId}:${selectedUnitId}`}
            words={activeWords.length > 3 ? activeWords : allWordsPool}
            soundEnabled={progress.soundEnabled}
            voiceAccent={progress.voiceAccent}
            onUpdateWordBox={handleUpdateWordBox}
            onMonsterDefeated={handleMonsterDefeated}
            onAddXp={handleAddXp}
            onExit={() => setCurrentMode('dashboard')}
          />
        )}

        {currentMode === 'manager' && (
          <VocabManager
            key={activeProfileId}
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
