import React, { useState } from 'react';
import Tesseract from 'tesseract.js';
import { VocabUnit, VocabWord } from '../../types/vocab';
import { Plus, Trash2, Download, Upload, ArrowLeft, FileText, Sparkles, BookPlus, Lock, ImageUp } from 'lucide-react';
import { hasParentPassword, removeParentPassword } from '../../services/auth';

interface VocabManagerProps {
  units: VocabUnit[];
  onSaveUnits: (units: VocabUnit[]) => void;
  onExit: () => void;
}

export const VocabManager: React.FC<VocabManagerProps> = ({
  units,
  onSaveUnits,
  onExit,
}) => {
  const [selectedUnitId, setSelectedUnitId] = useState<string>(units[0]?.id || '');
  const [tab, setTab] = useState<'import' | 'manual' | 'units' | 'backup'>('import');

  // Manual word state
  const [manualEn, setManualEn] = useState('');
  const [manualDe, setManualDe] = useState('');
  const [manualExample, setManualExample] = useState('');

  // Bulk import state
  const [bulkText, setBulkText] = useState('');
  const [importUnitName, setImportUnitName] = useState('');
  const [importNotice, setImportNotice] = useState<string | null>(null);

  // New unit state
  const [newUnitTitle, setNewUnitTitle] = useState('');
  const [newUnitIcon, setNewUnitIcon] = useState('📘');

  // OCR image import state
  const [ocrImageUrl, setOcrImageUrl] = useState<string | null>(null);
  const [ocrEntries, setOcrEntries] = useState<Array<{ id: string; en: string; de: string }>>([]);
  const [isOcrLoading, setIsOcrLoading] = useState(false);
  const [ocrError, setOcrError] = useState<string | null>(null);

  // Edit word state
  const [editingWordId, setEditingWordId] = useState<string | null>(null);
  const [editEn, setEditEn] = useState('');
  const [editDe, setEditDe] = useState('');
  const [editExample, setEditExample] = useState('');

  const currentUnit = units.find(u => u.id === selectedUnitId) || units[0];

  // 1. Bulk CSV / Text Import Handler
  const handleBulkImport = () => {
    if (!bulkText.trim()) return;

    const lines = bulkText.split('\n');
    const newWords: VocabWord[] = [];

    lines.forEach((line, index) => {
      const trimmed = line.trim();
      if (!trimmed) return;

      // Split by semicolon, comma, hyphen or tab
      let parts = trimmed.split(';');
      if (parts.length < 2) parts = trimmed.split('\t');
      if (parts.length < 2) parts = trimmed.split(' - ');
      if (parts.length < 2) parts = trimmed.split('=');

      if (parts.length >= 2) {
        const en = parts[0].trim();
        const de = parts[1].trim();
        const example = parts[2] ? parts[2].trim() : undefined;

        if (en && de) {
          newWords.push({
            id: `custom_${Date.now()}_${index}`,
            en,
            de,
            exampleEn: example,
            box: 1,
            isActive: false,
            correctCount: 0,
            incorrectCount: 0,
          });
        }
      }
    });

    if (newWords.length === 0) {
      setImportNotice('Keine gültigen Vokabeln gefunden. Bitte Format beachten: z.B. "ruler; Lineal"');
      return;
    }

    if (importUnitName.trim() || units.length === 0) {
      // Create a brand new unit
      const fallbackTitle = importUnitName.trim() || 'Unit 1: Meine Vokabeln';
      const newUnit: VocabUnit = {
        id: `unit_${Date.now()}`,
        title: fallbackTitle,
        description: `Eigene Lerneinheit (${newWords.length} Wörter)`,
        icon: '📝',
        isCustom: true,
        words: newWords,
      };
      const updated = [...units, newUnit];
      onSaveUnits(updated);
      setSelectedUnitId(newUnit.id);
      setImportNotice(`${newWords.length} Vokabeln in neuer Einheit „${newUnit.title}“ gespeichert!`);
    } else if (currentUnit) {
      // Append to current unit
      const updated = units.map(u => {
        if (u.id === currentUnit.id) {
          return {
            ...u,
            words: [...u.words, ...newWords],
          };
        }
        return u;
      });
      onSaveUnits(updated);
      setImportNotice(`${newWords.length} Vokabeln zu „${currentUnit.title}“ hinzugefügt!`);
    }

    setBulkText('');
    setImportUnitName('');
  };

  // 2. Manual Word Add Handler
  const handleAddManualWord = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualEn.trim() || !manualDe.trim()) return;

    let targetUnit = currentUnit;
    let currentUnitsList = units;

    if (!targetUnit) {
      // Auto-create first unit if none exists
      targetUnit = {
        id: `unit_${Date.now()}`,
        title: 'Unit 1: Meine Vokabeln',
        description: 'Eigene Lerneinheit',
        icon: '📘',
        isCustom: true,
        words: [],
      };
      currentUnitsList = [targetUnit];
      setSelectedUnitId(targetUnit.id);
    }

    const newWord: VocabWord = {
      id: `w_custom_${Date.now()}`,
      en: manualEn.trim(),
      de: manualDe.trim(),
      exampleEn: manualExample.trim() || undefined,
      box: 1,
      isActive: false,
      correctCount: 0,
      incorrectCount: 0,
    };

    const updated = currentUnitsList.map(u => {
      if (u.id === targetUnit!.id) {
        return {
          ...u,
          words: [...u.words, newWord],
        };
      }
      return u;
    });

    onSaveUnits(updated);
    setManualEn('');
    setManualDe('');
    setManualExample('');
  };

  const parseOcrTextToPairs = (rawText: string): Array<{ id: string; en: string; de: string }> => {
    const lines = rawText
      .split(/\r?\n/)
      .map(line => line.replace(/^\s*[-•*\d.]+\s*/, '').trim())
      .filter(Boolean);

    const knownSplitters = [';', ' - ', ' – ', ' — ', ' = ', ' : ', ' -> ', '\t'];
    const pairs: Array<{ id: string; en: string; de: string }> = [];

    lines.forEach((line, index) => {
      let normalized = line;
      const delimiter = knownSplitters.find(separator => normalized.includes(separator));

      if (!delimiter) return;

      const parts = normalized.split(delimiter);
      const en = parts[0]?.trim();
      const de = parts.slice(1).join(delimiter).trim();

      if (en && de) {
        pairs.push({ id: `ocr_${Date.now()}_${index}`, en, de });
      }
    });

    return pairs;
  };

  const handleOcrImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsOcrLoading(true);
    setOcrError(null);
    setOcrEntries([]);
    setOcrImageUrl(URL.createObjectURL(file));

    try {
      const result = await Tesseract.recognize(file, 'eng', {
        logger: () => undefined,
      });

      const parsed = parseOcrTextToPairs(result.data.text);

      if (parsed.length === 0) {
        setOcrError('Es wurden keine passenden Vokabelpaare erkannt. Bitte ein klareres Foto mit Text in „Englisch; Deutsch“-Format hochladen.');
        return;
      }

      setOcrEntries(parsed);
    } catch (error) {
      console.error('OCR failed', error);
      setOcrError('Die Texterkennung war nicht erfolgreich. Bitte versuche ein klareres Foto oder einen anderen Scan.');
    } finally {
      setIsOcrLoading(false);
    }
  };

  const handleImportOcrEntries = () => {
    if (!currentUnit || ocrEntries.length === 0) return;

    const newWords: VocabWord[] = ocrEntries.map(entry => ({
      id: `ocr_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      en: entry.en.trim(),
      de: entry.de.trim(),
      box: 1,
      isActive: false,
      correctCount: 0,
      incorrectCount: 0,
    }));

    const updated = units.map(u =>
      u.id === currentUnit.id
        ? { ...u, words: [...u.words, ...newWords] }
        : u
    );

    onSaveUnits(updated);
    setOcrEntries([]);
    setOcrImageUrl(null);
    setOcrError(null);
  };

  const handleToggleWordActive = (wordId: string, nextActive: boolean) => {
    if (!currentUnit) return;

    const updated = units.map(u => {
      if (u.id !== currentUnit.id) return u;

      return {
        ...u,
        words: u.words.map(w =>
          w.id === wordId ? { ...w, isActive: nextActive } : w
        ),
      };
    });

    onSaveUnits(updated);
  };

  const handleActivateAllStagedWords = () => {
    if (!currentUnit) return;

    const updated = units.map(u => {
      if (u.id !== currentUnit.id) return u;

      return {
        ...u,
        words: u.words.map(word =>
          word.isActive === false ? { ...word, isActive: true } : word
        ),
      };
    });

    onSaveUnits(updated);
  };

  // 4. Delete Word Handler
  const handleDeleteWord = (wordId: string) => {
    if (!currentUnit) return;
    const updated = units.map(u => {
      if (u.id === currentUnit.id) {
        return {
          ...u,
          words: u.words.filter(w => w.id !== wordId),
        };
      }
      return u;
    });
    onSaveUnits(updated);
  };

  // 4. Edit Word Handler
  const handleStartEditWord = (word: VocabWord) => {
    setEditingWordId(word.id);
    setEditEn(word.en);
    setEditDe(word.de);
    setEditExample(word.exampleEn || '');
  };

  const handleSaveEditedWord = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUnit || !editingWordId || !editEn.trim() || !editDe.trim()) return;

    const updated = units.map(u => {
      if (u.id !== currentUnit.id) return u;

      return {
        ...u,
        words: u.words.map(w =>
          w.id === editingWordId
            ? {
                ...w,
                en: editEn.trim(),
                de: editDe.trim(),
                exampleEn: editExample.trim() || undefined,
              }
            : w
        ),
      };
    });

    onSaveUnits(updated);
    setEditingWordId(null);
    setEditEn('');
    setEditDe('');
    setEditExample('');
  };

  const handleCancelEditWord = () => {
    setEditingWordId(null);
    setEditEn('');
    setEditDe('');
    setEditExample('');
  };

  // 5. Create New Unit
  const handleCreateUnit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUnitTitle.trim()) return;

    const newUnit: VocabUnit = {
      id: `unit_${Date.now()}`,
      title: newUnitTitle.trim(),
      description: 'Selbst erstellte Lerneinheit',
      icon: newUnitIcon || '📘',
      isCustom: true,
      words: [],
    };

    const updated = [...units, newUnit];
    onSaveUnits(updated);
    setSelectedUnitId(newUnit.id);
    setNewUnitTitle('');
  };

  // 5. Delete Unit
  const handleDeleteUnit = (unitId: string) => {
    const unitToDelete = units.find(unit => unit.id === unitId);
    if (!unitToDelete) return;

    if (units.length === 1 && unitToDelete.words.length > 0) {
      alert('Die letzte Unit enthält noch Vokabeln und kann deshalb nicht gelöscht werden.');
      return;
    }
    const updated = units.filter(u => u.id !== unitId);
    onSaveUnits(updated);
    setSelectedUnitId(updated[0]?.id || '');
  };

  // 6. JSON Export
  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(units, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `lernheld_vokabeln_backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // 7. JSON Import
  const handleImportJsonFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    if (e.target.files && e.target.files[0]) {
      fileReader.readAsText(e.target.files[0], 'UTF-8');
      fileReader.onload = event => {
        try {
          const parsed = JSON.parse(event.target?.result as string);
          if (Array.isArray(parsed) && parsed.length > 0) {
            onSaveUnits(parsed);
            setSelectedUnitId(parsed[0].id);
            alert('Vokabeln erfolgreich importiert!');
          }
        } catch {
          alert('Ungültiges Dateiformat. Bitte eine gültige JSON-Datei auswählen.');
        }
      };
    }
  };

  const stagedWords = currentUnit?.words.filter(word => word.isActive === false) ?? [];
  const activeWords = currentUnit?.words.filter(word => word.isActive !== false) ?? [];
  const totalWordsInUnit = currentUnit?.words.length ?? 0;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={onExit}
          className="text-slate-500 hover:text-slate-800 flex items-center gap-1.5 text-sm font-bold"
        >
          <ArrowLeft className="w-4 h-4" /> Zurück zum Lernen
        </button>
        <h1 className="text-xl font-black text-slate-800 flex items-center gap-2">
          <span>⚙️</span>
          <span>Vokabeln einpflegen & verwalten</span>
        </h1>
        <div className="w-16" />
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setTab('import')}
          className={`px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-1.5 ${
            tab === 'import'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'bg-white text-slate-600 hover:bg-slate-100'
          }`}
        >
          <FileText className="w-4 h-4" /> Schnell-Import (Text/CSV)
        </button>

        <button
          onClick={() => setTab('manual')}
          className={`px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-1.5 ${
            tab === 'manual'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'bg-white text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Plus className="w-4 h-4" /> Einzelne Vokabeln eintragen
        </button>

        <button
          onClick={() => setTab('units')}
          className={`px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-1.5 ${
            tab === 'units'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'bg-white text-slate-600 hover:bg-slate-100'
          }`}
        >
          <BookPlus className="w-4 h-4" /> Units & Wortlisten ({currentUnit?.words.length || 0})
        </button>

        <button
          onClick={() => setTab('backup')}
          className={`px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-1.5 ${
            tab === 'backup'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'bg-white text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Download className="w-4 h-4" /> Backup / Sync
        </button>
      </div>

      {/* Tab 1: Schnell-Import */}
      {tab === 'import' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Schnell-Import für Vokabellisten</h2>
            <p className="text-xs text-slate-500 mt-1">
              Füge hier Vokabellisten ein (z.B. aus Word, Excel oder Schulnotizen). Format: <code>Englisch; Deutsch</code> pro Zeile.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {units.length > 0 ? (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Zu welcher Unit hinzufügen?
                </label>
                <select
                  value={selectedUnitId}
                  onChange={e => setSelectedUnitId(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium"
                >
                  {units.map(u => (
                    <option key={u.id} value={u.id}>
                      {u.icon} {u.title}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}

            <div className={units.length === 0 ? "sm:col-span-2" : ""}>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {units.length === 0 ? "Name deiner neuen Unit (z. B. Unit 1: School):" : "...ODER als neue Unit anlegen (Name eingeben):"}
              </label>
              <input
                type="text"
                placeholder={units.length === 0 ? "z.B. Unit 1: Back to School" : "z.B. Unit 2: My Family"}
                value={importUnitName}
                onChange={e => setImportUnitName(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Vokabelliste hier einfügen:
            </label>
            <textarea
              rows={8}
              value={bulkText}
              onChange={e => setBulkText(e.target.value)}
              placeholder={"pencil case; Federmäppchen\nruler; Lineal\nblackboard; Schultafel\nhomework; Hausaufgabe"}
              className="w-full p-3 font-mono text-sm bg-slate-50 border border-slate-300 rounded-2xl outline-none focus:border-indigo-600 focus:bg-white"
            />
          </div>

          <div className="rounded-2xl border-2 border-dashed border-indigo-200 bg-indigo-50/50 p-4 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-black text-slate-800">Foto hochladen und OCR importieren</h3>
                <p className="text-xs text-slate-500">Mehrere Vokabeln aus einem Foto oder Screenshot erkennen.</p>
              </div>
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-indigo-600 px-3 py-2 text-xs font-bold text-white shadow-sm hover:bg-indigo-700">
                <ImageUp className="w-4 h-4" />
                <span>Bild auswählen</span>
                <input type="file" accept="image/*" onChange={handleOcrImageUpload} className="hidden" />
              </label>
            </div>

            {isOcrLoading && (
              <div className="rounded-xl border border-indigo-200 bg-white px-3 py-2 text-sm font-semibold text-indigo-700">
                Texterkennung läuft…
              </div>
            )}

            {ocrError && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700">
                {ocrError}
              </div>
            )}

            {ocrImageUrl && (
              <div className="space-y-3">
                <img src={ocrImageUrl} alt="OCR Preview" className="max-h-52 w-full rounded-2xl object-contain border border-slate-200 bg-white" />

                {ocrEntries.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold uppercase tracking-wide text-slate-600">Erkannte Vokabeln</h4>
                      <button
                        type="button"
                        onClick={handleImportOcrEntries}
                        className="rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700"
                      >
                        In Unit übernehmen
                      </button>
                    </div>

                    <div className="max-h-40 space-y-2 overflow-y-auto pr-1">
                      {ocrEntries.map(entry => (
                        <div key={entry.id} className="rounded-xl border border-slate-200 bg-white p-2">
                          <div className="text-sm font-extrabold text-slate-800">{entry.en}</div>
                          <div className="text-xs text-slate-500">{entry.de}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {importNotice && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-sm font-bold">
              {importNotice}
            </div>
          )}

          <button
            onClick={handleBulkImport}
            disabled={!bulkText.trim()}
            className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-extrabold rounded-2xl shadow-md transition-all flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4" /> Vokabeln jetzt importieren
          </button>
        </div>
      )}

      {/* Tab 2: Manuelle Eingabe */}
      {tab === 'manual' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Einzelne Vokabel hinzufügen</h2>
            <p className="text-xs text-slate-500 mt-1">
              Füge eine neue Vokabel zur ausgewählten Lerneinheit hinzu.
            </p>
          </div>

          <form onSubmit={handleAddManualWord} className="space-y-4">
            {units.length > 0 ? (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Ziel-Lerneinheit:
                </label>
                <select
                  value={selectedUnitId}
                  onChange={e => setSelectedUnitId(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium"
                >
                  {units.map(u => (
                    <option key={u.id} value={u.id}>
                      {u.icon} {u.title}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl text-xs text-indigo-800 font-semibold">
                Hinweis: Da noch keine Unit existiert, wird beim Speichern automatisch „Unit 1: Meine Vokabeln“ erstellt.
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Englisches Wort / Ausdruck *
                </label>
                <input
                  type="text"
                  required
                  placeholder="z.B. pencil case"
                  value={manualEn}
                  onChange={e => setManualEn(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Deutsche Übersetzung *
                </label>
                <input
                  type="text"
                  required
                  placeholder="z.B. das Federmäppchen"
                  value={manualDe}
                  onChange={e => setManualDe(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Optional: Beispielsatz auf Englisch
              </label>
              <input
                type="text"
                placeholder="z.B. My pencil case is in the bag."
                value={manualExample}
                onChange={e => setManualExample(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-sm"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-2xl shadow-md transition-all flex items-center justify-center gap-2"
            >
              <Plus className="w-5 h-5" /> Vokabel zur Unit hinzufügen
            </button>
          </form>
        </div>
      )}

      {/* Tab 3: Units verwalten & Wörterliste */}
      {tab === 'units' && (
        <div className="space-y-6">
          {/* New Unit Creator */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-3">
            <h3 className="text-sm font-bold text-slate-800">Neue Lerneinheit (Unit) erstellen</h3>
            <form onSubmit={handleCreateUnit} className="flex gap-2">
              <input
                type="text"
                placeholder="Name der neuen Unit (z.B. Unit 1: School)"
                value={newUnitTitle}
                onChange={e => setNewUnitTitle(e.target.value)}
                className="flex-1 p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm"
              />
              <input
                type="text"
                title="Icon Emoji"
                value={newUnitIcon}
                onChange={e => setNewUnitIcon(e.target.value)}
                className="w-14 p-2.5 text-center bg-slate-50 border border-slate-300 rounded-xl text-lg"
              />
              <button
                type="submit"
                disabled={!newUnitTitle.trim()}
                className="px-4 py-2.5 bg-indigo-600 text-white font-bold rounded-xl text-sm disabled:opacity-50"
              >
                Erstellen
              </button>
            </form>
          </div>

          {/* Unit selector and word list */}
          {units.length > 0 ? (
            <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{currentUnit?.icon}</span>
                  <select
                    value={selectedUnitId}
                    onChange={e => setSelectedUnitId(e.target.value)}
                    className="p-2 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-800"
                  >
                    {units.map(u => (
                      <option key={u.id} value={u.id}>
                        {u.title} ({u.words.length} Wörter)
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={() => handleDeleteUnit(currentUnit.id)}
                  className="text-xs text-rose-600 hover:text-rose-800 font-bold flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Unit löschen
                </button>
              </div>

              <div className="flex flex-wrap gap-2">
                <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-amber-800">
                  Vorbereitung: {stagedWords.length}
                </span>
                <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-emerald-800">
                  Freigeschaltet: {activeWords.length}
                </span>
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-slate-700">
                  Gesamt: {totalWordsInUnit}
                </span>
              </div>

              {/* Words list table */}
              <div className="space-y-4 max-h-96 overflow-y-auto pr-1">
                {currentUnit?.words.length === 0 ? (
                  <div className="text-center py-8 text-sm text-slate-400">
                    Noch keine Vokabeln in dieser Unit vorhanden.
                  </div>
                ) : (
                  <>
                    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3">
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <h4 className="text-xs font-black uppercase tracking-wide text-amber-700">Staging Area</h4>
                        <span className="text-[10px] font-bold text-amber-700">{stagedWords.length} vorbereitet</span>
                      </div>

                      {stagedWords.length === 0 ? (
                        <div className="text-xs text-amber-700/70">Keine neuen Wörter in Vorbereitung.</div>
                      ) : (
                        <div className="space-y-3">
                          <button
                            type="button"
                            onClick={handleActivateAllStagedWords}
                            className="w-full rounded-xl bg-emerald-600 px-3 py-2 text-[11px] font-black uppercase tracking-wide text-white hover:bg-emerald-700"
                          >
                            Alle freischalten
                          </button>

                          <div className="space-y-2">
                            {stagedWords.map(w => (
                              <div key={w.id} className="rounded-xl border border-amber-200 bg-white p-2.5 flex items-center justify-between gap-3">
                                <div className="min-w-0 flex-1">
                                  <div className="font-extrabold text-slate-800 text-sm truncate">{w.en}</div>
                                  <div className="text-xs text-slate-500 truncate">{w.de}</div>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                  <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-amber-100 text-amber-700">Vorbereitung</span>
                                  <button
                                    type="button"
                                    onClick={() => handleToggleWordActive(w.id, true)}
                                    className="px-2 py-1 text-[10px] font-bold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700"
                                  >
                                    Freischalten
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <h4 className="text-xs font-black uppercase tracking-wide text-slate-700">Freigeschaltet</h4>
                        <span className="text-[10px] font-bold text-slate-600">{activeWords.length} aktiv</span>
                      </div>

                      <div className="space-y-2">
                        {activeWords.length === 0 ? (
                          <div className="text-xs text-slate-500">Noch keine Wörter freigeschaltet.</div>
                        ) : (
                          activeWords.map(w => {
                            const isEditing = editingWordId === w.id;

                            return (
                              <div key={w.id} className="rounded-xl border border-slate-200 bg-white p-2.5 space-y-2">
                                {isEditing ? (
                                  <form onSubmit={handleSaveEditedWord} className="space-y-2 rounded-2xl border border-indigo-200 bg-indigo-50 p-3">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                      <input
                                        type="text"
                                        value={editEn}
                                        onChange={e => setEditEn(e.target.value)}
                                        className="w-full p-2 bg-white border border-slate-300 rounded-xl text-sm"
                                        placeholder="Englisch"
                                      />
                                      <input
                                        type="text"
                                        value={editDe}
                                        onChange={e => setEditDe(e.target.value)}
                                        className="w-full p-2 bg-white border border-slate-300 rounded-xl text-sm"
                                        placeholder="Deutsch"
                                      />
                                    </div>
                                    <input
                                      type="text"
                                      value={editExample}
                                      onChange={e => setEditExample(e.target.value)}
                                      className="w-full p-2 bg-white border border-slate-300 rounded-xl text-sm"
                                      placeholder="Beispielsatz (optional)"
                                    />
                                    <div className="flex items-center justify-end gap-2">
                                      <button
                                        type="button"
                                        onClick={handleCancelEditWord}
                                        className="px-3 py-1.5 text-xs font-bold text-slate-600 hover:text-slate-800"
                                      >
                                        Abbrechen
                                      </button>
                                      <button
                                        type="submit"
                                        className="px-3 py-1.5 text-xs font-bold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700"
                                      >
                                        Speichern
                                      </button>
                                    </div>
                                  </form>
                                ) : (
                                  <div className="flex items-center justify-between gap-3">
                                    <div className="flex-1 min-w-0">
                                      <div className="font-extrabold text-slate-800 text-sm truncate">{w.en}</div>
                                      <div className="text-xs text-slate-500 truncate">{w.de}</div>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                      <div className="text-[10px] font-bold px-2 py-1 rounded-full bg-indigo-100 text-indigo-700 whitespace-nowrap">
                                        Kasten-Fach {w.box || 1}
                                      </div>
                                      <button
                                        type="button"
                                        onClick={() => handleToggleWordActive(w.id, false)}
                                        className="px-2 py-1 text-[10px] font-bold text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200"
                                      >
                                        Zurücksetzen
                                      </button>
                                      <button
                                        onClick={() => handleStartEditWord(w)}
                                        className="px-2 py-1 text-xs font-bold text-indigo-700 bg-indigo-100 hover:bg-indigo-200 rounded-lg transition-colors"
                                      >
                                        Bearbeiten
                                      </button>
                                      <button
                                        onClick={() => handleDeleteWord(w.id)}
                                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition-colors"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-3xl p-8 border border-slate-200 text-center text-slate-500 text-sm">
              Noch keine Einheiten vorhanden. Erstelle oben deine erste Unit!
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Backup & Sync */}
      {tab === 'backup' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-6">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Datensicherung & Synchronisation</h2>
            <p className="text-xs text-slate-500 mt-1">
              Da GitHub Pages ohne fremde Datenbank auskommt, kannst du deinen Lernstand und eigene Vokabeln als Datei speichern oder auf andere Geräte übertragen.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-5 rounded-2xl border-2 border-indigo-100 bg-indigo-50/50 space-y-3">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <Download className="w-4 h-4 text-indigo-600" />
                <span>Backup exportieren</span>
              </h3>
              <p className="text-xs text-slate-500">
                Lädt alle Vokabeln und Units als JSON-Datei auf dein Gerät herunter.
              </p>
              <button
                onClick={handleExportJson}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm"
              >
                Vokabel-Datei herunterladen
              </button>
            </div>

            <div className="p-5 rounded-2xl border-2 border-slate-200 bg-slate-50/50 space-y-3">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <Upload className="w-4 h-4 text-slate-600" />
                <span>Backup importieren</span>
              </h3>
              <p className="text-xs text-slate-500">
                Stellt Vokabeln aus einer zuvor exportierten Backup-Datei wieder her.
              </p>
              <label className="block w-full text-center py-2.5 bg-white border border-slate-300 hover:border-indigo-400 cursor-pointer font-bold rounded-xl text-sm text-slate-700">
                Datei auswählen
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportJsonFile}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Password Security Card */}
          <div className="p-5 rounded-2xl border-2 border-slate-200 bg-slate-50/70 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <div className="font-extrabold text-slate-800 text-sm">
                  {hasParentPassword() ? 'Eltern-Passwort ist aktiv 🔒' : 'Kein Passwort hinterlegt'}
                </div>
                <div className="text-xs text-slate-500">
                  {hasParentPassword()
                    ? 'Der Zahnradbereich ist vor Änderungen geschützt.'
                    : 'Beim nächsten Klick auf das Zahnrad wird ein Passwort abgefragt.'}
                </div>
              </div>
            </div>

            {hasParentPassword() && (
              <button
                type="button"
                onClick={() => {
                  if (confirm('Möchtest du das Eltern-Passwort wirklich entfernen? Danach ist der Bereich ungeschützt.')) {
                    removeParentPassword();
                    alert('Passwort entfernt. Beim nächsten Öffnen kannst du ein neues festlegen.');
                    window.location.reload();
                  }
                }}
                className="px-3 py-2 bg-white border border-slate-300 hover:border-rose-400 hover:text-rose-600 text-slate-600 font-bold text-xs rounded-xl transition-colors"
              >
                Passwort zurücksetzen
              </button>
            )}
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Alle Einheiten leeren?</span>
            <button
              onClick={() => {
                if (confirm('Möchtest du wirklich alle Einheiten löschen und ganz neu anfangen?')) {
                  onSaveUnits([]);
                  setSelectedUnitId('');
                  alert('Alle Einheiten wurden gelöscht.');
                }
              }}
              className="text-rose-600 hover:text-rose-800 font-bold"
            >
              Alle Einheiten löschen
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
