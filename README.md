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
| **Glossar** | Rund 370 Begriffe mit weiteren Übersetzungen, wo es mehrere gibt. Begriffe mit Umschrift, japanischer Schrift und Übersetzung. Begriffe aus dem Lehrwerk haben Vorrang. |
| **Lernen** | Quiz und Karteikarten. Themenbereiche per Mehrfachauswahl kombinierbar oder als Vorbereitung auf die Theorieprüfung eines Grades (10. Kyu bis 1. Dan) |
| **Gürtel und Prüfung** | Gürtelfarben, Einteilung in Mudansha, Yūdansha und Kōdansha, Prüfungsbereiche und Theoriethemen je Kyu, Prüfungsordnung (ohne Punkte und Zahlen) |
| **Körpertraining** | 139 Kraft-, Dehnungs-, Mobility-, Rumpf- und Konditionsübungen (ohne Techniken), darunter Beweglichkeit und Beinkraft für Tritte. Eigene **Sessions** nach Art und Dauer (zum Beispiel 30 Minuten Dehnen), **Trainingspläne** für 4 bis 12 Wochen mit Ziel (zum Beispiel Kraft oder Beweglichkeit und Kraft für Tritte), Entlastungswochen und Übungstausch, geführter Ablauf mit Timer. Pläne und Sessions bleiben lokal auf dem Gerät. |
| **Schwarzgurt-Bereich** | Verschlüsselt: Bewertung und Punkteverteilung (Praxis und Theorie, alle Grade), Anforderungen je Grad, vollständige Prüfungsordnung, Dan-Dojoregeln |
| **Suche, Favoriten** | Suche über alle Inhalte, Favoriten bleiben lokal auf dem Gerät |

## Als App auf dem Handy installieren

Die veröffentlichte Seite im Handy-Browser öffnen. Auf der Startseite (und unter „Mehr“) gibt es den Button **„App installieren“**. Alternativ im Browser-Menü: Android/Chrome „App installieren“, Samsung Internet „Seite hinzufügen zu → Startbildschirm“, iPhone/Safari „Teilen → Zum Home-Bildschirm“. Danach startet sie wie eine App und funktioniert offline.

## Auf GitHub Pages veröffentlichen

