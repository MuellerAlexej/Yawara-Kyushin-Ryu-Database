/* Körpertraining (Teil 1): Übungsliste, Filter, Ausrüstung, Seite „Körpertraining“. */
'use strict';
/* ---------- Fitness ---------- */
const FX = { gruppe: '', level: '', art: '', only: true };
const haveEq = () => { const s = new Set(store.get('equip', ['matte', 'stuhl'])); if (!store.get('koerperOff', false)) s.add('koerper'); return s; };
function exOk(x, have) { const ok = x.geraet.length ? x.geraet.every(g => have.has(g)) : have.has('koerper'); return ok || (x.alternativen || []).some(s => s.every(g => have.has(g))); }
function exCard(x) {
  const gn = id => (D.fitness.geraete.find(g => g.id === id) || {}).name || id;
  return `<details class="item" id="${x.id}"><summary><span><strong>${esc(x.name)}</strong> ${VID[x.id] ? '<span class="badge">▶ Video</span>' : ''}</span>${starBtn(x.id)}</summary><div class="body">
  <div class="meta"><span class="badge">${esc(x.level)}</span><span class="badge">${esc(x.gruppe)}</span>${x.geraet.length ? x.geraet.map(g => `<span class="badge">${esc(gn(g))}</span>`).join('') : '<span class="badge">ohne Geräte</span>'}</div>
  <p><strong>Richtwert:</strong> ${esc(x.dosis)}</p><ul>${x.cues.map(c => `<li>${esc(c)}</li>`).join('')}</ul>
  ${x.fehler && x.fehler.length ? `<p style="margin:.4em 0"><strong>Typische Fehler</strong></p><ul>${x.fehler.map(f => `<li>${esc(f)}</li>`).join('')}</ul>` : ''}${x.start ? `<p class="mute" style="font-size:.9rem">Richtwert zum Start: ${esc(x.start)}</p>` : ''}<p class="mute" style="font-size:.9rem">Muskeln: ${esc(x.muskeln.join(', '))}<br>Nutzen im Budo: ${esc(x.budo.join(', '))}</p>
  ${x.hinweis ? `<p class="note">${esc(x.hinweis)}</p>` : ''}${videoHtml(x.id, x.suche + ' Übung Anleitung')}</div></details>`;
}
function fxList() {
  const have = haveEq(), all = D.fitness.uebungen.filter(x => (!FX.gruppe || x.gruppe === FX.gruppe) && (!FX.level || x.level === FX.level));
  const list = FX.only ? all.filter(x => exOk(x, have)) : all;
  return `<p class="mute" role="status">${list.length} von ${all.length} Übungen${FX.only ? ' passen zu deiner Ausrüstung' : ''}</p>` + list.map(exCard).join('');
}
function uebungenTab() {
  const F = D.fitness;
  return `<h3 style="margin-top:.2em">Meine Ausrüstung</h3>${eqChips()}
    <div class="chips"><select id="fxa" aria-label="Art"><option value="">Alle Arten</option>${TRART.slice(0, 4).concat([['mobility', 'Mobility']]).map(a => `<option value="${a[0]}" ${FX.art === a[0] ? 'selected' : ''}>${esc(a[1])}</option>`).join('')}</select>
    <select id="fxg" aria-label="Muskelgruppe"><option value="">Alle Bereiche</option>${F.gruppen.map(g => `<option ${FX.gruppe === g ? 'selected' : ''}>${esc(g)}</option>`).join('')}</select>
    <select id="fxl" aria-label="Niveau"><option value="">Alle Niveaus</option><option ${FX.level === 'Einsteiger' ? 'selected' : ''}>Einsteiger</option><option ${FX.level === 'Fortgeschritten' ? 'selected' : ''}>Fortgeschritten</option></select>
    <label class="f"><input type="checkbox" id="fxo" ${FX.only ? 'checked' : ''}> Nur passend zu meiner Ausrüstung</label></div><div id="fxres">${fxList()}</div>`;
}
function theorieTab() {
  const b = D.bereiche.bereiche.find(x => x.id === 'fitness');
  return `<p>Die Trainingslehre des Lehrwerks beschreibt Kraft, Ausdauer, Beweglichkeit, Schnelligkeit und die koordinativen Fähigkeiten sowie Methoden und Belastungskomponenten. Die Sessions und Pläne dieses Bereichs nutzen diese Grundlagen: Dauer- und Intervallmethode, Belastung und Erholung, steigende Belastung mit Entlastungswochen.</p><h3>Hinweise zur Beweglichkeit (Ergänzung)</h3><ul><li>Vor dem Training reichen etwa 10 Minuten Aufwärmen mit lockeren, dynamischen Bewegungen, bis Puls und Gelenke in Schwung sind.</li><li>Lange statische Dehnungen direkt vor Kraft- oder Schnellkraft-Training können kurzfristig Kraft und Schnelligkeit senken. Besser: nach dem Training oder in einer eigenen Dehn-Einheit.</li><li>Statisch dehnen heißt: bis ein deutlicher, aber kein schmerzhafter Zug entsteht (etwa 7 von 10 ist die Obergrenze), jeweils etwa 20 bis 45 Sekunden, 2 bis 3 Durchgänge.</li><li>Fortschritte in der Beweglichkeit brauchen Regelmäßigkeit und Geduld. Kraft in den gedehnten Bereichen (zum Beispiel Hüfte und Bein) macht die Beweglichkeit nutzbar und schützt vor Verletzungen.</li><li>Nie in den Schmerz hinein dehnen und nicht federn.</li></ul><ul class="list">${b.theorie.map(s => SEC[s]).filter(Boolean).map(a => `<li><a href="#/lehrwerk/${a.id}"><span><span class="nr">${esc(a.nr)}</span>${esc(a.titel)}</span><span class="pg">${esc(pages(a))}</span></a></li>`).join('')}</ul>`;
}
function pFitness(tab, focus) {
  tab = tab || 'session'; if (focus && tab === 'uebungen') { FX.gruppe = ''; FX.level = ''; FX.art = ''; FX.only = false; } if (tab === 'programme') tab = 'session'; const F = D.fitness;
  const head = `<p class="kicker">Bereich</p><h1>Körpertraining</h1><p class="lead">Kraft, Beweglichkeit und Kondition. Stelle dir eigene Sessions zusammen oder lass dir einen Trainingsplan für mehrere Wochen bauen. Alles bleibt lokal auf deinem Gerät.</p><div class="notice erg"><strong>Ergänzung.</strong> ${esc(F.hinweis)}</div>`;
  const bar = tabsBar('fitness', tab, [['session', 'Session'], ['plan', 'Trainingsplan'], ['uebungen', 'Übungen'], ['theorie', 'Theorie']]);
  setPage(head + bar + (tab === 'session' ? trSessionTab() : tab === 'plan' ? trPlanTab() : tab === 'uebungen' ? uebungenTab() : theorieTab()), 'Körpertraining', 'bereich'); if (focus) focusEl(focus);
}

document.addEventListener('click', e => {
  const q = e.target.closest('[data-eq]'); if (!q) return;
  const id = q.dataset.eq;
  if (id === 'koerper') { const off = !store.get('koerperOff', false); store.set('koerperOff', off); q.setAttribute('aria-pressed', !off); }
  else { const eq = new Set(store.get('equip', ['matte', 'stuhl'])); if (eq.has(id)) eq.delete(id); else eq.add(id); store.set('equip', Array.from(eq)); q.setAttribute('aria-pressed', eq.has(id)); }
  const fr = $('#fxres'); if (fr) fr.innerHTML = fxList();
});
document.addEventListener('change', e => {
  if (e.target.id === 'fxa') FX.art = e.target.value; else if (e.target.id === 'fxg') FX.gruppe = e.target.value; else if (e.target.id === 'fxl') FX.level = e.target.value; else if (e.target.id === 'fxo') FX.only = e.target.checked; else return;
  $('#fxres').innerHTML = fxList();
});
