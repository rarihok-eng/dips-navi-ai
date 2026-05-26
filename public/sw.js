// Placeholder service worker to avoid 404 responses that trigger Clerk auth errors
// when the root layout renders on missing static asset requests.
self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});
