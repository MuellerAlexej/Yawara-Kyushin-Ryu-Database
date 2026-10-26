/* YKR Wissensdatenbank – ohne Abhängigkeiten, läuft statisch (z. B. GitHub Pages). */
(function () {
'use strict';
const VERSION = '1.0.0';
const $ = (s, r) => (r || document).querySelector(s);
const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const inl = s => esc(s).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/\*(.+?)\*/g, '<em>$1</em>');
const store = {
  get(k, d) { try { const v = localStorage.getItem('ykr.' + k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem('ykr.' + k, JSON.stringify(v)); } catch (e) { /* privater Modus */ } }
};
const settings = Object.assign({ theme: 'auto', fs: 1, macrons: true }, store.get('settings', {}));
function applySettings() {
  document.documentElement.setAttribute('data-theme', settings.theme);
  document.documentElement.style.setProperty('--fs', settings.fs);
}
const ro = s => settings.macrons ? s : String(s || '').replace(/ō/g, 'o').replace(/Ō/g, 'O').replace(/ū/g, 'u').replace(/Ū/g, 'U').replace(/ā/g, 'a').replace(/ī/g, 'i').replace(/ē/g, 'e');
const norm = s => String(s || '').toLowerCase().replace(/ß/g, 'ss').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9äöü ]+/g, ' ').replace(/\s+/g, ' ').trim();
const favs = new Set(store.get('fav', []));
const saveFavs = () => store.set('fav', Array.from(favs));
const D = {};
const FILES = ['lehrwerk', 'glossar', 'graduierung', 'pruefung', 'ueber', 'bereiche', 'techniken', 'ergaenzungen', 'fitness'];
const IMG = n => `assets/pages/${n}.jpg`;
const pageKey = s => s === 0 ? 'vorwort' : 's' + String(s).padStart(2, '0');
const ytUrl = q => 'https://www.youtube.com/results?search_query=' + encodeURIComponent(q);

/* ---------- Lehrwerk-Index ---------- */
const SEC = {}; const SECLIST = [];
function indexLehrwerk() {
  D.lehrwerk.kapitel.forEach(k => k.abschnitte.forEach(a => { a.kapitel = k; SEC[a.id] = a; SECLIST.push(a); }));
}
const secTitle = a => (a.nr ? a.nr + ' ' : '') + a.titel;
const pages = a => a.von === a.bis ? (a.von === 0 ? 'Vorwort' : 'S. ' + a.von) : 'S. ' + a.von + '–' + a.bis;

