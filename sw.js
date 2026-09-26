const CACHE = 'impulso-1.7';

const PRECACHE = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(PRECACHE)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())
  );
});

function isNavigational(req){
  return req.mode === 'navigate';
}

function isFont(req){
  return req.url.startsWith('https://fonts.googleapis.com') || req.url.startsWith('https://fonts.gstatic.com');
}

function isUnsplash(req){
  return req.url.includes('api.unsplash.com') || req.url.includes('images.unsplash.com');
}

self.addEventListener('fetch', event => {
  const req = event.request;
  const url = new URL(req.url);

  if(req.method !== 'GET' || (url.origin === self.location.origin && url.pathname === '/sw.js')){
    return;
  }

  if(isNavigational(req)){
    event.respondWith(
      fetch(req)
        .then(res => {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put('./index.html', copy));
          return res;
        })
        .catch(() => caches.match('./index.html'))
    );
    return;
  }

  if(isFont(req)){
    event.respondWith(
      caches.match(req).then(cached => {
        const network = fetch(req).then(res => {
          if(res.ok){
            const copy = res.clone();
            caches.open(CACHE).then(c => c.put(req, copy));
          }
          return res;
        }).catch(() => cached);
        return cached || network;
      })
    );
    return;
  }

  if(isUnsplash(req)){
    event.respondWith(
      caches.match(req).then(cached => {
        const network = fetch(req).then(res => {
          if(res.ok){
            const copy = res.clone();
            caches.open(CACHE).then(c => c.put(req, copy));
          }
          return res;
        }).catch(() => cached);
        return cached || network;
      })
    );
    return;
  }

  event.respondWith(
    caches.match(req).then(cached => {
      const network = fetch(req).then(res => {
        if(res.ok){
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(req, copy));
        }
        return res;
      }).catch(() => cached);
      return cached || network;
    })
  );
});