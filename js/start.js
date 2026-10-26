/* Start: Formulare, Routing, Datenladen, Initialisierung. */
'use strict';
/* ---------- Formulare, Routing, Start ---------- */
document.addEventListener('submit', async e => {
  const f = e.target.closest('form[data-form]'); if (!f) return; e.preventDefault();
  const t = f.dataset.form;
  if (t === 'search') { const q = f.elements.q.value.trim(); location.hash = '#/suche/' + encodeURIComponent(q); }
  if (t === 'quiz') startLearn(f, (e.submitter && e.submitter.value) || 'quiz');
  if (t === 'sg') {
    const msg = $('#sgmsg'); msg.textContent = 'Wird geprüft …';
    try { SG = await sgDecrypt(f.elements.pw.value); drawSG(); }
    catch (err) { msg.textContent = err.message === 'nocrypto' ? 'Dieser Browser kann den Bereich hier nicht öffnen (benötigt eine sichere https-Verbindung).' : err.message === 'nofile' ? 'Der Bereich ist noch nicht eingerichtet.' : 'Passwort falsch.'; }
  }
});
function route() {
  closePage();
  if (RUN && RUN.timer && (location.hash || '').indexOf('#/training') !== 0) { clearInterval(RUN.timer); RUN.timer = null; RUN.paused = true; }
  const p = (location.hash || '#/').replace(/^#/, '').split('/').filter(Boolean).map(x => { try { return decodeURIComponent(x); } catch (e) { return x; } });
  try {
    switch (p[0] || '') {
      case '': pHome(); break;
      case 'lehrwerk': p[1] ? pAbschnitt(p[1]) : pLehrwerk(); break;
      case 'bereiche': pBereiche(); break;
      case 'bereich': pBereich(p[1], p[2], p[3]); break;
      case 'ergaenzung': pErgaenzung(p[1]); break;
      case 'glossar': G.focus = ''; if (p[1] && D.glossar.eintraege.some(x => x.id === p[1])) { G.focus = p[1]; G.q = ''; G.kat = ''; G.lw = false; G.limit = 100; } pGlossar(); break;
      case 'lernen': pLernen(); break;
      case 'graduierung': pGraduierung(); break;
      case 'pruefung': pPruefung(); break;
      case 'suche': pSuche(p[1]); break;
      case 'favoriten': pFavoriten(); break;
      case 'schwarzgurt': pSchwarzgurt(); break;
      case 'training': pRun(); break;
      case 'mehr': pMehr(); break;
      case 'ueber': pUeber(); break;
      default: pNotFound();
    }
  } catch (err) { console.error(err); setPage('<h1>Fehler</h1><p>Beim Anzeigen ist ein Fehler aufgetreten. <a href="#/">Zur Startseite</a></p>', 'Fehler', 'start'); }
}
async function init() {
  applySettings();
  try {
    await loadAll();
  } catch (err) {
    view().innerHTML = '<h1>Daten konnten nicht geladen werden</h1><p>Bitte Verbindung prüfen und die Seite neu laden.</p><p><button class="btn" onclick="location.reload()">Neu laden</button></p>'; return;
  }
  try { const vr = await fetch('data/videos.json'); if (vr.ok) loadVideos(await vr.json()); } catch (err) { console.warn('videos.json konnte nicht gelesen werden – es wird die YouTube-Suche verwendet.'); }
  D.fitness.uebungen.forEach(e => { EXM[e.id] = e; }); indexLehrwerk(); window.addEventListener('hashchange', route); route();
  if ('serviceWorker' in navigator && /^https?:/.test(location.protocol)) {
    const had = !!navigator.serviceWorker.controller; let reloaded = false;
    navigator.serviceWorker.register('sw.js').catch(() => { });
    navigator.serviceWorker.addEventListener('controllerchange', () => { if (had && !reloaded) { reloaded = true; location.reload(); } });
  }
}
window.YKR = { D, route, init, doSearch, tr: { buildSteps, makePlan, makeSession, totalMin, dayList, rngFrom, stepSec, startRun, tick: () => runTick(), get run() { return RUN; }, swapStep, dose, TRART, TRZIEL }, setVideos: v => { Object.keys(VID).forEach(k => delete VID[k]); loadVideos(v); } };
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
window.YKR = { D, route, init, doSearch, tr: { buildSteps, makePlan, makeSession, totalMin, dayList, rngFrom, stepSec, startRun, tick: () => runTick(), get run() { return RUN; }, swapStep, dose, TRART, TRZIEL }, setVideos: v => { Object.keys(VID).forEach(k => delete VID[k]); loadVideos(v); } };
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
