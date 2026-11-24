// Offline cache: game files + Three.js (cached on first online run)
const V='ls-v1',F=['./','./index.html','./manifest.json','./icon-192.png','./icon-512.png','./js/main.js','./js/player.js','./js/weapons.js','./js/enemies.js','./js/world.js','./js/ui.js','./js/mobile.js','https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js','./vendor/three.min.js'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(V).then(c=>Promise.all(F.map(u=>c.add(u).catch(()=>0)))).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==V).map(x=>caches.delete(x)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{e.respondWith(fetch(e.request).then(r=>{const c=r.clone();caches.open(V).then(x=>x.put(e.request,c));return r}).catch(()=>caches.match(e.request)))});
