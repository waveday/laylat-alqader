const CACHE_NAME = "laylat-alqadr-pwa-v2";
const ASSETS = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "https://cdn.tailwindcss.com"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(k => (k !== CACHE_NAME ? caches.delete(k) : null)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;

  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;

      return fetch(req).then((fresh) => {
        const copy = fresh.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(req, copy)).catch(()=>{});
        return fresh;
      }).catch(() => {
        if (req.mode === "navigate") return caches.match("./index.html");
        throw new Error("Offline and no cache");
      });
    })
  );
});