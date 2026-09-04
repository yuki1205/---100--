const CACHE_NAME = 'runaway-v1';
const APP_FILES = ['./', './index.html', './style.css', './app.js', './settings.js', './manifest.json', './assets/icon.svg'];
self.addEventListener('install', (event) => event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_FILES))));
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(caches.match(event.request).then((cached) => cached || fetch(event.request)));
});
