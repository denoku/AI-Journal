const CACHE_NAME = "brians-journal-v2";

// Only cache truly static assets, never navigation/HTML pages
// (those depend on auth state and must always hit the network)
const STATIC_ASSETS = ["/manifest.json"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS)),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key)),
        ),
      ),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Always pass through cross-origin requests
  if (url.origin !== self.location.origin) return;

  // Always pass through API and auth requests (never cache)
  if (url.pathname.startsWith("/api/")) return;

  // For navigation requests (HTML pages), always use network
  // Never cache these — they depend on auth state
  if (request.mode === "navigate") return;

  // For the manifest, use cache-first
  if (STATIC_ASSETS.includes(url.pathname)) {
    event.respondWith(
      caches.match(request).then((cached) => cached || fetch(request)),
    );
    return;
  }

  // Everything else: network only
});
