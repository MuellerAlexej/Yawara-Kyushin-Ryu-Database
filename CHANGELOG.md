# Änderungsliste

Die Versionsnummer steht nur in `js/version.js`. Bei jeder Änderung dort erhöhen, damit Handys die neue Version sicher laden.

## 1.9.0
- Programmcode in thematische Dateien aufgeteilt (`js/kern.js`, `seiten.js`, `glossar.js`, `quiz.js`, `graduierung.js`, `fitness.js`, `training.js`, `suche.js`, `schwarzgurt.js`, `ueber.js`, `start.js`).
- Große Datendateien aufgeteilt: Glossar je Kategorie (`data/glossar/`), Lehrwerk je Kapitel (`data/lehrwerk/`), Übungen je Art (`data/fitness/`), jeweils mit `index.json`.
- Prüfskript `tools/pruefen.py` und automatische Tests im Ordner `tests/`.
- Versionsnummer nur noch an einer Stelle (`js/version.js`).
- Offline-Dienst lädt Ordner mit Index automatisch vollständig.
- Dokumentation der Daten in `data/README.md`.
- **Beim Update im Repository löschen** (werden nicht mehr gebraucht): `js/app.js`, `data/glossar.json`, `data/lehrwerk.json`, `data/fitness.json`. Die Dateien `data/videos.json` und die Bilder in `assets/pages/` bleiben unverändert.

## 1.8.0
- Favoriten führen direkt zum Eintrag (Glossar, Techniken, Übungen).
- Seitenangaben des Lehrwerks sind anklickbar und öffnen den Original-Scan.
- Schalter „Übungen ohne Geräte (Körpergewicht)“ bei der Ausrüstung.
- 22 neue Begriffe zur Kleidung.

## 1.7.0
- 30 weitere Samurai-Waffen und Ausrüstungsbegriffe im Glossar.

## 1.6.0
- 146 weitere Iaido-Begriffe (Etikette, Kommandos, Schnittarten, Griffarten, Uniform, Schwertarten, Philosophie).
- Iaitō als stumpfe Stahlklinge beschrieben; Hinweise zu Schnitttests.

## 1.5.0
- 45 Iaido-Begriffe zu Schulen, Personen, Schwertpflege und Techniken.

## 1.4.0
- Karate: Beinwaffen, Tritte und Stände ins Glossar und in die Techniken.
- Körpertraining: 19 neue Übungen zu Beweglichkeit und Beinkraft, 4 neue Kurzprogramme, Plan „Beweglichkeit und Kraft für Tritte“.

## 1.3.0
- Neuer Bereich „Körpertraining“ mit Sessions, Trainingsplänen und geführter Durchführung. 54 Übungen aus der Fitness-App übernommen.

## 1.2.0
- Quiz mit Mehrfachauswahl der Themen und Prüfungsvorbereitung je Grad.
- Gruppentexte bei Techniken statt wiederholter Beschreibungen.
- Videolinks in `data/videos.json`, sonst YouTube-Suche.

## 1.1.0
- Punkte und Zahlen der Prüfungen nur im Schwarzgurt-Bereich.
- Einteilung Mudansha, Yūdansha, Kōdansha.
- Glossar mit weiteren Übersetzungen, Installation als App.

## 1.0.0
- Erste Version: Lehrwerk mit Original-Scans, Bereiche, Glossar, Quiz, Gürtel und Prüfung, Fitness, Suche, Favoriten, verschlüsselter Schwarzgurt-Bereich.
