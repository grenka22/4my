const CACHE_NAME = 'schedule-v1';
const ASSETS = [
    '/',
    '/index.html',
    '/style.css',
    '/app.js',
    '/data.js',
    '/parser.js',
    '/ocr.js',
    '/editor.js',
    '/render.js',
    '/manifest.json',
    '/icon.png'
];

self.addEventListener('install', (e) => {
    e.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            return cache.addAll(ASSETS).catch(err => {
                console.log('Some assets failed to cache:', err);
            });
        })
    );
});

self.addEventListener('fetch', (e) => {
    e.respondWith(
        caches.match(e.request).then(response => {
            return response || fetch(e.request);
        })
    );
});