// ═══════════════════════════════════════════════════════════════
//  SERVICE WORKER — NBS ACADEMIA
//  Hace que la Academia abra sin internet.
//  Estrategia "network-first": con internet siempre trae lo más
//  nuevo; sin internet usa la copia guardada.
// ═══════════════════════════════════════════════════════════════

var CACHE_NOMBRE = 'nbs-academia-v1';

var ARCHIVOS_BASE = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', function(event){
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NOMBRE).then(function(cache){
      return Promise.all(ARCHIVOS_BASE.map(function(url){
        return cache.add(url).catch(function(){ /* si falta uno, seguir */ });
      }));
    })
  );
});

self.addEventListener('activate', function(event){
  event.waitUntil(
    caches.keys().then(function(nombres){
      return Promise.all(nombres.map(function(n){
        if(n !== CACHE_NOMBRE){ return caches.delete(n); }
      }));
    }).then(function(){ return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function(event){
  var req = event.request;
  if(req.method !== 'GET'){ return; }
  var url = new URL(req.url);
  if(url.origin !== self.location.origin){ return; }

  event.respondWith(
    fetch(req).then(function(resp){
      var copia = resp.clone();
      caches.open(CACHE_NOMBRE).then(function(cache){
        cache.put(req, copia).catch(function(){});
      });
      return resp;
    }).catch(function(){
      return caches.match(req).then(function(cacheado){
        if(cacheado){ return cacheado; }
        if(req.mode === 'navigate'){ return caches.match('./index.html'); }
        return new Response('', { status: 503, statusText: 'Sin conexion' });
      });
    })
  );
});
