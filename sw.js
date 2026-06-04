const CACHE_NAME = 'mywallet-v8';

// ===== التثبيت =====
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      // حفظ الصفحة الرئيسية بكل مساراتها المحتملة
      return Promise.allSettled([
        cache.add('./'),
        cache.add('./index.html'),
        cache.add('/msa/'),
        cache.add('/msa/index.html'),
      ]);
    })
  );
  self.skipWaiting();
});

// ===== التفعيل =====
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// ===== الطلبات =====
self.addEventListener('fetch', e => {
  if (e.request.url.includes('firebaseio.com')) return;
  if (e.request.url.includes('anthropic.com')) return;
  if (e.request.url.includes('exchangerate')) return;
  if (e.request.method !== 'GET') return;

  e.respondWith(
    caches.open(CACHE_NAME).then(async cache => {
      // جرب الكاش أولاً
      const cached = await cache.match(e.request);

      // حدّث في الخلفية
      const networkFetch = fetch(e.request).then(resp => {
        if (resp && resp.status === 200) {
          cache.put(e.request, resp.clone());
        }
        return resp;
      }).catch(() => null);

      if (cached) {
        networkFetch; // تحديث خلفي
        return cached;
      }

      // إذا ما في كاش جرب الشبكة
      const networkResp = await networkFetch;
      if (networkResp) return networkResp;

      // آخر خيار: الصفحة الرئيسية من الكاش
      return (
        await cache.match('/msa/index.html') ||
        await cache.match('/msa/') ||
        await cache.match('./index.html') ||
        await cache.match('./')
      );
    })
  );
});
