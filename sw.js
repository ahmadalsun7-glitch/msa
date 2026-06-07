const CACHE_NAME = 'mywallet-v9';

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache =>
      cache.addAll(['./', './index.html', './sw.js'])
    )
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

  // تجاهل طلبات غير GET
  if (e.request.method !== 'GET') return;

  // تجاهل APIs الخارجية فقط (بيانات حية)
  if (url.includes('firebaseio.com')) return;
  if (url.includes('anthropic.com')) return;
  if (url.includes('generativelanguage.googleapis.com')) return;
  if (url.includes('exchangerate-api.com')) return;
  if (url.includes('open.er-api.com')) return;

  e.respondWith(
    caches.open(CACHE_NAME).then(async cache => {
      const cached = await cache.match(e.request);

      // تحديث الكاش في الخلفية
      const networkFetch = fetch(e.request).then(resp => {
        if (resp && resp.status === 200) {
          cache.put(e.request, resp.clone());
        }
        return resp;
      }).catch(() => null);

      // إذا موجود في الكاش أرجعه فوراً (يعمل أوفلاين)
      if (cached) {
        networkFetch;
        return cached;
      }

      // وإلا انتظر الشبكة
      const networkResp = await networkFetch;
      if (networkResp) return networkResp;

      // آخر خيار: الصفحة الرئيسية
      return cache.match('./index.html');
    })
  );
});
