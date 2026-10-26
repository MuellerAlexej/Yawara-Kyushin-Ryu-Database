/* Körpertraining (Teil 2): Sessions, Trainingspläne, geführte Durchführung. */
'use strict';
/* ================= Körpertraining: Sessions, Trainingspläne, Durchführung ================= */
const EXM = {};
const TRART = [['dehnung', 'Dehnung und Mobility'], ['kraft', 'Kraft'], ['kondition', 'Kondition und Ausdauer'], ['rumpf', 'Rumpf'], ['ganzkoerper', 'Ganzkörper']];
const TRZIEL = [['kraft', 'Kraft aufbauen'], ['tritte', 'Beweglichkeit und Kraft für Tritte'], ['beweglichkeit', 'Beweglichkeit verbessern'], ['kondition', 'Kondition und Ausdauer'], ['ganzkoerper', 'Fitness für den ganzen Körper'], ['rumpf', 'Rumpf stärken']];
const trLabel = (list, k) => (list.find(x => x[0] === k) || [k, k])[1];
const trGet = (k, d) => store.get('tr.' + k, d), trSet = (k, v) => store.set('tr.' + k, v);
const eqStored = () => store.get('equip', ['matte', 'stuhl']);
function rngFrom(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
function shuffleR(arr, rnd) { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); const t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
function stepSec(st) { const e = EXM[st.id] || {}, work = st.sek || ((st.wdh || 10) * 3.5), sides = e.seite ? 2 : 1; return Math.round(st.saetze * work * sides + Math.max(0, st.saetze - 1) * (st.pause || 30) + 25); }
const totalMin = steps => Math.round(steps.reduce((a, s) => a + stepSec(s), 0) / 60);
function dosisText(st) { const e = EXM[st.id] || {}, w = st.sek ? (st.sek >= 120 ? Math.round(st.sek / 60) + ' Min.' : st.sek + ' s') : st.wdh + ' Wdh.'; return st.saetze + ' × ' + w + (e.seite ? ' je Seite' : ''); }
function dose(e, p, deload, level) {
  let sets = e.saetze || 3, wdh = null, sek = null;
  if (e.wdh) wdh = Math.round(e.wdh[0] + (e.wdh[1] - e.wdh[0]) * p);
  if (e.sek) { const v = e.sek[0] + (e.sek[1] - e.sek[0]) * p; sek = v > 300 ? Math.round(v / 60) * 60 : Math.round(v / 5) * 5; }
  if (e.art === 'kraft' && level === 'Fortgeschritten' && p >= 0.5 && sets < 4) sets += 1;
  if (deload) { sets = Math.max(1, sets - 1); if (e.wdh) wdh = e.wdh[0]; if (e.sek) sek = e.sek[0]; }
  return { id: e.id, saetze: sets, wdh, sek, pause: e.pause || 30 };
}
const trPool = level => { const have = haveEq(); return D.fitness.uebungen.filter(e => exOk(e, have) && (level !== 'Einsteiger' || e.level === 'Einsteiger')); };
const WARM = ['f-hampelmann', 'f-beinschwingen', 'f-katze-kuh', 'f-wgs', 'f-seilspringen', 'f-knie-brust', 'f-ferse-gesaess', 'f-hueftoeffner'];
const MUS = { kraft: ['beine', 'druck', 'zug', 'rumpf', 'schulter', 'beine', 'zug', 'druck', 'rumpf'], ganzkoerper: ['beine', 'druck', 'zug', 'rumpf', 'kondition', 'beine', 'schulter', 'zug'], rumpf: ['rumpf'], kondition: ['kondition', 'kondition', 'rumpf'] };
function byRegion(list, rnd) { const reg = {}; shuffleR(list, rnd).forEach(e => { (reg[e.region] = reg[e.region] || []).push(e); }); return reg; }
function buildSteps(spec, rnd) {
  const T = spec.minuten * 60, p = spec.p == null ? 0.4 : spec.p, lv = spec.level, typ = spec.typ;
  let pool = trPool(lv);
  if (spec.ziel) { const z = pool.filter(e => e.ziele.indexOf(spec.ziel) >= 0); if (z.length >= 8) pool = z; }
  const used = new Set(), steps = []; let tot = 0;
  const mk = (e, phase) => {
    const st = dose(e, p, spec.deload, lv); st.phase = phase;
    if (e.id === 'f-dauerlauf') { st.saetze = 1; st.sek = Math.max(600, Math.min(2400, Math.round((T - tot) * 0.6 / 60) * 60)); st.pause = 0; }
    if (e.id === 'f-intervall') { st.saetze = Math.max(4, Math.min(10, Math.round((T - tot) * 0.5 / 120))); st.sek = 60; st.pause = 60; st.wdh = null; }
    return st;
  };
  const add = (e, phase) => { const st = mk(e, phase); used.add(e.id); steps.push(st); tot += stepSec(st); };
  const fits = (e, phase, cap) => tot + stepSec(mk(e, phase)) <= cap;
  const arts = a => pool.filter(e => a.indexOf(e.art) >= 0 && !used.has(e.id));
  const warm = typ !== 'dehnung' && spec.minuten >= 15, cool = warm;
  if (warm) shuffleR(WARM.map(id => EXM[id]).filter(e => e && pool.indexOf(e) >= 0), rnd).slice(0, spec.minuten >= 30 ? 2 : 1).forEach(e => add(e, 'warm'));
  const mainCap = T - (cool ? Math.round(T * 0.1) : 0);
  if (typ === 'dehnung') {
    shuffleR(arts(['mobility']), rnd).slice(0, spec.minuten >= 20 ? 2 : 1).forEach(e => add(e, 'warm'));
    const reg = byRegion(arts(['dehnung']), rnd); let order = Object.keys(reg);
    order = spec.regionen ? order.filter(r => spec.regionen.indexOf(r) >= 0).concat(order.filter(r => spec.regionen.indexOf(r) < 0)) : shuffleR(order, rnd);
    for (let g = 0; g < 80 && tot < T * 0.96; g++) { let any = false; for (const r of order) { const c = reg[r].find(e => !used.has(e.id) && fits(e, 'main', T * 1.06)); if (c) { add(c, 'main'); any = true; if (tot >= T * 0.96) break; } } if (!any) break; }
  } else {
    const seq = spec.muster || MUS[typ] || MUS.kraft; let miss = 0;
    for (let g = 0; g < 60 && tot < mainCap * 0.97 && miss < seq.length * 2; g++) {
      const m = seq[g % seq.length]; let cands = shuffleR(pool.filter(e => e.region === m && ['kraft', 'rumpf', 'kondition'].indexOf(e.art) >= 0 && !used.has(e.id)), rnd);
      if (lv === 'Fortgeschritten') cands = cands.filter(e => e.level === 'Fortgeschritten').concat(cands.filter(e => e.level !== 'Fortgeschritten'));
      const c = cands.find(e => fits(e, 'main', mainCap * 1.08) && !((e.id === 'f-dauerlauf' || e.id === 'f-intervall') && spec.minuten < 20));
      if (c) { add(c, 'main'); miss = 0; } else miss++;
    }
    if (cool) { const reg = byRegion(arts(['dehnung']), rnd), order = shuffleR(Object.keys(reg), rnd); const coolCap = Math.round(T * 0.16); let coolTot = 0; for (let g = 0; order.length && g < 30 && tot < T * 0.98 && coolTot < coolCap; g++) { const c = reg[order[g % order.length]].find(e => !used.has(e.id) && fits(e, 'cool', T * 1.08)); if (c) { const before = tot; add(c, 'cool'); coolTot += tot - before; } } }
    if (!spec.deload) { const mains = steps.filter(x => x.phase === 'main' && x.id !== 'f-dauerlauf'); for (let g = 0; mains.length && g < 12 && tot < T * 0.88; g++) { const s = mains[g % mains.length]; if (s.saetze >= 5) continue; s.saetze++; tot += Math.round((s.sek || s.wdh * 3.5) * ((EXM[s.id] || {}).seite ? 2 : 1) + (s.pause || 30)); } }
  }
  return steps;
}
function makeSession(f, seed) {
  const steps = buildSteps({ typ: f.typ, minuten: f.minuten, level: f.level }, rngFrom(seed));
  return { id: 's' + Date.now().toString(36) + Math.floor(Math.random() * 1000), name: trLabel(TRART, f.typ) + ' · ' + f.minuten + ' Min.', typ: f.typ, minuten: f.minuten, level: f.level, seed, steps };
}
const Dy = (f, t, o) => Object.assign({ f, t }, o || {});
function dayList(ziel, n) {
  const U = Dy('Unterkörper und Rumpf', 'kraft', { m: ['beine', 'beine', 'rumpf', 'beine', 'rumpf'] }), O = Dy('Oberkörper', 'kraft', { m: ['druck', 'zug', 'schulter', 'druck', 'zug'] }), O2 = Dy('Oberkörper Zug und Hüfte', 'kraft', { m: ['zug', 'beine', 'zug', 'schulter', 'rumpf'] }), G = Dy('Ganzkörper', 'kraft'), G2 = Dy('Ganzkörper B', 'kraft', { m: ['zug', 'druck', 'beine', 'schulter', 'rumpf'] }), GK = Dy('Ganzkörper', 'ganzkoerper'), RK = Dy('Rumpf', 'rumpf'), BW = Dy('Beweglichkeit', 'dehnung', { short: true });
  const BK = Dy('Beinkraft und Hüfte', 'kraft', { z: 'tritte', m: ['beine', 'beine', 'rumpf', 'beine', 'beine'] }), HB = Dy('Hüftbeweglichkeit', 'dehnung', { z: 'tritte', r: ['huefte', 'beine'] }), RB = Dy('Rumpf und Gleichgewicht', 'rumpf', { z: 'tritte' }), SK = Dy('Sprungkraft und Kondition', 'kondition', { z: 'tritte' });
  const H1 = Dy('Hüfte und Beine', 'dehnung', { r: ['huefte', 'beine'] }), H2 = Dy('Rücken und Schultern', 'dehnung', { r: ['ruecken', 'schulter', 'nacken'] }), H3 = Dy('Ganzkörper', 'dehnung'), HK = Dy('Hüfte kurz', 'dehnung', { r: ['huefte'], short: true });
  const KA = Dy('Zirkel', 'kondition'), KB = Dy('Ausdauer', 'kondition', { m: ['kondition'] }), KC = Dy('Kondition und Rumpf', 'kondition', { m: ['kondition', 'rumpf', 'kondition', 'rumpf'] });
  const L = { kraft: { 2: [G, G2], 3: [U, O, G], 4: [U, O, Dy('Rumpf und Kondition', 'ganzkoerper', { m: ['rumpf', 'kondition', 'rumpf', 'kondition'] }), O2], 5: [U, O, BW, O2, G] },
    tritte: { 2: [BK, HB], 3: [BK, HB, RB], 4: [BK, HB, RB, SK], 5: [BK, HB, RB, SK, Dy('Hüftbeweglichkeit kurz', 'dehnung', { z: 'tritte', r: ['huefte', 'beine'], short: true })] },
    beweglichkeit: { 2: [H1, H2], 3: [H1, H2, H3], 4: [H1, H2, H3, HK], 5: [H1, H2, H3, HK, Dy('Rücken kurz', 'dehnung', { r: ['ruecken'], short: true })] },
    kondition: { 2: [KA, KC], 3: [KA, KB, KC], 4: [KA, KB, KC, BW], 5: [KA, KB, KC, RK, BW] },
    ganzkoerper: { 2: [GK, Dy('Ganzkörper B', 'ganzkoerper')], 3: [GK, Dy('Ganzkörper B', 'ganzkoerper'), BW], 4: [GK, Dy('Ganzkörper B', 'ganzkoerper'), KA, BW], 5: [GK, Dy('Ganzkörper B', 'ganzkoerper'), KA, RK, BW] },
    rumpf: { 2: [RK, Dy('Rumpf B', 'rumpf')], 3: [RK, Dy('Rumpf B', 'rumpf'), BW], 4: [RK, Dy('Rumpf B', 'rumpf'), KC, BW], 5: [RK, Dy('Rumpf B', 'rumpf'), KC, BW, RB] } };
  return L[ziel][n];
}
function makePlan(f) {
  const seed = Math.floor(Math.random() * 1e9), days = dayList(f.ziel, f.tage), W = f.wochen, weeks = [];
  for (let w = 1; w <= W; w++) {
    const deload = W >= 5 && w % 4 === 0 && w !== W, p = W > 1 ? (w - 1) / (W - 1) : 0.5, blk = Math.floor((w - 1) / 4);
    weeks.push({ nr: w, deload, p, days: days.map((d, i) => { const basis = d.short ? Math.min(20, f.minuten) : f.minuten, minuten = deload ? Math.max(10, Math.round(basis * 0.75 / 5) * 5) : basis; return { fokus: d.f, typ: d.t, minuten, steps: buildSteps({ typ: d.t, minuten, level: f.level, p, deload, ziel: d.z, muster: d.m, regionen: d.r }, rngFrom(seed + i * 977 + blk * 131)) }; }) });
  }
  return { id: 'p' + Date.now().toString(36), name: trLabel(TRZIEL, f.ziel) + ' · ' + W + ' Wochen', ziel: f.ziel, level: f.level, wochen: W, tage: f.tage, minuten: f.minuten, created: Date.now(), done: {}, weeks };
}
/* ---- Oberflächen ---- */
function eqChips() { const have = haveEq(); return `<div class="chips" id="eq"><button type="button" class="chip" data-eq="koerper" aria-pressed="${have.has('koerper')}">Übungen ohne Geräte (Körpergewicht)</button>${D.fitness.geraete.filter(g => !g.fix).map(g => `<button type="button" class="chip" data-eq="${g.id}" aria-pressed="${have.has(g.id)}">${esc(g.name)}</button>`).join('')}</div>`; }
const optList = (list, cur) => list.map(x => `<option value="${esc(x[0])}" ${String(x[0]) === String(cur) ? 'selected' : ''}>${esc(x[1])}</option>`).join('');
const TR = { cur: null, prefs: null, newPlan: false, planId: null };
const trPrefs = () => Object.assign({ typ: 'dehnung', minuten: 30, level: 'Einsteiger', ziel: 'kraft', wochen: 8, tage: 3, pmin: 30 }, trGet('prefs', {}));
function stepsHtml(steps, o) {
  o = o || {}; const lab = { warm: 'Aufwärmen', main: 'Hauptteil', cool: 'Dehnen zum Abschluss' }; let last = null, h = '';
  steps.forEach((st, i) => {
    const e = EXM[st.id]; if (!e) return;
    if (st.phase !== last) { const hasPh = steps.some(s => s.phase !== steps[0].phase); if (hasPh) h += `<h3 style="margin:.9em 0 .3em;font-size:.95rem;color:var(--accent)">${lab[st.phase] || ''}</h3>`; last = st.phase; }
    h += `<div class="row" style="padding:8px 0;border-bottom:1px solid var(--line);align-items:center"><div><strong>${esc(e.name)}</strong><br><span class="mute" style="font-size:.88rem">${esc(dosisText(st))} · ${esc(e.gruppe)}</span></div>${o.swap ? `<button class="btn ghost small" data-act="${o.swap}" ${o.attrs || ''} data-i="${i}">Tauschen</button>` : ''}</div>`;
  });
  return h || '<p class="mute">Keine passenden Übungen. Wähle mehr Ausrüstung oder ein anderes Niveau.</p>';
}
function sessionCard(s, saved) {
  return `<div class="item"><div class="row"><div><h3>${esc(s.name)}</h3><div class="meta"><span class="badge">ca. ${totalMin(s.steps)} Min.</span><span class="badge">${s.steps.length} Übungen</span><span class="badge">${esc(s.level)}</span></div></div></div>${stepsHtml(s.steps, saved ? null : { swap: 'tr-swap' })}
  <p style="margin-top:12px"><button class="btn" data-act="${saved ? 'tr-run-saved' : 'tr-run-cur'}" ${saved ? `data-id="${esc(s.id)}"` : ''}>Session starten</button> ${saved ? `<button class="btn ghost" data-act="tr-del-sess" data-id="${esc(s.id)}">Löschen</button>` : `<button class="btn ghost" data-act="tr-reshuffle">Neu mischen</button>`}</p>
  ${saved ? '' : `<div class="row" style="margin-top:6px;gap:8px"><input type="text" id="trname" value="${esc(s.name)}" aria-label="Name der Session" maxlength="50"><button class="btn ghost" data-act="tr-save">Speichern</button></div>`}</div>`;
}
function trSessionTab() {
  const pr = trPrefs(), saved = trGet('sessions', []);
  return `<h2 style="margin-top:.2em">Session zusammenstellen</h2><p class="mute">Wähle Art und Dauer, die App stellt passende Übungen zusammen. Zum Beispiel 30 Minuten Dehnen.</p>
  <div class="item"><label for="trtyp"><strong>Art</strong></label><select id="trtyp">${optList(TRART, pr.typ)}</select><p></p>
  <label for="trmin"><strong>Dauer</strong></label><select id="trmin">${optList([10, 15, 20, 30, 40, 45, 60].map(m => [m, m + ' Minuten']), pr.minuten)}</select><p></p>
  <label for="trlv"><strong>Niveau</strong></label><select id="trlv">${optList([['Einsteiger', 'Einsteiger'], ['Fortgeschritten', 'Fortgeschritten']], pr.level)}</select><p></p>
  <strong>Meine Ausrüstung</strong>${eqChips()}<button class="btn" data-act="tr-new">Session erstellen</button></div>
  <div id="trres">${TR.cur ? sessionCard(TR.cur, false) : ''}</div>
  <h2>Fertige Programme</h2>${D.fitness.programme.map(p => `<details class="item"><summary><strong>${esc(p.name)}</strong></summary><div class="body"><p>${esc(p.beschr)}</p><ol>${p.schritte.map(s => `<li>${esc((EXM[s[0]] || {}).name)} · ${esc(s[1])}</li>`).join('')}</ol><button class="btn" data-act="tr-run-prog" data-id="${p.id}">Starten</button></div></details>`).join('')}
  <h2>Meine Sessions</h2>${saved.length ? saved.map(s => `<details class="item"><summary><strong>${esc(s.name)}</strong><span class="badge">ca. ${totalMin(s.steps)} Min.</span></summary><div class="body">${sessionCard(s, true)}</div></details>`).join('') : '<p class="mute">Noch keine gespeicherten Sessions. Erstelle oben eine Session und tippe auf „Speichern“.</p>'}`;
}
function curPlan() { const pl = trGet('plans', []); return pl.find(p => p.id === TR.planId) || pl[0] || null; }
function planDayKey(w, d) { return w + '-' + d; }
function planHtml(pl) {
  const total = pl.weeks.reduce((a, w) => a + w.days.length, 0), done = Object.keys(pl.done).length;
  const cw = (pl.weeks.find(w => w.days.some((d, i) => !pl.done[planDayKey(w.nr, i)])) || pl.weeks[pl.weeks.length - 1]).nr;
  return `<div class="item"><h3>${esc(pl.name)}</h3><div class="meta"><span class="badge">${pl.tage} Tage pro Woche</span><span class="badge">${esc(pl.level)}</span><span class="badge">${done} von ${total} Einheiten</span></div><div class="progress" aria-hidden="true"><i style="width:${Math.round(done / total * 100)}%"></i></div>
  <p class="mute" style="font-size:.9rem">Die Wiederholungen oder Haltezeiten steigen von Woche zu Woche. Jede vierte Woche ist eine Entlastungswoche mit weniger Sätzen. Alle vier Wochen wechseln die Übungen. Schaffst du am Ende alle Sätze im oberen Bereich, nimm etwas mehr Gewicht oder eine schwerere Variante.</p>
  <button class="btn ghost small" data-act="tr-plan-del" data-id="${pl.id}">Plan löschen</button></div>` +
    pl.weeks.map(w => `<details class="item" ${w.nr === cw ? 'open' : ''}><summary><strong>Woche ${w.nr}</strong> ${w.deload ? '<span class="badge">Entlastung</span>' : ''}<span class="mute">${w.days.filter((d, i) => pl.done[planDayKey(w.nr, i)]).length}/${w.days.length}</span></summary><div class="body">${w.days.map((d, i) => { const k = planDayKey(w.nr, i), dn = !!pl.done[k]; return `<div class="item" style="margin:8px 0"><div class="row"><div><strong>Tag ${i + 1}: ${esc(d.fokus)}</strong><br><span class="mute" style="font-size:.88rem">ca. ${totalMin(d.steps)} Min. · ${d.steps.length} Übungen</span></div><button class="star" data-act="pl-done" data-pl="${pl.id}" data-w="${w.nr}" data-d="${i}" aria-pressed="${dn}" aria-label="Als erledigt markieren">${dn ? '✓' : '○'}</button></div><details style="margin-top:6px"><summary>Übungen ansehen</summary>${stepsHtml(d.steps, { swap: 'pl-swap', attrs: `data-pl="${pl.id}" data-w="${w.nr}" data-d="${i}"` })}</details><p style="margin:8px 0 0"><button class="btn small" data-act="pl-start" data-pl="${pl.id}" data-w="${w.nr}" data-d="${i}">Starten</button></p></div>`; }).join('')}</div></details>`).join('');
}
function trPlanTab() {
  const plans = trGet('plans', []), pr = trPrefs();
  const form = `<div class="item"><h3>Neuen Plan erstellen</h3><label for="plz"><strong>Ziel</strong></label><select id="plz">${optList(TRZIEL, pr.ziel)}</select><p></p>
  <label for="plw"><strong>Dauer</strong></label><select id="plw">${optList([4, 6, 8, 12].map(m => [m, m + ' Wochen']), pr.wochen)}</select><p></p>
  <label for="plt"><strong>Trainingstage pro Woche</strong></label><select id="plt">${optList([2, 3, 4, 5].map(m => [m, m + ' Tage']), pr.tage)}</select><p></p>
  <label for="plm"><strong>Dauer pro Einheit</strong></label><select id="plm">${optList([20, 30, 45, 60].map(m => [m, m + ' Minuten']), pr.pmin)}</select><p></p>
  <label for="pll"><strong>Niveau</strong></label><select id="pll">${optList([['Einsteiger', 'Einsteiger'], ['Fortgeschritten', 'Fortgeschritten']], pr.level)}</select><p></p>
  <strong>Meine Ausrüstung</strong>${eqChips()}<p class="mute" style="font-size:.88rem">Der Plan nutzt nur Übungen, für die du die Ausrüstung angehakt hast. Er enthält ausschließlich Kraft-, Beweglichkeits- und Konditionsübungen.</p><button class="btn" data-act="tr-plan-create">Plan erstellen</button></div>`;
  if (!plans.length || TR.newPlan) return `<p class="mute">Lass dir einen Trainingsplan für mehrere Wochen bauen. Er wird nur auf deinem Gerät gespeichert.</p>${form}${plans.length ? '<p><button class="btn ghost" data-act="tr-plan-back">Zurück zu meinen Plänen</button></p>' : ''}`;
  const pl = curPlan();
  return `<div class="row" style="gap:8px;margin-bottom:8px"><select id="plsel" aria-label="Plan wählen">${plans.map(p => `<option value="${p.id}" ${p.id === pl.id ? 'selected' : ''}>${esc(p.name)}</option>`).join('')}</select><button class="btn ghost" data-act="tr-plan-new">Neuer Plan</button></div>${planHtml(pl)}`;
}
function trRerender() { const t = (location.hash.split('/')[3] || 'session'); pFitness(t === 'programme' ? 'session' : t); }
function readSessionForm() { const pr = trPrefs(); pr.typ = $('#trtyp').value; pr.minuten = parseInt($('#trmin').value, 10); pr.level = $('#trlv').value; trSet('prefs', pr); return pr; }
function swapStep(steps, i, p, deload, level) {
  const st = steps[i], e = EXM[st.id], used = new Set(steps.map(s => s.id));
  const pool = trPool(level).filter(x => !used.has(x.id) && x.art === e.art);
  let c = pool.filter(x => x.region === e.region); if (!c.length) c = pool;
  c = c.sort((a, b) => a.id < b.id ? -1 : 1); if (!c.length) return null; st.alt = (st.alt || 0) + 1; const n = c[st.alt % c.length], ns = dose(n, p, deload, level); ns.phase = st.phase; ns.alt = st.alt; return ns;
}
/* ---- Durchführung ---- */
let RUN = null, AC = null, WL = null;
const fmtClock = s => Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
function beep(long) { try { AC = AC || new (window.AudioContext || window.webkitAudioContext)(); const o = AC.createOscillator(), g = AC.createGain(); o.connect(g); g.connect(AC.destination); o.frequency.value = long ? 880 : 660; g.gain.value = 0.15; o.start(); o.stop(AC.currentTime + (long ? 0.35 : 0.1)); if (long && navigator.vibrate) navigator.vibrate(200); } catch (x) { /* kein Ton */ } }
function runUnits(steps) {
  const u = [];
  steps.forEach((st, si) => { const e = EXM[st.id] || {}, sides = e.seite ? 2 : 1; for (let s = 1; s <= st.saetze; s++) for (let sd = 1; sd <= sides; sd++) u.push({ si, set: s, sets: st.saetze, side: sides === 2 ? sd : 0, time: !!st.sek, secs: st.sek || 0, wdh: st.wdh, rest: sd < sides ? 5 : (s === st.saetze ? 0 : (st.pause || 30)) }); });
  return u;
}
function startRun(title, steps, ref) {
  if (!steps.length) return; RUN = { title, steps: steps.map(s => Object.assign({}, s)), units: runUnits(steps), u: 0, phase: 'ready', t: 0, timer: null, paused: false, ref: ref || null, start: Date.now() };
  try { AC = AC || new (window.AudioContext || window.webkitAudioContext)(); if (AC.resume) AC.resume(); } catch (x) { /* egal */ }
  try { if (navigator.wakeLock) navigator.wakeLock.request('screen').then(l => { WL = l; }).catch(() => { }); } catch (x) { /* egal */ }
  location.hash = '#/training/run'; if (location.hash === '#/training/run') drawRun();
}
function runTimer() { const r = RUN; clearInterval(r.timer); r.timer = setInterval(runTick, 1000); r.paused = false; }
function runTick() { const r = RUN; if (!r || r.paused) return; r.t--; const c = $('#runclock'); if (c) c.textContent = fmtClock(Math.max(r.t, 0)); if (r.t > 0 && r.t <= 3) beep(false); if (r.t <= 0) runAdvance(); }
function runAdvance() {
  const r = RUN, un = r.units[r.u]; clearInterval(r.timer); r.timer = null; beep(true);
  if (r.phase === 'work' && un.rest > 0) { r.phase = 'rest'; r.t = un.rest; drawRun(); runTimer(); } else runNext(r.phase === 'rest');
}
function runNext(auto) {
  const r = RUN; r.u++;
  if (r.u >= r.units.length) { r.phase = 'done'; clearInterval(r.timer); r.timer = null; if (WL && WL.release) { try { WL.release(); } catch (x) { /* egal */ } WL = null; } if (r.ref) { const pl = trGet('plans', []), p = pl.find(x => x.id === r.ref.pl); if (p) { p.done[planDayKey(r.ref.w, r.ref.d)] = Date.now(); trSet('plans', pl); } } drawRun(); return; }
  const nu = r.units[r.u]; r.phase = 'ready'; r.t = 0;
  if (auto && nu.time) { r.phase = 'work'; r.t = nu.secs; drawRun(); runTimer(); } else drawRun();
}
function drawRun() {
  const r = RUN; if (!r) { setPage('<h1>Keine Session aktiv</h1><p><a class="btn" href="#/bereich/fitness">Zum Körpertraining</a></p>', 'Training', 'bereich'); return; }
  if (r.phase === 'done') { const min = Math.max(1, Math.round((Date.now() - r.start) / 60000)); setPage(`<h1>Geschafft</h1><div class="q bigpad"><div class="term">${esc(r.title)}</div><p>Du hast ${r.steps.length} Übungen in etwa ${min} Minuten abgeschlossen.${r.ref ? ' Die Einheit ist im Plan als erledigt markiert.' : ''}</p><p><a class="btn" href="#/bereich/fitness/${r.ref ? 'plan' : 'session'}">Fertig</a></p></div>`, 'Geschafft', 'bereich'); return; }
  const un = r.units[r.u], st = r.steps[un.si], e = EXM[st.id], nextSt = (r.units.slice(r.u + 1).find(x => x.si !== un.si) || {}).si;
  const clock = (r.phase === 'work' || r.phase === 'rest') ? `<div class="term" style="text-align:center;font-size:3.2rem;margin:.2em 0" id="runclock" role="timer">${fmtClock(Math.max(r.t, 0))}</div><p style="text-align:center" class="mute">${r.phase === 'rest' ? 'Pause' : 'Halten'}${r.paused ? ' (angehalten)' : ''}</p>` : '';
  let btns = '';
  if (r.phase === 'ready') btns = un.time ? `<button class="btn" data-act="run-start">Start (${un.secs >= 120 ? Math.round(un.secs / 60) + ' Min.' : un.secs + ' s'})</button>` : `<button class="btn" data-act="run-set">Satz erledigt</button>`;
  else if (r.paused) btns = '<button class="btn" data-act="run-resume">Weiter</button>';
  else btns = `<button class="btn" data-act="run-skip">${r.phase === 'rest' ? 'Pause überspringen' : 'Fertig'}</button> <button class="btn ghost" data-act="run-pause">Anhalten</button>`;
  setPage(`<div class="progress" aria-hidden="true"><i style="width:${Math.round(r.u / r.units.length * 100)}%"></i></div><p class="kicker">${esc(r.title)} · Schritt ${r.u + 1} von ${r.units.length}</p>
  <div class="q"><h1 style="margin-bottom:.2em">${esc(e.name)}</h1><p class="mute" style="margin:0 0 .6em">Satz ${un.set} von ${un.sets}${un.side ? ' · ' + (un.side === 1 ? 'erste Seite' : 'zweite Seite') : ''} · ${esc(dosisText(st))}</p>${clock}<p>${btns}</p>
  ${r.phase === 'ready' || r.phase === 'work' ? `<ul>${e.cues.slice(0, 3).map(c => `<li>${esc(c)}</li>`).join('')}</ul>` : ''}${nextSt != null && r.phase !== 'work' ? `<p class="mute" style="font-size:.9rem">Danach: ${esc(EXM[r.steps[nextSt].id].name)}</p>` : ''}</div>
  <p><button class="btn ghost small" data-act="run-back">Zurück</button> <button class="btn ghost small" data-act="run-end">Beenden</button></p>`, e.name, 'bereich');
}
function pRun() { drawRun(); }
document.addEventListener('click', e => {
  const b = e.target.closest('[data-act^="tr-"],[data-act^="pl-"],[data-act^="run-"]'); if (!b) return; const a = b.dataset.act, plans = () => trGet('plans', []);
  if (a === 'tr-new' || a === 'tr-reshuffle') { const pr = readSessionForm ? (a === 'tr-new' ? readSessionForm() : trPrefs()) : trPrefs(); TR.cur = makeSession(pr, Math.floor(Math.random() * 1e9)); trRerender(); }
  else if (a === 'tr-swap') { const i = +b.dataset.i, s = TR.cur, n = swapStep(s.steps, i, 0.4, false, s.level); if (n) { s.steps[i] = n; trRerender(); } else alert('Es gibt keine passende Alternative.'); }
  else if (a === 'tr-save') { const s = TR.cur, nm = ($('#trname') || {}).value; if (!s) return; const sv = trGet('sessions', []); sv.unshift(Object.assign({}, s, { name: (nm || s.name).trim() || s.name })); trSet('sessions', sv); trRerender(); }
  else if (a === 'tr-run-cur') startRun(TR.cur.name, TR.cur.steps);
  else if (a === 'tr-run-saved') { const s = trGet('sessions', []).find(x => x.id === b.dataset.id); if (s) startRun(s.name, s.steps); }
  else if (a === 'tr-del-sess') { if (confirm('Session löschen?')) { trSet('sessions', trGet('sessions', []).filter(x => x.id !== b.dataset.id)); trRerender(); } }
  else if (a === 'tr-run-prog') { const p = D.fitness.programme.find(x => x.id === b.dataset.id); startRun(p.name, p.schritte.map(s => Object.assign(dose(EXM[s[0]], 0.4, false, 'Fortgeschritten'), { phase: 'main' }))); }
  else if (a === 'tr-plan-new') { TR.newPlan = true; trRerender(); }
  else if (a === 'tr-plan-back') { TR.newPlan = false; trRerender(); }
  else if (a === 'tr-plan-create') {
    const pr = trPrefs(); pr.ziel = $('#plz').value; pr.wochen = +$('#plw').value; pr.tage = +$('#plt').value; pr.pmin = +$('#plm').value; pr.level = $('#pll').value; trSet('prefs', pr);
    const pl = makePlan({ ziel: pr.ziel, wochen: pr.wochen, tage: pr.tage, minuten: pr.pmin, level: pr.level });
    if (pl.weeks.some(w => w.days.some(d => !d.steps.length))) { alert('Mit der gewählten Ausrüstung und dem Niveau lässt sich kein vollständiger Plan bauen. Hake mehr Ausrüstung an (zum Beispiel Matte) oder wähle „Fortgeschritten“.'); return; }
    const all = plans(); all.unshift(pl); trSet('plans', all); TR.planId = pl.id; TR.newPlan = false; trRerender();
  }
  else if (a === 'tr-plan-del') { if (confirm('Diesen Plan wirklich löschen?')) { trSet('plans', plans().filter(x => x.id !== b.dataset.id)); TR.planId = null; trRerender(); } }
  else if (a === 'pl-done') { const all = plans(), p = all.find(x => x.id === b.dataset.pl), k = planDayKey(b.dataset.w, b.dataset.d); if (p.done[k]) delete p.done[k]; else p.done[k] = Date.now(); trSet('plans', all); const open = $$('details[open]').map(x => (x.querySelector('summary') || {}).textContent); trRerender(); $$('details').forEach(x => { if (open.indexOf((x.querySelector('summary') || {}).textContent) >= 0) x.open = true; }); }
  else if (a === 'pl-start') { const p = plans().find(x => x.id === b.dataset.pl), wk = p.weeks[b.dataset.w - 1], d = wk.days[b.dataset.d]; startRun('Woche ' + wk.nr + ' · ' + d.fokus, d.steps, { pl: p.id, w: wk.nr, d: +b.dataset.d }); }
  else if (a === 'pl-swap') {
    const all = plans(), p = all.find(x => x.id === b.dataset.pl), w0 = +b.dataset.w, di = +b.dataset.d, si = +b.dataset.i, old = p.weeks[w0 - 1].days[di].steps[si];
    const n = swapStep(p.weeks[w0 - 1].days[di].steps, si, p.weeks[w0 - 1].p, p.weeks[w0 - 1].deload, p.level); if (!n) { alert('Es gibt keine passende Alternative.'); return; }
    const blk = Math.floor((w0 - 1) / 4);
    p.weeks.forEach(w => { if (Math.floor((w.nr - 1) / 4) !== blk) return; const dd = w.days[di], s = dd && dd.steps[si]; if (s && s.id === old.id) { const ne = EXM[n.id], ns = dose(ne, w.p, w.deload, p.level); ns.phase = s.phase; ns.alt = n.alt; dd.steps[si] = ns; } });
    trSet('plans', all); const open = $$('details[open]').map(x => (x.querySelector('summary') || {}).textContent); trRerender(); $$('details').forEach(x => { if (open.indexOf((x.querySelector('summary') || {}).textContent) >= 0) x.open = true; });
  }
  else if (RUN && a.indexOf('run-') === 0) {
    const r = RUN, un = r.units[r.u];
    if (a === 'run-start') { r.phase = 'work'; r.t = un.secs; drawRun(); runTimer(); }
    else if (a === 'run-set') { if (un.rest > 0) { r.phase = 'rest'; r.t = un.rest; drawRun(); runTimer(); } else runNext(false); }
    else if (a === 'run-skip') { clearInterval(r.timer); r.timer = null; if (r.phase === 'work' && un.rest > 0) { r.phase = 'rest'; r.t = un.rest; drawRun(); runTimer(); } else runNext(r.phase === 'rest'); }
    else if (a === 'run-pause') { r.paused = true; clearInterval(r.timer); r.timer = null; drawRun(); }
    else if (a === 'run-resume') { r.paused = false; drawRun(); runTimer(); }
    else if (a === 'run-back') { clearInterval(r.timer); r.timer = null; r.u = Math.max(0, r.u - 1); r.phase = 'ready'; r.paused = false; drawRun(); }
    else if (a === 'run-end') { if (confirm('Training wirklich beenden?')) { clearInterval(r.timer); RUN = null; if (WL && WL.release) { try { WL.release(); } catch (x) { /* egal */ } WL = null; } location.hash = '#/bereich/fitness'; } }
  }
});
document.addEventListener('change', e => { if (e.target.id === 'plsel') { TR.planId = e.target.value; trRerender(); } });
