/* Gürtel und Prüfung: Gürtelfarben, Prüfungsbereiche, Prüfungsordnung. */
'use strict';
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
  const acc = cols.map(c => `<details class="item"><summary><strong>${esc(c)} ${esc(g.farben[c].name)}</strong></summary><div class="body"><h3 style="margin-top:0">Praxis</h3><ul>${g.bereiche[c].map(x => `<li>${esc(x)}</li>`).join('')}</ul><dl class="defs">${materialLines(g, c).map(l => `<dt>${esc(l[0])}</dt><dd>${esc(l[1])}</dd>`).join('')}</dl><h3>Theorie</h3><ul>${g.themen[c].map(t => `<li>${esc(t)}</li>`).join('')}</ul></div></details>`).join('');
  setPage(`<h1>Gürtel und Prüfung</h1><p class="lead">Das gemeinsame Gürtelsystem aller Bereiche des Yawara Kyushin Ryu.</p>
  <h2 style="margin-top:.4em">Gürtelfarben</h2><div class="grid">${BELTS.map(b => `<div class="item" style="display:flex;gap:12px;align-items:center;margin:0"><span style="width:44px;height:22px;border-radius:5px;border:1px solid var(--line);background:${b[2] || 'transparent'};flex:none"></span><span><strong>${esc(b[0])}</strong><br><span class="mute" style="font-size:.88rem">${esc(b[1])}</span></span></div>`).join('')}</div>
  <h2>Mudansha, Yūdansha und Kōdansha</h2><div class="tblwrap"><table><thead><tr><th>Einteilung</th><th>Schrift</th><th>Bedeutung</th><th>Grade</th></tr></thead><tbody>${g.einteilung.map(r => `<tr><th>${esc(ro(r[0]))}</th><td lang="ja">${esc(r[1])}</td><td>${esc(r[2])}</td><td>${esc(r[3])}</td></tr>`).join('')}</tbody></table></div><p class="mute" style="font-size:.85rem">Quelle: ${esc(g.einteilungQuelle)} (Kapitel 6.1)</p>
  <h2>Regeln</h2><ul>${g.regeln.map(r => `<li>${esc(r)}</li>`).join('')}</ul>
  <p>Mehr zum Thema im Lehrwerk: <a href="#/lehrwerk/l-6-1">Kapitel 6.1 Der Gürtel und der Kuro Obi</a>.</p>
  <h2>Was wird je Kyu geprüft?</h2><p class="mute" style="font-size:.9rem">Grundlagen für alle Stufen: ${esc(g.grundlagen)}. Die Inhalte findest du im <a href="#/lehrwerk">Lehrwerk</a> und im <a href="#/glossar">Glossar</a>, zum Üben gibt es den <a href="#/lernen">Lernmodus</a>.</p>${acc}
  <p class="mute" style="font-size:.85rem">${esc(g.hinweisMaterial)} Quellen: ${esc(g.quellePraxis)}; ${esc(g.quelleTheorie)}.</p>
  <div class="notice">${esc(g.hinweisSchwarz)} <a href="#/schwarzgurt">Zum Schwarzgurt-Bereich</a></div>
  <p><a class="btn" href="#/pruefung">Prüfungsordnung ansehen</a></p>`, 'Gürtel und Prüfung', 'mehr');
}
function pPruefung() {
  const p = D.pruefung;
  setPage(`<h1>Prüfungsordnung</h1><div class="notice">${esc(p.quelle)}. Das Dokument der Schule ist maßgeblich; hier steht eine Zusammenfassung.</div>
  ${p.abschnitte.map(a => `<details class="item" ${a.titel === 'Grundsätze' ? 'open' : ''}><summary><strong>${esc(a.titel)}</strong></summary><div class="body"><ul>${a.punkte.map(x => `<li>${esc(x)}</li>`).join('')}</ul></div></details>`).join('')}
  <p><a class="btn ghost" href="#/graduierung">Zu den Anforderungen je Gürtel</a></p>`, 'Prüfungsordnung', 'mehr');
}
