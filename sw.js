/* Service Worker: Offline-Nutzung. Bei jeder Aktualisierung der App die Versionsnummer erhöhen. */
const VERSION = 'ykr-1.0.0';
const CORE = ['./','index.html','css/app.css','js/app.js','manifest.webmanifest','icons/icon.svg','icons/icon-192.png',
 'data/lehrwerk.json','data/glossar.json','data/graduierung.json','data/pruefung.json','data/ueber.json','data/bereiche.json','data/techniken.json','data/ergaenzungen.json','data/fitness.json','data/schwarzgurt.json'];
self.addEventListener('install', e => { e.waitUntil(caches.open(VERSION).then(c => Promise.all(CORE.map(u => c.add(u).catch(()=>null)))).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const r = e.request; if (r.method !== 'GET' || new URL(r.url).origin !== location.origin) return;
  const isImg = /\.(jpg|jpeg|png|svg)$/i.test(r.url);
  if (isImg) { e.respondWith(caches.match(r).then(m => m || fetch(r).then(res => { const cp = res.clone(); caches.open(VERSION).then(c => c.put(r, cp)); return res; }))); return; }
  e.respondWith(fetch(r).then(res => { const cp = res.clone(); caches.open(VERSION).then(c => c.put(r, cp)); return res; }).catch(() => caches.match(r).then(m => m || caches.match('index.html'))));
});
