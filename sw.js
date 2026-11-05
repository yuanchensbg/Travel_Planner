// Meridian: offline verfügbar + Updates ohne neues Hochladen
// - Installiertes Update (Cache "rhyme-override") wird beim Öffnen geliefert.
// - Eigene Dateien: zuerst Netz, ohne Netz die gespeicherte Version.
// - Bibliotheken von CDNs (z.B. Übersetzer) werden einmal gespeichert und dann offline genutzt.
//   Welche Adressen dazugehören, kann die App selbst festlegen (Cache "rhyme-config", Eintrag "sw-config"),
//   damit künftige Erweiterungen keinen neuen Netlify-Upload brauchen.
const C = 'rhyme-v3', EXT = 'rhyme-ext', DEF_HOSTS = ['cdn.jsdelivr.net'];
self.addEventListener('install', (e) => { e.waitUntil(caches.open(C).then((c) => c.addAll(['./', './index.html']))); self.skipWaiting(); });
self.addEventListener('activate', (e) => { e.waitUntil(self.clients.claim()); });
async function hosts() { try { const r = await caches.open('rhyme-config').then((c) => c.match('sw-config')); if (r) { const j = await r.json(); return DEF_HOSTS.concat(j.cacheHosts || []); } } catch (e) {} return DEF_HOSTS; }
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return; const u = new URL(e.request.url);
  if (u.origin === location.origin) {
    const nav = e.request.mode === 'navigate' || u.pathname.endsWith('/') || u.pathname.endsWith('/index.html');
    e.respondWith((async () => {
      if (nav) { const o = await caches.open('rhyme-override').then((c) => c.match('override')); if (o) return o; }
      try { const r = await fetch(e.request); const cp = r.clone(); caches.open(C).then((c) => c.put(e.request, cp)); return r; }
      catch (err) { return (await caches.match(e.request)) || (await caches.match('./index.html')); }
    })());
    return;
  }
  e.respondWith((async () => {
    const hs = await hosts(); if (!hs.some((h) => u.hostname === h || u.hostname.endsWith('.' + h))) return fetch(e.request);
    const c = await caches.open(EXT), hit = await c.match(e.request); if (hit) return hit;
    const r = await fetch(e.request); if (r && (r.ok || r.type === 'opaque')) c.put(e.request, r.clone()); return r;
  })());
});
