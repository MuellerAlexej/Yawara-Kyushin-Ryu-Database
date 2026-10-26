/* Service Worker: Offline-Nutzung. Die Versionsnummer steht nur in js/version.js. */
importScripts('js/version.js');
const VERSION = 'ykr-' + self.YKR_VERSION;
const CORE = ['./', 'index.html', 'css/app.css', 'manifest.webmanifest', 'icons/icon.svg', 'icons/icon-192.png',
  'js/version.js', 'js/kern.js', 'js/seiten.js', 'js/glossar.js', 'js/quiz.js', 'js/graduierung.js', 'js/fitness.js', 'js/training.js', 'js/suche.js', 'js/schwarzgurt.js', 'js/ueber.js', 'js/start.js',
  'data/graduierung.json', 'data/pruefung.json', 'data/ueber.json', 'data/bereiche.json', 'data/techniken.json', 'data/ergaenzungen.json', 'data/lernen.json', 'data/videos.json', 'data/schwarzgurt.json'];
/* Ordner mit Index: Der Index wird gespeichert, danach alle darin genannten Dateien. */
const INDEXES = [['data/glossar/', 'dateien'], ['data/lehrwerk/', 'kapitel'], ['data/fitness/', 'dateien']];
async function precache() {
  const c = await caches.open(VERSION);
  await Promise.all(CORE.map(u => c.add(u).catch(() => null)));
  for (const [dir, key] of INDEXES) {
    try {
      const r = await fetch(dir + 'index.json'); if (!r.ok) continue;
      const j = await r.clone().json(); await c.put(dir + 'index.json', r);
      await Promise.all((j[key] || []).map(d => c.add(dir + d.datei).catch(() => null)));
    } catch (e) { /* offline beim Installieren: später beim Abruf nachgeladen */ }
  }
}
self.addEventListener('install', e => { e.waitUntil(precache().then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const r = e.request; if (r.method !== 'GET' || new URL(r.url).origin !== location.origin) return;
  const isImg = /\.(jpg|jpeg|png|svg)$/i.test(r.url);
  if (isImg) { e.respondWith(caches.match(r).then(m => m || fetch(r).then(res => { const cp = res.clone(); caches.open(VERSION).then(c => c.put(r, cp)); return res; }))); return; }
  e.respondWith(fetch(r).then(res => { const cp = res.clone(); caches.open(VERSION).then(c => c.put(r, cp)); return res; }).catch(() => caches.match(r).then(m => m || caches.match('index.html'))));
});
