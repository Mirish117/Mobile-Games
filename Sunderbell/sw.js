/* Sunderbell service worker: code and data network-first (so GitHub updates arrive), everything cached for offline play. */
const V = 'sunderbell-v2';
self.addEventListener('install', e => { self.skipWaiting(); e.waitUntil(caches.open(V).then(c => c.addAll(['./', 'index.html', 'editor.html', 'css/game.css', 'manifest.webmanifest', 'icons/icon-192.png']).catch(() => { }))); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const r = e.request; if (r.method !== 'GET') return;
  const net = () => fetch(r).then(res => { if (res && (res.ok || res.type === 'opaque')) { const cp = res.clone(); caches.open(V).then(c => c.put(r, cp)); } return res; });
  e.respondWith(net().catch(() => caches.match(r)));
});
