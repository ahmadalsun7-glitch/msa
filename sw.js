const CACHE_NAME = 'mywallet-v13';
const BASE = '/msa';
const CORE_FILES = [
  BASE + '/',
  BASE + '/index.html',
  BASE + '/manifest.json',
  BASE + '/icon-192.png',
  BASE + '/icon-512.png',
];

const SKIP = [
  'firebaseio.com',
  'googleapis.com',
  'anthropic.com',
  'generativelanguage.googleapis.com',
  'exchangerate',
  'open.er-api.com',
  'gemini',
  'workers.dev',
  'openrouter.ai',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(async cache => {
      for (const url of CORE_FILES) {
        try {
          const resp = await fetch(url, { cache: 'reload', redirect: 'follow' });
          if (resp.ok) {
            await cache.put(url, resp.clone());
          }
        } catch(err) {}
      }
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const url = e.request.url;
  if (e.request.method !== 'GET') return;
  if (SKIP.some(s => url.includes(s))) return;
  if (!url.includes('ahmadalsun7-glitch.github.io')) return;

  e.respondWith(handle(e.request));
});

async function handle(request) {
  const cache = await caches.open(CACHE_NAME);

  const cached = await cache.match(request)
    || await cache.match(request.url.endsWith('/') ? request.url.slice(0,-1) : request.url + '/');

  const networkPromise = fetch(request, { redirect: 'follow' })
    .then(resp => {
      if (resp && resp.ok && resp.type !== 'opaque') {
        cache.put(request, resp.clone());
      }
      return resp;
    })
    .catch(() => null);

  if (cached) {
    networkPromise;
    return cached;
  }

  const networkResp = await networkPromise;
  if (networkResp && networkResp.ok) return networkResp;

  const fallback = await cache.match(BASE + '/index.html') || await cache.match(BASE + '/');
  return fallback || new Response(
    `<!DOCTYPE html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><title>محفظتي</title>
    <style>body{font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;background:#f0f0ff}
    .box{text-align:center;padding:2rem;background:white;border-radius:12px}
    h2{color:#6366f1}p{color:#666}</style></head>
    <body><div class="box"><h2>📶 لا يوجد اتصال</h2><p>افتح التطبيق مرة مع الإنترنت أولاً</p></div></body></html>`,
    { status: 503, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
  );
}
