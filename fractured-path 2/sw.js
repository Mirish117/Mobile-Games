const V='fp-v1';
const FILES=['./','index.html','manifest.webmanifest','css/style.css','js/core.js','js/music.js','js/art.js','js/arthd.js','js/sprites.js','js/charhd.js','js/data.js','js/classes.js','js/maps.js','js/world.js','js/ui.js','js/field.js','js/battle.js','js/menus.js','js/story.js','js/main.js','icons/icon-180.png','icons/icon-192.png','icons/icon-512.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(V).then(c=>c.addAll(FILES)).then(()=>self.skipWaiting()));});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==V).map(x=>caches.delete(x)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',e=>{if(e.request.method!=='GET')return;e.respondWith(fetch(e.request).then(r=>{const c=r.clone();caches.open(V).then(ch=>ch.put(e.request,c));return r;}).catch(()=>caches.match(e.request)));});
