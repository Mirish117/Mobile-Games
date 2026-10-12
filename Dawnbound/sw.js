/* Dawnbound service worker: cache-first, fills the cache as you play so the game works offline afterwards. */
const V = 'dawnbound-v1';
self.addEventListener('install', e => { self.skipWaiting(); e.waitUntil(caches.open(V).then(c => c.addAll(['./', 'index.html', 'css/style.css', 'manifest.webmanifest', 'icons/icon-192.png']).catch(() => { }))); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const r = e.request; if (r.method !== 'GET' || !r.url.startsWith(self.location.origin)) return;
  const heavy = /\/assets\//.test(r.url);
  const net = () => fetch(r).then(res => { if (res && res.ok) { const cp = res.clone(); caches.open(V).then(c => c.put(r, cp)); } return res; });
  /* code: network-first (so GitHub updates arrive), art/audio: cache-first (fast, offline) */
  e.respondWith(heavy ? caches.match(r).then(hit => hit || net()) : net().catch(() => caches.match(r)));
});
