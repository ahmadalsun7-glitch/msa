const CACHE_NAME = 'mywallet-v10';
const BASE = '/msa';

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache =>
      cache.addAll([
        BASE + '/',
        BASE + '/index.html',
        BASE + '/sw.js',
      ])
    ).catch(err => console.log('Cache addAll failed:', err))
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  const url = e.request.url;
  if (e.request.method !== 'GET') return;
  if (url.includes('firebaseio.com')) return;
  if (url.includes('googleapis.com')) return;
  if (url.includes('anthropic.com')) return;
  if (url.includes('exchangerate')) return;

  e.respondWith(
    caches.open(CACHE_NAME).then(async cache => {
      const cached = await cache.match(e.request);
      const networkFetch = fetch(e.request).then(resp => {
        if (resp && resp.status === 200) cache.put(e.request, resp.clone());
        return resp;
      }).catch(() => null);

      if (cached) { networkFetch; return cached; }
      const networkResp = await networkFetch;
      if (networkResp) return networkResp;
      return cache.match(BASE + '/index.html');
    })
  );
});
