const { JSDOM, VirtualConsole } = require('jsdom');
const fs = require('fs'), path = require('path'), { webcrypto } = require('crypto');
const ROOT = path.resolve(__dirname, '..');
const PW = process.env.YKR_SG_PASSWORT || '';  // Passwort des Schwarzgurt-Bereichs, nur für den Entschlüsselungs-Test
const errors = [];
const vc = new VirtualConsole();
vc.on('jsdomError', e => errors.push('jsdomError: ' + e.message));
vc.on('error', (...a) => errors.push('console.error: ' + a.join(' ')));
const html = fs.readFileSync(ROOT + '/index.html', 'utf8');
const dom = new JSDOM(html, { url: 'http://localhost/', runScripts: 'outside-only', pretendToBeVisual: true, virtualConsole: vc });
const w = dom.window;
w.scrollTo = () => {}; w.confirm = () => true; w.alert = m => errors.push('alert: ' + m);
Object.defineProperty(w, 'crypto', { value: webcrypto, configurable: true });
w.TextEncoder = TextEncoder; w.TextDecoder = TextDecoder;
w.fetch = async (u) => { const p = path.join(ROOT, String(u).replace(/^\//, '')); if (!fs.existsSync(p)) return { ok: false, status: 404 }; const t = fs.readFileSync(p, 'utf8'); return { ok: true, json: async () => JSON.parse(t) }; };
const sleep = ms => new Promise(r => setTimeout(r, ms));
const $ = s => w.document.querySelector(s), $$ = s => Array.from(w.document.querySelectorAll(s));
async function go(h) { w.location.hash = h; await sleep(30); }
let fail = 0; const ok = (c, m) => { if (!c) { fail++; console.log('FAIL:', m); } else console.log('ok  :', m); };
(async () => {
  const scripts = Array.from(html.matchAll(/<script src="([^"]+)"><\/script>/g)).map(m => m[1]);
  w.eval(scripts.map(s => fs.readFileSync(path.join(ROOT, s), 'utf8')).join('\n;\n'));  // wie im Browser: alle Skripte in der Reihenfolge der index.html
  await sleep(300);
  ok(/Wissensdatenbank/.test($('h1').textContent), 'Startseite lädt');
  ok($$('.grid .card').length >= 10, 'Karten auf Startseite: ' + $$('.grid .card').length);
  const D = w.YKR.D;
  // alle Lehrwerk-Abschnitte
  let n = 0;
  for (const k of D.lehrwerk.kapitel) for (const a of k.abschnitte) { await go('#/lehrwerk/' + a.id); if ($('article.read') && $('h1').textContent.length > 2) n++; else console.log('Abschnitt leer', a.id); }
  ok(n === 38, 'alle 38 Lehrwerk-Abschnitte rendern (' + n + ')');
  await go('#/lehrwerk'); ok($$('.list li').length >= 38, 'Inhaltsverzeichnis');
  // Seitenansicht
  await go('#/lehrwerk/l-2-3'); $('.pgmark').click(); await sleep(10); ok(!!$('#dlg img') && /s09/.test($('#dlg img').src), 'Originalseite öffnet'); $('[data-pgact=close]').click(); ok(!$('#dlg'), 'Originalseite schließt');
  // Bereiche
  for (const b of D.bereiche.bereiche) for (const t of ['theorie', 'ausruestung', 'techniken', 'uebungen', 'programme']) { if (b.id !== 'fitness' && (t === 'uebungen' || t === 'programme')) continue; await go(`#/bereich/${b.id}/${t}`); if (!$('h1')) console.log('leer', b.id, t); }
  await go('#/bereich/karate/techniken'); ok($$('details.item').length >= 40 && /Mawashi geri/.test($('#main').textContent) && /Kiba dachi/.test($('#main').textContent) && /Reiterstand/.test($('#main').textContent), 'Karate: Tritte und Stände sichtbar (' + $$('details.item').length + ')'); await go('#/bereich/iaido/techniken'); ok($$('details.item').length >= 25, 'Iaido-Techniken: ' + $$('details.item').length);
  ok(!$('table'), 'keine Kata-Anzahl öffentlich');
  for (const e of D.ergaenzungen.artikel) { await go('#/ergaenzung/' + e.id); ok($$('article.read p, article.read .note').length >= 1 && $$('article.read li').length >= 1, 'Ergänzung ' + e.id); }
  // Glossar
  await go('#/glossar'); ok($$('#gres .item').length === 100, 'Glossar zeigt 100 + mehr');
  const gq = $('#gq'); gq.value = 'kamae'; gq.dispatchEvent(new w.Event('input', { bubbles: true })); ok($$('#gres .item').length > 3 && $$('#gres .item').length < 40, 'Glossar-Filter: ' + $$('#gres .item').length);
  const gl = $('#gl'); gl.checked = true; gl.dispatchEvent(new w.Event('change', { bubbles: true })); ok($$('#gres .item').length > 0, 'Nur Lehrwerk-Filter');
  // Favorit
  await go('#/glossar'); $('#gres [data-fav]') ; const f = $('[data-fav]'); f.click(); ok(f.getAttribute('aria-pressed') === 'true', 'Favorit setzen');
  await go('#/favoriten'); ok($$('.item').length === 1, 'Favoriten-Liste');
  // Lernen: Mehrfachauswahl
  await go('#/lernen'); let form = $('form[data-form=quiz]'); ok($$('input[name=kat]').length === 27, 'Quiz: 27 Themenbereiche zur Auswahl');
  $$('input[name=kat]')[0].checked = true; $$('input[name=kat]')[2].checked = true; $$('input[name=kat]')[2].dispatchEvent(new w.Event('change', { bubbles: true }));
  const cntTxt = $('#qcount').textContent; ok(/\d+ passende/.test(cntTxt), 'Quiz: Zähler ' + cntTxt);
  form.elements.n.value = '10'; form.dispatchEvent(new w.Event('submit', { bubbles: true, cancelable: true })); await sleep(20);
  const first = D.glossar.eintraege.filter(e => ['Dojo und Etikette','Ränge, Titel, Anreden'].includes(e.kat)).length;
  ok(!!$('#opts'), 'Quiz startet mit Mehrfachauswahl');
  let q = 0; while ($('#opts') && q < 12) { $$('#opts button')[0].click(); const nx = $('[data-act=next]'); if (!nx) break; nx.click(); q++; }
  ok(/richtig/.test($('.term') ? $('.term').textContent : ''), 'Quiz endet mit Ergebnis (' + q + ' Fragen)');
  // Lernen: Prüfungsvorbereitung
  $('[data-act=again]').click(); form = $('form[data-form=quiz]');
  const rg = $$('input[name=src]')[1]; rg.checked = true; rg.dispatchEvent(new w.Event('change', { bubbles: true }));
  form.elements.grad.value = '1. Dan'; form.elements.grad.dispatchEvent(new w.Event('change', { bubbles: true }));
  ok(!$('#qgrad').classList.contains('hide') && /Tameshigiri/.test($('#qgradinfo').textContent), 'Quiz: Prüfungsvorbereitung 1. Dan zeigt Themen');
  form.elements.grad.value = '10. Kyu'; form.elements.grad.dispatchEvent(new w.Event('change', { bubbles: true }));
  ok(!/Tameshigiri/.test($('#qgradinfo').textContent) && parseInt($('#qcount').textContent) > 20, '10. Kyu ohne Tameshigiri: ' + $('#qcount').textContent);
  form.elements.n.value = '20'; form.dispatchEvent(new w.Event('submit', { bubbles: true, cancelable: true })); await sleep(20);
  ok(!!$('#opts'), 'Quiz zum 10. Kyu startet'); $('[data-act=quit]').click();
  // Videos: Technik ohne Link -> Suche, mit Link -> direkter Link
  await go('#/bereich/iaido/techniken'); ok(/youtube\.com\/results/.test($('#t-seitei-1').innerHTML) && !$('#t-seitei-1 .vids'), 'ohne Link: YouTube-Suche');
  w.eval("YKR.setVideos({eintraege:[{id:'t-seitei-1',links:[{titel:'Test',url:'https://www.youtube.com/watch?v=abc'},{titel:'böse',url:'javascript:alert(1)'}]}]})"); await go('#/bereich/iaido/theorie'); await go('#/bereich/iaido/techniken');
  ok($$('#t-seitei-1 .vids a').length === 1 && /watch\?v=abc/.test($('#t-seitei-1 .vids a').href) && /Weitere Videos/.test($('#t-seitei-1').textContent), 'mit Link: direkter Link, unsichere Links ignoriert');
  ok(/Kamae ist dynamisch/.test($('#main').textContent) && ($('#main').textContent.match(/Kamae ist dynamisch/g) || []).length === 1, 'Kamae-Text nur einmal je Gruppe');
  // Graduierung/Prüfung
  await go('#/graduierung'); ok($$('details.item').length === 5 && /Kōdansha/.test($('table').textContent) && !/BE\b/.test($('#main').textContent), 'Graduierung ohne Punkte, mit Einteilung');
  await go('#/pruefung'); ok($$('details.item').length === 7, 'Prüfungsordnung');
  // Fitness
  await go('#/bereich/fitness/uebungen'); const c0 = $$('#fxres details.item').length; ok(c0 > 15, 'Fitness ohne Geräte: ' + c0);
  $('[data-eq=kurzhantel]').click(); $('[data-eq=band]').click(); const c1 = $$('#fxres details.item').length; ok(c1 > c0, 'Fitness mit Kurzhantel+Matte: ' + c1);
  const fo = $('#fxo'); fo.checked = false; fo.dispatchEvent(new w.Event('change', { bubbles: true })); ok($$('#fxres details.item').length === D.fitness.uebungen.length, 'Alle Übungen: ' + $$('#fxres details.item').length);
  await go('#/bereich/fitness/programme'); ok($$('details.item').length === 8, 'Kurzprogramme (8)');
  // Körpertraining: Sessions
  const TRf = w.YKR.tr; const bad = [];
  for (const typ of ['dehnung', 'kraft', 'kondition', 'rumpf', 'ganzkoerper']) for (const min of [10, 15, 20, 30, 45, 60]) for (const lv of ['Einsteiger', 'Fortgeschritten']) {
    const st = TRf.buildSteps({ typ, minuten: min, level: lv }, TRf.rngFrom(42 + min)); const m = TRf.totalMin(st);
    if (!st.length || m < min * 0.75 || m > min * 1.2) bad.push(`${typ}/${min}/${lv}=${m}`);
  }
  ok(bad.length === 0, 'Sessions treffen die Dauer: ' + (bad.join(' | ') || 'alle ok'));
  // UI: Session erstellen
  await go('#/bereich/fitness/session'); $('#trtyp').value = 'dehnung'; $('#trmin').value = '30'; $('#trlv').value = 'Einsteiger';
  $('[data-act=tr-new]').click(); await sleep(10);
  ok($$('#trres .row strong').length >= 6 && /Min\./.test($('#trres').textContent), 'Dehnungs-Session (30 Min) wird angezeigt: ' + $$('#trres .row strong').length + ' Übungen');
  const firstEx = $$('#trres .row strong')[1].textContent; const sw = $$('[data-act=tr-swap]')[1]; sw.click(); await sleep(10);
  ok($$('#trres .row strong')[1].textContent !== firstEx, 'Tauschen ersetzt eine Übung');
  $('#trname').value = 'Meine Dehnung'; $('[data-act=tr-save]').click(); await sleep(10);
  ok(/Meine Dehnung/.test($('#main').textContent) && JSON.parse(w.localStorage.getItem('ykr.tr.sessions')).length === 1, 'Session wird lokal gespeichert');
  // Durchführung
  $('[data-act=tr-run-cur]').click(); await sleep(20);
  ok(/#\/training\/run/.test(w.location.hash) && $('h1').textContent.length > 2, 'Player startet: ' + $('h1').textContent);
  let guard = 0; while (TRf.run && TRf.run.phase !== 'done' && guard++ < 400) {
    const r = TRf.run; const main = $('[data-act=run-start]') || $('[data-act=run-set]') || $('[data-act=run-skip]') || $('[data-act=run-resume]');
    if (!main) break; main.click(); if (TRf.run.phase === 'work' || TRf.run.phase === 'rest') { let g2 = 0; while ((TRf.run.phase === 'work' || TRf.run.phase === 'rest') && g2++ < 400) TRf.tick(); }
  }
  ok(TRf.run && TRf.run.phase === 'done' && /Geschafft/.test($('h1').textContent), 'Session lässt sich komplett durchführen (' + guard + ' Schritte)');
  // Fertige Programme
  await go('#/bereich/fitness/session'); $('[data-act=tr-run-prog]').click(); await sleep(10); ok(/training\/run/.test(w.location.hash), 'Fertiges Programm startet'); $('[data-act=run-end]').click();
  // Pläne
  const pbad = [];
  for (const ziel of ['kraft', 'tritte', 'beweglichkeit', 'kondition', 'ganzkoerper', 'rumpf']) for (const tage of [2, 3, 4, 5]) for (const wo of [4, 12]) for (const lv of ['Einsteiger', 'Fortgeschritten']) {
    const pl = TRf.makePlan({ ziel, wochen: wo, tage, minuten: 30, level: lv });
    if (pl.weeks.length !== wo || pl.weeks.some(wk => wk.days.length !== tage || wk.days.some(d => !d.steps.length || new Set(d.steps.map(s => s.id)).size !== d.steps.length))) pbad.push(`${ziel}/${tage}/${wo}/${lv}`);
    if (wo === 12 && !(pl.weeks[3].deload && pl.weeks[7].deload && !pl.weeks[11].deload)) pbad.push('deload ' + ziel);
  }
  ok(pbad.length === 0, 'Pläne: alle Ziele, Tage, Wochen, Niveaus gültig ' + (pbad.slice(0, 5).join(' | ') || ''));
  const P8 = TRf.makePlan({ ziel: 'tritte', wochen: 8, tage: 3, minuten: 30, level: 'Einsteiger' });
  const names = new Set(P8.weeks.flatMap(wk => wk.days.flatMap(d => d.steps.map(s => w.YKR.D.fitness.uebungen.find(e => e.id === s.id).name)))); 
  ok(![...names].some(n => /Kata|Mae-geri|Mawashi|Kumite|Technik/i.test(n)), 'Tritte-Plan enthält keine Kampfkunst-Techniken (' + names.size + ' verschiedene Übungen)');
  const dose1 = P8.weeks[0].days[0].steps.find(s => s.phase === 'main' && s.wdh), dose7 = P8.weeks[6].days[0].steps.find(s => s.id === dose1.id);
  ok(!dose7 || dose7.wdh >= dose1.wdh, 'Belastung steigt (Woche 1: ' + (dose1 && dose1.wdh) + ' -> Woche 7: ' + (dose7 && dose7.wdh) + ')');
  // Plan über die Oberfläche
  await go('#/bereich/fitness/plan'); $('#plz').value = 'tritte'; $('#plw').value = '8'; $('#plt').value = '3'; $('#plm').value = '30'; $('#pll').value = 'Einsteiger';
  $('[data-act=tr-plan-create]').click(); await sleep(30);
  ok($$('details.item').length >= 8 && /0 von 24 Einheiten/.test($('#main').textContent), 'Plan wird angelegt (8 Wochen, 24 Einheiten)');
  const sw2 = $('[data-act=pl-swap]'); const before = sw2.closest('.row').querySelector('strong').textContent; sw2.click(); await sleep(10);
  ok($$('[data-act=pl-swap]')[0].closest('.row').querySelector('strong').textContent !== before, 'Tauschen im Plan wirkt');
  $('[data-act=pl-done]').click(); await sleep(10); ok(/1 von 24 Einheiten/.test($('#main').textContent), 'Einheit als erledigt markieren');
  $$('[data-act=pl-start]')[1].click(); await sleep(20); let g3 = 0; while (TRf.run && TRf.run.phase !== 'done' && g3++ < 600) { const m = $('[data-act=run-start]') || $('[data-act=run-set]') || $('[data-act=run-skip]') || $('[data-act=run-resume]'); if (!m) break; m.click(); let g4 = 0; while (TRf.run.phase === 'work' || TRf.run.phase === 'rest') { if (g4++ > 600) break; TRf.tick(); } }
  await go('#/bereich/fitness/plan'); ok(/2 von 24 Einheiten/.test($('#main').textContent), 'Plan-Einheit durchgeführt und automatisch abgehakt');
  ok(w.localStorage.getItem('ykr.tr.plans').length < 400000, 'Plan-Speicher klein: ' + Math.round(w.localStorage.getItem('ykr.tr.plans').length / 1024) + ' KB');
  // Favoriten: direkt zum angetippten Eintrag
  const ge = D.glossar.eintraege[250];
  await go('#/glossar/' + ge.id); ok($('#gres .item') && $('#gres .item').id === ge.id && $('#gres .item').classList.contains('focus'), 'Glossar-Favorit steht an erster Stelle (' + ge.romaji + ')');
  await go('#/glossar'); const gq2 = $('#gq'); ok(!$('#gres .item.focus') && gq2.value === '', 'ohne Fokus normale Liste');
  await go('#/bereich/karate/techniken/t-geri-mawashigeri'); ok($('#t-geri-mawashigeri') && $('#t-geri-mawashigeri').open === true, 'Technik-Favorit wird geöffnet');
  await go('#/bereich/fitness/uebungen/f-liegestuetz'); ok($('#f-liegestuetz') && $('#f-liegestuetz').open === true, 'Übungs-Favorit wird geöffnet');
  ok(/techniken\/t-geri/.test(w.YKR.doSearch('Mawashi geri')), 'Suchtreffer führt direkt zur Technik');
  // Klickbare Lehrwerk-Seitenangaben
  await go('#/glossar'); const bd = $('#gres .badge[data-page]'); ok(!!bd, 'Seitenangabe ist anklickbar'); bd.click(); await sleep(10);
  ok(!!$('#dlg img'), 'Klick auf Seitenangabe öffnet die Originalseite'); $('[data-pgact=close]').click();
  // Körpergewichtsübungen ein- und ausschalten
  w.localStorage.removeItem('ykr.koerperOff'); await go('#/bereich/fitness/uebungen'); const fo2 = $('#fxo'); fo2.checked = true; fo2.dispatchEvent(new w.Event('change', { bubbles: true })); const withBw = $$('#fxres details.item').length;
  $('[data-eq=koerper]').click(); const noBw = $$('#fxres details.item').length;
  ok(noBw < withBw && w.localStorage.getItem('ykr.koerperOff') === 'true', 'Körpergewicht abwählbar: ' + withBw + ' -> ' + noBw);
  const nbSes = TRf.buildSteps({ typ: 'kraft', minuten: 30, level: 'Einsteiger' }, TRf.rngFrom(5)); ok(nbSes.every(s => (w.YKR.D.fitness.uebungen.find(e => e.id === s.id).geraet || []).length > 0), 'Session ohne Körpergewichtsübungen');
  $('[data-eq=koerper]').click(); ok($$('#fxres details.item').length === withBw, 'Körpergewicht wieder zuschaltbar');
  // Suche
  for (const t of ['kamae', 'tameshigiri', 'mut', 'Kaiten', 'Bokken', 'sila', 'weiß']) { await go('#/suche/' + t); ok($$('#sres .item').length > 0, 'Suche "' + t + '": ' + $$('#sres .item').length); }
  ok(w.YKR.doSearch('xyzxyz').indexOf('Keine Treffer') >= 0, 'Suche ohne Treffer');
  if (PW) {
  // Schwarzgurt
  await go('#/schwarzgurt'); let fm = $('form[data-form=sg]'); fm.elements.pw.value = 'falsch-falsch'; fm.dispatchEvent(new w.Event('submit', { bubbles: true, cancelable: true })); await sleep(900);
  ok(/Passwort falsch/.test($('#sgmsg').textContent), 'falsches Passwort wird abgelehnt');
  fm = $('form[data-form=sg]'); fm.elements.pw.value = PW; fm.dispatchEvent(new w.Event('submit', { bubbles: true, cancelable: true })); await sleep(1500);
  ok(/Schwarzgurt-Bereich/.test($('h1').textContent) && $$('details.item').length === 5, 'richtiges Passwort öffnet Bereich');
  ok(/Dan-Träger/.test(w.document.body.textContent) && /Regeln die Regeln zu lehren/.test(w.document.body.textContent), 'Dan-Dojoregeln sichtbar');
  $('[data-sgsel="4. Dan"]').click(); ok(/Kumitachi/.test($('#sggrad').textContent) && /40/.test($('#sggrad').textContent), 'Dan-Anforderungen 4. Dan'); $('[data-sgsel="10. Kyu"]').click(); ok(/25 BE|BE/.test($('#sggrad').textContent) && /Kamae/.test($('#sggrad').textContent), 'Kyu-Punkte im Schwarzgurt-Bereich');ok(/zwei Drittel/.test(w.document.body.textContent), 'Bewertungsregeln im Schwarzgurt-Bereich');
  $('[data-act=sglock]').click(); ok(!!$('form[data-form=sg]'), 'Sperren funktioniert');
  } else console.log('skip: Schwarzgurt-Test (Umgebungsvariable YKR_SG_PASSWORT nicht gesetzt)');
  // Rest
  await go('#/ueber'); ok($$('details.item').length >= 5 && /App installieren/.test($('#main').textContent), 'Über-Seite mit Installationshilfe');
  const st = $('#st'); st.value = 'dark'; st.dispatchEvent(new w.Event('change', { bubbles: true })); ok(w.document.documentElement.getAttribute('data-theme') === 'dark', 'Dunkelmodus');
  await go('#/mehr'); await go('#/bereiche'); await go('#/gibtsnicht'); ok(/nicht gefunden/.test($('h1').textContent), '404');
  console.log('\nFehlerliste:', errors.length ? errors : 'keine'); console.log('FEHLSCHLÄGE:', fail);
  process.exit(fail || errors.length ? 1 : 0);
})().catch(e => { console.log('TESTABSTURZ', e); process.exit(2); });
