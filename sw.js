// PuckRush service worker: caches the game shell so the installed app opens
// instantly and works offline. Ads and the leaderboard API are never cached.
var CACHE = 'puckrush-app-v1';
var SHELL = ['./', './index.html', './manifest.webmanifest',
  './icons/icon-192.png', './icons/icon-512.png',
  './icons/icon-maskable-512.png', './icons/apple-touch-icon.png'];
self.addEventListener('install', function(e){
  e.waitUntil(caches.open(CACHE).then(function(c){ return c.addAll(SHELL); }).then(function(){ return self.skipWaiting(); }));
});
self.addEventListener('activate', function(e){
  e.waitUntil(caches.keys().then(function(keys){
    return Promise.all(keys.map(function(k){ return k === CACHE ? null : caches.delete(k); }));
  }).then(function(){ return self.clients.claim(); }));
});
self.addEventListener('fetch', function(e){
  var url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return;
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
