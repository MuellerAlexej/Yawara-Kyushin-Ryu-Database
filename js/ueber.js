/* Über die App: Installation, Schule, Einstellungen. */
'use strict';
/* ---------- Installation als App ---------- */
let deferredInstall = null;
const isStandalone = () => (window.matchMedia && matchMedia('(display-mode: standalone)').matches) || navigator.standalone === true;
window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); deferredInstall = e; const b = $('#installbtn'); if (b) b.classList.remove('hide'); });
window.addEventListener('appinstalled', () => { deferredInstall = null; });
function installHtml() {
  if (isStandalone()) return '';
  return `<div class="item"><h3>Als App auf dem Handy</h3><p>Die Wissensdatenbank lässt sich wie eine App installieren, bekommt ein Symbol auf dem Startbildschirm und funktioniert danach auch offline.</p>
  <button class="btn ${deferredInstall ? '' : 'hide'}" id="installbtn" data-act="install">App installieren</button>
  <details style="margin-top:8px"><summary>Anleitung für dein Handy</summary><ul><li><strong>Android (Chrome):</strong> Menü ⋮ → „App installieren“ oder „Zum Startbildschirm hinzufügen“.</li><li><strong>Samsung Internet:</strong> Menü ≡ → „Seite hinzufügen zu“ → „Startbildschirm“.</li><li><strong>iPhone (Safari):</strong> Teilen-Symbol → „Zum Home-Bildschirm“.</li></ul></details></div>`;
}
document.addEventListener('click', async e => {
  if (!e.target.closest('[data-act=install]') || !deferredInstall) return;
  deferredInstall.prompt(); try { await deferredInstall.userChoice; } catch (x) { /* egal */ } deferredInstall = null; const b = $('#installbtn'); if (b) b.classList.add('hide');
});

/* ---------- Über, Einstellungen ---------- */
function pUeber() {
  const U = D.ueber;
  setPage(`<h1>Über diese App</h1>
  <div class="item"><h3>Grundsatz</h3><p>Das <strong>Lehrwerk des Yawara Kyushin Ryu</strong> (1. Auflage, Tobias Riemer) ist die verbindliche Grundlage aller Inhalte. Alles, was nicht aus dem Lehrwerk stammt, ist als <span class="badge erg">Ergänzung</span> gekennzeichnet. Bei Abweichungen gilt das Lehrwerk. Der Text des Lehrwerks wurde aus dem Scan übertragen und geprüft, zu jeder Seite lässt sich der Original-Scan öffnen.</p><p class="mute" style="font-size:.88rem">${esc(D.lehrwerk.copyright)}. Das Lehrwerk wird mit Zustimmung des Autors in dieser App bereitgestellt. Die App ist kostenfrei und dient ausschließlich dem Lernen.</p></div>
  <h2>Die Schule</h2>${U.abschnitte.map(s => `<details class="item"><summary><strong>${esc(s.titel)}</strong></summary><div class="body">${(s.text || []).map(t => `<p>${esc(t)}</p>`).join('')}${s.punkte ? `<ul>${s.punkte.map(p => `<li>${esc(p)}</li>`).join('')}</ul>` : ''}<p class="mute" style="font-size:.82rem">Quelle: ${esc(s.quelle)}</p></div></details>`).join('')}
  ${installHtml()}<h2>Einstellungen</h2><div class="item"><label for="st"><strong>Darstellung</strong></label><select id="st" data-set="theme"><option value="auto" ${settings.theme === 'auto' ? 'selected' : ''}>Automatisch (Gerät)</option><option value="light" ${settings.theme === 'light' ? 'selected' : ''}>Hell</option><option value="dark" ${settings.theme === 'dark' ? 'selected' : ''}>Dunkel</option></select>
  <p></p><label for="sf"><strong>Schriftgröße</strong></label><select id="sf" data-set="fs"><option value="1" ${settings.fs == 1 ? 'selected' : ''}>Normal</option><option value="1.15" ${settings.fs == 1.15 ? 'selected' : ''}>Groß</option><option value="1.3" ${settings.fs == 1.3 ? 'selected' : ''}>Sehr groß</option></select>
  <p></p><label class="f"><input type="checkbox" id="sm" data-set="macrons" ${settings.macrons ? 'checked' : ''}> Längungszeichen in Umschrift anzeigen (ō, ū)</label>
  <p></p><button class="btn ghost small" data-act="reset">Favoriten und Einstellungen zurücksetzen</button></div>
  <p class="foot">Version ${VERSION} · Funktioniert offline, nachdem sie einmal geladen wurde.</p>`, 'Über', 'mehr');
}
document.addEventListener('change', e => {
  const s = e.target.dataset && e.target.dataset.set; if (!s) return;
  settings[s] = s === 'macrons' ? e.target.checked : s === 'fs' ? parseFloat(e.target.value) : e.target.value; store.set('settings', settings); applySettings();
});
document.addEventListener('click', e => { if (e.target.closest('[data-act=reset]') && confirm('Favoriten und Einstellungen auf diesem Gerät wirklich löschen?')) { ['fav', 'settings', 'equip', 'koerperOff', 'last'].forEach(k => { try { localStorage.removeItem('ykr.' + k); } catch (x) { /* egal */ } }); location.reload(); } });
function pNotFound() { setPage('<h1>Seite nicht gefunden</h1><p><a class="btn" href="#/">Zur Startseite</a></p>', 'Nicht gefunden', 'start'); }
