/* Seiten: Startseite, Mehr, Lehrwerk, Bereiche, Techniken, Ergänzungen. */
'use strict';
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
  </div>${installHtml()}<p class="foot">Version ${VERSION} · Lehrwerk 1. Auflage</p>`, '', 'start');
}

function pMehr() {
  setPage(`<h1>Mehr</h1>${installHtml()}<ul class="list">
  <li><a href="#/graduierung"><span>Gürtel und Prüfung</span><span class="pg">Anforderungen</span></a></li>
  <li><a href="#/pruefung"><span>Prüfungsordnung</span><span class="pg">Zusammenfassung</span></a></li>
  <li><a href="#/lernen"><span>Lernen (Quiz und Karteikarten)</span></a></li>
  <li><a href="#/bereich/fitness"><span>Körpertraining (Sessions und Pläne)</span></a></li>
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

function groupIntro(b, g) {
  const x = (D.techniken.gruppen || []).find(y => y.key === b + '|' + g); if (!x) return '';
  const sc = SEC[x.abschnitt];
  return `<div class="notice"><p style="margin:0 0 8px">${esc(x.text)}</p>${badge(x.quelle)} ${x.seite ? `<button class="chip" data-page="${pageKey(x.seite)}">Original S. ${x.seite}</button>` : ''} ${sc ? `<a class="chip" href="#/lehrwerk/${sc.id}" style="text-decoration:none;display:inline-block">Im Lehrwerk lesen</a>` : ''}</div>`;
}
function techCard(t) {
  const sec = t.abschnitt && SEC[t.abschnitt];
  return `<details class="item" id="${t.id}"><summary><span><strong>${esc(ro(t.name))}</strong> ${t.jp ? `<span class="jp" lang="ja">${esc(t.jp)}</span>` : ''} ${VID[t.id] ? '<span class="badge">▶ Video</span>' : ''}</span>${starBtn(t.id)}</summary><div class="body">
  ${t.text ? `<p>${esc(t.text)}</p>` : ''}<div class="meta">${badge(t.quelle)}</div>
  ${videoHtml(t.id, t.suche)}<p>${t.seite ? `<button class="btn ghost small" data-page="${pageKey(t.seite)}">Original S. ${t.seite}</button> ` : ''}${sec ? `<a class="btn ghost small" href="#/lehrwerk/${sec.id}">Im Lehrwerk lesen</a>` : ''}</p></div></details>`;
}

function pBereich(id, tab, focus) {
  const b = D.bereiche.bereiche.find(x => x.id === id); if (!b) return pNotFound();
  if (id === 'fitness') return pFitness(tab, focus);
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
    body = groups.map(g => `<h2>${esc(g)}</h2>${groupIntro(id, g)}${ts.filter(t => t.gruppe === g).map(techCard).join('')}`).join('') +
      `<p class="notice">Die Ausführung der Techniken lernst du beim Lehrer. Zu jeder Technik gibt es eine Videosuche auf YouTube. Geprüfte Videolinks der Schule werden hier ergänzt, sobald sie vorliegen.</p>`;
  }
  setPage(head + bar + body, b.name, 'bereich'); if (focus) focusEl(focus);
}

function pErgaenzung(id) {
  const e = D.ergaenzungen.artikel.find(x => x.id === id); if (!e) return pNotFound();
  setPage(`<p class="kicker">Ergänzung · ${esc(D.bereiche.bereiche.find(b => b.id === e.bereich).name)}</p><h1>${esc(e.titel)}</h1>
  <div class="notice erg"><strong>Ergänzung aus öffentlichen Quellen.</strong> ${esc(D.ergaenzungen.hinweis)}</div>
  <article class="read">${renderBlocks(e.bloecke, { noPages: true })}<h3 class="sub">Quellen</h3><ul>${e.quellen.map(q => `<li>${esc(q)}</li>`).join('')}</ul></article>
  <p class="foot"><a href="#/bereich/${e.bereich}">Zurück zum Bereich</a></p>`, e.titel, 'bereich');
}
