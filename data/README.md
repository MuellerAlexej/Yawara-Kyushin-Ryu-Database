# Daten der App

Alle Inhalte liegen als JSON-Dateien in diesem Ordner. Das Programm (Ordner `js/`) muss für neue Inhalte nicht geändert werden. Nach jeder Änderung `python3 tools/pruefen.py` ausführen.

| Ort | Inhalt |
|---|---|
| `glossar/` | Begriffe, **eine Datei je Kategorie**, dazu `index.json` mit Kategorienliste und Dateinamen |
| `lehrwerk/` | Text des Lehrwerks, **eine Datei je Kapitel**, dazu `index.json` |
| `fitness/` | Übungen, **eine Datei je Art** (kraft, dehnung, mobility, rumpf, kondition), dazu `index.json` mit Geräten, Gruppen und Kurzprogrammen |
| `techniken.json` | Techniken je Bereich, dazu Gruppentexte unter `gruppen` |
| `bereiche.json` | Bereiche (Theorie, Ausrüstung) |
| `ergaenzungen.json` | Hintergrundtexte aus öffentlichen Quellen |
| `graduierung.json`, `pruefung.json` | Gürtelsystem und Prüfungsordnung (öffentlicher Teil) |
| `lernen.json` | Zuordnung der Prüfungsthemen je Grad zu Glossar-IDs (Quiz) |
| `videos.json` | Videolinks zu Techniken und Übungen |
| `ueber.json` | Texte über die Schule |
| `schwarzgurt.json` | **Verschlüsselt**, nur mit `tools/schwarzgurt_verschluesseln.py` neu erzeugen |

## Neuen Glossar-Eintrag anlegen

In die Datei der passenden Kategorie (`glossar/<kategorie>.json`) unter `eintraege` ergänzen:

```json
{ "id": "g-beispiel", "romaji": "Beispiel", "jp": "例", "de": "Deutsche Übersetzung", "kat": "Name der Kategorie", "quelle": "Ergänzung", "alt": ["weitere Übersetzung"], "hinweis": "optional" }
```

- `id` muss eindeutig sein und mit `g-` beginnen.
- `kat` muss genau dem Namen der Kategorie entsprechen.
- `quelle`: `Ergänzung` oder `Lehrwerk S. 9` (die Seitenangabe wird in der App anklickbar).
- `alt` und `hinweis` sind optional.
- Neue Kategorie: neue Datei anlegen und in `glossar/index.json` unter `kategorien` und `dateien` eintragen.

## Neue Übung anlegen

In `fitness/uebungen-<art>.json` ergänzen. Wichtige Felder: `id` (beginnt mit `f-`), `name`, `art`, `region`, `geraet` (Liste, leer = ohne Geräte), `level` (Einsteiger oder Fortgeschritten), `saetze`, **entweder** `wdh` **oder** `sek` als `[von, bis]`, `pause`, `seite` (true, wenn je Seite), `cues` (Ausführungshinweise), `ziele` (zum Beispiel `kraft`, `tritte`, `beweglichkeit`).

## Videolinks

Siehe `videos.json`: bei der Technik oder Übung unter `links` einen Eintrag `{ "titel": "…", "url": "https://…" }` ergänzen.
