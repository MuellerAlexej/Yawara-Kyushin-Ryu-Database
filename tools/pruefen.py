#!/usr/bin/env python3
"""
Prüft die Daten und den Aufbau der YKR-Wissensdatenbank auf Fehler.

Aufruf (im Hauptordner des Repositories):   python3 tools/pruefen.py
Nur Python 3 nötig, keine weiteren Pakete. Rückgabewert 1, wenn Fehler gefunden wurden.

Geprüft werden unter anderem:
  - alle JSON-Dateien sind gültig (Kommas, Anführungszeichen)
  - IDs sind eindeutig (Glossar, Lehrwerk, Techniken, Übungen)
  - Verweise stimmen (Bereiche -> Lehrwerk, Techniken -> Lehrwerk, Programme -> Übungen, Quiz -> Glossar, Videos -> Techniken/Übungen)
  - Bilder, Skripte und Dateien des Offline-Dienstes sind vorhanden
  - Index-Dateien nennen alle Dateien ihres Ordners
"""
import json, os, re, sys
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
errors, warnings = [], []
def err(m): errors.append(m)
def warn(m): warnings.append(m)
def path(*p): return os.path.join(ROOT, *p)
def load(rel):
    try:
        with open(path(rel), encoding="utf-8") as f: return json.load(f)
    except FileNotFoundError: err(f"{rel}: Datei fehlt"); return None
    except json.JSONDecodeError as e: err(f"{rel}: ungültiges JSON (Zeile {e.lineno}, Spalte {e.colno}): {e.msg}"); return None

# 1) Alle JSON-Dateien lesbar
for dp, _, fns in os.walk(path("data")):
    for fn in fns:
        if fn.endswith(".json"): load(os.path.relpath(os.path.join(dp, fn), ROOT))
load("manifest.webmanifest")

# 2) Glossar
gi = load("data/glossar/index.json"); G = {}
if gi:
    listed = {d["datei"] for d in gi["dateien"]}
    for fn in os.listdir(path("data/glossar")):
        if fn.endswith(".json") and fn != "index.json" and fn not in listed: err(f"data/glossar/{fn}: nicht im Index eingetragen")
    for d in gi["dateien"]:
        j = load("data/glossar/" + d["datei"])
        if not j: continue
        if j.get("kategorie") != d["kategorie"]: err(f"{d['datei']}: Kategorie stimmt nicht mit dem Index überein")
        if d["kategorie"] not in gi["kategorien"]: err(f"{d['datei']}: Kategorie fehlt in der Kategorienliste")
        for e in j["eintraege"]:
            for k in ("id", "romaji", "de", "kat", "quelle"):
                if not e.get(k) and not (k == "de" and e.get("alt")): err(f"{d['datei']}: Eintrag ohne '{k}': {e.get('romaji') or e}")
            if e.get("kat") != d["kategorie"]: err(f"{e.get('id')}: kat passt nicht zur Datei")
            if e["id"] in G: err(f"Glossar: doppelte ID {e['id']}")
            G[e["id"]] = e
            if e.get("alt") is not None and not isinstance(e["alt"], list): err(f"{e['id']}: 'alt' muss eine Liste sein")

# 3) Lehrwerk
li = load("data/lehrwerk/index.json"); SEC = set()
if li:
    for k in li["kapitel"]:
        j = load("data/lehrwerk/" + k["datei"])
        if not j: continue
        for a in j["abschnitte"]:
            if a["id"] in SEC: err(f"Lehrwerk: doppelte Abschnitts-ID {a['id']}")
            SEC.add(a["id"])
            for b in a["bloecke"]:
                if b["t"] not in ("p", "q", "h", "ul", "ol", "dl", "table", "fig", "tree", "note"): err(f"{a['id']}: unbekannter Blocktyp {b['t']}")
                if b["t"] == "fig" and not os.path.exists(path("assets/pages", b["img"] + ".jpg")): err(f"{a['id']}: Bild {b['img']}.jpg fehlt")
                if "s" in b and not (0 <= b["s"] <= 37): err(f"{a['id']}: Seitenzahl {b['s']} außerhalb 0 bis 37")
for n in ["deckblatt", "vorwort", "inhalt"] + [f"s{i:02d}" for i in range(1, 38)]:
    if not os.path.exists(path("assets/pages", n + ".jpg")): err(f"assets/pages/{n}.jpg fehlt")

# 4) Fitness
fi = load("data/fitness/index.json"); EX = {}
if fi:
    gids = {g["id"] for g in fi["geraete"]}
    for d in fi["dateien"]:
        j = load("data/fitness/" + d["datei"])
        if not j: continue
        for e in j["uebungen"]:
            if e["id"] in EX: err(f"Übungen: doppelte ID {e['id']}")
            EX[e["id"]] = e
            if e["art"] != d["art"]: err(f"{e['id']}: Art passt nicht zur Datei")
            for g in e["geraet"]:
                if g not in gids: err(f"{e['id']}: unbekanntes Gerät '{g}'")
            if bool(e.get("wdh")) == bool(e.get("sek")): err(f"{e['id']}: genau eines von 'wdh' oder 'sek' nötig")
            for k in ("wdh", "sek"):
                if e.get(k) and (len(e[k]) != 2 or e[k][0] > e[k][1]): err(f"{e['id']}: '{k}' muss [von, bis] sein")
            if not e.get("cues"): warn(f"{e['id']}: keine Ausführungshinweise")
    for p in fi["programme"]:
        for s in p["schritte"]:
            if s[0] not in EX: err(f"Programm {p['id']}: Übung {s[0]} unbekannt")

