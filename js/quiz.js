/* Lernen: Quiz und Karteikarten, Prüfungsvorbereitung nach Graden. */
'use strict';
/* ---------- Lernen ---------- */
let Q = null;
const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
function qPool(cfg) {
  let p = D.glossar.eintraege.filter(e => e.de && e.romaji);
  if (cfg.src === 'grad') { const set = new Set(); (D.lernen.grade[cfg.grad] || []).forEach(t => t.ids.forEach(i => set.add(i))); p = p.filter(e => set.has(e.id)); }
  else { if (cfg.kats.length) p = p.filter(e => cfg.kats.indexOf(e.kat) >= 0); if (cfg.onlyLw) p = p.filter(e => /Lehrwerk/.test(e.quelle)); }
  if (cfg.mode === 'jp') p = p.filter(e => e.jp);
  const seen = {}; return p.filter(e => { const k = norm(e.romaji) + '|' + norm(e.de); if (seen[k]) return false; seen[k] = 1; return true; });
}
function readCfg(f) {
  const el = f.elements, r = f.querySelector('input[name=src]:checked'), lw = f.querySelector('input[name=lw]');
  return { src: r ? r.value : 'themen', mode: el.mode.value, n: parseInt(el.n.value, 10), grad: el.grad ? el.grad.value : '', kats: Array.from(f.querySelectorAll('input[name=kat]:checked')).map(x => x.value), onlyLw: !!(lw && lw.checked) };
}
function qSync(f) {
  const c = readCfg(f); $('#qthemen').classList.toggle('hide', c.src !== 'themen'); $('#qgrad').classList.toggle('hide', c.src !== 'grad');
  $('#qcount').textContent = qPool(c).length + ' passende Begriffe';
  if (c.src === 'grad') { const tm = D.lernen.grade[c.grad] || []; $('#qgradinfo').innerHTML = `<p class="mute" style="font-size:.9rem;margin:.4em 0">Themen dieser Prüfung, die sich als Begriffe üben lassen:</p><ul>${tm.map(t => `<li>${esc(t.name)} (${t.ids.length})</li>`).join('')}</ul><p class="mute" style="font-size:.85rem">${esc(D.lernen.hinweis)}</p>`; }
}
document.addEventListener('change', e => { const f = e.target.closest && e.target.closest('form[data-form=quiz]'); if (f) qSync(f); });
document.addEventListener('click', e => {
  const a = e.target.closest('[data-act=qall],[data-act=qnone]'); if (!a) return; const f = a.closest('form');
  $$('input[name=kat]', f).forEach(x => { x.checked = a.dataset.act === 'qall'; }); qSync(f);
});
function pLernen() {
  if (Q && Q.state === 'quiz') return drawQuiz();
  if (Q && Q.state === 'cards') return drawCards();
  if (Q && Q.state === 'done') return drawDone();
  const cats = D.glossar.kategorien, cnt = c => D.glossar.eintraege.filter(e => e.kat === c).length, grades = Object.keys(D.lernen.grade);
  setPage(`<h1>Lernen</h1><p class="lead">Übe die Begriffe, die in der Theorieprüfung gefragt werden: Tugenden, Waffen, Schwert-, Kleidungs- und Rüstungsteile, Kamae und mehr.</p>
  <form data-form="quiz" class="item"><fieldset style="border:0;padding:0;margin:0"><legend><strong>Womit möchtest du üben?</strong></legend>
  <label class="f"><input type="radio" name="src" value="themen" checked> Nach Themen (mehrere möglich)</label>
  <label class="f"><input type="radio" name="src" value="grad"> Vorbereitung auf eine Theorieprüfung</label></fieldset>
  <div id="qthemen"><p style="margin:.6em 0 .2em"><strong>Themenbereiche</strong> <button type="button" class="btn ghost small" data-act="qall">Alle</button> <button type="button" class="btn ghost small" data-act="qnone">Keine</button></p>
  ${cats.map(c => `<label class="f"><input type="checkbox" name="kat" value="${esc(c)}"> ${esc(c)} <span class="mute">(${cnt(c)})</span></label>`).join('')}
  <label class="f"><input type="checkbox" name="lw"> Nur Begriffe aus dem Lehrwerk</label><p class="mute" style="font-size:.85rem">Ohne Auswahl werden alle Themenbereiche verwendet.</p></div>
  <div id="qgrad" class="hide"><p style="margin:.6em 0 .2em"><label for="qg"><strong>Prüfung</strong></label></p><select id="qg" name="grad">${grades.map(g => `<option>${esc(g)}</option>`).join('')}</select><div id="qgradinfo"></div></div>
  <p></p><label for="qm"><strong>Aufgabentyp</strong></label><select id="qm" name="mode"><option value="ro2de">Begriff → Übersetzung</option><option value="de2ro">Übersetzung → Begriff</option><option value="jp">Japanische Schrift → Begriff</option></select>
  <p></p><label for="qn"><strong>Anzahl</strong></label><select id="qn" name="n"><option>10</option><option>20</option><option>30</option><option>50</option></select>
  <p id="qcount" class="mute" role="status"></p><button class="btn" type="submit" name="go" value="quiz">Quiz starten</button> <button class="btn ghost" type="submit" name="go" value="cards">Karteikarten</button></form>`, 'Lernen', 'mehr');
  qSync($('form[data-form=quiz]'));
}
function startLearn(f, go) {
  const cfg = readCfg(f); const pool = qPool(cfg); if (pool.length < 4) { alert('Für diese Auswahl gibt es zu wenige Begriffe.'); return; }
  const items = shuffle(pool).slice(0, cfg.n);
  Q = { cfg, pool, items, i: 0, score: 0, wrong: [], state: go };
  go === 'cards' ? drawCards() : drawQuiz();
}
function qAnswer(e, mode) { return mode === 'de2ro' || mode === 'jp' ? ro(e.romaji) : e.de; }
function qQuestion(e, mode) { return mode === 'ro2de' ? `${esc(ro(e.romaji))}${e.jp ? ` <span class="jp" lang="ja" style="color:var(--accent)">${esc(e.jp)}</span>` : ''}` : mode === 'jp' ? `<span class="jp" lang="ja">${esc(e.jp)}</span>` : esc(e.de); }
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
  $('#fb').innerHTML = `<p style="margin:14px 0 8px"><strong>${ok ? 'Richtig.' : 'Nicht ganz.'}</strong> ${esc(ro(e.romaji))}${e.jp ? ' (' + esc(e.jp) + ')' : ''}: ${esc(e.de)}${e.alt && e.alt.length ? ' (auch: ' + esc(e.alt.join('; ')) + ')' : ''}</p>${e.hinweis ? `<p class="mute" style="font-size:.85rem">${esc(e.hinweis)}</p>` : ''}<button class="btn" data-act="next">${Q.i + 1 < Q.items.length ? 'Weiter' : 'Ergebnis'}</button>`;
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