/* ---------- Block-Renderer ---------- */
function blockText(b) {
  const parts = [];
  ['x', 'by', 'titel'].forEach(k => b[k] && parts.push(b[k]));
  (b.items || []).forEach(i => parts.push(Array.isArray(i) ? i.join(' ') : i));
  (b.rows || []).forEach(r => parts.push(r.join(' ')));
  if (b.node) (function w(n) { parts.push(n.x); (n.k || []).forEach(w); })(b.node);
  return parts.join(' ');
}
function treeHtml(n) { return `<li><span>${esc(n.x)}</span>${n.k && n.k.length ? '<ul>' + n.k.map(treeHtml).join('') + '</ul>' : ''}</li>`; }
function renderBlocks(bl, opt) {
  opt = opt || {}; let last = null, out = '';
  bl.forEach(b => {
    if (!opt.noPages && b.s !== undefined && b.s !== last) {
      out += `<button class="pgmark" data-page="${pageKey(b.s)}" aria-label="Originalseite ${b.s === 0 ? 'Vorwort' : b.s} ansehen">${b.s === 0 ? 'Vorwort' : 'Seite ' + b.s} · Original ansehen</button>`; last = b.s;
    }
    const ttl = b.titel ? `<h3 class="sub">${esc(b.titel)}</h3>` : '';
    switch (b.t) {
      case 'p': out += `<p${b.sig ? ' class="sig"' : ''}>${inl(b.x)}</p>`; break;
      case 'h': out += `<h3 class="sub">${esc(b.x)}</h3>`; break;
      case 'q': out += `<blockquote>${esc(b.x)}${b.by ? `<cite>${esc(b.by)}</cite>` : ''}</blockquote>`; break;
      case 'ul': out += ttl + `<ul>${b.items.map(i => `<li>${inl(i)}</li>`).join('')}</ul>`; break;
      case 'ol': out += ttl + `<ol>${b.items.map(i => `<li>${inl(i)}</li>`).join('')}</ol>`; break;
      case 'dl': out += ttl + `<dl class="defs">${b.items.map(i => `<dt>${esc(i[0])}${i[2] ? ` <span class="jp" lang="ja">${esc(i[2])}</span>` : ''}</dt><dd>${esc(i[1])}</dd>`).join('')}</dl>`; break;
      case 'table': out += ttl + `<div class="tblwrap"><table><thead><tr>${b.head.map(h => `<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>${b.rows.map(r => `<tr>${r.map((c, i) => `<td${/[\u3000-\u9fff]/.test(c) ? ' lang="ja"' : ''}>${esc(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`; break;
      case 'fig': out += `<figure><img src="${IMG(b.img)}" alt="${esc(b.alt)}" loading="lazy" data-page="${b.img}"><figcaption>${esc(b.cap)} · Zum Vergrößern antippen</figcaption></figure>`; break;
      case 'tree': out += `<ul class="tree">${treeHtml(b.node)}</ul>`; break;
      case 'note': out += `<div class="note">${inl(b.x)}</div>`; break;
    }
  });
  return out;
}

/* ---------- Seitenansicht (Originalscan) ---------- */
const PAGEORDER = ['deckblatt', 'vorwort', 'inhalt'].concat(Array.from({ length: 37 }, (_, i) => 's' + String(i + 1).padStart(2, '0')));
function pageLabel(k) { return k === 'deckblatt' ? 'Deckblatt' : k === 'vorwort' ? 'Vorwort' : k === 'inhalt' ? 'Inhaltsverzeichnis' : 'Lehrwerk Seite ' + parseInt(k.slice(1), 10); }
function openPage(k) {
  closePage(); let i = PAGEORDER.indexOf(k); if (i < 0) return;
  const el = document.createElement('div'); el.className = 'dlg'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true'); el.id = 'dlg';
  const draw = () => {
    el.innerHTML = `<div class="bar"><b>${esc(pageLabel(PAGEORDER[i]))}</b><button class="btn ghost small" data-pgact="prev" ${i === 0 ? 'disabled' : ''}>‹ Zurück</button><button class="btn ghost small" data-pgact="next" ${i === PAGEORDER.length - 1 ? 'disabled' : ''}>Weiter ›</button><button class="btn small" data-pgact="close" aria-label="Schließen">Schließen</button></div><div class="pic"><img src="${IMG(PAGEORDER[i])}" alt="${esc(pageLabel(PAGEORDER[i]))} (Scan des Originals)"></div>`;
    const c = $('[data-pgact=close]', el); c && c.focus();
  };
  el.addEventListener('click', e => { const a = e.target.closest('[data-pgact]'); if (!a) return; e.stopPropagation(); const k = a.dataset.pgact; if (k === 'close') closePage(); if (k === 'prev' && i > 0) { i--; draw(); } if (k === 'next' && i < PAGEORDER.length - 1) { i++; draw(); } });
  document.body.appendChild(el); draw();
}
function closePage() { const d = $('#dlg'); if (d) d.remove(); }
document.addEventListener('keydown', e => { if (e.key === 'Escape') closePage(); });

/* ---------- Favoriten ---------- */
const starBtn = id => `<button class="star" data-fav="${esc(id)}" aria-pressed="${favs.has(id)}" aria-label="Favorit">${favs.has(id) ? '★' : '☆'}</button>`;
document.addEventListener('click', e => {
  const f = e.target.closest('[data-fav]'); if (f) { const id = f.dataset.fav; if (favs.has(id)) favs.delete(id); else favs.add(id); saveFavs(); f.setAttribute('aria-pressed', favs.has(id)); f.textContent = favs.has(id) ? '★' : '☆'; return; }
  const p = e.target.closest('[data-page]'); if (p) { e.preventDefault(); openPage(p.dataset.page); }
});

/* ---------- Seitenrahmen ---------- */
const view = () => $('#main');
function setPage(html, title, tab) {
  view().innerHTML = html; document.title = (title ? title + ' – ' : '') + 'YKR Wissensdatenbank';
  $$('#tabs a').forEach(a => a.removeAttribute('aria-current')); const t = $(`#tabs a[data-k="${tab}"]`); if (t) t.setAttribute('aria-current', 'page');
  window.scrollTo(0, 0); view().focus({ preventScroll: true });
}
const badge = q => q === 'Ergänzung' ? '<span class="badge erg">Ergänzung</span>' : /Lehrwerk/.test(q || '') ? `<span class="badge lw">${esc(q)}</span>` : q ? `<span class="badge">${esc(q)}</span>` : '';
const bColor = id => 'c-' + (((D.bereiche.bereiche.find(b => b.id === id) || {}).farbe) || 'indigo');

/* ================= Seiten ================= */
function cardLink(href, title, text, cls, jp) { return `<a class="card ${cls || ''}" href="${href}"><span class="bar"></span>${jp ? `<span class="jp" lang="ja">${esc(jp)}</span>` : ''}<h3>${esc(title)}</h3><p>${esc(text)}</p></a>`; }

function pHome() {
  const last = SEC[store.get('last', '')];
  setPage(`<section class="hero"><p class="kicker">Yawara Kyushin Ryu</p><h1>Wissensdatenbank</h1>
  <p class="lead">Lehrwerk, Begriffe, Techniken, Gürtelsystem und Fitness an einem Ort. Das Lehrwerk ist die verbindliche Grundlage aller Inhalte.</p>
  <form class="search" data-form="search" role="search"><input type="search" name="q" placeholder="Suchen: Begriff, Technik, Thema …" aria-label="Suche"><button class="btn" type="submit">Suchen</button></form></section>
  ${last ? `<a class="card" href="#/lehrwerk/${last.id}" style="margin-bottom:8px"><span class="bar"></span><p class="kicker">Weiterlesen</p><h3>${esc(secTitle(last))}</h3><p>${esc(pages(last))}</p></a>` : ''}
  <h2>Bereiche</h2><div class="grid">${D.bereiche.bereiche.map(b => cardLink('#/bereich/' + b.id, b.name, b.kurz, 'c-' + b.farbe, b.jp)).join('')}</div>
  <h2>Werkzeuge</h2><div class="grid">
  ${cardLink('#/lehrwerk', 'Lehrwerk lesen', 'Das komplette Buch mit allen Kapiteln und den Originalseiten.', 'c-vermilion')}
  ${cardLink('#/glossar', 'Glossar', 'Japanische Begriffe mit Schrift und Übersetzung.', 'c-gold')}
  ${cardLink('#/lernen', 'Lernen', 'Quiz und Karteikarten zu den Begriffen der Theorieprüfung.', 'c-moss')}
  ${cardLink('#/graduierung', 'Gürtel und Prüfung', 'Anforderungen der Kyu-Grade, Prüfungsordnung.', 'c-indigo')}
  ${cardLink('#/schwarzgurt', 'Schwarzgurt-Bereich', 'Geschützter Bereich für Dan-Träger.', 'c-sumi', '黒帯')}
  </div><p class="foot">Version ${VERSION} · Lehrwerk 1. Auflage</p>`, '', 'start');
}

function pMehr() {
  setPage(`<h1>Mehr</h1><ul class="list">
  <li><a href="#/graduierung"><span>Gürtel und Prüfung</span><span class="pg">Anforderungen</span></a></li>
  <li><a href="#/pruefung"><span>Prüfungsordnung</span><span class="pg">Zusammenfassung</span></a></li>
  <li><a href="#/lernen"><span>Lernen (Quiz und Karteikarten)</span></a></li>
  <li><a href="#/bereich/fitness"><span>Allgemeine Fitness</span></a></li>
  <li><a href="#/favoriten"><span>Favoriten</span><span class="pg">${favs.size}</span></a></li>
  <li><a href="#/schwarzgurt"><span>Schwarzgurt-Bereich</span><span class="pg">geschützt</span></a></li>
  <li><a href="#/ueber"><span>Über die App, Schule und Einstellungen</span></a></li></ul>`, 'Mehr', 'mehr');
}

function pLehrwerk() {
  const L = D.lehrwerk;
  setPage(`<p class="kicker">${esc(L.auflage)} · ${esc(L.autor)}</p><h1>Lehrwerk</h1>
  <p class="lead">Die verbindliche Grundlage dieser App. Zu jeder Seite lässt sich der Original-Scan öffnen.</p>
  <div class="chips"><button class="chip" data-page="deckblatt">Deckblatt</button><button class="chip" data-page="inhalt">Inhaltsverzeichnis (Original)</button></div>
  ${L.kapitel.map(k => `<h2>${esc(k.nr ? k.nr + '. ' : '')}${esc(k.titel)}</h2><ul class="list">${k.abschnitte.map(a => `<li><a href="#/lehrwerk/${a.id}"><span><span class="nr">${esc(a.nr || '')}</span>${esc(a.titel)}</span><span class="pg">${esc(pages(a))}</span></a></li>`).join('')}</ul>`).join('')}`, 'Lehrwerk', 'lehrwerk');
}

function pAbschnitt(id) {
  const a = SEC[id]; if (!a) return pNotFound();
  store.set('last', id);
  const i = SECLIST.indexOf(a), pv = SECLIST[i - 1], nx = SECLIST[i + 1];
  setPage(`<p class="kicker">Lehrwerk · ${esc(a.kapitel.nr ? 'Kapitel ' + a.kapitel.nr : a.kapitel.titel)} · ${esc(pages(a))}</p>
  <div class="row"><h1>${esc(secTitle(a))}${a.jp ? ` <span class="jp" lang="ja">${esc(a.jp)}</span>` : ''}</h1>${starBtn(a.id)}</div>
  <article class="read">${renderBlocks(a.bloecke)}</article>
  <div class="pager">${pv ? `<a class="btn ghost" href="#/lehrwerk/${pv.id}">‹ ${esc(secTitle(pv)).slice(0, 34)}</a>` : '<span></span>'}${nx ? `<a class="btn ghost" href="#/lehrwerk/${nx.id}">${esc(secTitle(nx)).slice(0, 34)} ›</a>` : '<span></span>'}</div>
  <p class="foot"><a href="#/lehrwerk">Zum Inhaltsverzeichnis</a></p>`, secTitle(a), 'lehrwerk');
}

function pBereiche() {
  setPage(`<h1>Bereiche</h1><p class="lead">Jeder Bereich ist gleich aufgebaut: Theorie, Ausrüstung und Techniken.</p><div class="grid">${D.bereiche.bereiche.map(b => cardLink('#/bereich/' + b.id, b.name, b.kurz, 'c-' + b.farbe, b.jp)).join('')}</div>`, 'Bereiche', 'bereich');
}

function tabsBar(base, cur, tabs) { return `<div class="tabsbar" role="tablist">${tabs.map(t => `<a href="#/bereich/${base}/${t[0]}" ${t[0] === cur ? 'aria-current="page"' : ''}>${t[1]}</a>`).join('')}</div>`; }

function katasTable() {
  const g = D.graduierung, cols = g.spalten;
  const rows = ['Seitei-Iai-Kata', 'Kyokushinkai Kata'].map(k => `<tr><th>${k === 'Seitei-Iai-Kata' ? 'Seitei-Iai-Kata (Anzahl)' : 'Kyokushinkai-Kata'}</th>${g.praxis[k].map(v => `<td>${v === null ? '–' : esc(v)}</td>`).join('')}</tr>`).join('');
  return `<h3>Kata je Gürtelgrad (Kyu)</h3><div class="tblwrap"><table><thead><tr><th></th>${cols.map(c => `<th>${esc(c)}</th>`).join('')}</tr></thead><tbody>${rows}</tbody></table></div><p class="mute" style="font-size:.85rem">Quelle: Graduierungssystem Praxis. Die Dan-Anforderungen stehen im <a href="#/schwarzgurt">Schwarzgurt-Bereich</a>.</p>`;
}

function techCard(t) {
  const vids = (t.videos || []).map(v => `<li><a href="${esc(v.url)}" target="_blank" rel="noopener">${esc(v.titel || v.url)}</a></li>`).join('');
  const sec = t.abschnitt && SEC[t.abschnitt];
  return `<details class="item" id="${t.id}"><summary><span><strong>${esc(ro(t.name))}</strong> ${t.jp ? `<span class="jp" lang="ja">${esc(t.jp)}</span>` : ''}</span>${starBtn(t.id)}</summary><div class="body">
  ${t.text ? `<p>${esc(t.text)}</p>` : ''}<div class="meta">${badge(t.quelle)}</div>
  ${vids ? `<ul>${vids}</ul>` : ''}<p><a class="btn ghost small" href="${ytUrl(t.suche)}" target="_blank" rel="noopener">Videos auf YouTube suchen ↗</a> ${sec ? `<a class="btn ghost small" href="#/lehrwerk/${sec.id}">Im Lehrwerk lesen</a>` : ''}</p></div></details>`;
}

function pBereich(id, tab) {
  const b = D.bereiche.bereiche.find(x => x.id === id); if (!b) return pNotFound();
  if (id === 'fitness') return pFitness(tab);
  tab = tab || 'theorie';
  const head = `<p class="kicker">Bereich</p><h1>${esc(b.name)}${b.zusatz ? ` <span class="mute" style="font-size:1rem">(${esc(b.zusatz)})</span>` : ''} ${b.jp ? `<span class="jp" lang="ja" style="color:var(--accent)">${esc(b.jp)}</span>` : ''}</h1><p class="lead">${esc(b.kurz)}</p>`;
  const bar = tabsBar(id, tab, [['theorie', 'Theorie'], ['ausruestung', 'Ausrüstung'], ['techniken', 'Techniken']]);
  let body = '';
  if (tab === 'theorie') {
    body = `<h2 style="margin-top:.2em">Aus dem Lehrwerk</h2><ul class="list">${b.theorie.map(sid => SEC[sid]).filter(Boolean).map(a => `<li><a href="#/lehrwerk/${a.id}"><span><span class="nr">${esc(a.nr || '')}</span>${esc(a.titel)}</span><span class="pg">${esc(pages(a))}</span></a></li>`).join('')}</ul>`;
    const eg = b.ergaenzungen.map(e => D.ergaenzungen.artikel.find(x => x.id === e)).filter(Boolean);
    if (eg.length) body += `<h2>Ergänzungen <span class="badge erg">Ergänzung</span></h2><p class="mute" style="font-size:.9rem">${esc(D.ergaenzungen.hinweis)}</p><ul class="list">${eg.map(e => `<li><a href="#/ergaenzung/${e.id}"><span>${esc(e.titel)}</span><span class="pg">öffnen</span></a></li>`).join('')}</ul>`;
  } else if (tab === 'ausruestung') {
    const items = b.ausruestung.map(x => D.bereiche.ausruestung.find(a => a.id === x)).filter(Boolean);
    body = items.map(a => { const s = SEC[a.abschnitt]; return `<div class="item"><h3>${esc(a.name)} ${a.jp ? `<span class="jp" lang="ja" style="color:var(--accent)">${esc(a.jp)}</span>` : ''}</h3><div class="meta">${badge(a.quelle)}</div><p>${esc(a.text)}</p>${s ? `<a class="btn ghost small" href="#/lehrwerk/${s.id}">Im Lehrwerk lesen</a>` : ''}</div>`; }).join('') || '<p class="mute">Keine Einträge.</p>';
  } else {
    const ts = D.techniken.techniken.filter(t => t.bereich === id), groups = [];
    ts.forEach(t => { if (groups.indexOf(t.gruppe) < 0) groups.push(t.gruppe); });
    body = (id === 'iaido' || id === 'karate' ? katasTable() : '') + groups.map(g => `<h2>${esc(g)}</h2>${ts.filter(t => t.gruppe === g).map(techCard).join('')}`).join('') +
      `<p class="notice">Die Ausführung der Techniken lernst du beim Lehrer. Zu jeder Technik gibt es eine Videosuche auf YouTube. Geprüfte Videolinks der Schule werden hier ergänzt, sobald sie vorliegen.</p>`;
  }
  setPage(head + bar + body, b.name, 'bereich');
}

function pErgaenzung(id) {
  const e = D.ergaenzungen.artikel.find(x => x.id === id); if (!e) return pNotFound();
  setPage(`<p class="kicker">Ergänzung · ${esc(D.bereiche.bereiche.find(b => b.id === e.bereich).name)}</p><h1>${esc(e.titel)}</h1>
  <div class="notice erg"><strong>Ergänzung aus öffentlichen Quellen.</strong> ${esc(D.ergaenzungen.hinweis)}</div>
  <article class="read">${renderBlocks(e.bloecke, { noPages: true })}<h3 class="sub">Quellen</h3><ul>${e.quellen.map(q => `<li>${esc(q)}</li>`).join('')}</ul></article>
  <p class="foot"><a href="#/bereich/${e.bereich}">Zurück zum Bereich</a></p>`, e.titel, 'bereich');
}

/* ---------- Glossar ---------- */
const G = { q: '', kat: '', lw: false, limit: 100 };
function glossFiltered() {
  const toks = norm(G.q).split(' ').filter(Boolean);
  return D.glossar.eintraege.filter(e => (!G.kat || e.kat === G.kat) && (!G.lw || /Lehrwerk/.test(e.quelle)) && toks.every(t => norm(e.romaji + ' ' + e.jp + ' ' + e.de + ' ' + e.kat).indexOf(t) >= 0))
    .sort((a, b) => norm(a.romaji).localeCompare(norm(b.romaji)));
}
function glossList() {
  const f = glossFiltered(), shown = f.slice(0, G.limit);
  return `<p class="mute" role="status">${f.length} Einträge</p>` + shown.map(e => `<div class="item" id="${e.id}"><div class="row"><div><h3>${esc(ro(e.romaji))} ${e.jp ? `<span class="jp" lang="ja" style="color:var(--accent)">${esc(e.jp)}</span>` : ''}</h3><p>${esc(e.de)}</p><div class="meta"><span class="badge">${esc(e.kat)}</span>${badge(e.quelle)}</div>${e.hinweis ? `<p class="mute" style="font-size:.85rem">${esc(e.hinweis)}</p>` : ''}</div>${starBtn(e.id)}</div></div>`).join('') +
    (f.length > G.limit ? `<p class="bigpad"><button class="btn ghost" data-act="more">Mehr anzeigen (${f.length - G.limit})</button></p>` : '');
}
function pGlossar() {
  const cats = D.glossar.kategorien;
  setPage(`<h1>Glossar</h1><p class="lead">Japanische Begriffe mit Umschrift, Schrift und deutscher Übersetzung. Begriffe aus dem Lehrwerk sind markiert und haben Vorrang.</p>
  <input type="search" id="gq" placeholder="Begriff, Schrift oder Übersetzung suchen" aria-label="Glossar durchsuchen" value="${esc(G.q)}">
  <div class="chips"><select id="gk" aria-label="Kategorie"><option value="">Alle Kategorien</option>${cats.map(c => `<option ${G.kat === c ? 'selected' : ''}>${esc(c)}</option>`).join('')}</select>
  <label class="f"><input type="checkbox" id="gl" ${G.lw ? 'checked' : ''}> Nur Begriffe aus dem Lehrwerk</label></div><div id="gres">${glossList()}</div>`, 'Glossar', 'glossar');
}
document.addEventListener('input', e => { if (e.target.id === 'gq') { G.q = e.target.value; G.limit = 100; $('#gres').innerHTML = glossList(); } });
document.addEventListener('change', e => {
  if (e.target.id === 'gk') { G.kat = e.target.value; G.limit = 100; $('#gres').innerHTML = glossList(); }
  if (e.target.id === 'gl') { G.lw = e.target.checked; G.limit = 100; $('#gres').innerHTML = glossList(); }
});

/* ---------- Lernen ---------- */
let Q = null;
const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
function qPool(cfg) {
  let p = D.glossar.eintraege.filter(e => e.de && e.romaji);
  if (cfg.kat === '__lw') p = p.filter(e => /Lehrwerk/.test(e.quelle)); else if (cfg.kat) p = p.filter(e => e.kat === cfg.kat);
  if (cfg.mode === 'jp') p = p.filter(e => e.jp);
  const seen = {}; return p.filter(e => { const k = norm(e.romaji) + '|' + norm(e.de); if (seen[k]) return false; seen[k] = 1; return true; });
}
function qAnswer(e, mode) { return mode === 'de2ro' || mode === 'jp' ? ro(e.romaji) : e.de; }
function qQuestion(e, mode) { return mode === 'ro2de' ? `${esc(ro(e.romaji))}${e.jp ? ` <span class="jp" lang="ja" style="color:var(--accent)">${esc(e.jp)}</span>` : ''}` : mode === 'jp' ? `<span class="jp" lang="ja">${esc(e.jp)}</span>` : esc(e.de); }
function pLernen() {
  if (Q && Q.state === 'quiz') return drawQuiz();
  if (Q && Q.state === 'cards') return drawCards();
  if (Q && Q.state === 'done') return drawDone();
  const cats = D.glossar.kategorien;
  setPage(`<h1>Lernen</h1><p class="lead">Übe die Begriffe, die in der Theorieprüfung gefragt werden: Tugenden, Waffen, Schwert-, Kleidungs- und Rüstungsteile, Kamae und mehr.</p>
  <form data-form="quiz" class="item"><label for="qm"><strong>Aufgabentyp</strong></label><select id="qm" name="mode"><option value="ro2de">Begriff → Übersetzung</option><option value="de2ro">Übersetzung → Begriff</option><option value="jp">Japanische Schrift → Begriff</option></select>
  <p></p><label for="qk"><strong>Themenbereich</strong></label><select id="qk" name="kat"><option value="__lw">Alle Begriffe aus dem Lehrwerk</option><option value="">Alle Begriffe</option>${cats.map(c => `<option>${esc(c)}</option>`).join('')}</select>
  <p></p><label for="qn"><strong>Anzahl</strong></label><select id="qn" name="n"><option>10</option><option>20</option><option>30</option></select>
  <p></p><button class="btn" type="submit" name="go" value="quiz">Quiz starten</button> <button class="btn ghost" type="submit" name="go" value="cards">Karteikarten</button></form>`, 'Lernen', 'mehr');
}
function startLearn(f, go) {
  const cfg = { mode: f.elements.mode.value, kat: f.elements.kat.value, n: parseInt(f.elements.n.value, 10) };
  const pool = qPool(cfg); if (pool.length < 4) { alert('Für diese Auswahl gibt es zu wenige Begriffe.'); return; }
  const items = shuffle(pool).slice(0, cfg.n);
  Q = { cfg, pool, items, i: 0, score: 0, wrong: [], state: go };
  go === 'cards' ? drawCards() : drawQuiz();
}
function drawQuiz() {
  const e = Q.items[Q.i], m = Q.cfg.mode, ans = qAnswer(e, m);
  if (!Q.opts || Q.optsFor !== Q.i) {
    const same = Q.pool.filter(x => x !== e && qAnswer(x, m) !== ans && x.kat === e.kat), rest = Q.pool.filter(x => x !== e && qAnswer(x, m) !== ans);
    const dis = []; shuffle(same).concat(shuffle(rest)).forEach(x => { if (dis.length < 3 && !dis.some(d => qAnswer(d, m) === qAnswer(x, m))) dis.push(x); });
    Q.opts = shuffle([e].concat(dis)); Q.optsFor = Q.i; Q.answered = false;
  }
  setPage(`<div class="progress" aria-hidden="true"><i style="width:${Math.round(Q.i / Q.items.length * 100)}%"></i></div><div class="q"><p class="kicker">Frage ${Q.i + 1} von ${Q.items.length}</p><div class="term">${qQuestion(e, m)}</div>
  <div class="opts" id="opts">${Q.opts.map((o, k) => `<button data-k="${k}">${esc(qAnswer(o, m))}</button>`).join('')}</div><div id="fb"></div></div>
  <p><button class="btn ghost small" data-act="quit">Abbrechen</button></p>`, 'Quiz', 'mehr');
}
function answerQuiz(k) {
  if (Q.answered) return; Q.answered = true;
  const e = Q.items[Q.i], m = Q.cfg.mode, ok = Q.opts[k] === e;
  if (ok) Q.score++; else Q.wrong.push(e);
  $$('#opts button').forEach((b, j) => { b.disabled = true; if (Q.opts[j] === e) b.classList.add('ok'); else if (j === k) b.classList.add('bad'); });
  $('#fb').innerHTML = `<p style="margin:14px 0 8px"><strong>${ok ? 'Richtig.' : 'Nicht ganz.'}</strong> ${esc(ro(e.romaji))}${e.jp ? ' (' + esc(e.jp) + ')' : ''}: ${esc(e.de)}</p>${e.hinweis ? `<p class="mute" style="font-size:.85rem">${esc(e.hinweis)}</p>` : ''}<button class="btn" data-act="next">${Q.i + 1 < Q.items.length ? 'Weiter' : 'Ergebnis'}</button>`;
  const nb = $('[data-act=next]'); nb && nb.focus();
}
function drawDone() {
  setPage(`<h1>Ergebnis</h1><div class="q"><div class="term">${Q.score} von ${Q.items.length} richtig</div>${Q.wrong.length ? `<h3>Zum Wiederholen</h3><dl class="defs">${Q.wrong.map(e => `<dt>${esc(ro(e.romaji))}${e.jp ? ` <span class="jp" lang="ja">${esc(e.jp)}</span>` : ''}</dt><dd>${esc(e.de)}</dd>`).join('')}</dl>` : '<p>Alles richtig. Sehr gut.</p>'}
  <button class="btn" data-act="again">Neue Runde</button></div>`, 'Ergebnis', 'mehr');
}
function drawCards() {
  const e = Q.items[Q.i];
  setPage(`<div class="progress" aria-hidden="true"><i style="width:${Math.round(Q.i / Q.items.length * 100)}%"></i></div><div class="q bigpad"><p class="kicker">Karte ${Q.i + 1} von ${Q.items.length}</p><div class="term">${esc(ro(e.romaji))}${e.jp ? ` <span class="jp" lang="ja" style="color:var(--accent)">${esc(e.jp)}</span>` : ''}</div>
  <div id="back" class="hide"><p style="font-size:1.1rem">${esc(e.de)}</p><div class="meta">${badge(e.quelle)}</div></div>
  <p><button class="btn" data-act="flip">Antwort zeigen</button> <button class="btn ghost hide" data-act="cnext">${Q.i + 1 < Q.items.length ? 'Nächste Karte' : 'Fertig'}</button></p></div><p><button class="btn ghost small" data-act="quit">Abbrechen</button></p>`, 'Karteikarten', 'mehr');
}
document.addEventListener('click', e => {
  const o = e.target.closest('#opts button'); if (o && Q) return answerQuiz(parseInt(o.dataset.k, 10));
  const a = e.target.closest('[data-act]'); if (!a) return; const act = a.dataset.act;
  if (act === 'more') { G.limit += 100; $('#gres').innerHTML = glossList(); }
  if (act === 'quit') { Q = null; pLernen(); }
  if (act === 'again') { Q = null; pLernen(); }
  if (act === 'next' && Q) { if (Q.i + 1 < Q.items.length) { Q.i++; drawQuiz(); } else { Q.state = 'done'; drawDone(); } }
  if (act === 'flip') { $('#back').classList.remove('hide'); a.classList.add('hide'); const n = $('[data-act=cnext]'); n.classList.remove('hide'); n.focus(); }
  if (act === 'cnext' && Q) { if (Q.i + 1 < Q.items.length) { Q.i++; drawCards(); } else { Q = null; pLernen(); } }
});

/* ---------- Gürtel und Prüfung ---------- */
const BELTS = [['Schüleranwärter', 'keine Farbe', null], ['10. Kyu', 'Weiß', '#f4f1ea'], ['6. Kyu', 'Grün', '#3f7d4e'], ['5. Kyu', 'Blau', '#2b5f9e'], ['3. Kyu', 'Braun', '#7a4a2b'], ['1. Kyu', 'Braun', '#7a4a2b'], ['1. bis 5. Dan', 'Schwarz', '#1a1a1a'], ['6. bis 8. Dan', 'Rot-weiß geblockt', 'repeating-linear-gradient(90deg,#b02a24 0 10px,#f4f1ea 10px 20px)'], ['9. und 10. Dan', 'Rot', '#b02a24']];
const ALLG = ['10. Kyu', '6. Kyu', '5. Kyu', '3. Kyu', '1. Kyu', '1. Dan', '2. Dan', '3. Dan', '4. Dan', '5. Dan', '6. Dan', '7. Dan', '8. Dan'];
function theorieTable(t) {
  return `<div class="tblwrap"><table><thead><tr><th>Anforderung</th><th class="num">BE</th></tr></thead><tbody>${t.punkte.map(p => `<tr><td>${esc(p[0])}</td><td class="num">${p[1] == null ? '' : p[1]}</td></tr>`).join('')}${t.summeAngegeben != null ? `<tr><th>Summe (laut Original)</th><th class="num">${t.summeAngegeben}</th></tr>` : ''}</tbody></table></div>${t.hinweis ? `<p class="note">${esc(t.hinweis)}</p>` : ''}`;
}
function materialLines(g, sel) {
  const i = ALLG.indexOf(sel);
  return g.material.map(m => { const t = m.teile.filter(t => ALLG.indexOf(t.von) <= i && i <= ALLG.indexOf(t.bis))[0]; return t ? [m.bereich, t.x] : null; }).filter(Boolean);
}
function pGraduierung() {
  const g = D.graduierung, cols = g.spalten;
  const praxisRows = Object.keys(g.praxis).map(k => `<tr><th>${esc(k)}</th>${g.praxis[k].map(v => `<td>${v === null ? '–' : esc(v)}</td>`).join('')}</tr>`).join('');
  const mat = cols.map(c => `<details class="item"><summary><strong>Waffen und Material · ${esc(c)}</strong></summary><div class="body"><dl class="defs">${materialLines(g, c).map(l => `<dt>${esc(l[0])}</dt><dd>${esc(l[1])}</dd>`).join('')}</dl></div></details>`).join('');
  setPage(`<h1>Gürtel und Prüfung</h1><p class="lead">Das gemeinsame Gürtelsystem aller Bereiche des Yawara Kyushin Ryu.</p>
  <h2 style="margin-top:.4em">Gürtelfarben</h2><div class="grid">${BELTS.map(b => `<div class="item" style="display:flex;gap:12px;align-items:center;margin:0"><span style="width:44px;height:22px;border-radius:5px;border:1px solid var(--line);background:${b[2] || 'transparent'};flex:none"></span><span><strong>${esc(b[0])}</strong><br><span class="mute" style="font-size:.88rem">${esc(b[1])}</span></span></div>`).join('')}</div>
  <h2>Regeln</h2><ul>${g.regeln.map(r => `<li>${esc(r)}</li>`).join('')}</ul>
  <p>Mehr zum Thema im Lehrwerk: <a href="#/lehrwerk/l-6-1">Kapitel 6.1 Der Gürtel und der Kuro Obi</a>.</p>
  <h2>Praxis: Anforderungen je Kyu</h2><div class="tblwrap"><table><thead><tr><th>Bereich</th>${cols.map(c => `<th>${esc(c)}</th>`).join('')}</tr></thead><tbody>${praxisRows}</tbody></table></div>
  <p class="mute" style="font-size:.88rem">Die Zahlen geben die Anzahl der zu zeigenden Techniken bzw. Kata an. Grundlagen für alle Stufen: ${esc(g.grundlagen)}.</p>${mat}<p class="mute" style="font-size:.85rem">${esc(g.hinweisMaterial)} Quelle: ${esc(g.quellePraxis)}.</p>
  <h2>Theorie: Anforderungen je Kyu</h2><p class="mute" style="font-size:.9rem">BE = Bewertungseinheiten. Quelle: ${esc(g.quelleTheorie)}. Die Inhalte findest du im <a href="#/lehrwerk">Lehrwerk</a> und im <a href="#/glossar">Glossar</a>; zum Üben gibt es den <a href="#/lernen">Lernmodus</a>.</p>
  ${cols.map(c => `<details class="item"><summary><strong>${esc(c)}${g.farben[c] ? ' ' + esc(g.farben[c].name) : ''}</strong><span class="badge">${g.theorie[c].summeAngegeben} BE</span></summary><div class="body">${theorieTable(g.theorie[c])}</div></details>`).join('')}
  <div class="notice">${esc(g.hinweisDan)} <a href="#/schwarzgurt">Zum Schwarzgurt-Bereich</a></div>
  <p><a class="btn" href="#/pruefung">Prüfungsordnung ansehen</a></p>`, 'Gürtel und Prüfung', 'mehr');
}
function pPruefung() {
  const p = D.pruefung;
  setPage(`<h1>Prüfungsordnung</h1><div class="notice">${esc(p.quelle)}. Das Dokument der Schule ist maßgeblich; hier steht eine Zusammenfassung.</div>
  ${p.abschnitte.map(a => `<details class="item" ${a.titel === 'Grundsätze' ? 'open' : ''}><summary><strong>${esc(a.titel)}</strong></summary><div class="body"><ul>${a.punkte.map(x => `<li>${esc(x)}</li>`).join('')}</ul></div></details>`).join('')}
  <p><a class="btn ghost" href="#/graduierung">Zu den Anforderungen je Gürtel</a></p>`, 'Prüfungsordnung', 'mehr');
}

/* ---------- Fitness ---------- */
const FX = { gruppe: '', level: '', only: true };
const haveEq = () => new Set(['koerper'].concat(store.get('equip', [])));
function exOk(x, have) { return x.geraet.every(g => have.has(g)) || (x.alternativen || []).some(s => s.every(g => have.has(g))); }
function exCard(x) {
  const gn = id => (D.fitness.geraete.find(g => g.id === id) || {}).name || id;
  return `<details class="item"><summary><span><strong>${esc(x.name)}</strong></span>${starBtn(x.id)}</summary><div class="body">
  <div class="meta"><span class="badge">${esc(x.level)}</span><span class="badge">${esc(x.gruppe)}</span>${x.geraet.length ? x.geraet.map(g => `<span class="badge">${esc(gn(g))}</span>`).join('') : '<span class="badge">ohne Geräte</span>'}</div>
  <p><strong>Richtwert:</strong> ${esc(x.dosis)}</p><ul>${x.cues.map(c => `<li>${esc(c)}</li>`).join('')}</ul>
  <p class="mute" style="font-size:.9rem">Muskeln: ${esc(x.muskeln.join(', '))}<br>Nutzen im Budo: ${esc(x.budo.join(', '))}</p>
  ${x.hinweis ? `<p class="note">${esc(x.hinweis)}</p>` : ''}<p><a class="btn ghost small" href="${ytUrl(x.suche + ' Übung Anleitung')}" target="_blank" rel="noopener">Videos auf YouTube suchen ↗</a></p></div></details>`;
}
function fxList() {
  const have = haveEq(), all = D.fitness.uebungen.filter(x => (!FX.gruppe || x.gruppe === FX.gruppe) && (!FX.level || x.level === FX.level));
  const list = FX.only ? all.filter(x => exOk(x, have)) : all;
  return `<p class="mute" role="status">${list.length} von ${all.length} Übungen${FX.only ? ' passen zu deiner Ausrüstung' : ''}</p>` + list.map(exCard).join('');
}
function pFitness(tab) {
  tab = tab || 'uebungen'; const F = D.fitness, have = haveEq();
  const head = `<p class="kicker">Bereich</p><h1>Allgemeine Fitness</h1><p class="lead">Kraft, Beweglichkeit und Kondition für alle Stile. Wähle deine Ausrüstung aus, die Übungen passen sich an.</p><div class="notice erg"><strong>Ergänzung.</strong> ${esc(F.hinweis)}</div>`;
  const bar = tabsBar('fitness', tab, [['uebungen', 'Übungen'], ['programme', 'Kurzprogramme'], ['theorie', 'Theorie']]);
  let body = '';
  if (tab === 'uebungen') {
    body = `<h3 style="margin-top:.2em">Meine Ausrüstung</h3><div class="chips" id="eq">${F.geraete.filter(g => !g.fix).map(g => `<button class="chip" data-eq="${g.id}" aria-pressed="${have.has(g.id)}">${esc(g.name)}</button>`).join('')}</div>
    <div class="chips"><select id="fxg" aria-label="Muskelgruppe"><option value="">Alle Bereiche</option>${F.gruppen.map(g => `<option ${FX.gruppe === g ? 'selected' : ''}>${esc(g)}</option>`).join('')}</select>
    <select id="fxl" aria-label="Niveau"><option value="">Alle Niveaus</option><option ${FX.level === 'Einsteiger' ? 'selected' : ''}>Einsteiger</option><option ${FX.level === 'Fortgeschritten' ? 'selected' : ''}>Fortgeschritten</option></select>
    <label class="f"><input type="checkbox" id="fxo" ${FX.only ? 'checked' : ''}> Nur passend zu meiner Ausrüstung</label></div><div id="fxres">${fxList()}</div>`;
  } else if (tab === 'programme') {
    body = F.programme.map(p => `<details class="item"><summary><strong>${esc(p.name)}</strong></summary><div class="body"><p>${esc(p.beschr)}</p><ol>${p.schritte.map(s => { const x = F.uebungen.find(u => u.id === s[0]); return `<li><details><summary><strong>${esc(x.name)}</strong> · ${esc(s[1])}</summary><ul>${x.cues.map(c => `<li>${esc(c)}</li>`).join('')}</ul></details></li>`; }).join('')}</ol></div></details>`).join('');
  } else {
    const b = D.bereiche.bereiche.find(x => x.id === 'fitness');
    body = `<p>Die Trainingslehre des Lehrwerks beschreibt Kraft, Ausdauer, Beweglichkeit, Schnelligkeit und die koordinativen Fähigkeiten sowie Methoden und Belastungskomponenten.</p><ul class="list">${b.theorie.map(s => SEC[s]).filter(Boolean).map(a => `<li><a href="#/lehrwerk/${a.id}"><span><span class="nr">${esc(a.nr)}</span>${esc(a.titel)}</span><span class="pg">${esc(pages(a))}</span></a></li>`).join('')}</ul>`;
  }
  setPage(head + bar + body, 'Allgemeine Fitness', 'bereich');
}
document.addEventListener('click', e => {
  const q = e.target.closest('[data-eq]'); if (!q) return;
  const eq = new Set(store.get('equip', [])), id = q.dataset.eq; if (eq.has(id)) eq.delete(id); else eq.add(id);
  store.set('equip', Array.from(eq)); q.setAttribute('aria-pressed', eq.has(id)); $('#fxres').innerHTML = fxList();
});
document.addEventListener('change', e => {
  if (e.target.id === 'fxg') FX.gruppe = e.target.value; else if (e.target.id === 'fxl') FX.level = e.target.value; else if (e.target.id === 'fxo') FX.only = e.target.checked; else return;
  $('#fxres').innerHTML = fxList();
});

/* ---------- Suche ---------- */
let IDX = null;
const fold = s => String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
function buildIndex() {
  const o = [];
  SECLIST.forEach(a => o.push({ k: 'Lehrwerk', t: secTitle(a), u: '#/lehrwerk/' + a.id, x: a.bloecke.map(blockText).join(' '), b: pages(a) }));
  D.glossar.eintraege.forEach(e => o.push({ k: 'Glossar', t: ro(e.romaji) + (e.jp ? ' ' + e.jp : ''), u: '#/glossar/' + e.id, x: e.de + ' ' + e.kat, b: e.quelle }));
  D.techniken.techniken.forEach(t => o.push({ k: 'Techniken', t: t.name + (t.jp ? ' ' + t.jp : ''), u: '#/bereich/' + t.bereich + '/techniken', x: t.text + ' ' + t.gruppe, b: t.quelle }));
  D.ergaenzungen.artikel.forEach(a => o.push({ k: 'Ergänzungen', t: a.titel, u: '#/ergaenzung/' + a.id, x: a.bloecke.map(blockText).join(' '), b: 'Ergänzung' }));
  D.fitness.uebungen.forEach(f => o.push({ k: 'Fitness', t: f.name, u: '#/bereich/fitness/uebungen', x: f.cues.join(' ') + ' ' + f.muskeln.join(' ') + ' ' + f.budo.join(' '), b: 'Ergänzung' }));
  D.bereiche.ausruestung.forEach(a => o.push({ k: 'Ausrüstung', t: a.name, u: a.abschnitt ? '#/lehrwerk/' + a.abschnitt : '#/bereiche', x: a.text, b: a.quelle }));
  D.pruefung.abschnitte.forEach(a => o.push({ k: 'Prüfung', t: a.titel + ' (Prüfungsordnung)', u: '#/pruefung', x: a.punkte.join(' '), b: 'Prüfungsordnung' }));
  Object.keys(D.graduierung.theorie).forEach(c => o.push({ k: 'Prüfung', t: 'Theorie ' + c, u: '#/graduierung', x: D.graduierung.theorie[c].punkte.map(p => p[0]).join(' '), b: 'Graduierungssystem' }));
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
    else if (id.startsWith('t-')) { const t = D.techniken.techniken.find(x => x.id === id); if (t) rows.push(['Techniken', t.name, '#/bereich/' + t.bereich + '/techniken', id]); }
    else if (id.startsWith('f-')) { const f = D.fitness.uebungen.find(x => x.id === id); if (f) rows.push(['Fitness', f.name, '#/bereich/fitness/uebungen', id]); }
  });
  setPage(`<h1>Favoriten</h1><p class="lead">Deine Favoriten bleiben auf diesem Gerät gespeichert.</p>${rows.length ? rows.map(r => `<div class="item row"><a href="${r[2]}" style="text-decoration:none;color:var(--ink)"><span class="badge">${r[0]}</span> <strong>${esc(r[1])}</strong></a>${starBtn(r[3])}</div>`).join('') : '<p class="mute">Noch keine Favoriten. Tippe auf den Stern bei einem Abschnitt, Begriff, einer Technik oder Übung.</p>'}`, 'Favoriten', 'mehr');
}

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
  ${a.map(s => `<details class="item" ${s.id === 'sg-dojoregeln' ? 'open' : ''}><summary><strong>${esc(s.titel)}</strong></summary><div class="body">${s.grad ? `<div id="sggrad">${sgGradHtml(s.grad)}</div>` : `<div class="read">${renderBlocks(s.bloecke, { noPages: true })}</div>`}${s.quelle ? `<p class="mute" style="font-size:.82rem">Quelle: ${esc(s.quelle)}</p>` : ''}</div></details>`).join('')}`, 'Schwarzgurt', 'mehr');
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

/* ---------- Über, Einstellungen ---------- */
function pUeber() {
  const U = D.ueber;
  setPage(`<h1>Über diese App</h1>
  <div class="item"><h3>Grundsatz</h3><p>Das <strong>Lehrwerk des Yawara Kyushin Ryu</strong> (1. Auflage, Tobias Riemer) ist die verbindliche Grundlage aller Inhalte. Alles, was nicht aus dem Lehrwerk stammt, ist als <span class="badge erg">Ergänzung</span> gekennzeichnet. Bei Abweichungen gilt das Lehrwerk. Der Text des Lehrwerks wurde aus dem Scan übertragen und geprüft, zu jeder Seite lässt sich der Original-Scan öffnen.</p><p class="mute" style="font-size:.88rem">${esc(D.lehrwerk.copyright)}. Das Lehrwerk wird mit Zustimmung des Autors in dieser App bereitgestellt. Die App ist kostenfrei und dient ausschließlich dem Lernen.</p></div>
  <h2>Die Schule</h2>${U.abschnitte.map(s => `<details class="item"><summary><strong>${esc(s.titel)}</strong></summary><div class="body">${(s.text || []).map(t => `<p>${esc(t)}</p>`).join('')}${s.punkte ? `<ul>${s.punkte.map(p => `<li>${esc(p)}</li>`).join('')}</ul>` : ''}<p class="mute" style="font-size:.82rem">Quelle: ${esc(s.quelle)}</p></div></details>`).join('')}
  <h2>Einstellungen</h2><div class="item"><label for="st"><strong>Darstellung</strong></label><select id="st" data-set="theme"><option value="auto" ${settings.theme === 'auto' ? 'selected' : ''}>Automatisch (Gerät)</option><option value="light" ${settings.theme === 'light' ? 'selected' : ''}>Hell</option><option value="dark" ${settings.theme === 'dark' ? 'selected' : ''}>Dunkel</option></select>
  <p></p><label for="sf"><strong>Schriftgröße</strong></label><select id="sf" data-set="fs"><option value="1" ${settings.fs == 1 ? 'selected' : ''}>Normal</option><option value="1.15" ${settings.fs == 1.15 ? 'selected' : ''}>Groß</option><option value="1.3" ${settings.fs == 1.3 ? 'selected' : ''}>Sehr groß</option></select>
  <p></p><label class="f"><input type="checkbox" id="sm" data-set="macrons" ${settings.macrons ? 'checked' : ''}> Längungszeichen in Umschrift anzeigen (ō, ū)</label>
  <p></p><button class="btn ghost small" data-act="reset">Favoriten und Einstellungen zurücksetzen</button></div>
  <p class="foot">Version ${VERSION} · Funktioniert offline, nachdem sie einmal geladen wurde.</p>`, 'Über', 'mehr');
}
document.addEventListener('change', e => {
  const s = e.target.dataset && e.target.dataset.set; if (!s) return;
  settings[s] = s === 'macrons' ? e.target.checked : s === 'fs' ? parseFloat(e.target.value) : e.target.value; store.set('settings', settings); applySettings();
});
document.addEventListener('click', e => { if (e.target.closest('[data-act=reset]') && confirm('Favoriten und Einstellungen auf diesem Gerät wirklich löschen?')) { ['fav', 'settings', 'equip', 'last'].forEach(k => { try { localStorage.removeItem('ykr.' + k); } catch (x) { /* egal */ } }); location.reload(); } });
function pNotFound() { setPage('<h1>Seite nicht gefunden</h1><p><a class="btn" href="#/">Zur Startseite</a></p>', 'Nicht gefunden', 'start'); }

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
  const p = (location.hash || '#/').replace(/^#/, '').split('/').filter(Boolean).map(x => { try { return decodeURIComponent(x); } catch (e) { return x; } });
  try {
    switch (p[0] || '') {
      case '': pHome(); break;
      case 'lehrwerk': p[1] ? pAbschnitt(p[1]) : pLehrwerk(); break;
      case 'bereiche': pBereiche(); break;
      case 'bereich': pBereich(p[1], p[2]); break;
      case 'ergaenzung': pErgaenzung(p[1]); break;
      case 'glossar': if (p[1]) { const e = D.glossar.eintraege.find(x => x.id === p[1]); if (e) { G.q = e.romaji; G.kat = ''; G.lw = false; } } pGlossar(); break;
      case 'lernen': pLernen(); break;
      case 'graduierung': pGraduierung(); break;
      case 'pruefung': pPruefung(); break;
      case 'suche': pSuche(p[1]); break;
      case 'favoriten': pFavoriten(); break;
      case 'schwarzgurt': pSchwarzgurt(); break;
      case 'mehr': pMehr(); break;
      case 'ueber': pUeber(); break;
      default: pNotFound();
    }
  } catch (err) { console.error(err); setPage('<h1>Fehler</h1><p>Beim Anzeigen ist ein Fehler aufgetreten. <a href="#/">Zur Startseite</a></p>', 'Fehler', 'start'); }
}
async function init() {
  applySettings();
  try {
    const res = await Promise.all(FILES.map(f => fetch('data/' + f + '.json').then(r => { if (!r.ok) throw new Error(f); return r.json(); })));
    FILES.forEach((f, i) => { D[f] = res[i]; });
  } catch (err) {
    view().innerHTML = '<h1>Daten konnten nicht geladen werden</h1><p>Bitte Verbindung prüfen und die Seite neu laden.</p><p><button class="btn" onclick="location.reload()">Neu laden</button></p>'; return;
  }
  indexLehrwerk(); window.addEventListener('hashchange', route); route();
  if ('serviceWorker' in navigator && /^https?:/.test(location.protocol)) {
    const had = !!navigator.serviceWorker.controller; let reloaded = false;
    navigator.serviceWorker.register('sw.js').catch(() => { });
    navigator.serviceWorker.addEventListener('controllerchange', () => { if (had && !reloaded) { reloaded = true; location.reload(); } });
  }
}
window.YKR = { D, route, init, doSearch };
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
