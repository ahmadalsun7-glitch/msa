const CACHE_NAME = 'mywallet-v5';

// الملفات الأساسية للحفظ
const SHELL = ['/'];

// ===== التثبيت: حفظ الشل =====
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
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// ===== الطلبات: Stale-While-Revalidate =====
self.addEventListener('fetch', e => {
  // تجاهل طلبات Firebase (بيانات حية)
  if (e.request.url.includes('firebaseio.com')) return;
  // تجاهل طلبات غير GET
  if (e.request.method !== 'GET') return;

  e.respondWith(
    caches.open(CACHE_NAME).then(async cache => {
      const cached = await cache.match(e.request);
      const fetchPromise = fetch(e.request)
        .then(resp => {
          // احفظ النسخة الجديدة في الكاش
          if (resp && resp.status === 200) {
            cache.put(e.request, resp.clone());
          }
          return resp;
        })
        .catch(() => null);

      // إذا عندنا نسخة محفوظة، أرجعها فوراً + حدّث في الخلفية
      return cached || fetchPromise || caches.match('/');
    })
  );
});
