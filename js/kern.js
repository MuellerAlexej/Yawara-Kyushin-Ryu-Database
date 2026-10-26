/* Kern: Hilfsfunktionen, Einstellungen, Favoriten, Block-Renderer, Seitenansicht, Seitenrahmen. */
'use strict';
const VERSION = self.YKR_VERSION;
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
/* Daten: einfache Dateien und Ordner mit Index (siehe data/README.md) */
const SIMPLE = ['graduierung', 'pruefung', 'ueber', 'bereiche', 'techniken', 'ergaenzungen', 'lernen'];
async function loadJson(path) { const r = await fetch(path); if (!r.ok) throw new Error(path); return r.json(); }
async function loadAll() {
  const [simple, gi, li, fi] = await Promise.all([Promise.all(SIMPLE.map(f => loadJson('data/' + f + '.json'))), loadJson('data/glossar/index.json'), loadJson('data/lehrwerk/index.json'), loadJson('data/fitness/index.json')]);
  SIMPLE.forEach((f, i) => { D[f] = simple[i]; });
  const [gf, lf, ff] = await Promise.all([Promise.all(gi.dateien.map(d => loadJson('data/glossar/' + d.datei))), Promise.all(li.kapitel.map(d => loadJson('data/lehrwerk/' + d.datei))), Promise.all(fi.dateien.map(d => loadJson('data/fitness/' + d.datei)))]);
  D.glossar = { kategorien: gi.kategorien, eintraege: [].concat(...gf.map(x => x.eintraege)) };
  D.lehrwerk = Object.assign({}, li, { kapitel: lf.map(x => ({ nr: x.nr, titel: x.titel, abschnitte: x.abschnitte })) });
  D.fitness = Object.assign({}, fi, { uebungen: [].concat(...ff.map(x => x.uebungen)) });
}
const VID = {};
function loadVideos(v) { ((v && v.eintraege) || []).forEach(x => { const l = (x.links || []).filter(y => y && /^https?:\/\//i.test(y.url || '')); if (l.length) VID[x.id] = l; }); }
function videoHtml(id, q) {
  const v = VID[id] || [];
  return (v.length ? `<ul class="vids">${v.map(x => `<li><a class="btn small" href="${esc(x.url)}" target="_blank" rel="noopener">▶ ${esc(x.titel || 'Video ansehen')} ↗</a></li>`).join('')}</ul>` : '') + `<p><a class="btn ghost small" href="${ytUrl(q)}" target="_blank" rel="noopener">${v.length ? 'Weitere Videos suchen' : 'Videos auf YouTube suchen'} ↗</a></p>`;
}
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
const badge = q => {
  if (q === 'Ergänzung') return '<span class="badge erg">Ergänzung</span>';
  const m = /Lehrwerk S\. (\d+)/.exec(q || '');
  if (m && +m[1] >= 1 && +m[1] <= 37) return `<span class="badge lw" role="button" tabindex="0" data-page="${pageKey(+m[1])}" title="Originalseite im Lehrwerk öffnen">${esc(q)} ↗</span>`;
  return /Lehrwerk/.test(q || '') ? `<span class="badge lw">${esc(q)}</span>` : q ? `<span class="badge">${esc(q)}</span>` : '';
};
function focusEl(id) {
  const el = id && document.getElementById(id); if (!el) return;
  if (el.tagName === 'DETAILS') el.open = true;
  el.classList.add('focus'); try { el.scrollIntoView({ block: 'center' }); } catch (x) { /* egal */ }
}
document.addEventListener('keydown', e => { if ((e.key === 'Enter' || e.key === ' ') && e.target.matches && e.target.matches('[data-page][role=button]')) { e.preventDefault(); openPage(e.target.dataset.page); } });
const bColor = id => 'c-' + (((D.bereiche.bereiche.find(b => b.id === id) || {}).farbe) || 'indigo');
