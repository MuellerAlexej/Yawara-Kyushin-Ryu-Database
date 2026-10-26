# YKR Wissensdatenbank

Wissensdatenbank des **Yawara Kyushin Ryu (YKR)** als Web-App für Schüler und Lehrer: Lehrwerk, Glossar, Techniken, Gürtelsystem, Prüfungsordnung, Fitness und ein geschützter Bereich für Dan-Träger. Die App läuft ohne Server direkt auf **GitHub Pages**, lässt sich auf dem Handy wie eine App installieren und funktioniert nach dem ersten Laden auch offline.

## Grundsatz: Das Lehrwerk ist die Quelle der Wahrheit

- Das **Lehrwerk des YKR** (1. Auflage, Tobias Riemer) ist die verbindliche Grundlage aller Inhalte. Der Text wurde aus dem Scan übertragen und geprüft. Zu jeder Seite lässt sich der **Original-Scan** öffnen.
- Alles, was nicht aus dem Lehrwerk stammt, ist in der App als **Ergänzung** gekennzeichnet (zum Beispiel Hintergrundtexte aus öffentlichen Quellen und die Fitness-Übungen). Bei Abweichungen gilt das Lehrwerk.
- Weitere Schul-Dokumente (Graduierungssysteme, Prüfungsordnung, Dojoregeln, Webseitenbeschreibung, Orga-Struktur, Kataliste) sind mit Quellenangabe eingearbeitet.

## Inhalte

| Bereich | Inhalt |
|---|---|
| **Lehrwerk** | Alle 10 Kapitel plus Vorwort, durchsuchbar, mit Original-Scans |
| **Bereiche** | Yawara Kyushin Ryu (Allgemein), Iaido, Kyokushinkai Karate, Jiu-Jitsu/Selbstverteidigung, Allgemeine Fitness, jeweils mit Theorie, Ausrüstung und Techniken |
| **Glossar** | Rund 400 Begriffe mit Umschrift, japanischer Schrift und Übersetzung. Begriffe aus dem Lehrwerk haben Vorrang. |
| **Lernen** | Quiz und Karteikarten, zum Beispiel zu Tugenden, Schwert-, Kleidungs- und Rüstungsteilen |
| **Gürtel und Prüfung** | Anforderungen der Kyu-Grade (Praxis und Theorie), Gürtelfarben, Prüfungsordnung |
| **Fitness** | 66 Übungen, filterbar nach vorhandener Ausrüstung, dazu Kurzprogramme (Aufwärmen, Mobility, Rumpf, Ganzkörper) |
| **Schwarzgurt-Bereich** | Verschlüsselt: Dan-Dojoregeln, Anforderungen 1. bis 8. Dan, Dan-Prüfungsregeln |
| **Suche, Favoriten** | Suche über alle Inhalte, Favoriten bleiben lokal auf dem Gerät |

## Auf GitHub Pages veröffentlichen

