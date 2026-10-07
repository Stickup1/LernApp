# ⚡ LernHeld 5. Klasse (Mittelschule Bayern)

Eine maßgeschneiderte Lern-App für Schüler der 5. Klasse Mittelschule (Bayern) mit Fokus auf **Englisch-Vokabeltraining** und **Gamification**. 

Läuft 100% statisch im Browser, werbefrei, offline-fähig und optimiert für **GitHub Pages** (Smartphone, Tablet/iPad und PC).

---

## 🎯 Enthaltene Features

### 1. Vokabeltrainer & Übungsmodi
- **5-Fächer-Kasten (Leitner-System):** Vokabeln wandern bei Erfolg von Fach 1 bis Fach 5.
- **Native englische Sprachausgabe (TTS):** Akzentfreie Aussprache per Knopfdruck über die Web Speech API.
- **5 verschiedene Spiel- und Lernmodi:**
  1. 🗂️ **Karteikarten:** Klassisches Aufdecken mit Beispielsätzen und Audio.
  2. ⚡ **Speed Quiz:** 4-Auswahl-Quiz mit Streak-Bonus und Sofort-Feedback.
  3. 🧩 **Buchstabensalat (Scramble):** Wörter Buchstabe für Buchstabe puzzeln (ideal für Touch/Tablet).
  4. ✍️ **Schreib-Trainer:** Tastatur-Eingabe mit Hilfetipps zur optimalen Vorbereitung auf Tests.
  5. 👾 **Monster-Bosskampf:** Besiege Vokabel-Monster mit richtigen Antworten (Gamification).

### 2. Vokabeln einpflegen & verwalten
- **Vorbereiteter Lehrplan-Wortschatz (Bayern 5. Klasse):**
  - Unit 1: *Back to School* (Schulsachen & Klassenzimmer)
  - Unit 2: *Family & Friends* (Familie & Freunde)
  - Unit 3: *Pets & Animals* (Haustiere & Tiere)
  - Unit 4: *My Room & Hobbies* (Zimmer & Freizeit)
  - Unit 5: *Food & Drinks* (Essen & Trinken)
- **Schnell-Import (CSV / Text):** Beliebige Vokabellisten im Format `Englisch; Deutsch` direkt per Copy & Paste einfügen.
- **Manuelle Eingabemaske:** Einzelne Vokabeln mit Beispielsatz und Thema erfassen.
- **Backup & Synchronisation:** Export und Import aller Daten als Datei (für den Wechsel vom PC aufs Tablet).

### 3. Gamification
- **Erfahrungspunkte (XP) & Level-System**
- **Tages-Serie (Streak 🔥)**
- **Synthetisierte Audio-Effekte (Web Audio API)**
- **Konfetti-Effekte** bei Erfolgen und Level-Ups

---

## 🚀 Lokale Entwicklung

```bash
# Abhängigkeiten installieren
npm install

# Entwicklungsserver starten
npm run dev

# Produktions-Build erstellen
npm run build
```

---

## 🌐 GitHub Pages Aktivierung

Die App enthält bereits eine vollautomatische GitHub Action (`.github/workflows/deploy.yml`).

Um die Seite nach dem Push auf GitHub live zu schalten:
1. Gehe im GitHub-Repository auf **Settings** (Einstellungen).
2. Klicke links im Menü auf **Pages**.
3. Wähle unter **Build and deployment** bei **Source** die Option:  
   👉 **GitHub Actions**
4. Sobald der Branch `main` gepusht wird, wird die App automatisch gebaut und bereitgestellt!
