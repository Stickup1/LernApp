# LernHeld

LernHeld ist eine browserbasierte App zum Üben englischer Vokabeln. Sie bietet fünf Lernmodi, Aussprache und getrennte Lernprofile für mehrere Personen auf demselben Gerät.

## Lernmodi

- **Karteikarten:** Vokabeln wiederholen und den eigenen Kenntnisstand im 5-Fächer-Leitner-System einschätzen.
- **Vokabel-Memory:** Englische und deutsche Kartenpaare finden. Englische Karten werden beim Aufdecken vorgelesen; ein Treffer bringt 10 XP und verbessert das Leitner-Fach. Eine Runde enthält bis zu sechs Paare.
- **Buchstabensalat:** Englische Wörter aus einzelnen Buchstaben zusammensetzen. Die Groß- und Kleinschreibung wird berücksichtigt; einzelne Schritte können zurückgenommen werden.
- **Schreib-Trainer:** Die englische Übersetzung eintippen, Hinweise nutzen und die Aussprache anhören oder üben.
- **Monster-Quest:** Mit richtigen Übersetzungen Monster besiegen und Lernfortschritt sammeln.

Die Sprachausgabe verwendet die Web Speech API des Browsers. Verfügbare Stimmen und Qualität hängen vom jeweiligen Gerät und Browser ab.

## Vokabeln und Units

Neue Installationen enthalten keine vorgefertigten Units. Eigene Lerneinheiten und Wörter lassen sich in der Verwaltung anlegen.

- Wörter manuell hinzufügen oder Listen zeilenweise im Format `Englisch; Deutsch` importieren.
- Neue Wörter aus manueller Eingabe, Textimport und OCR landen zunächst in der Staging Area. Sie werden erst nach dem Freischalten in den Lernmodi verwendet.
- Gedruckte Vokabellisten können als Foto oder Screenshot mit Tesseract.js erkannt und anschließend als vorbereitete Wörter importiert werden. Die Erkennung sollte vor dem Übernehmen geprüft werden.
- Units und einzelne Vokabeln können bearbeitet, freigeschaltet oder gelöscht werden.

## Fortschritt und Datensicherung

Profile, Units, XP, Level und Wortfortschritt werden im `localStorage` des aktuellen Browsers gespeichert. Es gibt keine automatische Cloud-Synchronisierung. Browserdaten zu löschen oder ein anderes Gerät zu verwenden überträgt den Lernstand daher nicht automatisch.

Über die Backup-Funktionen können Profile und Fortschritt als JSON-Datei exportiert und auf einem anderen Gerät wieder importiert werden. Die Vokabelverwaltung bietet zusätzlich einen Export und Import der Units.

Die App hat kein Backend und keine Benutzerkonten. Die Eltern-PIN ist eine lokale Sperre für die Verwaltungsoberfläche, keine serverseitige Authentifizierung.

## Voraussetzungen und Offline-Nutzung

Die App wird als statische Website über GitHub Pages ausgeliefert. Lernstände liegen lokal im Browser. Eine vollständige Offline-Verfügbarkeit ist nicht garantiert; insbesondere kann die OCR-Funktion Internetzugriff benötigen, um Tesseract-Worker und Sprachdaten zu laden. Aussprachefunktionen benötigen einen Browser mit entsprechender Web-Speech-Unterstützung.

## Lokale Entwicklung

```bash
npm install
npm run dev
npm run build
npm run preview
```

`npm run build` führt zuerst den TypeScript-Check und danach den Vite-Produktionsbuild aus.

## GitHub Pages

Die GitHub-Action in `.github/workflows/deploy.yml` baut die App bei Pushes auf `main` und veröffentlicht sie über GitHub Pages. Im Repository muss unter **Settings → Pages → Build and deployment → Source** die Option **GitHub Actions** ausgewählt sein.
