#!/usr/bin/env python3
"""
Verschlüsselt den Schwarzgurt-Bereich für die YKR-Wissensdatenbank.

Verwendung:
  python3 tools/schwarzgurt_verschluesseln.py schwarzgurt_klartext.json
  python3 tools/schwarzgurt_verschluesseln.py schwarzgurt_klartext.json --passwort "MeinNeuesPasswort"

Das Ergebnis liegt danach in data/schwarzgurt.json und kann auf GitHub hochgeladen werden.
Die Klartext-Datei (schwarzgurt_klartext.json) darf NIEMALS in das Repository hochgeladen werden.

Voraussetzung: Python 3 und das Paket "cryptography" (pip install cryptography).
Verfahren: PBKDF2-HMAC-SHA256 (250.000 Runden) und AES-256-GCM, kompatibel mit der Web-Crypto-API des Browsers.
"""
import argparse, base64, getpass, json, os, sys
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC

ITER = 250_000
b64 = lambda b: base64.b64encode(b).decode("ascii")

def key_from(pw: str, salt: bytes) -> bytes:
    return PBKDF2HMAC(algorithm=hashes.SHA256(), length=32, salt=salt, iterations=ITER).derive(pw.encode("utf-8"))

def main():
    ap = argparse.ArgumentParser(description="Schwarzgurt-Bereich verschlüsseln")
    ap.add_argument("eingabe", help="Klartext-Datei (JSON)")
    ap.add_argument("--ausgabe", default=os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "data", "schwarzgurt.json"))
    ap.add_argument("--passwort", help="Passwort (sonst wird danach gefragt)")
    a = ap.parse_args()
    pw = a.passwort
    if not pw:
        pw = getpass.getpass("Neues Passwort (mindestens 10 Zeichen): ")
        if pw != getpass.getpass("Passwort wiederholen: "):
            sys.exit("Die Passwörter stimmen nicht überein.")
    if len(pw) < 10:
        sys.exit("Das Passwort ist zu kurz (mindestens 10 Zeichen).")
    with open(a.eingabe, "rb") as f:
        raw = f.read()
    json.loads(raw.decode("utf-8"))  # prüft, dass es gültiges JSON ist
    salt, iv = os.urandom(16), os.urandom(12)
    ct = AESGCM(key_from(pw, salt)).encrypt(iv, raw, None)
    out = {"v": 1, "kdf": "PBKDF2-SHA256", "iter": ITER, "salt": b64(salt), "iv": b64(iv), "ct": b64(ct)}
    with open(a.ausgabe, "w", encoding="utf-8") as f:
        json.dump(out, f)
    # Gegenprobe
    chk = AESGCM(key_from(pw, base64.b64decode(out["salt"]))).decrypt(base64.b64decode(out["iv"]), base64.b64decode(out["ct"]), None)
    assert chk == raw
    print("Fertig:", os.path.normpath(a.ausgabe))

if __name__ == "__main__":
    main()