# 5) Techniken, Bereiche, Ergänzungen
T = load("data/techniken.json"); B = load("data/bereiche.json"); ER = load("data/ergaenzungen.json"); TID = {}
if B: bids = {b["id"] for b in B["bereiche"]}; AID = {a["id"] for a in B["ausruestung"]}
if T and B:
    for t in T["techniken"]:
        if t["id"] in TID: err(f"Techniken: doppelte ID {t['id']}")
        TID[t["id"]] = t
        if t["bereich"] not in bids: err(f"{t['id']}: unbekannter Bereich {t['bereich']}")
        if t.get("abschnitt") and t["abschnitt"] not in SEC: err(f"{t['id']}: Lehrwerk-Abschnitt {t['abschnitt']} unbekannt")
    combos = {t["bereich"] + "|" + t["gruppe"] for t in T["techniken"]}
    for g in T.get("gruppen", []):
        if g["key"] not in combos: warn(f"Gruppentext ohne Technik: {g['key']}")
        if g.get("abschnitt") and g["abschnitt"] not in SEC: err(f"Gruppe {g['key']}: Abschnitt {g['abschnitt']} unbekannt")
if B:
    eids = {a["id"] for a in ER["artikel"]} if ER else set()
    for b in B["bereiche"]:
        for s in b["theorie"]:
            if s not in SEC: err(f"Bereich {b['id']}: Lehrwerk-Abschnitt {s} unbekannt")
        for e in b["ergaenzungen"]:
            if e not in eids: err(f"Bereich {b['id']}: Ergänzung {e} unbekannt")
        for a in b["ausruestung"]:
            if a not in AID: err(f"Bereich {b['id']}: Ausrüstung {a} unbekannt")
    for a in B["ausruestung"]:
        if a.get("abschnitt") and a["abschnitt"] not in SEC: err(f"Ausrüstung {a['id']}: Abschnitt {a['abschnitt']} unbekannt")

# 6) Quiz-Zuordnung und Videos
LZ = load("data/lernen.json")
if LZ:
    for k, ids in LZ["themen"].items():
        for i in ids:
            if i not in G: err(f"lernen.json Thema '{k}': Glossar-ID {i} unbekannt")
V = load("data/videos.json")
if V:
    known = set(TID) | set(EX) | ({p["id"] for p in fi["programme"]} if fi else set()); seen = set()
    for e in V["eintraege"]:
        if e["id"] in seen: err(f"videos.json: doppelte ID {e['id']}")
        seen.add(e["id"])
        if e["id"] not in known: warn(f"videos.json: ID {e['id']} gibt es nicht mehr")
        if not isinstance(e.get("links"), list): err(f"videos.json {e['id']}: 'links' muss eine Liste sein"); continue
        for l in e["links"]:
            if not re.match(r"^https?://", l.get("url", "")): err(f"videos.json {e['id']}: Link muss mit http:// oder https:// beginnen ({l.get('url')!r})")
    for i in known - seen: warn(f"videos.json: kein Eintrag für {i}")

# 7) Schwarzgurt (nur Struktur, der Inhalt ist verschlüsselt)
S = load("data/schwarzgurt.json")
if S:
    for k in ("v", "kdf", "iter", "salt", "iv", "ct"):
        if k not in S: err(f"data/schwarzgurt.json: Feld '{k}' fehlt")
    if S.get("iter", 0) < 100000: err("data/schwarzgurt.json: zu wenige Schlüsselrunden")

# 8) Skripte, Offline-Dienst, Version
html = open(path("index.html"), encoding="utf-8").read()
scripts = re.findall(r'<script src="([^"]+)"></script>', html)
for s in scripts:
    if not os.path.exists(path(s)): err(f"index.html: Skript {s} fehlt")
for fn in os.listdir(path("js")):
    if "js/" + fn not in scripts: err(f"js/{fn} wird in der index.html nicht geladen")
sw = open(path("sw.js"), encoding="utf-8").read()
for u in re.findall(r"'((?:data|js|css|icons)/[^']+|index\.html|manifest\.webmanifest)'", sw.split("const INDEXES")[0]):
    if not os.path.exists(path(u)): err(f"sw.js: {u} fehlt")
ver = re.search(r"YKR_VERSION = '([^']+)'", open(path("js/version.js"), encoding="utf-8").read())
if not ver: err("js/version.js: keine Versionsnummer")
elif os.path.exists(path("CHANGELOG.md")) and ("## " + ver.group(1)) not in open(path("CHANGELOG.md"), encoding="utf-8").read(): warn(f"CHANGELOG.md: kein Eintrag für Version {ver.group(1)}")
if ver and "videos.json" not in sw: warn("sw.js: videos.json nicht im Offline-Speicher")

print(f"Geprüft: {len(G)} Glossar-Einträge, {len(SEC)} Lehrwerk-Abschnitte, {len(EX)} Übungen, {len(TID)} Techniken" + (f", Version {ver.group(1)}" if ver else ""))
for w in warnings: print("Hinweis:", w)
for e in errors: print("FEHLER:", e)
print("Ergebnis:", "OK" if not errors else f"{len(errors)} Fehler", f"({len(warnings)} Hinweise)")
sys.exit(1 if errors else 0)