1. Auf [github.com](https://github.com) anmelden und ein **neues Repository** anlegen, zum Beispiel `ykr-wissensdatenbank`.
2. Die ZIP-Datei entpacken. Den **Inhalt** des entpackten Ordners (nicht den Ordner selbst) in das Repository hochladen: „Add file“ → „Upload files“, alle Dateien und Ordner hineinziehen, dann „Commit changes“. Es sind etwa 60 Dateien und rund 8 MB.
3. Im Repository **Settings → Pages**: Branch `main`, Ordner `/ (root)` wählen und speichern.
4. Nach ein bis zwei Minuten ist die App unter `https://<benutzername>.github.io/<repository-name>/` erreichbar.
5. Auf dem Handy den Link öffnen und im Browser-Menü **„Zum Startbildschirm hinzufügen“** (Android: „App installieren“) wählen.

> Eine GitHub-Pages-Seite ist in der Regel **öffentlich im Internet erreichbar**, auch wenn das Repository privat ist. Das Lehrwerk steht deshalb für jeden lesbar online. Die Veröffentlichung erfolgt mit Zustimmung des Autors Tobias Riemer. Geschützt ist nur der Schwarzgurt-Bereich (siehe unten).

### Aktualisieren

Geänderte Dateien erneut hochladen („Upload files“ überschreibt gleichnamige Dateien). Die Adresse bleibt gleich. Bei größeren Änderungen die Versionsnummer in `sw.js` (`VERSION`) und in `js/app.js` erhöhen, damit Geräte die neue Version sicher laden.

## Schwarzgurt-Bereich: Passwort und Pflege

Der Bereich liegt **verschlüsselt** in `data/schwarzgurt.json` (AES-256-GCM, Schlüsselableitung PBKDF2). Ohne Passwort sind die Inhalte unlesbar, auch im Quelltext. Das Passwort wird nie hochgeladen.

**Passwort ändern oder Inhalte ergänzen:**

1. Python 3 installieren und einmal `pip install cryptography` ausführen.
2. Die Klartext-Datei `schwarzgurt_klartext.json` bearbeiten (liegt **nicht** im Repository, sicher aufbewahren, nie hochladen).
3. Verschlüsseln: `python3 tools/schwarzgurt_verschluesseln.py schwarzgurt_klartext.json`. Das Passwort wird abgefragt.
4. Die neu erzeugte `data/schwarzgurt.json` hochladen.

**Grenzen dieser Lösung:**

- Es gibt **ein gemeinsames Passwort** für alle Berechtigten. Scheidet jemand aus, wird das Passwort geändert und neu verschlüsselt. Einzelne Personen lassen sich nicht sperren. Wer das Passwort kennt, kann den Inhalt kopieren.
- Ein schwaches Passwort lässt sich durch Ausprobieren knacken. Mindestens 12 Zeichen verwenden.
- Videolinks sind nur geschützt, solange sie verschlüsselt sind.

## Inhalte pflegen

Alle Inhalte liegen als JSON-Dateien im Ordner `data/`, getrennt vom Design:

| Datei | Inhalt |
|---|---|
| `lehrwerk.json` | Text des Lehrwerks (Kapitel, Abschnitte, Blöcke mit Seitenangabe) |
| `glossar.json` | Begriffe: `romaji`, `jp`, `de`, `kat`, `quelle`, optional `hinweis` |
| `techniken.json` | Techniken je Bereich, mit Feld `videos` |
| `bereiche.json` | Bereiche und Ausrüstung |
| `graduierung.json`, `pruefung.json` | Gürtelsystem und Prüfungsordnung (öffentlicher Teil) |
| `ergaenzungen.json` | Hintergrundtexte aus öffentlichen Quellen |
| `fitness.json` | Übungen, Geräte, Kurzprogramme |
| `ueber.json` | Texte über die Schule |

**Videolinks ergänzen:** In `data/techniken.json` beim jeweiligen Eintrag das Feld `videos` füllen, zum Beispiel `"videos": [{"titel": "Ausführung", "url": "https://www.youtube.com/watch?v=…"}]`. Ohne Eintrag zeigt die App eine YouTube-Suche zur Technik an.

**Original-Scans:** Die Seitenbilder liegen in `assets/pages/` (`s01.jpg` bis `s37.jpg` entsprechen den gedruckten Seiten, dazu Deckblatt, Vorwort und Inhaltsverzeichnis). Wird ein Bild ausgetauscht, den Dateinamen ändern oder die Browser-Daten leeren, weil Bilder zwischengespeichert werden.

## Bekannte Hinweise

- Der Lehrwerktext wurde per Texterkennung aus dem Scan übertragen und gegen die Seitenbilder geprüft. Im Zweifel gilt der Original-Scan (in der App bei jeder Seite abrufbar).
- Im Graduierungssystem (Theorie) ist die Summe für den 1. Dan mit 85 angegeben, die Einzelwerte ergeben 95. Die App zeigt beides an.
- Die Zuordnung der Waffen und Materialien zu den Stufen im Graduierungssystem (Praxis) folgt der Spaltenaufteilung der Tabelle.
- Die japanische Schreibung von „Kyushin“ liegt nicht vor und ist deshalb nirgends angegeben.
- Die Fitness-Übungen sind eine Ergänzung. Sie ersetzen keine ärztliche oder trainerische Beratung.

## Technik

Statische Web-App aus HTML, CSS und JavaScript ohne Abhängigkeiten, ohne Tracking und ohne Server. Favoriten und Einstellungen werden nur lokal im Browser gespeichert. Offline-Nutzung über einen Service Worker.

```
index.html · manifest.webmanifest · sw.js
css/app.css · js/app.js
data/            Inhalte (JSON)
assets/pages/    Original-Scans des Lehrwerks
icons/           App-Symbole
tools/           Werkzeug zum Verschlüsseln des Schwarzgurt-Bereichs
```

## Urheberrecht

- Lehrwerk: © 2019 Yawara Kyushin Ryu und Tobias Riemer, mit Zustimmung des Autors in dieser App bereitgestellt.
- Die App ist kostenfrei und dient ausschließlich dem Lernen. Es bestehen keine finanziellen Gewinnansprüche.
- Quellen der Ergänzungen stehen bei den jeweiligen Artikeln in der App.
