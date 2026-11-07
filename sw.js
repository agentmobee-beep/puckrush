// PuckRush service worker: keeps the installed app opening instantly and
// working offline, while always preferring the freshest page when online.
// Ads and the leaderboard API are never cached.
// v2 (2026-11-07): page loads are network-first. The old cache-first page
// handling could strand returning players on an outdated build.
var CACHE = 'puckrush-app-v2';
var SHELL = ['./', './index.html', './manifest.webmanifest',
  './icons/icon-192.png', './icons/icon-512.png',
  './icons/icon-maskable-512.png', './icons/apple-touch-icon.png'];
self.addEventListener('install', function(e){
  e.waitUntil(
    Promise.all(SHELL.map(function(u){
      return caches.open(CACHE).then(function(c){ return c.add(new Request(u, { cache: 'reload' })); });
    })).then(function(){ return self.skipWaiting(); })
  );
});
self.addEventListener('activate', function(e){
  e.waitUntil(caches.keys().then(function(keys){
    return Promise.all(keys.map(function(k){ return k === CACHE ? null : caches.delete(k); }));
  }).then(function(){ return self.clients.claim(); }));
});
self.addEventListener('fetch', function(e){
  var url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return;
  var isPage = e.request.mode === 'navigate' || url.pathname === '/' ||
    url.pathname.endsWith('.html');
  if (isPage){
    // Network-first for the page itself: online players always get the
    // latest build; the cache is only the offline fallback.
    e.respondWith(
      fetch(e.request).then(function(res){
        if (res && res.ok){ var copy = res.clone(); caches.open(CACHE).then(function(c){ c.put('./index.html', copy); }); }
        return res;
      }).catch(function(){
        return caches.match('./index.html', { ignoreSearch: true });
      })
    );
    return;
  }
  // Static shell files (icons, manifest): cache-first with background refresh.
  e.respondWith(
    caches.match(e.request, { ignoreSearch: true }).then(function(hit){
      var net = fetch(e.request).then(function(res){
        if (res && res.ok){ var copy = res.clone(); caches.open(CACHE).then(function(c){ c.put(e.request, copy); }); }
        return res;
      }).catch(function(){ return hit; });
      return hit || net;
    })
  );
});
