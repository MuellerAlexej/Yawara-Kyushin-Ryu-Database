/* Schwarzgurt-Bereich (verschlüsselt, Entschlüsselung im Browser). */
'use strict';
/* ---------- Schwarzgurt-Bereich (verschlüsselt) ---------- */
let SG = null, SGSEL = '1. Dan';
async function sgDecrypt(pw) {
  if (!(window.crypto && crypto.subtle)) throw new Error('nocrypto');
  const r = await fetch('data/schwarzgurt.json'); if (!r.ok) throw new Error('nofile');
  const pk = await r.json(), b64 = s => Uint8Array.from(atob(s), c => c.charCodeAt(0)), enc = new TextEncoder();
  const k0 = await crypto.subtle.importKey('raw', enc.encode(pw), 'PBKDF2', false, ['deriveKey']);
  const key = await crypto.subtle.deriveKey({ name: 'PBKDF2', salt: b64(pk.salt), iterations: pk.iter, hash: 'SHA-256' }, k0, { name: 'AES-GCM', length: 256 }, false, ['decrypt']);
  const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: b64(pk.iv) }, key, b64(pk.ct));
  return JSON.parse(new TextDecoder().decode(pt));
}
function sgGradHtml(g) {
  const i = g.spalten.indexOf(SGSEL), th = g.theorie[SGSEL];
  const pr = Object.keys(g.praxis).map(k => [k, g.praxis[k][i]]).filter(r => r[1] != null);
  const mat = g.material.map(m => { const t = m.teile.filter(t => ALLG.indexOf(t.von) <= ALLG.indexOf(SGSEL) && ALLG.indexOf(SGSEL) <= ALLG.indexOf(t.bis))[0]; return t ? [m.bereich, t.x] : null; }).filter(Boolean);
  return `<div class="chips" role="group" aria-label="Dan-Grad">${g.spalten.map(c => `<button class="chip" data-sgsel="${esc(c)}" aria-pressed="${c === SGSEL}">${esc(c)}</button>`).join('')}</div>
  <h3>Praxis</h3><dl class="defs">${pr.map(r => `<dt>${esc(r[0])}</dt><dd>${esc(r[1])}</dd>`).join('')}</dl>${mat.length ? `<h3>Waffen und Material</h3><dl class="defs">${mat.map(r => `<dt>${esc(r[0])}</dt><dd>${esc(r[1])}</dd>`).join('')}</dl>` : ''}
  <h3>Theorie</h3>${th ? theorieTable(th) : '<p class="mute">Keine Angaben.</p>'}`;
}
function drawSG() {
  const a = SG.abschnitte;
  setPage(`<p class="kicker">Geschützter Bereich</p><div class="row"><h1>Schwarzgurt-Bereich <span class="jp" lang="ja" style="color:var(--accent)">黒帯</span></h1><button class="btn ghost small" data-act="sglock">Sperren</button></div>
  <div class="notice">Dieser Bereich ist nur für Dan-Träger gedacht. Inhalte nicht weitergeben. Beim Schließen der App wird er wieder gesperrt.</div>
  ${a.map(s => `<details class="item" ${s === a[0] ? 'open' : ''}><summary><strong>${esc(s.titel)}</strong></summary><div class="body">${s.grad ? `<div id="sggrad">${sgGradHtml(s.grad)}</div>` : `<div class="read">${renderBlocks(s.bloecke, { noPages: true })}</div>`}${s.quelle ? `<p class="mute" style="font-size:.82rem">Quelle: ${esc(s.quelle)}</p>` : ''}</div></details>`).join('')}`, 'Schwarzgurt', 'mehr');
}
function pSchwarzgurt() {
  if (SG) return drawSG();
  setPage(`<p class="kicker">Geschützter Bereich</p><h1>Schwarzgurt-Bereich <span class="jp" lang="ja" style="color:var(--accent)">黒帯</span></h1><p class="lead">Inhalte für Dan-Träger sind verschlüsselt gespeichert und werden erst im Browser mit dem Passwort geöffnet.</p>
  <form class="item" data-form="sg"><label for="sgp"><strong>Passwort</strong></label><input type="password" id="sgp" name="pw" autocomplete="current-password" required><p id="sgmsg" role="alert" class="mute"></p><button class="btn" type="submit">Entsperren</button></form>
  <p class="mute" style="font-size:.88rem">Das Passwort erhältst du von deinem Meister.</p>`, 'Schwarzgurt', 'mehr');
}
document.addEventListener('click', e => {
  const s = e.target.closest('[data-sgsel]'); if (s && SG) { SGSEL = s.dataset.sgsel; const g = SG.abschnitte.find(x => x.grad).grad; $('#sggrad').innerHTML = sgGradHtml(g); return; }
  const l = e.target.closest('[data-act=sglock]'); if (l) { SG = null; pSchwarzgurt(); }
});
