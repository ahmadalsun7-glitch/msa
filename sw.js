const CACHE_NAME = 'mywallet-v6';

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

// ===== الطلبات: Network First (يجلب الجديد دائماً) =====
self.addEventListener('fetch', e => {
  // تجاهل طلبات Firebase (بيانات حية)
  if (e.request.url.includes('firebaseio.com')) return;
  // تجاهل طلبات غير GET
  if (e.request.method !== 'GET') return;

  e.respondWith(
    fetch(e.request)
      .then(resp => {
        if (resp && resp.status === 200) {
          const clone = resp.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
        }
        return resp;
      })
      .catch(() => caches.match(e.request).then(cached => cached || caches.match('/')))
  );
});
