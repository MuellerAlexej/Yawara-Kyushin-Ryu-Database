/* Suche und Favoriten. */
'use strict';
/* ---------- Suche ---------- */
let IDX = null;
const fold = s => String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
function buildIndex() {
  const o = [];
  SECLIST.forEach(a => o.push({ k: 'Lehrwerk', t: secTitle(a), u: '#/lehrwerk/' + a.id, x: a.bloecke.map(blockText).join(' '), b: pages(a) }));
  D.glossar.eintraege.forEach(e => o.push({ k: 'Glossar', t: ro(e.romaji) + (e.jp ? ' ' + e.jp : ''), u: '#/glossar/' + e.id, x: e.de + ' ' + e.kat, b: e.quelle }));
  D.techniken.techniken.forEach(t => o.push({ k: 'Techniken', t: t.name + (t.jp ? ' ' + t.jp : ''), u: '#/bereich/' + t.bereich + '/techniken/' + t.id, x: t.text + ' ' + t.gruppe, b: t.quelle }));
  D.ergaenzungen.artikel.forEach(a => o.push({ k: 'Ergänzungen', t: a.titel, u: '#/ergaenzung/' + a.id, x: a.bloecke.map(blockText).join(' '), b: 'Ergänzung' }));
  D.fitness.uebungen.forEach(f => o.push({ k: 'Fitness', t: f.name, u: '#/bereich/fitness/uebungen/' + f.id, x: f.cues.join(' ') + ' ' + f.muskeln.join(' ') + ' ' + f.budo.join(' '), b: 'Ergänzung' }));
  D.bereiche.ausruestung.forEach(a => o.push({ k: 'Ausrüstung', t: a.name, u: a.abschnitt ? '#/lehrwerk/' + a.abschnitt : '#/bereiche', x: a.text, b: a.quelle }));
  D.pruefung.abschnitte.forEach(a => o.push({ k: 'Prüfung', t: a.titel + ' (Prüfungsordnung)', u: '#/pruefung', x: a.punkte.join(' '), b: 'Prüfungsordnung' }));
  Object.keys(D.graduierung.themen).forEach(c => o.push({ k: 'Prüfung', t: 'Prüfung ' + c, u: '#/graduierung', x: D.graduierung.themen[c].join(' ') + ' ' + D.graduierung.bereiche[c].join(' '), b: 'Graduierungssystem' }));
  o.forEach(i => { i.n = norm(i.t + ' ' + i.x); i.nt = norm(i.t); });
  return o;
}
function doSearch(q) {
  const toks = norm(q).split(' ').filter(Boolean); if (!toks.length) return '<p class="mute">Gib einen Suchbegriff ein, zum Beispiel „Kamae“, „Tameshigiri“ oder „Mut“.</p>';
  if (!IDX) IDX = buildIndex();
  const order = ['Lehrwerk', 'Glossar', 'Techniken', 'Ergänzungen', 'Ausrüstung', 'Prüfung', 'Fitness'];
  const res = IDX.filter(i => toks.every(t => i.n.indexOf(t) >= 0)).map(i => ({ i, s: toks.reduce((a, t) => a + (i.nt.indexOf(t) >= 0 ? 5 : 1), 0) + (i.nt === toks.join(' ') ? 10 : 0) })).sort((a, b) => b.s - a.s).slice(0, 80);
  if (!res.length) return `<p class="mute">Keine Treffer für „${esc(q)}“.</p>`;
  const snip = (x) => { const fx = fold(x), p = fx.indexOf(fold(toks[0])); if (p < 0) return esc(x.slice(0, 120)); const a = Math.max(0, p - 50); return (a > 0 ? '…' : '') + esc(x.slice(a, p + 110)) + '…'; };
  return order.map(k => { const r = res.filter(z => z.i.k === k); return r.length ? `<h2>${k} <span class="badge">${r.length}</span></h2>${r.map(z => `<a class="item" style="display:block;text-decoration:none;color:var(--ink)" href="${z.i.u}"><strong>${esc(z.i.t)}</strong> ${badge(z.i.b)}<p class="mute" style="font-size:.88rem">${snip(z.i.x)}</p></a>`).join('')}` : ''; }).join('');
}
function pSuche(q) {
  q = q || '';
  setPage(`<h1>Suche</h1><form class="search" data-form="search" role="search"><input type="search" name="q" id="sq" value="${esc(q)}" placeholder="Begriff, Technik, Thema …" aria-label="Suchbegriff" autofocus><button class="btn" type="submit">Suchen</button></form><div id="sres" aria-live="polite">${doSearch(q)}</div>`, 'Suche', 'start');
}
document.addEventListener('input', e => { if (e.target.id === 'sq') { $('#sres').innerHTML = doSearch(e.target.value); try { history.replaceState(null, '', '#/suche/' + encodeURIComponent(e.target.value)); } catch (x) { /* egal */ } } });

/* ---------- Favoriten ---------- */
function pFavoriten() {
  const ids = Array.from(favs), rows = [];
  ids.forEach(id => {
    if (id.startsWith('l-') && SEC[id]) rows.push(['Lehrwerk', secTitle(SEC[id]), '#/lehrwerk/' + id, id]);
    else if (id.startsWith('g-')) { const e = D.glossar.eintraege.find(x => x.id === id); if (e) rows.push(['Glossar', ro(e.romaji) + ': ' + e.de, '#/glossar/' + id, id]); }
    else if (id.startsWith('t-')) { const t = D.techniken.techniken.find(x => x.id === id); if (t) rows.push(['Techniken', t.name, '#/bereich/' + t.bereich + '/techniken/' + id, id]); }
    else if (id.startsWith('f-')) { const f = D.fitness.uebungen.find(x => x.id === id); if (f) rows.push(['Fitness', f.name, '#/bereich/fitness/uebungen/' + id, id]); }
  });
  setPage(`<h1>Favoriten</h1><p class="lead">Deine Favoriten bleiben auf diesem Gerät gespeichert.</p>${rows.length ? rows.map(r => `<div class="item row"><a href="${r[2]}" style="text-decoration:none;color:var(--ink)"><span class="badge">${r[0]}</span> <strong>${esc(r[1])}</strong></a>${starBtn(r[3])}</div>`).join('') : '<p class="mute">Noch keine Favoriten. Tippe auf den Stern bei einem Abschnitt, Begriff, einer Technik oder Übung.</p>'}`, 'Favoriten', 'mehr');
}
