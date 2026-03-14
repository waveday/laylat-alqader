/* sw.js */
const CACHE_VERSION = "v1.0.0";
const APP_SHELL_CACHE = `app-shell-${CACHE_VERSION}`;
const RUNTIME_CACHE = `runtime-${CACHE_VERSION}`;

// ملفات التطبيق الأساسية (App Shell)
const APP_ASSETS = [
  "/",
  "/index.html",
  "./styles.css",
  "/sw.js",
  "/icons/site.webmanifest",
  "/icons/web-app-manifest-192x192.png",
  "/icons/web-app-manifest-512x512.png",
  "/icons/apple-touch-icon.png",
  "/icons/favicon-96x96.png",
  "/icons/favicon.svg",
  "/icons/favicon.ico"
];

// عند التثبيت: خزّن ملفات الـ App Shell
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(APP_SHELL_CACHE).then((cache) => cache.addAll(APP_ASSETS))
  );
  self.skipWaiting();
});

// عند التفعيل: احذف الكاش القديم
self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(
      keys.map((key) => {
        if (![APP_SHELL_CACHE, RUNTIME_CACHE].includes(key)) return caches.delete(key);
      })
    );
    await self.clients.claim();
  })());
});

// استراتيجيات الكاش
async function cacheFirst(request) {
  const cached = await caches.match(request);
  return cached || fetch(request);
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(RUNTIME_CACHE);
  const cached = await cache.match(request);

  const networkFetch = fetch(request).then((response) => {
    // خزّن فقط الردود الناجحة
    if (response && response.ok) cache.put(request, response.clone());
    return response;
  }).catch(() => cached);

  return cached || networkFetch;
}

self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // تعامل مع التنقل (فتح الصفحة) - App Shell offline
  if (req.mode === "navigate") {
    event.respondWith(
      caches.match("./index.html").then((cached) => cached || fetch(req))
    );
    return;
  }

  // ملفات نفس الموقع: Cache First
  if (url.origin === self.location.origin) {
    event.respondWith(cacheFirst(req));
    return;
  }

  // ملفات خارجية مثل Tailwind CDN: Stale-While-Revalidate
  // ملاحظة: أول مرة لازم إنترنت عشان يتحمّل ثم يشتغل أوفلاين بعد ذلك.
  event.respondWith(staleWhileRevalidate(req));
});