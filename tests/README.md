# Automatische Tests

Die Tests spielen die App in einer simulierten Browser-Umgebung durch (alle Seiten, Glossar, Quiz, Suche, Favoriten, Körpertraining mit Sessions und Plänen, Entschlüsselung des Schwarzgurt-Bereichs). Sie ersetzen **keinen** Test auf einem echten Handy.

Voraussetzung: Node.js (ab Version 18).

```
cd tests
npm install
npm test
```

Für den Test des Schwarzgurt-Bereichs das Passwort als Umgebungsvariable setzen (Linux/Mac):

```
YKR_SG_PASSWORT="…" npm test
```

Ohne Passwort wird dieser eine Test übersprungen. Das Passwort gehört nie in das Repository.

Zusätzlich prüft `python3 tools/pruefen.py` (im Hauptordner) die Daten auf Fehler.
