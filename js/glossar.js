/* Glossar: Liste, Suche, Filter, Fokus auf einen Eintrag. */
'use strict';
/* ---------- Glossar ---------- */
const G = { q: '', kat: '', lw: false, limit: 100, focus: '' };
function glossFiltered() {
  const toks = norm(G.q).split(' ').filter(Boolean);
  return D.glossar.eintraege.filter(e => (!G.kat || e.kat === G.kat) && (!G.lw || /Lehrwerk/.test(e.quelle)) && toks.every(t => norm(e.romaji + ' ' + e.jp + ' ' + e.de + ' ' + e.kat).indexOf(t) >= 0))
    .sort((a, b) => norm(a.romaji).localeCompare(norm(b.romaji)));
}
function glossOrdered() {
  const f = glossFiltered(); if (!G.focus) return f;
  const fe = D.glossar.eintraege.find(x => x.id === G.focus); return fe ? [fe].concat(f.filter(x => x.id !== G.focus)) : f;
}
function glossList() {
  const f = glossOrdered(), shown = f.slice(0, G.limit);
  return `<p class="mute" role="status">${f.length} Einträge</p>` + shown.map(e => `<div class="item${e.id === G.focus ? ' focus' : ''}" id="${e.id}"><div class="row"><div><h3>${esc(ro(e.romaji))} ${e.jp ? `<span class="jp" lang="ja" style="color:var(--accent)">${esc(e.jp)}</span>` : ''}</h3><p>${esc(e.de)}</p>${e.alt && e.alt.length ? `<p class="mute" style="font-size:.9rem">Weitere Übersetzungen: ${esc(e.alt.join('; '))}</p>` : ''}<div class="meta"><span class="badge">${esc(e.kat)}</span>${badge(e.quelle)}</div>${e.hinweis ? `<p class="mute" style="font-size:.85rem">${esc(e.hinweis)}</p>` : ''}</div>${starBtn(e.id)}</div></div>`).join('') +
    (f.length > G.limit ? `<p class="bigpad"><button class="btn ghost" data-act="more">Mehr anzeigen (${f.length - G.limit})</button></p>` : '');
}
function pGlossar() {
  const cats = D.glossar.kategorien;
  setPage(`<h1>Glossar</h1><p class="lead">Japanische Begriffe mit Umschrift, Schrift und deutscher Übersetzung. Begriffe aus dem Lehrwerk sind markiert und haben Vorrang.</p>
  <input type="search" id="gq" placeholder="Begriff, Schrift oder Übersetzung suchen" aria-label="Glossar durchsuchen" value="${esc(G.q)}">
  <div class="chips"><select id="gk" aria-label="Kategorie"><option value="">Alle Kategorien</option>${cats.map(c => `<option ${G.kat === c ? 'selected' : ''}>${esc(c)}</option>`).join('')}</select>
  <label class="f"><input type="checkbox" id="gl" ${G.lw ? 'checked' : ''}> Nur Begriffe aus dem Lehrwerk</label></div><div id="gres">${glossList()}</div>`, 'Glossar', 'glossar');
}
document.addEventListener('input', e => { if (e.target.id === 'gq') { G.q = e.target.value; G.limit = 100; G.focus = ''; $('#gres').innerHTML = glossList(); } });
document.addEventListener('change', e => {
  if (e.target.id === 'gk') { G.kat = e.target.value; G.limit = 100; G.focus = ''; $('#gres').innerHTML = glossList(); }
  if (e.target.id === 'gl') { G.lw = e.target.checked; G.limit = 100; G.focus = ''; $('#gres').innerHTML = glossList(); }
});