1. Auf [github.com](https://github.com) anmelden und ein **neues Repository** anlegen, zum Beispiel `ykr-wissensdatenbank`.
2. Die ZIP-Datei entpacken. Den **Inhalt** des entpackten Ordners (nicht den Ordner selbst) in das Repository hochladen: „Add file“ → „Upload files“, alle Dateien und Ordner hineinziehen, dann „Commit changes“. Es sind etwa 60 Dateien und rund 8 MB.
3. Im Repository **Settings → Pages**: Branch `main`, Ordner `/ (root)` wählen und speichern.
4. Nach ein bis zwei Minuten ist die App unter `https://<benutzername>.github.io/<repository-name>/` erreichbar.
5. Auf dem Handy den Link öffnen und im Browser-Menü **„Zum Startbildschirm hinzufügen“** (Android: „App installieren“) wählen.

> Eine GitHub-Pages-Seite ist in der Regel **öffentlich im Internet erreichbar**, auch wenn das Repository privat ist. Das Lehrwerk steht deshalb für jeden lesbar online. Die Veröffentlichung erfolgt mit Zustimmung des Autors Tobias Riemer. Geschützt ist nur der Schwarzgurt-Bereich (siehe unten).

### Aktualisieren

Geänderte Dateien erneut hochladen („Upload files“ überschreibt gleichnamige Dateien). Die Adresse bleibt gleich. Bei jeder Änderung die Versionsnummer in `js/version.js` erhöhen, damit Geräte die neue Version sicher laden.

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
| `lehrwerk/` | Text des Lehrwerks, eine Datei je Kapitel |
| `glossar/` | Begriffe, eine Datei je Kategorie (`romaji`, `jp`, `de`, `kat`, `quelle`, optional `alt` und `hinweis`) |
| `techniken.json` | Techniken je Bereich, mit Einleitungstexten je Gruppe |
| `videos.json` | **Videolinks** zu Techniken und Übungen (siehe unten) |
| `lernen.json` | Zuordnung der Prüfungsthemen je Grad zu Glossar-Begriffen für das Quiz |
| `bereiche.json` | Bereiche und Ausrüstung |
| `graduierung.json`, `pruefung.json` | Gürtelsystem und Prüfungsordnung (öffentlicher Teil) |
| `ergaenzungen.json` | Hintergrundtexte aus öffentlichen Quellen |
| `fitness/` | Übungen (eine Datei je Art), Geräte, Kurzprogramme |
| `ueber.json` | Texte über die Schule |

**Videolinks eintragen:** Alle Videolinks stehen in der Datei `data/videos.json`. Jede Technik und Übung hat dort einen Eintrag mit leerer Liste `"links": []`. Beispiel:

```json
{ "id": "t-seitei-1", "name": "1. Ipponme Mae", "bereich": "Iaido", "gruppe": "Seitei-Iai-Kata (ZNKR)",
  "links": [ { "titel": "Ausführung durch Sensei", "url": "https://www.youtube.com/watch?v=XXXXXXXXXXX" } ] }
```

Mehrere Videos pro Eintrag sind möglich (durch Komma getrennt). Ohne Link zeigt die App automatisch eine YouTube-Suche, mit Link das Video direkt und die Suche als Zusatz. Es zählen nur Links, die mit `http://` oder `https://` beginnen. Bearbeiten geht direkt auf GitHub: Datei öffnen, Stift-Symbol, ändern, „Commit changes“. Die Datei muss gültiges JSON bleiben (Anführungszeichen und Kommas beachten).

**Original-Scans:** Die Seitenbilder liegen in `assets/pages/` (`s01.jpg` bis `s37.jpg` entsprechen den gedruckten Seiten, dazu Deckblatt, Vorwort und Inhaltsverzeichnis). Wird ein Bild ausgetauscht, den Dateinamen ändern oder die Browser-Daten leeren, weil Bilder zwischengespeichert werden.

## Körpertraining: Hinweise

- Sessions und Pläne werden **nur im Browser des jeweiligen Geräts** gespeichert (nicht im Repository). Löscht jemand die Browserdaten, sind sie weg.
- Voreingestellte Ausrüstung: Matte und stabiler Stuhl. Übungen ohne Geräte (Körpergewicht) lassen sich mit einem eigenen Schalter ein- oder ausblenden. Alles andere wählt jeder selbst aus. Plan und Session nutzen nur Übungen, für die die Ausrüstung angehakt ist.
- Die Übungen stammen zum Teil aus der Fitness-App der Schule (allgemein gehalten) und sind eine Ergänzung. Der Bereich enthält bewusst **keine** Kampfkunst-Techniken.
- Neue Übungen werden in `data/fitness/uebungen-<art>.json` ergänzt (Felder `art`, `region`, `ziele`, `saetze`, `wdh` oder `sek`, `pause`).

## Quellen der Ergänzungen

- Karate-Begriffe (Beinwaffen, Tritte, Stände): Kyokushin-Liste der West Island Karate Schule (westislandkarate.com), englische Bedeutungen ins Deutsche übertragen, japanische Schrift ergänzt.
- Iaido-Begriffe (Schulen, Schnittarten, Schwertpflege, Etikette): Anregung aus „Iaido Terminology A-Z“ von Deborah Klens-Bigman (fightingarts.com) und aus der Begriffsliste des Agassiz Dojo (musoshindenryu.com). Die Übersetzungen und Formulierungen sind eigene, japanische Schrift ergänzt. Wo das Lehrwerk anders übersetzt, gilt das Lehrwerk.
- Kleidung: Anregung aus „Samurai Clothes: A Complete Guide“ (kamicrew.com) sowie allgemein bekanntes Wissen. Übersetzungen und Formulierungen sind eigene.
- Weitere Samurai-Waffen und -Ausrüstung: zusammengestellt aus allgemein bekanntem Wissen, abgeglichen mit mehreren Übersichtsseiten. Die Wikipedia-Kategorie „Samurai weapons and equipment“ war für den Abruf nicht erreichbar.
- Übungen und Programme zu Beweglichkeit und Beinkraft für Tritte: eigene Formulierungen. Anregung für den Aufbau (Aufwärmen mit Mobility, Aktivierung, Sprungkraft und Puls; statisches Dehnen nach dem Training) aus dem Ratgeber „How to Perform Higher Kicks“ von Trevor Hannant. Texte, Tabellen und Videos des Ratgebers sind **nicht** übernommen.

## Bekannte Hinweise

- Der Lehrwerktext wurde per Texterkennung aus dem Scan übertragen und gegen die Seitenbilder geprüft. Im Zweifel gilt der Original-Scan (in der App bei jeder Seite abrufbar).
- Im Graduierungssystem (Theorie) ist die Summe für den 1. Dan mit 85 angegeben, die Einzelwerte ergeben 95. Der Schwarzgurt-Bereich zeigt beides an.
- Punkteverteilungen und Anzahlen je Grad sind bewusst nur im Schwarzgurt-Bereich sichtbar.
- Die Zuordnung der Waffen und Materialien zu den Stufen im Graduierungssystem (Praxis) folgt der Spaltenaufteilung der Tabelle.
- Die japanische Schreibung von „Kyushin“ liegt nicht vor und ist deshalb nirgends angegeben.
- Die Fitness-Übungen sind eine Ergänzung. Sie ersetzen keine ärztliche oder trainerische Beratung.

## Technik und Dateistruktur

Statische Web-App aus HTML, CSS und JavaScript ohne Abhängigkeiten, ohne Tracking und ohne Server. Favoriten, Einstellungen, Pläne und Sessions werden nur lokal im Browser gespeichert. Offline-Nutzung über einen Service Worker.

```
index.html · manifest.webmanifest · sw.js
css/app.css
js/              Programm, aufgeteilt nach Themen
                 version.js (einzige Stelle für die Versionsnummer), kern.js, seiten.js, glossar.js,
                 quiz.js, graduierung.js, fitness.js, training.js, suche.js, schwarzgurt.js, ueber.js, start.js
data/            Inhalte (JSON), siehe data/README.md
  glossar/       eine Datei je Kategorie + index.json
  lehrwerk/      eine Datei je Kapitel + index.json
  fitness/       eine Datei je Übungsart + index.json
assets/pages/    Original-Scans des Lehrwerks
icons/           App-Symbole
tools/           pruefen.py (Datenprüfung), schwarzgurt_verschluesseln.py
tests/           automatische Tests (Node.js)
CHANGELOG.md     Änderungsliste
```

**Nach jeder Änderung:** `python3 tools/pruefen.py` ausführen, Versionsnummer in `js/version.js` erhöhen, Eintrag in `CHANGELOG.md` ergänzen.

## Urheberrecht

- Lehrwerk: © 2019 Yawara Kyushin Ryu und Tobias Riemer, mit Zustimmung des Autors in dieser App bereitgestellt.
- Die App ist kostenfrei und dient ausschließlich dem Lernen. Es bestehen keine finanziellen Gewinnansprüche.
- Quellen der Ergänzungen stehen bei den jeweiligen Artikeln in der App.
