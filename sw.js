const CACHE_NAME = 'mywallet-v7';
const SHELL = [
  './',
  './index.html'
];

// ===== التثبيت: حفظ الملفات الأساسية =====
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(SHELL))
  );
  self.skipWaiting();
});

// ===== التفعيل: حذف الكاش القديم =====
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// ===== الطلبات: Cache First + تحديث في الخلفية =====
self.addEventListener('fetch', e => {
  // تجاهل Firebase و API calls
  if (e.request.url.includes('firebaseio.com')) return;
  if (e.request.url.includes('anthropic.com')) return;
  if (e.request.url.includes('api.')) return;
  if (e.request.method !== 'GET') return;

  e.respondWith(
    caches.open(CACHE_NAME).then(async cache => {
      const cached = await cache.match(e.request);

      // حدّث الكاش في الخلفية دائماً
      const fetchPromise = fetch(e.request).then(resp => {
        if (resp && resp.status === 200) {
          cache.put(e.request, resp.clone());
        }
        return resp;
      }).catch(() => null);

      // أرجع الكاش فوراً إذا موجود (يعمل أوفلاين)
      // وإلا انتظر الشبكة
      if (cached) {
        fetchPromise; // حدّث في الخلفية
        return cached;
      }
      return fetchPromise || caches.match('./index.html');
    })
  );
});
